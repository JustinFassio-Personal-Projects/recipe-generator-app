# Stripe Customer Portal Setup Guide

The Stripe Customer Portal allows users to self-serve manage their subscriptions without requiring custom UI or backend logic.

## What Users Can Do

With the Customer Portal, subscribers can:

- ✅ Cancel their subscription
- ✅ Update payment methods
- ✅ View billing history
- ✅ Download invoices
- ✅ Update billing information

## Setup Instructions

### Step 1: Enable Customer Portal

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Settings** → **Billing** → **Customer portal**
3. Click **Activate** (if not already activated)

### Step 2: Configure Portal Settings

#### Products & Subscriptions

Configure what actions customers can take:

1. In **Products** section:
   - ✅ Enable "Customers can cancel their subscriptions"
   - ✅ Enable "Customers can pause their subscriptions" (optional)
   - ⚠️ Choose cancellation behavior:
     - **Recommended:** "Cancel at end of billing period" (better UX)
     - Alternative: "Cancel immediately"

2. In **Payment Methods** section:
   - ✅ Enable "Customers can update their payment methods"

3. In **Invoices** section:
   - ✅ Enable "Show invoice history"
   - ✅ Enable "Allow invoice PDF downloads"

#### Branding

Customize the portal appearance:

1. **Business Information:**
   - Add your business name: `Recipe Generator`
   - Add your business website
   - Add support email/phone

2. **Branding:**
   - Upload your logo (recommended: 512x512px PNG)
   - Choose brand color (use your primary brand color)
   - Choose accent color (for links and buttons)

3. **Custom Terms & Privacy Links** (optional):
   - Add link to Terms of Service
   - Add link to Privacy Policy

### Step 3: Configure Return URL

The return URL is where users go after finishing in the portal.

**Default Return URL:** `https://yourdomain.com/subscription`

This is automatically set in the code:

```typescript
// api/stripe/create-portal-session.ts
const returnUrl = `${origin}/subscription`;
```

**For Local Development:**

- Uses `http://localhost:5174/subscription`
- Automatically detected from request origin

**For Production:**

- Uses your production domain
- No configuration needed in Stripe Dashboard

### Step 4: Test Mode vs. Live Mode

#### Test Mode Setup

For development/staging:

1. Switch to **Test mode** (toggle in Stripe Dashboard)
2. Configure portal settings as above
3. Test with test payment methods

#### Live Mode Setup

For production:

1. Switch to **Live mode**
2. **Important:** Live mode has separate settings!
3. Re-configure all portal settings in Live mode
4. The settings don't carry over from Test mode

### Step 5: Test the Portal

#### Local Testing

1. Start your dev server: `npm run dev`
2. Sign up/login to your app
3. Subscribe to Premium (use test card: `4242 4242 4242 4242`)
4. Navigate to `/subscription` page
5. Click **"Manage Subscription"** button
6. Verify portal opens and shows correct options

#### What to Test

- ✅ Portal opens successfully
- ✅ Shows correct subscription information
- ✅ Can cancel subscription
- ✅ Can update payment method
- ✅ Can view billing history
- ✅ Return URL works (redirects back to `/subscription`)

### Common Issues

#### Issue: Portal button doesn't work

**Causes:**

- User has no subscription
- Missing `stripe_customer_id` in database
- Stripe Customer Portal not activated

**Solution:**

```bash
# Check database for customer_id
psql postgresql://... -c "SELECT user_id, stripe_customer_id, status FROM user_subscriptions WHERE user_id='USER_ID';"

# Verify webhook synced subscription
# Check Vercel logs for webhook processing
```

#### Issue: Portal shows wrong brand

**Solution:**

- Update branding in Stripe Dashboard
- Settings are per-mode (Test vs Live)
- Changes take effect immediately

#### Issue: Users can't cancel

**Solution:**

- Check "Customers can cancel" is enabled in portal settings
- Verify you're in the correct mode (Test vs Live)

### Security Notes

✅ **Portal sessions are secure:**

- Each session is unique and expires
- Sessions are tied to specific customer
- Can only be created by authenticated backend

✅ **Users can only access their own data:**

- Stripe validates customer_id
- Backend verifies user authentication first

⚠️ **Important:**

- Never expose `stripe_customer_id` in frontend code
- Always create portal sessions server-side
- Always verify user authentication before creating session

### Implementation Reference

The Customer Portal is implemented in these files:

**Backend:**

- `api/stripe/create-portal-session.ts` - Creates portal session

**Frontend:**

- `src/hooks/useCustomerPortal.ts` - Hook to open portal
- `src/pages/SubscriptionPage.tsx` - UI with "Manage Subscription" button

### Customization Options

#### Add Custom Links

You can add up to 10 custom links to the portal:

1. In Stripe Dashboard → Customer portal → **Business information**
2. Under **Custom links**, click **Add link**
3. Examples:
   - "Help Center" → `https://yourdomain.com/help`
   - "Contact Support" → `https://yourdomain.com/support`
   - "Feature Requests" → `https://yourdomain.com/feedback`

#### Configure Email Notifications

When users make changes in the portal, Stripe can send emails:

1. Navigate to **Settings** → **Emails**
2. Configure:
   - Successful payment emails
   - Failed payment emails
   - Subscription canceled emails
   - Invoice emails

**Recommended:** Enable all notification emails for transparency

### Production Checklist

Before going live:

- [ ] Customer Portal activated in **Live mode**
- [ ] All desired features enabled (cancel, update payment, etc.)
- [ ] Branding configured (logo, colors, business info)
- [ ] Email notifications configured
- [ ] Tested complete flow in Live mode with real card
- [ ] Return URL works correctly
- [ ] Terms/Privacy links added (if applicable)
- [ ] Support contact information added

### Monitoring

Track portal usage:

1. **Stripe Dashboard** → **More** → **Customer portal**
2. View metrics:
   - Number of portal sessions created
   - Actions taken (cancellations, payment updates)
   - Most common actions

### Additional Resources

- [Stripe Customer Portal Documentation](https://stripe.com/docs/billing/subscriptions/customer-portal)
- [Customizing the Portal](https://stripe.com/docs/billing/subscriptions/integrating-customer-portal)
- [Portal Security Best Practices](https://stripe.com/docs/security/guide)

---

**Questions?** Check the troubleshooting section above or contact your development team.
