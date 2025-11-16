# Cleaning Up Test Subscription Data

## Problem

If you see this error when trying to access the Customer Portal:

```
Error: No such customer: 'cus_test_manual'
```

Or:

```
Error: Invalid customer account
Your customer account could not be found in Stripe.
```

This means your database contains test/fake subscription data with Stripe customer IDs that don't actually exist in Stripe.

## Why This Happens

This typically occurs when:

1. Manual test data was inserted into the database
2. A subscription was created in a different Stripe account
3. Test mode vs Live mode mismatch
4. Customer was deleted in Stripe but subscription remains in database

## Quick Fix (For Testing)

### Option 1: Delete the Test Subscription

Run the cleanup script to identify and remove invalid subscriptions:

```bash
# Check for invalid subscriptions
npx tsx scripts/stripe/cleanup-test-subscriptions.ts

# Delete invalid subscriptions
npx tsx scripts/stripe/cleanup-test-subscriptions.ts --delete
```

### Option 2: Manual Database Cleanup

If you know the user with the invalid subscription:

```sql
-- Check subscription data
SELECT user_id, stripe_customer_id, stripe_subscription_id, status
FROM user_subscriptions
WHERE user_id = 'USER_ID_HERE';

-- Delete invalid subscription
DELETE FROM user_subscriptions
WHERE user_id = 'USER_ID_HERE';
```

### Option 3: Clean Up via Supabase Studio

1. Go to Supabase Studio
2. Navigate to Table Editor → `user_subscriptions`
3. Find rows with fake customer IDs (like 'cus_test_manual')
4. Delete those rows

## After Cleanup

After removing invalid subscriptions:

1. **User needs to subscribe again** with a real Stripe checkout
2. This will create a proper customer in Stripe
3. Customer Portal will work correctly

## Creating Valid Test Data

To create valid test subscriptions for development:

### Step 1: Use Real Stripe Checkout

Don't insert data manually. Always use the actual checkout flow:

```bash
# 1. Start dev server
npm run dev

# 2. In browser:
- Sign up/login
- Go to /subscription
- Click "Start Free Trial"
- Use test card: 4242 4242 4242 4242
- Complete checkout
```

This creates:

- Real Stripe customer
- Real Stripe subscription
- Proper webhook sync to database

### Step 2: Use Stripe Test Mode

Make sure you're using Test mode in Stripe Dashboard:

```bash
# .env.local should have TEST keys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # From test mode
STRIPE_PRICE_ID=price_...  # From test mode
```

### Step 3: Verify Webhook Processing

After checkout, check logs:

```bash
# Vercel dev logs should show:
[Webhook] Received event: checkout.session.completed
[Webhook] ✅ Subscription created for user USER_ID
```

## Prevention

To avoid this issue in the future:

### ✅ DO:

- Always use real Stripe checkout flow
- Use Stripe test mode for development
- Let webhooks sync subscription data
- Use the cleanup script before staging/production

### ❌ DON'T:

- Manually insert subscription records
- Mix Test and Live mode data
- Skip webhook configuration
- Delete customers in Stripe without cleaning database

## Troubleshooting

### Error: "Customer account deleted"

Customer exists in Stripe but is marked as deleted.

**Solution:**

1. Delete subscription from database
2. Subscribe again with new checkout

### Error: "No subscription found"

User doesn't have a subscription record.

**Solution:**

1. User needs to subscribe via checkout flow
2. Don't try to access Customer Portal without subscription

### Portal works but shows wrong data

Test mode vs Live mode mismatch.

**Solution:**

1. Verify environment variables match Stripe mode
2. Check which mode you're in (Stripe Dashboard toggle)
3. Use cleanup script to remove wrong-mode data

## Verification Script

Use the cleanup script to audit your subscription data:

```bash
# Dry run - just check for issues
npx tsx scripts/stripe/cleanup-test-subscriptions.ts

# See output:
# ✅ Valid subscriptions: 5
# ❌ Invalid subscriptions: 2
#
# Invalid subscription details will be listed
```

## For Production

Before deploying to production:

1. **Clean staging database:**

   ```bash
   npx tsx scripts/stripe/cleanup-test-subscriptions.ts --delete
   ```

2. **Verify live mode configuration:**
   - All env vars use `sk_live_...` keys
   - Webhook endpoint configured in Live mode
   - Price ID from Live mode products

3. **Test with real cards** (in test environment):
   - Use Stripe test cards
   - Verify complete flow works
   - Check Customer Portal access

4. **Production launch:**
   - Start with small beta group
   - Monitor for customer portal errors
   - Check webhook delivery in Stripe Dashboard

## Quick Reference

```bash
# Check for problems
npx tsx scripts/stripe/cleanup-test-subscriptions.ts

# Delete invalid data
npx tsx scripts/stripe/cleanup-test-subscriptions.ts --delete

# Check database directly
psql $DATABASE_URL -c "SELECT * FROM user_subscriptions;"

# Verify Stripe customer
stripe customers retrieve cus_xxxxx --api-key sk_test_xxxxx
```

## Support

If you continue to have issues:

1. Check Vercel logs for detailed error messages
2. Verify Stripe Dashboard mode (Test vs Live)
3. Confirm webhook is processing events
4. Check `email_logs` table for delivery issues
5. Review Stripe webhook delivery logs

---

**Remember:** Always use real Stripe checkout flow for creating subscriptions, even in development!
