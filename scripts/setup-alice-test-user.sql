-- ============================================
-- Setup Alice Baker for Stripe Sandbox Testing
-- ============================================
-- User: Alice Baker
-- Stripe Customer ID: cus_TQbpaEeTVwYIu6
-- Supabase User ID: b5a39943-724b-4dc9-b2d8-006afae23eb9
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

-- 3. Verify user creation
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE id = 'b5a39943-724b-4dc9-b2d8-006afae23eb9';

-- 4. Verify profile creation
SELECT 
  id,
  full_name,
  tenant_id
FROM public.profiles
WHERE id = 'b5a39943-724b-4dc9-b2d8-006afae23eb9';

-- ============================================
-- Notes:
-- ============================================
-- Login credentials:
--   Email: alice@example.com
--   Password: password123
--
-- Next steps:
-- 1. Login with Alice's credentials
-- 2. Go to /subscription page
-- 3. Click "Start Free Trial"
-- 4. Use Stripe test card: 4242 4242 4242 4242
-- 5. This will create subscription with Stripe Customer ID: cus_TQbpaEeTVwYIu6
-- ============================================

