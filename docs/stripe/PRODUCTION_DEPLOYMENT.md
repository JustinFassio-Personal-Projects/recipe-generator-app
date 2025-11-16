# Stripe Production Deployment Guide

**Last Updated:** November 16, 2025  
**Status:** Production-Ready  
**Estimated Deployment Time:** 2-3 hours

---

## 📋 Pre-Deployment Checklist

Before deploying to production, verify:

- [ ] All Stripe endpoints tested in staging
- [ ] Webhook handler tested with Stripe CLI
- [ ] Customer Portal configured and tested
- [ ] Email notifications verified
- [ ] Database migration applied
- [ ] All environment variables documented
- [ ] Rollback plan prepared
- [ ] Support team briefed

---

## 🔐 Step 1: Stripe Dashboard Configuration (Live Mode)

### Switch to Live Mode

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. **Toggle from Test mode to Live mode** (top-right corner)
3. ⚠️ **Important:** All configuration must be done in Live mode

### Create Production Product & Price

1. Navigate to **Products** → **Add Product**
2. Fill in details:
   - **Name:** `AI Tools Premium`
   - **Description:** `Unlimited AI recipe generation and advanced features`
   - **Pricing Model:** `Recurring`
   - **Price:** `$5.99`
   - **Billing Period:** `Monthly`
   - **Free Trial:** `7 days`
3. Click **Save Product**
4. **Copy the Price ID** (format: `price_xxxxx`)
   - You'll need this for `STRIPE_PRICE_ID` environment variable

### Configure Production Webhooks

1. Navigate to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. **Endpoint URL:** `https://your-production-domain.com/api/stripe/webhook`
   - Replace `your-production-domain.com` with your actual domain
4. **Events to send:** Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. **Copy the Signing Secret** (format: `whsec_xxxxx`)
   - You'll need this for `STRIPE_WEBHOOK_SECRET`

### Configure Customer Portal (Live Mode)

1. Navigate to **Settings** → **Billing** → **Customer portal**
2. Click **Activate** (if not already active)
3. Configure settings:

**Products:**

- ✅ Enable "Customers can cancel their subscriptions"
- ✅ Cancellation behavior: "Cancel at end of billing period"
- ✅ Enable "Customers can update their payment methods"

**Invoices:**

- ✅ Enable "Show invoice history"
- ✅ Enable "Allow invoice PDF downloads"

**Branding:**

- Upload logo (512x512px PNG recommended)
- Set brand color
- Add business name and support contact

4. Click **Save**

---

## 🔑 Step 2: Environment Variables Setup

### Vercel Production Environment

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **Environment Variables**
4. Add these variables for **Production** environment:

```bash
# Stripe (LIVE MODE - use live keys!)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...  # From production webhook endpoint
STRIPE_PRICE_ID=price_...  # From production product

# Supabase (Production Database)
SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Production service role key
SUPABASE_ANON_KEY=eyJ...  # Production anon key
VITE_SUPABASE_ANON_KEY=eyJ...  # Production anon key

# Optional: Email (if using custom provider)
RESEND_API_KEY=re_...  # If using Resend for emails
```

### Get Stripe Live Keys

1. In Stripe Dashboard (Live mode)
2. **Developers** → **API keys**
3. Copy:
   - **Publishable key** (starts with `pk_live_`)
   - **Secret key** (starts with `sk_live_`) - Click "Reveal live key token"

⚠️ **Security Note:** Never commit live keys to git. Only add them to Vercel environment variables.

### Verify Environment Variables

```bash
# In Vercel Dashboard, verify all variables are set for Production
# Check that keys start with live_ not test_
```

---

## 🗄️ Step 3: Database Migration

### Verify Migration Applied

The subscription table should already exist from development, but verify:

```sql
-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'user_subscriptions'
);

-- Check if view exists
SELECT EXISTS (
  SELECT FROM information_schema.views
  WHERE table_schema = 'public'
  AND table_name = 'user_subscription_status'
);
```

### If Migration Not Applied

```bash
# Apply migration to production database
supabase db push --db-url "postgresql://postgres:password@your-production-db/postgres"

# Or use Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Run the migration file: supabase/migrations/20250110000000_create_subscriptions.sql
```

### Clean Up Test Data

Before production launch, remove any test subscriptions:

```bash
# Run cleanup script against production database
# (Make sure to backup first!)
npx tsx scripts/stripe/cleanup-test-subscriptions.ts

# Delete test data if found
npx tsx scripts/stripe/cleanup-test-subscriptions.ts --delete
```

