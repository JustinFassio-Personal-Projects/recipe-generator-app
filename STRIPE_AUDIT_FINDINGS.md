# Stripe Payment Workflow Audit Findings

## Audit Date

Started: January 2025

## Executive Summary

This document contains findings from a comprehensive audit of the Stripe payment workflow to identify why subscription purchases are not being registered in the app.

---

## 1. Webhook Handler Analysis (`api/stripe/webhook.ts`)

### Critical Issues Found

#### Issue 1.1: Module-Level Stripe Initialization

**Location:** Lines 5-7
**Severity:** HIGH
**Problem:**

- Stripe client is initialized at module level using `process.env.STRIPE_SECRET_KEY!`
- If environment variable is missing or invalid when module loads, the entire serverless function will crash during initialization
- This prevents the function from even attempting to handle webhook requests

**Current Code:**

```typescript
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});
```

**Impact:** Function may fail to initialize, preventing all webhook processing.

---

#### Issue 1.2: Incorrect Environment Variable Usage

**Location:** Line 10
**Severity:** CRITICAL
**Problem:**

- Webhook handler uses `process.env.VITE_SUPABASE_URL!`
- `VITE_*` prefixed variables are typically only available in Vite's client-side build
- In Vercel serverless functions, these variables may not be available
- Should use `SUPABASE_URL` or check both variants like `create-checkout.ts` does

**Current Code:**

```typescript
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

**Impact:** Supabase client may fail to initialize, causing all database operations to fail silently.

---

#### Issue 1.3: Missing Error Handling for Database Operations

**Location:** Lines 97-116, 136-157, 181-187, 243-246
**Severity:** HIGH
**Problem:**

- Database upsert/update operations don't check for errors
- If database operation fails, webhook still returns 200 OK to Stripe
- No logging of database operation failures
- Silent failures make debugging impossible

**Current Code:**

```typescript
await supabase.from('user_subscriptions').upsert({
  // ... data
});
// No error checking!
```

**Impact:** Subscription records may not be created/updated, but Stripe thinks the webhook succeeded.

---

#### Issue 1.4: Silent Failure on Missing Metadata

**Location:** Lines 81-86
**Severity:** HIGH
**Problem:**

- If `session.metadata?.supabase_user_id` is missing, webhook logs error but continues
- Returns 200 OK to Stripe even though subscription wasn't created
- No way to recover from this failure

**Current Code:**

```typescript
if (!userId) {
  console.error('No user ID in checkout session metadata');
  break; // Just breaks, returns 200 OK
}
```

**Impact:** Checkout sessions without metadata will never create subscription records.

---

#### Issue 1.5: Missing Error Handling for Subscription Retrieval

**Location:** Lines 89-94
**Severity:** MEDIUM
**Problem:**

- `stripe.subscriptions.retrieve()` may fail but error isn't caught
- Could cause webhook handler to crash

**Impact:** Webhook may fail completely if subscription retrieval fails.

---

## 2. Checkout Session Creation Analysis (`api/stripe/create-checkout.ts`)

### Issues Found

#### Issue 2.1: Metadata Set in Multiple Places

**Location:** Lines 163-167, 171-173
**Severity:** LOW
**Status:** ✅ CORRECT - No issue
**Finding:** This is intentional and correct. Both locations are needed:

- Session metadata (line 171-173): Available in `checkout.session.completed` event
- Subscription metadata (line 165-167): Available in subscription object

**Code Verification:**

```typescript
subscription_data: {
  trial_period_days: 7,
  metadata: {
    supabase_user_id: user.id,  // ✅ Set on subscription
  },
},
metadata: {
  supabase_user_id: user.id,  // ✅ Set on session
},
```

**Verdict:** No issue here - metadata is correctly set in both places.

---

#### Issue 2.2: Environment Variable Handling

**Location:** Lines 36-40
**Severity:** LOW
**Status:** ✅ GOOD - Handles both VITE\_\* and non-prefixed variants
**Finding:** This file correctly handles environment variable fallbacks:

```typescript
const supabaseUrl =
  process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim();
