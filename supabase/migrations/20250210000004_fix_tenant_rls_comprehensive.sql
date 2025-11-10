-- =====================================================
-- Comprehensive Multi-Tenant RLS Fix - Phase 1
-- =====================================================
-- This migration applies RLS policies ONLY to tables that exist at this point (Feb 10, 2025)
-- Later migrations will add tenant support to tables created after this date
-- =====================================================

-- =====================================================
-- STEP 1: Create Helper Functions for Safe Tenant Lookups
-- =====================================================

-- This function safely retrieves the authenticated user's tenant_id
-- It's marked as SECURITY DEFINER to bypass RLS when looking up the tenant
CREATE OR REPLACE FUNCTION public.user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.user_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_tenant_id() TO anon;

-- Helper function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
      AND is_admin = true 
      AND tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
  )
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- =====================================================
-- STEP 2: Drop All Existing Conflicting Policies
-- =====================================================

-- Drop policies on profiles
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
DROP POLICY IF EXISTS "profiles_select_same_tenant" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;

-- Drop policies on recipes
DROP POLICY IF EXISTS "recipes_select_public" ON recipes;
DROP POLICY IF EXISTS "recipes_select_same_tenant_public" ON recipes;
DROP POLICY IF EXISTS "recipes_select_own" ON recipes;
DROP POLICY IF EXISTS "recipes_insert_own" ON recipes;
DROP POLICY IF EXISTS "recipes_insert_own_tenant" ON recipes;
DROP POLICY IF EXISTS "recipes_update_own" ON recipes;
DROP POLICY IF EXISTS "recipes_delete_own" ON recipes;
DROP POLICY IF EXISTS "Public recipes are viewable by everyone" ON recipes;
DROP POLICY IF EXISTS "Users can view their own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can insert their own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can update their own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can delete their own recipes" ON recipes;

-- Drop policies on user_groceries
DROP POLICY IF EXISTS "user_groceries_own_data" ON user_groceries;
DROP POLICY IF EXISTS "user_groceries_tenant_scoped" ON user_groceries;

-- Drop policies on usernames
DROP POLICY IF EXISTS "usernames_select_all" ON usernames;
DROP POLICY IF EXISTS "usernames_insert_own" ON usernames;
DROP POLICY IF EXISTS "usernames_update_own" ON usernames;
DROP POLICY IF EXISTS "usernames_delete_own" ON usernames;

-- Drop policies on user_safety
DROP POLICY IF EXISTS "user_safety_select_own" ON user_safety;
DROP POLICY IF EXISTS "user_safety_insert_own" ON user_safety;
DROP POLICY IF EXISTS "user_safety_update_own" ON user_safety;
DROP POLICY IF EXISTS "user_safety_own_data" ON user_safety;

-- Drop policies on cooking_preferences
DROP POLICY IF EXISTS "cooking_preferences_select_own" ON cooking_preferences;
DROP POLICY IF EXISTS "cooking_preferences_insert_own" ON cooking_preferences;
DROP POLICY IF EXISTS "cooking_preferences_update_own" ON cooking_preferences;
DROP POLICY IF EXISTS "cooking_preferences_select_all" ON cooking_preferences;
DROP POLICY IF EXISTS "cooking_preferences_modify_own" ON cooking_preferences;

-- Drop policies on avatar_analytics
DROP POLICY IF EXISTS "avatar_analytics_insert_own" ON avatar_analytics;
DROP POLICY IF EXISTS "avatar_analytics_select_own" ON avatar_analytics;

-- Drop policies on user_subscriptions
DROP POLICY IF EXISTS "Users can view own subscription" ON user_subscriptions;
DROP POLICY IF EXISTS "Service role can insert subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Service role can update subscriptions" ON user_subscriptions;

