# Subscription Sync Fix

## Problem

Users were completing Stripe checkout but the subscription wasn't being synced to the database, resulting in:

- ❌ User pays for subscription
- ❌ Database shows no subscription
- ❌ User still blocked from premium features

## Root Cause

**Stripe webhooks don't work in local development** because:

1. Webhooks require a publicly accessible URL
2. `localhost` is not accessible to Stripe servers
3. Without webhooks, the `user_subscriptions` table never gets updated

## Solution Implemented

### 1. New API Endpoint: `/api/stripe/verify-session`

Created a manual sync endpoint that:

- Takes the `session_id` from the success page
- Retrieves the checkout session from Stripe API
- Retrieves the subscription details from Stripe API
- Syncs the subscription to `user_subscriptions` table
- Works in BOTH local dev and production

**File:** `api/stripe/verify-session.ts`

### 2. New Hook: `useVerifySubscription`

React hook that calls the verify endpoint:

- Authenticates the user
- Sends session_id to the API
- Handles success/error states

**File:** `src/hooks/useVerifySubscription.ts`

### 3. Updated Success Page

The subscription success page now:

- ✅ Immediately calls verify endpoint on mount
- ✅ Shows loading state while syncing
- ✅ Shows success when subscription is confirmed
- ✅ Falls back to polling if verify fails
- ✅ Gives user feedback about what's happening

**File:** `src/pages/SubscriptionSuccessPage.tsx`

## How It Works Now

### User Flow

1. **User clicks "Start Free Trial"**
   → Redirects to Stripe Checkout

2. **User completes payment**
   → Stripe redirects to `/subscription/success?session_id=xxx`

3. **Success page loads**
   → Immediately calls `/api/stripe/verify-session` with session_id

4. **Verify endpoint:**
   - ✅ Authenticates user via JWT
   - ✅ Retrieves session from Stripe
   - ✅ Retrieves subscription from Stripe
   - ✅ Syncs to database
   - ✅ Returns success

5. **User sees confirmation**
   → Can now use premium features immediately

### Fallback Behavior

If the verify endpoint fails:

- Success page continues polling subscription status
- Webhook will eventually sync (in production)
- User gets "Almost There!" message with retry button

## Testing

### To Test Locally

1. Ensure both servers are running:

   ```bash
   # Terminal 1: Frontend
   npm run dev

   # Terminal 2: API
   npx vercel dev --listen 3000
   ```

2. Go to subscription page and start free trial

3. Complete Stripe checkout (use test card: `4242 4242 4242 4242`)

4. You'll be redirected to success page

5. Watch the console - you should see:

   ```
   [SubscriptionSuccess] Verifying subscription for session: cs_xxx
   [VerifySession] Retrieved subscription from Stripe
   [VerifySession] ✅ Successfully synced subscription to database
   ```

6. Check the database:

   ```sql
   SELECT * FROM user_subscriptions;
   ```

   You should see your subscription!

7. Try creating a recipe - you should NOT be blocked anymore

### To Verify in Production

In production, BOTH methods work:

1. ✅ Webhook syncs subscription (primary method)
2. ✅ Verify endpoint syncs subscription (fallback/immediate)

This ensures users always get access, even if webhooks are delayed.

## Files Modified

### New Files

- `api/stripe/verify-session.ts` - Manual sync endpoint
- `src/hooks/useVerifySubscription.ts` - React hook for verification
- `SUBSCRIPTION_SYNC_FIX.md` - This documentation

### Modified Files

- `src/pages/SubscriptionSuccessPage.tsx` - Added immediate verification
- `api/stripe/create-checkout.ts` - Fixed environment loading (previous fix)

## Environment Variables Required

Ensure these are set in `.env.local` for local development:

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PRICE_ID=price_xxx

# Supabase
SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=your_anon_key
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Benefits

### For Users

- ✅ Immediate access after payment (no waiting for webhooks)
- ✅ Clear feedback during activation
- ✅ Works reliably in all environments

### For Development

- ✅ Works in local dev without Stripe CLI
- ✅ Easy to test subscription flow
- ✅ Fallback ensures reliability

### For Production

- ✅ Dual sync (webhook + manual) for redundancy
- ✅ Faster subscription activation
- ✅ Better user experience

## Next Steps

### Optional Enhancements

1. **Add Stripe CLI for local webhooks** (optional but recommended)

   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

2. **Add subscription management page** where users can:
   - View current plan
   - Cancel subscription
   - Update payment method

3. **Add webhook event logs** to track what events are received

## Troubleshooting

### Issue: "Subscription already synced"

- **Cause:** Subscription already exists in database
- **Solution:** This is fine! It means verification worked previously

### Issue: "Session does not belong to user"

- **Cause:** Session ID from different user's checkout
- **Solution:** Use your own session_id from your checkout

### Issue: "Still showing no subscription"

- **Cause:** Cache not invalidated
- **Solution:** Click "Check Status" button or refresh page

### Issue: "Internal server error"

- **Cause:** Missing environment variables
- **Solution:** Check console logs for which variables are missing