```

**Comparison:** Unlike `webhook.ts`, this file checks both variants, making it more robust.

---

#### Issue 2.3: Stripe Initialization Location

**Location:** Lines 81-83
**Severity:** LOW
**Status:** ✅ GOOD - Initialized inside handler
**Finding:** Stripe client is initialized inside the handler function, preventing module-level failures. This is the correct pattern.

---

#### Issue 2.4: Metadata Verification

**Location:** Lines 154-175
**Severity:** INFO
**Status:** ✅ VERIFIED
**Finding:**

- `supabase_user_id` is set in session metadata (line 172)
- `supabase_user_id` is set in subscription_data.metadata (line 166)
- Both are set to `user.id` which is verified earlier (line 104)
- Customer metadata also includes `supabase_user_id` (line 144)

**Verdict:** Metadata is correctly set and should be available in webhook events.

---

## 3. Database Schema Analysis

### Issues Found

#### Issue 3.1: RLS Policy for Service Role

**Location:** `supabase/migrations/20250110000000_create_subscriptions.sql` Lines 34-37, 40-43
**Severity:** LOW
**Status:** ✅ Policies appear correct but need verification
**Finding:**

- Policy "Service role can insert subscriptions" (lines 34-37): Uses `with check (true)` - allows all inserts
- Policy "Service role can update subscriptions" (lines 40-43): Uses `using (true)` - allows all updates
- **Note:** RLS policies with `using (true)` or `with check (true)` allow operations when using service role key
- Service role key bypasses RLS, so these policies should work correctly

**Potential Issue:** The policy names suggest they're for service role, but RLS policies don't actually check which key is being used. The service role key bypasses RLS entirely. These policies may be redundant but shouldn't cause issues.

**Recommendation:** Verify that webhook handler is using `SUPABASE_SERVICE_ROLE_KEY` (which it is, line 11 of webhook.ts).

---

#### Issue 3.2: Database Schema Structure

**Location:** `supabase/migrations/20250110000000_create_subscriptions.sql`
**Severity:** INFO
**Status:** ✅ Schema matches webhook handler expectations
**Finding:**

- Table structure matches what webhook handler expects
- All required fields are present
- Indexes are created for performance
- View `user_subscription_status` exists and is properly configured
- Foreign key constraint on `user_id` references `auth.users(id)`

**Verdict:** Schema is correct and should work with webhook handler.

---

## 4. Environment Variables Analysis

### Issues Found

#### Issue 4.1: Inconsistent Environment Variable Usage

**Severity:** CRITICAL
**Problem:**

- `create-checkout.ts` checks both `VITE_SUPABASE_URL` and `SUPABASE_URL` (line 38)
- `webhook.ts` only checks `VITE_SUPABASE_URL` (line 10)
- This inconsistency will cause webhook handler to fail if only `SUPABASE_URL` is set in Vercel

**Code Comparison:**

**create-checkout.ts (CORRECT):**

```typescript
const supabaseUrl =
  process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim();
```

**webhook.ts (INCORRECT):**

```typescript
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!, // ❌ Only checks VITE_* variant
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

**Impact:** If Vercel only has `SUPABASE_URL` set (without `VITE_` prefix), webhook handler will fail to initialize Supabase client, causing all webhook processing to fail silently.

**Required Variables Checklist:**

| Variable                                        | Used By            | Status                   |
| ----------------------------------------------- | ------------------ | ------------------------ |
| `STRIPE_SECRET_KEY`                             | Both files         | ✅ Required              |
| `STRIPE_WEBHOOK_SECRET`                         | webhook.ts         | ✅ Required              |
| `STRIPE_PRICE_ID`                               | create-checkout.ts | ✅ Required              |
| `SUPABASE_URL` or `VITE_SUPABASE_URL`           | Both files         | ⚠️ Inconsistent handling |
| `SUPABASE_SERVICE_ROLE_KEY`                     | Both files         | ✅ Required              |
| `SUPABASE_ANON_KEY` or `VITE_SUPABASE_ANON_KEY` | create-checkout.ts | ✅ Required              |

**Recommendation:** Update `webhook.ts` to check both environment variable variants like `create-checkout.ts` does.

---

## 5. Frontend Subscription Status Analysis

### Issues Found

#### Issue 5.1: Query Invalidation Timing

**Location:** `src/pages/SubscriptionSuccessPage.tsx` Lines 29-30
**Severity:** MEDIUM
**Problem:**