---

## 🚀 Step 4: Deployment

### Deploy to Vercel

```bash
# Option 1: Deploy via Git (Recommended)
git add .
git commit -m "feat: Production Stripe configuration"
git push origin main

# Vercel will auto-deploy

# Option 2: Manual deploy
vercel --prod
```

### Verify Deployment

1. Check Vercel deployment status
2. Verify production URL is live
3. Check Vercel logs for any errors

---

## ✅ Step 5: Production Testing

### Test Complete Flow

**Prerequisites:**

- Use a real credit card (not test cards!)
- OR use Stripe test mode if you want to verify flow first

**Testing Steps:**

1. **Sign Up/Login**

   ```
   Navigate to: https://your-domain.com
   Create account or login
   ```

2. **Subscribe to Premium**

   ```
   Go to: https://your-domain.com/subscription
   Click: "Start Free Trial"
   Complete Stripe Checkout
   Use test card: 4242 4242 4242 4242 (if in test mode)
   ```

3. **Verify Success Page**

   ```
   Should redirect to: /subscription/success
   Should show: "Welcome to Premium!" immediately
   Should NOT show: "Almost There!" or loading for > 5 seconds
   ```

4. **Verify Webhook Processing**

   ```
   Check Stripe Dashboard:
   - Developers → Webhooks → Your endpoint
   - Should show "checkout.session.completed" succeeded
   - No failed attempts
   ```

5. **Verify Database**

   ```sql
   SELECT * FROM user_subscriptions
   WHERE user_id = 'YOUR_USER_ID';

   -- Should show:
   -- status: 'trialing' or 'active'
   -- trial_end: 7 days from now
   -- stripe_customer_id: starts with 'cus_'
   -- stripe_subscription_id: starts with 'sub_'
   ```

6. **Test Customer Portal**

   ```
   Go to: https://your-domain.com/subscription
   Click: "Manage Subscription"
   Portal should open in new tab
   Test: View billing history
   Test: Update payment method (don't save!)
   Test: Cancel subscription (don't confirm!)
   ```

7. **Verify Emails**

   ```
   Check email inbox for:
   - Welcome to Premium email
   - Subscription confirmation

   Check database:
   SELECT * FROM email_logs
   WHERE user_id = 'YOUR_USER_ID'
   ORDER BY created_at DESC;
   ```

### Test Error Scenarios

1. **Test Declined Card** (test mode only)

   ```
   Card: 4000 0000 0000 0002 (generic decline)
   Should show error on Stripe checkout page
   Should NOT create subscription in database
   ```

2. **Test Webhook Failure Recovery**
   ```
   Temporarily disable webhook in Stripe
   Complete checkout
   Verify verify-session endpoint syncs subscription
   Re-enable webhook
   ```

---

## 📊 Step 6: Monitoring Setup

### Stripe Dashboard Alerts

1. Navigate to **Settings** → **Email Alerts**
2. Enable alerts for:
   - Failed webhook deliveries
   - Failed payments
   - Disputes and chargebacks
3. Add your support team email

### Webhook Monitoring

Monitor webhook health:

- **Stripe Dashboard** → **Developers** → **Webhooks** → Your endpoint
- Check "Recent deliveries" tab
- Set up alert if success rate < 95%

### Vercel Logs

1. **Vercel Dashboard** → Your project → **Logs**
2. Monitor for:
   - `[Webhook]` errors
   - `[Checkout]` errors
   - `[PortalSession]` errors
3. Set up log alerts for 500 errors

### Database Monitoring

Create alerts for:

```sql
-- Subscriptions not syncing (created > 5 min ago, no subscription)
SELECT COUNT(*) FROM user_subscriptions
WHERE stripe_subscription_id IS NULL
AND created_at < NOW() - INTERVAL '5 minutes';

-- Failed webhooks (check Stripe webhook history)
-- Subscriptions in past_due status
SELECT COUNT(*) FROM user_subscriptions
WHERE status = 'past_due';
```

---

## 🔄 Step 7: Rollback Plan

If critical issues arise:

### Quick Disable (Without Rolling Back)

Disable subscriptions temporarily:

```typescript
// In create-checkout.ts, add at top of handler:
return res.status(503).json({
  error: 'Service temporarily unavailable',
  details: 'Subscriptions are temporarily disabled for maintenance.',
});
```

Deploy this change to disable new subscriptions while keeping existing ones working.

### Full Rollback

