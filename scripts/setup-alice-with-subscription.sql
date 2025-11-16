-- ============================================
-- Setup Alice Baker WITH Active Test Subscription
-- ============================================
-- This script creates Alice AND gives her an active trial subscription
-- Use this if you want to test premium features immediately without going through checkout
-- ============================================

-- 1. Create auth user for Alice
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token,
  aud,
  role
) VALUES (
  'b5a39943-724b-4dc9-b2d8-006afae23eb9',
  '00000000-0000-0000-0000-000000000000',
  'alice@example.com',
  -- Password: 'password123' (hashed with bcrypt)
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Alice Baker"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  '',
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- 2. Create profile for Alice
INSERT INTO public.profiles (
  id,
  full_name,
  tenant_id,
  created_at,
  updated_at
) VALUES (
  'b5a39943-724b-4dc9-b2d8-006afae23eb9',
  'Alice Baker',
  '00000000-0000-0000-0000-000000000001',  -- Recipe Generator tenant
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  updated_at = NOW();

-- 3. Create ACTIVE TRIAL subscription for Alice
-- This simulates what would happen after a successful Stripe checkout
INSERT INTO public.user_subscriptions (
  user_id,
  stripe_customer_id,
  stripe_subscription_id,
  stripe_price_id,
  status,
  trial_start,
  trial_end,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  tenant_id,
  created_at,
  updated_at
) VALUES (
  'b5a39943-724b-4dc9-b2d8-006afae23eb9',
  'cus_TQbpaEeTVwYIu6',  -- Real Stripe customer ID from sandbox
  'sub_test_alice_001',   -- Test subscription ID
  'price_1QYbNfDlxejMQkXhNDNBOh8l',  -- Your actual price ID from env
  'trialing',  -- Status: currently in trial
  NOW(),  -- Trial started now
  NOW() + INTERVAL '7 days',  -- Trial ends in 7 days
  NOW(),
  NOW() + INTERVAL '1 month',
  false,
  '00000000-0000-0000-0000-000000000001',  -- Recipe Generator tenant
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO UPDATE SET
  stripe_customer_id = EXCLUDED.stripe_customer_id,
  stripe_subscription_id = EXCLUDED.stripe_subscription_id,
  stripe_price_id = EXCLUDED.stripe_price_id,
  status = EXCLUDED.status,
  trial_start = EXCLUDED.trial_start,
  trial_end = EXCLUDED.trial_end,
  current_period_start = EXCLUDED.current_period_start,
  current_period_end = EXCLUDED.current_period_end,
  updated_at = NOW();

-- 4. Verify setup
SELECT 
  u.email,
  u.email_confirmed_at,
  s.stripe_customer_id,
  s.status,
  s.trial_end,
  vs.has_access,
  vs.is_in_trial
FROM auth.users u
LEFT JOIN public.user_subscriptions s ON u.id = s.user_id
LEFT JOIN public.user_subscription_status vs ON u.id = vs.user_id
WHERE u.id = 'b5a39943-724b-4dc9-b2d8-006afae23eb9';

-- ============================================
-- Success! Alice is now set up with:
-- ✅ Account: alice@example.com / password123
-- ✅ Stripe Customer ID: cus_TQbpaEeTVwYIu6
-- ✅ Active Trial: 7 days remaining
-- ✅ Premium Access: Enabled
--
-- Alice can now:
-- - Access AI recipe generation
-- - Access AI health coach
-- - Generate AI images
-- - Test the Customer Portal
-- ============================================