- Queries are invalidated immediately on page load (line 29-30)
- Webhook may not have processed yet when user lands on success page
- No retry mechanism if subscription isn't found immediately
- No polling to check if webhook has processed

**Current Code:**

```typescript
useEffect(() => {
  // Track subscription conversion
  subscriptionEvents.converted(...);

  // Invalidate subscription queries to refetch updated status
  queryClient.invalidateQueries({ queryKey: ['subscription'] });
  queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
}, [queryClient]);
```

**Impact:**

- User may see "no subscription" even though purchase succeeded
- Subscription status may not appear until webhook processes (could be seconds or minutes)
- Poor user experience - user thinks purchase failed

**Recommendation:** Add polling mechanism to check subscription status every few seconds until found, or add a delay before invalidating queries.

---

#### Issue 5.2: Subscription Status Query Implementation

**Location:** `src/hooks/useSubscription.ts` Lines 34-63
**Severity:** LOW
**Status:** ✅ Implementation looks correct
**Finding:**

- Query uses `maybeSingle()` which returns null if no subscription exists (correct)
- Error handling for missing table is good (lines 49-54)
- Cache configuration is reasonable (5 minute staleTime)
- Query key is correct: `['subscription-status']`

**Verdict:** Hook implementation is correct, but timing issue remains (Issue 5.1).

---

#### Issue 5.3: React Query Cache Invalidation

**Location:** `src/pages/SubscriptionSuccessPage.tsx` Line 29-30
**Severity:** LOW
**Status:** ✅ Invalidation is correct
**Finding:**

- Both query keys are invalidated: `['subscription']` and `['subscription-status']`
- This matches the query keys used in hooks
- Invalidation will trigger refetch

**Verdict:** Cache invalidation is correct, but happens too early (before webhook processes).

---

## 6. End-to-End Flow Analysis

### Flow Breakdown

#### Step 1: User Clicks "Start Free Trial"

**Location:** `src/pages/SubscriptionPage.tsx` → `src/hooks/useCreateCheckout.ts`
**Status:** ✅ Should work

- User authenticated check passes
- API call to `/api/stripe/create-checkout` is made
- Checkout session is created successfully
- User redirected to Stripe Checkout

**Potential Issues:** None identified - code looks correct.

---

#### Step 2: User Completes Stripe Checkout

**Location:** External (Stripe)
**Status:** ✅ Should work

- Stripe handles payment collection
- Checkout session marked as completed
- User redirected to `/subscription/success?session_id=xxx`

**Potential Issues:** None - this is Stripe's responsibility.

---

#### Step 3: Stripe Sends Webhook Event

**Location:** Stripe → `/api/stripe/webhook`
**Status:** ⚠️ **POTENTIAL FAILURE POINT**
**Potential Issues:**

1. Webhook endpoint may not be accessible
2. Webhook secret may be incorrect
3. Webhook signature verification may fail
4. Environment variables may be missing (CRITICAL - Issue 1.2, 4.1)

**Check Required:**

- Verify webhook endpoint URL in Stripe Dashboard
- Verify `STRIPE_WEBHOOK_SECRET` is set correctly
- Check Stripe Dashboard for webhook delivery failures

---

#### Step 4: Webhook Handler Processes Event

**Location:** `api/stripe/webhook.ts`
**Status:** ⚠️ **LIKELY FAILURE POINT**
**Potential Issues:**

1. **CRITICAL:** Supabase client initialization fails (Issue 1.2) - uses `VITE_SUPABASE_URL` which may not be available
2. **HIGH:** Module-level Stripe initialization fails if env vars missing (Issue 1.1)
3. **HIGH:** Missing metadata causes silent failure (Issue 1.4)
4. **HIGH:** Database operations fail silently (Issue 1.3)

**Failure Scenarios:**

- If `VITE_SUPABASE_URL` not set → Supabase client fails → All database operations fail → Webhook returns 200 OK but subscription not created
- If metadata missing → Logs error but continues → Returns 200 OK → Subscription not created
- If database upsert fails → No error checking → Returns 200 OK → Subscription not created

---

#### Step 5: Database Record Creation

**Location:** Supabase `user_subscriptions` table
**Status:** ⚠️ **POTENTIAL FAILURE POINT**
**Potential Issues:**