```bash
# Option 1: Revert to previous deployment
vercel rollback your-project-url --prod

# Option 2: Revert git commit
git revert HEAD
git push origin main
```

### Communicate with Users

If rolling back:

1. Update status page (if you have one)
2. Email affected users (use admin script)
3. Provide ETA for fix
4. Offer refunds if necessary

---

## 📈 Step 8: Post-Launch Monitoring (First 24 Hours)

### Hour 1-2: Active Monitoring

- [ ] Check Vercel logs every 15 minutes
- [ ] Monitor Stripe webhook delivery
- [ ] Watch for error alerts
- [ ] Check first real subscriptions

### Hour 3-6: Periodic Checks

- [ ] Check every hour
- [ ] Verify webhook success rate > 95%
- [ ] Check database sync is working
- [ ] Monitor customer portal usage

### Hour 7-24: Standard Monitoring

- [ ] Check every 3-4 hours
- [ ] Review any support tickets
- [ ] Check email delivery rate
- [ ] Monitor cancellation rate

### Day 2-7: Ongoing

- [ ] Daily check of metrics
- [ ] Weekly review of webhook logs
- [ ] Weekly subscription reconciliation
- [ ] Monthly review of conversion rate

---

## 📊 Key Metrics to Track

### Subscription Metrics

- New subscriptions per day
- Trial start rate
- Trial-to-paid conversion rate
- Churn rate (cancellations per month)
- MRR (Monthly Recurring Revenue)

### Technical Metrics

- Webhook success rate (target: >99%)
- Checkout success rate (target: >90%)
- Customer portal usage
- Average time to subscription sync (<5 seconds)

### Support Metrics

- Billing-related support tickets
- Average resolution time
- Common issues

---

## 🆘 Emergency Procedures

### Webhook Failures Spike

If webhooks suddenly start failing:

1. Check Stripe Dashboard webhook logs for error messages
2. Verify webhook endpoint is accessible
3. Check Vercel function logs
4. Verify `STRIPE_WEBHOOK_SECRET` is correct
5. Test with Stripe CLI: `stripe listen --forward-to https://your-domain.com/api/stripe/webhook`

### Database Not Syncing

If subscriptions created but not appearing in database:

1. Check webhook processing in Vercel logs
2. Verify database credentials
3. Run manual sync script: `npx tsx scripts/stripe/cleanup-test-subscriptions.ts`
4. Check RLS policies aren't blocking service role

### Payment Failures

If multiple payments failing:

1. Check Stripe Dashboard for patterns
2. Verify price ID is correct
3. Check if test mode accidentally enabled
4. Contact Stripe support if widespread

---

## 📞 Support Contacts

### Stripe Support

- Dashboard: https://dashboard.stripe.com/support
- Email: support@stripe.com
- Phone: Available in dashboard

### Vercel Support

- Dashboard: https://vercel.com/support
- Discord: https://vercel.com/discord

### Internal Team

- Engineering on-call: [Your contact]
- Product lead: [Your contact]
- Customer support: [Your contact]

---

## ✅ Post-Deployment Checklist

- [ ] All environment variables set in production
- [ ] Stripe Live mode product created
- [ ] Stripe webhook endpoint configured
- [ ] Customer Portal activated and configured
- [ ] Database migration verified
- [ ] End-to-end test completed successfully
- [ ] Webhook processing verified
- [ ] Email delivery confirmed
- [ ] Customer Portal tested
- [ ] Monitoring alerts configured
- [ ] Support team briefed
- [ ] Documentation updated
- [ ] Rollback plan ready
- [ ] First 24-hour monitoring schedule set

---

## 🎉 Success Criteria

Your production deployment is successful when:

✅ Users can complete checkout without errors  
✅ Subscriptions sync to database within 5 seconds  
✅ Webhooks succeed at >99% rate  
✅ Emails deliver successfully  
✅ Customer Portal works for all users  
✅ No critical errors in logs  
✅ Support tickets < 5% of subscriptions

---

## 📚 Additional Resources

- [Stripe Production Checklist](https://stripe.com/docs/keys#test-live-modes)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Customer Portal Documentation](https://stripe.com/docs/billing/subscriptions/customer-portal)
- [TEST_DATA_CLEANUP.md](./TEST_DATA_CLEANUP.md) - Handling test data
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues
- [CUSTOMER_PORTAL_SETUP.md](./CUSTOMER_PORTAL_SETUP.md) - Portal configuration

---

**Need Help?** Check the troubleshooting guide or contact the engineering team.

**Good luck with your production launch!** 🚀
