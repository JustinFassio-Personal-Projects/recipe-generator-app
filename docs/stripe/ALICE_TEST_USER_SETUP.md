# Alice Baker - Stripe Sandbox Test User Setup

## 👤 User Information

**Name:** Alice Baker  
**Email:** `alice@example.com`  
**Password:** `password123`  
**Supabase User ID:** `b5a39943-724b-4dc9-b2d8-006afae23eb9`  
**Stripe Customer ID:** `cus_TQbpaEeTVwYIu6`

---

## 🚀 Quick Setup

### Option 1: User Only (Test Full Checkout Flow)

Use this to test the complete subscription flow from scratch:

```bash
# Run the SQL script to create Alice without a subscription
psql $DATABASE_URL -f scripts/setup-alice-test-user.sql
```

**Then:**

1. Login as Alice (`alice@example.com` / `password123`)
2. Visit `/subscription` page
3. Click "Start Free Trial"
4. Complete Stripe checkout with test card: `4242 4242 4242 4242`
5. Webhook will create subscription automatically

### Option 2: User + Active Subscription (Test Premium Features)

Use this to skip checkout and immediately test premium features:

```bash
# Run the SQL script to create Alice WITH an active trial
psql $DATABASE_URL -f scripts/setup-alice-with-subscription.sql
```

**Then:**

1. Login as Alice (`alice@example.com` / `password123`)
2. Immediately access all premium features
3. Test AI recipe generation, health coach, image generation
4. Test Customer Portal at `/subscription`

---

## 📝 What You Can Test With Alice

### ✅ Without Subscription (Option 1)

After running `setup-alice-test-user.sql`:

- [x] Login/Authentication
- [x] View recipes (free features)
- [x] See "Upgrade to Premium" prompts on AI features
- [x] Test checkout flow
- [x] Test Stripe webhook integration
- [x] Test trial activation

### ✅ With Active Subscription (Option 2)

After running `setup-alice-with-subscription.sql`:

- [x] Access AI recipe generation (`/chat-recipe`)
- [x] Access AI health coach (`/coach-chat`)
- [x] Generate AI images on recipe forms
- [x] See "Trial Active" badge
- [x] Access Customer Portal
- [x] Test subscription management
- [x] Test cancellation flow

---

## 🧪 Testing Scenarios

### Scenario 1: New User Signup → Checkout → Trial

```bash
# 1. Create Alice without subscription
psql $DATABASE_URL -f scripts/setup-alice-test-user.sql

# 2. Login as Alice
# Email: alice@example.com
# Password: password123

# 3. Try to access /chat-recipe
# Expected: See "Upgrade to Premium" prompt

# 4. Go to /subscription and click "Start Free Trial"
# Expected: Redirect to Stripe Checkout

# 5. Use Stripe test card:
# Card: 4242 4242 4242 4242
# Exp: Any future date
# CVC: Any 3 digits
# ZIP: Any 5 digits

# 6. Complete checkout
# Expected: Redirect to /subscription/success
# Expected: Webhook creates subscription record

# 7. Try /chat-recipe again
# Expected: Full access to AI features
```

### Scenario 2: Existing Premium User

```bash
# 1. Create Alice WITH subscription
psql $DATABASE_URL -f scripts/setup-alice-with-subscription.sql

# 2. Login as Alice
# Email: alice@example.com
# Password: password123

# 3. Visit /chat-recipe
# Expected: Immediate access to AI chat

# 4. Check header/nav
# Expected: See "Trial Active" badge

# 5. Generate a recipe with AI
# Expected: Full functionality, no prompts

# 6. Visit /subscription
# Expected: See "Current Subscription" card
# Expected: See "Manage Subscription" button
```

### Scenario 3: Customer Portal Testing

```bash
# 1. Setup Alice with subscription
psql $DATABASE_URL -f scripts/setup-alice-with-subscription.sql

# 2. Login as Alice
# 3. Go to /subscription
# 4. Click "Manage Subscription"
# Expected: Redirect to Stripe Customer Portal
# 5. Test cancellation, payment method update, etc.
```

### Scenario 4: Trial Expiration Testing

```bash
# 1. Setup Alice with subscription
psql $DATABASE_URL -f scripts/setup-alice-with-subscription.sql

# 2. Manually expire the trial
psql $DATABASE_URL -c "
UPDATE user_subscriptions
SET
  trial_end = NOW() - INTERVAL '1 day',
  status = 'active'  -- or 'past_due' if payment failed
WHERE user_id = 'b5a39943-724b-4dc9-b2d8-006afae23eb9';
"

# 3. Login as Alice
# 4. Check /chat-recipe
# Expected: Still has access (status = 'active')

# 5. Simulate cancelled subscription
psql $DATABASE_URL -c "
UPDATE user_subscriptions
SET
  status = 'canceled',
  cancel_at_period_end = true,
  canceled_at = NOW()
WHERE user_id = 'b5a39943-724b-4dc9-b2d8-006afae23eb9';
"

# 6. Reload and check /chat-recipe
# Expected: See "Upgrade to Premium" prompt (access revoked)
```

---

## 🔧 Useful Commands

### Check Alice's Current Status