1. Database operation fails but error not checked (Issue 1.3)
2. RLS policies may block operation (unlikely with service role)
3. Foreign key constraint violation if user_id invalid
4. Unique constraint violation if subscription already exists

**Check Required:**

- Verify migration has been applied
- Check database logs for errors
- Verify RLS policies allow service role operations

---

#### Step 6: Frontend Queries Subscription Status

**Location:** `src/pages/SubscriptionSuccessPage.tsx` → `src/hooks/useSubscription.ts`
**Status:** ⚠️ **TIMING ISSUE**
**Potential Issues:**

1. Query invalidated too early - webhook may not have processed yet (Issue 5.1)
2. User sees "no subscription" even though purchase succeeded
3. No retry mechanism if subscription not found

**Failure Scenario:**

- User lands on success page
- Queries invalidated immediately
- Webhook hasn't processed yet
- Query returns null (no subscription)
- User thinks purchase failed
- Eventually webhook processes and subscription appears (poor UX)

---

### Most Likely Root Causes

Based on code analysis, the most likely causes of subscription registration failure are:

1. **CRITICAL:** Webhook handler uses `VITE_SUPABASE_URL` which may not be available in Vercel serverless context
2. **HIGH:** Database operations fail silently - no error checking means failures go unnoticed
3. **HIGH:** Missing metadata causes silent failure - webhook returns 200 OK but subscription not created
4. **MEDIUM:** Frontend queries too early - user sees "no subscription" before webhook processes

---

## Summary of Critical Issues

### Must Fix (Blocking Subscription Registration)

#### 1. CRITICAL: Webhook Handler Environment Variable Issue

**File:** `api/stripe/webhook.ts` Line 10
**Issue:** Uses `process.env.VITE_SUPABASE_URL!` which may not be available in Vercel serverless context
**Impact:** Supabase client fails to initialize → All database operations fail → Subscriptions never created
**Fix:** Change to check both `SUPABASE_URL` and `VITE_SUPABASE_URL` like `create-checkout.ts` does

#### 2. HIGH: Missing Error Handling for Database Operations

**File:** `api/stripe/webhook.ts` Lines 97, 136, 181, 243
**Issue:** Database upsert/update operations don't check for errors
**Impact:** Database failures go unnoticed → Webhook returns 200 OK → Stripe thinks it succeeded → Subscription not created
**Fix:** Add error checking after all database operations and return appropriate error codes

#### 3. HIGH: Module-Level Stripe Initialization

**File:** `api/stripe/webhook.ts` Lines 5-7
**Issue:** Stripe client initialized at module level
**Impact:** Function may crash during initialization if env vars missing → Webhook handler never runs
**Fix:** Move Stripe initialization inside handler function (like `create-checkout.ts` does)

#### 4. HIGH: Silent Failure on Missing Metadata

**File:** `api/stripe/webhook.ts` Lines 81-86
**Issue:** If metadata missing, logs error but returns 200 OK
**Impact:** Checkout sessions without metadata never create subscriptions → No recovery mechanism
**Fix:** Return error status code when metadata is missing, or add fallback to retrieve user_id from customer

### Should Fix (Improves Reliability)

#### 5. MEDIUM: Frontend Query Invalidation Timing

**File:** `src/pages/SubscriptionSuccessPage.tsx` Lines 29-30
**Issue:** Queries invalidated immediately, webhook may not have processed
**Impact:** Poor UX - user sees "no subscription" even though purchase succeeded
**Fix:** Add polling mechanism or delay before invalidating queries

#### 6. MEDIUM: Missing Error Handling for Subscription Retrieval

**File:** `api/stripe/webhook.ts` Lines 89-94
**Issue:** `stripe.subscriptions.retrieve()` may fail but error not caught
**Impact:** Webhook handler may crash if subscription retrieval fails
**Fix:** Add try-catch around subscription retrieval

---

## Recommended Fixes

### Priority 1: Fix Webhook Handler (CRITICAL)

#### Fix 1.1: Environment Variable Handling

**File:** `api/stripe/webhook.ts`
**Change:** Update Supabase client initialization to check both environment variable variants:

```typescript
// BEFORE (Line 9-12):
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// AFTER:
const supabaseUrl =
  process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim();
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  // Handle error appropriately
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
```

#### Fix 1.2: Move Stripe Initialization Inside Handler