-- Drop policies on tenants (admin panel access)
DROP POLICY IF EXISTS "admins_can_manage_tenants" ON tenants;
DROP POLICY IF EXISTS "tenants_select_all" ON tenants;
DROP POLICY IF EXISTS "tenants_update_owner" ON tenants;
DROP POLICY IF EXISTS "tenants_insert_admin" ON tenants;

-- =====================================================
-- STEP 3: Create RLS Policies for PROFILES
-- =====================================================

-- Super admin can see all profiles
CREATE POLICY "profiles_super_admin_all" ON profiles
  FOR ALL
  USING (public.is_super_admin());

-- Users can see profiles in their tenant
CREATE POLICY "profiles_select_same_tenant" ON profiles
  FOR SELECT
  USING (tenant_id = public.user_tenant_id());

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- STEP 4: Create RLS Policies for RECIPES
-- =====================================================

-- Super admin can see/manage all recipes
CREATE POLICY "recipes_super_admin_all" ON recipes
  FOR ALL
  USING (public.is_super_admin());

-- Anonymous users can view public recipes
CREATE POLICY "recipes_anon_select_public" ON recipes
  FOR SELECT
  TO anon
  USING (is_public = true);

-- Authenticated users can view public recipes in their tenant
CREATE POLICY "recipes_select_public_same_tenant" ON recipes
  FOR SELECT
  TO authenticated
  USING (is_public = true AND tenant_id = public.user_tenant_id());

-- Users can view their own recipes (public or private)
CREATE POLICY "recipes_select_own" ON recipes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert recipes in their tenant
CREATE POLICY "recipes_insert_own_tenant" ON recipes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    AND tenant_id = public.user_tenant_id()
  );

-- Users can update their own recipes
CREATE POLICY "recipes_update_own" ON recipes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own recipes
CREATE POLICY "recipes_delete_own" ON recipes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- STEP 5: Create RLS Policies for USER_GROCERIES
-- =====================================================

-- Super admin can see/manage all groceries
CREATE POLICY "user_groceries_super_admin_all" ON user_groceries
  FOR ALL
  USING (public.is_super_admin());

-- Users can manage their own groceries in their tenant
CREATE POLICY "user_groceries_own_data" ON user_groceries
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = user_id 
    AND tenant_id = public.user_tenant_id()
  );

-- =====================================================
-- STEP 6: Create RLS Policies for USERNAMES
-- =====================================================

-- Super admin can see/manage all usernames
CREATE POLICY "usernames_super_admin_all" ON usernames
  FOR ALL USING (public.is_super_admin());

-- Users can manage their own username in their tenant
CREATE POLICY "usernames_own_data" ON usernames
  FOR ALL TO authenticated
  USING (auth.uid() = user_id AND tenant_id = public.user_tenant_id());

-- =====================================================
-- STEP 7: Create RLS Policies for USER_SAFETY
-- =====================================================

-- Super admin can see/manage all user safety data
CREATE POLICY "user_safety_super_admin_all" ON user_safety
  FOR ALL USING (public.is_super_admin());

-- Users can manage their own safety data in their tenant
CREATE POLICY "user_safety_own_data" ON user_safety
  FOR ALL TO authenticated
  USING (auth.uid() = user_id AND tenant_id = public.user_tenant_id());

-- =====================================================
-- STEP 8: Create RLS Policies for COOKING_PREFERENCES
-- =====================================================

-- Super admin can see/manage all cooking preferences
CREATE POLICY "cooking_preferences_super_admin_all" ON cooking_preferences
  FOR ALL USING (public.is_super_admin());

-- Users can manage their own cooking preferences in their tenant
CREATE POLICY "cooking_preferences_own_data" ON cooking_preferences
  FOR ALL TO authenticated
  USING (auth.uid() = user_id AND tenant_id = public.user_tenant_id());

-- =====================================================
-- STEP 9: Create RLS Policies for AVATAR_ANALYTICS
-- =====================================================

