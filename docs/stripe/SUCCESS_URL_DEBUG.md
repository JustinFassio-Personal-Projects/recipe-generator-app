# Success URL Redirect Debug

## Problem

After completing Stripe Checkout, users are redirected to `/recipes` instead of `/subscription/success?session_id={CHECKOUT_SESSION_ID}`.

## Expected Flow (per Stripe docs)

1. User clicks "Get Started"
2. API creates Checkout Session with `success_url: "http://localhost:5174/subscription/success?session_id={CHECKOUT_SESSION_ID}"`
3. User redirected to Stripe hosted page
4. User completes payment
5. **Stripe redirects to success_url** ← THIS IS FAILING
6. Success page calls `verify-session` endpoint
7. Subscription synced to database

## Actual Flow

1. User clicks "Get Started"
2. API creates Checkout Session (success_url unknown - no logs visible)
3. User redirected to Stripe hosted page
4. User completes payment
5. **Stripe redirects to `/recipes`** ← WRONG!
6. No success page, no sync, user shows as unsubscribed

## Possible Causes

### 1. Stripe Dashboard Override

**Most Likely**: Stripe Dashboard has a default redirect URL configured that overrides the API.

**Check**: Dashboard → Settings → Checkout Settings → "Success and cancellation URLs"

### 2. Wrong Origin Header

The `origin` variable is set to `req.headers.origin || 'http://localhost:5174'`

If the origin header is wrong, the success_url would be wrong.

**Current code:**

```typescript
const origin = req.headers.origin || 'http://localhost:5174';
success_url: `${origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
```

### 3. Payment Link Used Instead

If user is using a Stripe Payment Link (`https://buy.stripe.com/test_...`), the success URL is pre-configured in the Payment Link settings, not in the API call.

### 4. Checkout Session Cached

If an old checkout session is being reused, it might have the old success_url.

## Debugging Steps

### Step 1: Add Logging

Already added in `create-checkout.ts`:

```typescript
console.log('[Checkout] Origin header:', req.headers.origin);
console.log('[Checkout] Using origin:', origin);
console.log(
  '[Checkout] Success URL will be:',
  `${origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`
);
```

**Action**: Check Vercel dev server terminal for these logs.

### Step 2: Check Stripe Dashboard

1. Go to https://dashboard.stripe.com/test/settings/checkout
2. Look for "Branded checkout and customer portal settings" section
3. Check if "Success URL" is configured
4. If set, either:
   - Remove it (let API control it)
   - Change it to `http://localhost:5174/subscription/success?session_id={CHECKOUT_SESSION_ID}`

### Step 3: Inspect Checkout Session

After creating a checkout session, inspect it in Stripe Dashboard:

1. Dashboard → Payments → Checkout Sessions
2. Find the most recent session
3. Click to view details
4. Check what `success_url` is actually set to

### Step 4: Test with Explicit URL

Temporarily hardcode the success URL to verify it works:

```typescript
success_url: 'http://localhost:5174/subscription/success?session_id={CHECKOUT_SESSION_ID}',
```

## Solutions

### Solution 1: Remove Dashboard Override (RECOMMENDED)

If Stripe Dashboard has a default URL, remove it and let the API control it.

### Solution 2: Update Dashboard URL

Change the dashboard default to match our success page.

### Solution 3: Use Referer Header

If origin header is unreliable:

```typescript
const origin =
  req.headers.referer?.replace(/\/$/, '') || 'http://localhost:5174';
```

### Solution 4: Environment Variable

Set success URL base in environment:

```typescript
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5174';
success_url: `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
```

## Next Steps

1. User checks Stripe Dashboard settings
2. User provides Vercel terminal logs showing success_url
3. Implement appropriate solution based on findings