**File:** `api/stripe/webhook.ts`
**Change:** Move Stripe client initialization from module level to inside handler:

```typescript
// BEFORE (Lines 5-7):
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

// AFTER (Inside handler function):
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!stripeSecretKey) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2025-09-30.clover',
  });
  // ... rest of handler
}
```

#### Fix 1.3: Add Error Handling for Database Operations

**File:** `api/stripe/webhook.ts`
**Change:** Add error checking after all database operations:

```typescript
// Example for checkout.session.completed (Line 97):
const { data, error } = await supabase.from('user_subscriptions').upsert({
  // ... data
});

if (error) {
  console.error('Failed to create subscription:', error);
  return res.status(500).json({
    error: 'Database operation failed',
    details: error.message,
  });
}

if (!data) {
  console.error('Upsert returned no data');
  return res.status(500).json({ error: 'Failed to create subscription' });
}
```

#### Fix 1.4: Handle Missing Metadata Gracefully

**File:** `api/stripe/webhook.ts`
**Change:** Return error status when metadata is missing, or add fallback:

```typescript
// Option 1: Return error (recommended)
if (!userId) {
  console.error('No user ID in checkout session metadata', {
    sessionId: session.id,
    metadata: session.metadata,
  });
  return res.status(400).json({
    error: 'Missing user ID in checkout session metadata',
  });
}

// Option 2: Fallback to customer metadata
let userId = session.metadata?.supabase_user_id;
if (!userId && session.customer) {
  const customer = await stripe.customers.retrieve(session.customer as string);
  userId = customer.metadata?.supabase_user_id;
}
```

### Priority 2: Add Comprehensive Error Logging

**File:** `api/stripe/webhook.ts`
**Changes:**

- Log all database operation errors with context
- Log webhook event details for debugging
- Return appropriate HTTP status codes to Stripe
- Add structured logging for better monitoring

### Priority 3: Improve Frontend Handling

**File:** `src/pages/SubscriptionSuccessPage.tsx`
**Change:** Add polling mechanism to check subscription status:

```typescript
useEffect(() => {
  // Invalidate queries immediately
  queryClient.invalidateQueries({ queryKey: ['subscription'] });
  queryClient.invalidateQueries({ queryKey: ['subscription-status'] });

  // Poll for subscription status (webhook may take a few seconds)
  const pollInterval = setInterval(() => {
    queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
  }, 2000); // Check every 2 seconds

  // Stop polling after 30 seconds or when subscription found
  const timeout = setTimeout(() => {
    clearInterval(pollInterval);
  }, 30000);

  return () => {
    clearInterval(pollInterval);
    clearTimeout(timeout);
  };
}, [queryClient]);
```

---

## Verification Checklist

After implementing fixes, verify:

- [ ] Webhook endpoint is accessible at `/api/stripe/webhook`
- [ ] Stripe Dashboard shows successful webhook deliveries
- [ ] Environment variables are set correctly in Vercel
- [ ] Database operations succeed and log properly
- [ ] Subscription records are created in `user_subscriptions` table
- [ ] Frontend can query subscription status after purchase
- [ ] Error logs provide clear debugging information

---

## Testing Steps

1. **Test Webhook Endpoint:**
   - Use Stripe CLI: `stripe listen --forward-to http://localhost:3000/api/stripe/webhook`
   - Trigger test event: `stripe trigger checkout.session.completed`
   - Verify webhook is received and processed

2. **Test Checkout Flow:**
   - Create test checkout session
   - Complete checkout with test card
   - Verify webhook receives `checkout.session.completed` event
   - Check database for subscription record
   - Verify frontend shows subscription status

3. **Test Error Scenarios:**
   - Test with missing environment variables
   - Test with invalid webhook secret
   - Test with missing metadata
   - Verify error handling and logging

---

## Monitoring Recommendations

1. **Set up alerts for:**
   - Webhook delivery failures in Stripe Dashboard
   - Database operation errors in Vercel logs
   - Missing subscription records after checkout completion

2. **Monitor metrics:**
   - Webhook success rate
   - Time between checkout completion and subscription creation
   - Database operation success rate

3. **Regular checks:**
   - Verify environment variables are set correctly
   - Check Stripe Dashboard for failed webhook deliveries
   - Review Vercel function logs for errors