```sql
SELECT
  u.email,
  s.status,
  s.stripe_customer_id,
  s.trial_end,
  vs.has_access,
  vs.is_in_trial,
  vs.trial_ended
FROM auth.users u
LEFT JOIN user_subscriptions s ON u.id = s.user_id
LEFT JOIN user_subscription_status vs ON u.id = vs.user_id
WHERE u.email = 'alice@example.com';
```

### Give Alice Premium Access

```sql
INSERT INTO user_subscriptions (
  user_id, stripe_customer_id, stripe_subscription_id,
  status, trial_start, trial_end
) VALUES (
  'b5a39943-724b-4dc9-b2d8-006afae23eb9',
  'cus_TQbpaEeTVwYIu6',
  'sub_test_alice_001',
  'trialing',
  NOW(),
  NOW() + INTERVAL '7 days'
) ON CONFLICT (user_id) DO UPDATE
SET status = 'trialing', trial_end = NOW() + INTERVAL '7 days';
```

### Remove Alice's Subscription

```sql
DELETE FROM user_subscriptions
WHERE user_id = 'b5a39943-724b-4dc9-b2d8-006afae23eb9';
```

### Cancel Alice's Subscription (Simulate Cancellation)

```sql
UPDATE user_subscriptions
SET
  status = 'canceled',
  cancel_at_period_end = true,
  canceled_at = NOW()
WHERE user_id = 'b5a39943-724b-4dc9-b2d8-006afae23eb9';
```

### Reset Alice's Trial

```sql
UPDATE user_subscriptions
SET
  status = 'trialing',
  trial_start = NOW(),
  trial_end = NOW() + INTERVAL '7 days',
  cancel_at_period_end = false,
  canceled_at = NULL
WHERE user_id = 'b5a39943-724b-4dc9-b2d8-006afae23eb9';
```

### Delete Alice Completely

```sql
-- Delete in order due to foreign keys
DELETE FROM user_subscriptions WHERE user_id = 'b5a39943-724b-4dc9-b2d8-006afae23eb9';
DELETE FROM profiles WHERE id = 'b5a39943-724b-4dc9-b2d8-006afae23eb9';
DELETE FROM auth.users WHERE id = 'b5a39943-724b-4dc9-b2d8-006afae23eb9';
```

---

## 🧪 Stripe Test Cards

Use these test cards in Stripe Checkout:

### Successful Payments

- **Card:** `4242 4242 4242 4242`
- **Exp:** Any future date
- **CVC:** Any 3 digits
- **ZIP:** Any 5 digits

### Declined Payments

- **Card:** `4000 0000 0000 0002` (Generic decline)
- **Card:** `4000 0000 0000 9995` (Insufficient funds)

### 3D Secure

- **Card:** `4000 0025 0000 3155` (Requires authentication)

[More test cards](https://stripe.com/docs/testing#cards)

---

## 🐛 Troubleshooting

### Issue: "No such customer" Error

**Cause:** Stripe customer ID in database doesn't exist in Stripe sandbox

**Fix:**

```sql
-- Option 1: Remove the invalid customer ID
UPDATE user_subscriptions
SET stripe_customer_id = NULL
WHERE user_id = 'b5a39943-724b-4dc9-b2d8-006afae23eb9';

-- Option 2: Delete and recreate via checkout
DELETE FROM user_subscriptions
WHERE user_id = 'b5a39943-724b-4dc9-b2d8-006afae23eb9';
-- Then go through checkout flow
```

### Issue: Alice Can't Access Premium Features

**Check:**

```sql
-- Verify subscription status
SELECT * FROM user_subscription_status
WHERE user_id = 'b5a39943-724b-4dc9-b2d8-006afae23eb9';

-- Should show:
-- has_access = true
-- is_in_trial = true (if in trial)
-- status = 'trialing' or 'active'
```

**Fix:**

```sql
-- Reset to active trial
UPDATE user_subscriptions
SET
  status = 'trialing',
  trial_end = NOW() + INTERVAL '7 days'
WHERE user_id = 'b5a39943-724b-4dc9-b2d8-006afae23eb9';
```

### Issue: Webhook Not Creating Subscription

**Check:**

1. Webhook endpoint is running (`/api/stripe/webhook`)
2. Webhook secret is correct in `.env.local`
3. Check Stripe Dashboard → Webhooks → Events
4. Look at browser console for errors

**Manual Fix:**

```bash
# Create subscription manually after checkout
psql $DATABASE_URL -f scripts/setup-alice-with-subscription.sql
```

---

## 📚 Related Documentation

- [Premium Access Fix](./PREMIUM_ACCESS_FIX.md) - How premium gating works
- [Customer Portal Setup](./CUSTOMER_PORTAL_SETUP.md) - Portal configuration
- [Test Data Cleanup](./TEST_DATA_CLEANUP.md) - Cleanup invalid test data
- [Production Deployment](./PRODUCTION_DEPLOYMENT.md) - Going live

---

## ✅ Quick Verification Checklist

After setting up Alice, verify:

- [ ] Can login with `alice@example.com` / `password123`
- [ ] Subscription status shows correctly on `/subscription` page
- [ ] Can access (or see upgrade prompt for) `/chat-recipe`
- [ ] Can access (or see upgrade prompt for) `/coach-chat`
- [ ] AI image generation shows correct state
- [ ] Customer Portal button works (if subscribed)
- [ ] Premium badge shows correctly (if subscribed)

---

**Happy Testing! 🎉**