-- Super admin can see/manage all avatar analytics
CREATE POLICY "avatar_analytics_super_admin_all" ON avatar_analytics
  FOR ALL USING (public.is_super_admin());

-- Users can manage their own avatar analytics in their tenant
CREATE POLICY "avatar_analytics_own_data" ON avatar_analytics
  FOR ALL TO authenticated
  USING (auth.uid() = user_id AND tenant_id = public.user_tenant_id());

-- =====================================================
-- STEP 10: Create RLS Policies for USER_SUBSCRIPTIONS
-- =====================================================

-- Super admin can see/manage all subscriptions
CREATE POLICY "user_subscriptions_super_admin_all" ON user_subscriptions
  FOR ALL USING (public.is_super_admin());

-- Users can view their own subscription in their tenant
CREATE POLICY "user_subscriptions_select_own" ON user_subscriptions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND tenant_id = public.user_tenant_id());

-- Service role can insert/update subscriptions (for Stripe webhooks)
CREATE POLICY "user_subscriptions_service_insert" ON user_subscriptions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "user_subscriptions_service_update" ON user_subscriptions
  FOR UPDATE USING (true);

-- =====================================================
-- STEP 11: Create RLS Policies for GLOBAL_INGREDIENTS
-- =====================================================

-- Super admin can manage all global ingredients
CREATE POLICY "global_ingredients_super_admin_all" ON global_ingredients
  FOR ALL USING (public.is_super_admin());

-- All users can view global ingredients (they're global after all)
CREATE POLICY "global_ingredients_select_all" ON global_ingredients
  FOR SELECT USING (true);

-- Users can insert ingredients in their tenant
CREATE POLICY "global_ingredients_insert_own_tenant" ON global_ingredients
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.user_tenant_id());

-- =====================================================
-- STEP 12: Create RLS Policies for USER_HIDDEN_INGREDIENTS
-- =====================================================

-- Super admin can see/manage all hidden ingredients
CREATE POLICY "user_hidden_ingredients_super_admin_all" ON user_hidden_ingredients
  FOR ALL USING (public.is_super_admin());

-- Users can manage their own hidden ingredients in their tenant
CREATE POLICY "user_hidden_ingredients_own_data" ON user_hidden_ingredients
  FOR ALL TO authenticated
  USING (auth.uid() = user_id AND tenant_id = public.user_tenant_id());

-- =====================================================
-- STEP 13: Create RLS Policies for TENANTS Table
-- =====================================================

-- Super admins can manage all tenants
CREATE POLICY "tenants_super_admin_all" ON tenants
  FOR ALL
  USING (public.is_super_admin());

-- Tenant admins can view and update their own tenant
CREATE POLICY "tenants_admin_own_tenant" ON tenants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
        AND profiles.tenant_id = tenants.id
    )
  );

CREATE POLICY "tenants_admin_update_own" ON tenants
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
        AND profiles.tenant_id = tenants.id
    )
  );

-- Anyone can view their own tenant (for branding, etc.)
CREATE POLICY "tenants_user_view_own" ON tenants
  FOR SELECT
  TO authenticated
  USING (id = public.user_tenant_id());

-- Anonymous users need to be able to read tenant info for subdomains
CREATE POLICY "tenants_anon_read_active" ON tenants
  FOR SELECT
  TO anon
  USING (is_active = true);

-- =====================================================
-- STEP 14: Enable RLS on All Tables
-- =====================================================

-- Ensure RLS is enabled on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_groceries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE usernames ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_safety ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooking_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatar_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_hidden_ingredients ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- MIGRATION COMPLETE - PHASE 1
-- =====================================================
-- All RLS policies have been applied to tables that exist at this point
-- Future migrations will add tenant support to:
-- - evaluation_reports (created Sept 4, 2025)
-- - recipe_ratings, recipe_versions, recipe_views (created Sept 16, 2025)
-- - conversation_threads and related tables (created Nov 7, 2025)
-- =====================================================
