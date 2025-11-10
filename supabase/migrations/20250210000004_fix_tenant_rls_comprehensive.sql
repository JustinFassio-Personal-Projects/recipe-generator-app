-- =====================================================
-- Comprehensive Multi-Tenant RLS Fix
-- =====================================================
-- This migration fixes all RLS issues by:
-- 1. Creating a helper function for safe tenant lookups
-- 2. Dropping all conflicting policies
-- 3. Adding tenant_id to all user tables
-- 4. Backfilling existing data
-- 5. Creating consistent RLS policies across all tables
-- =====================================================

-- =====================================================
-- STEP 1: Create Helper Function for Safe Tenant Lookups
-- =====================================================

-- This function safely retrieves the authenticated user's tenant_id
-- It's marked as SECURITY DEFINER to bypass RLS when looking up the tenant
-- NOTE: Must be in public schema, not auth schema (permission denied)
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

-- Note: evaluation_reports table doesn't exist at this point (created later in migration 20250904212232)
-- DROP POLICY IF EXISTS "evaluation_reports_tenant_scoped" ON evaluation_reports;

-- Drop policies on tenants (admin panel access)
DROP POLICY IF EXISTS "admins_can_manage_tenants" ON tenants;

-- =====================================================
-- STEP 3: Add tenant_id Column to User Tables
-- =====================================================

-- Add tenant_id to tables that don't have it
-- We'll use DO blocks to avoid errors if columns already exist

DO $$ 
BEGIN
  -- avatar_analytics
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'avatar_analytics' 
                 AND column_name = 'tenant_id') THEN
    ALTER TABLE avatar_analytics ADD COLUMN tenant_id UUID REFERENCES tenants(id);
    CREATE INDEX IF NOT EXISTS idx_avatar_analytics_tenant ON avatar_analytics(tenant_id);
  END IF;

  -- recipe_views
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'recipe_views' 
                 AND column_name = 'tenant_id') THEN
    ALTER TABLE recipe_views ADD COLUMN tenant_id UUID REFERENCES tenants(id);
    CREATE INDEX IF NOT EXISTS idx_recipe_views_tenant ON recipe_views(tenant_id);
  END IF;

  -- user_budgets
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'user_budgets' 
                 AND column_name = 'tenant_id') THEN
    ALTER TABLE user_budgets ADD COLUMN tenant_id UUID REFERENCES tenants(id);
    CREATE INDEX IF NOT EXISTS idx_user_budgets_tenant ON user_budgets(tenant_id);
  END IF;

  -- image_generation_costs
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'image_generation_costs' 
                 AND column_name = 'tenant_id') THEN
    ALTER TABLE image_generation_costs ADD COLUMN tenant_id UUID REFERENCES tenants(id);
    CREATE INDEX IF NOT EXISTS idx_image_generation_costs_tenant ON image_generation_costs(tenant_id);
  END IF;

  -- recipe_comments
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'recipe_comments' 
                 AND column_name = 'tenant_id') THEN
    ALTER TABLE recipe_comments ADD COLUMN tenant_id UUID REFERENCES tenants(id);
    CREATE INDEX IF NOT EXISTS idx_recipe_comments_tenant ON recipe_comments(tenant_id);
  END IF;

  -- user_subscriptions
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'user_subscriptions' 
                 AND column_name = 'tenant_id') THEN
    ALTER TABLE user_subscriptions ADD COLUMN tenant_id UUID REFERENCES tenants(id);
    CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tenant ON user_subscriptions(tenant_id);
  END IF;

  -- usernames
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'usernames' 
                 AND column_name = 'tenant_id') THEN
    ALTER TABLE usernames ADD COLUMN tenant_id UUID REFERENCES tenants(id);
    CREATE INDEX IF NOT EXISTS idx_usernames_tenant ON usernames(tenant_id);
  END IF;

  -- user_safety
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'user_safety' 
                 AND column_name = 'tenant_id') THEN
    ALTER TABLE user_safety ADD COLUMN tenant_id UUID REFERENCES tenants(id);
    CREATE INDEX IF NOT EXISTS idx_user_safety_tenant ON user_safety(tenant_id);
  END IF;

  -- cooking_preferences
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'cooking_preferences' 
                 AND column_name = 'tenant_id') THEN
    ALTER TABLE cooking_preferences ADD COLUMN tenant_id UUID REFERENCES tenants(id);
    CREATE INDEX IF NOT EXISTS idx_cooking_preferences_tenant ON cooking_preferences(tenant_id);
  END IF;

  -- recipe_ratings
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'recipe_ratings' 
                 AND column_name = 'tenant_id') THEN
    ALTER TABLE recipe_ratings ADD COLUMN tenant_id UUID REFERENCES tenants(id);
    CREATE INDEX IF NOT EXISTS idx_recipe_ratings_tenant ON recipe_ratings(tenant_id);
  END IF;

  -- user_subscription_status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'user_subscription_status' 
                 AND column_name = 'tenant_id') THEN
    ALTER TABLE user_subscription_status ADD COLUMN tenant_id UUID REFERENCES tenants(id);
    CREATE INDEX IF NOT EXISTS idx_user_subscription_status_tenant ON user_subscription_status(tenant_id);
  END IF;

  -- user_hidden_ingredients
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'user_hidden_ingredients' 
                 AND column_name = 'tenant_id') THEN
    ALTER TABLE user_hidden_ingredients ADD COLUMN tenant_id UUID REFERENCES tenants(id);
    CREATE INDEX IF NOT EXISTS idx_user_hidden_ingredients_tenant ON user_hidden_ingredients(tenant_id);
  END IF;

  -- conversation_threads
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'conversation_threads' 
                 AND column_name = 'tenant_id') THEN
    ALTER TABLE conversation_threads ADD COLUMN tenant_id UUID REFERENCES tenants(id);
    CREATE INDEX IF NOT EXISTS idx_conversation_threads_tenant ON conversation_threads(tenant_id);
  END IF;

  -- evaluation_progress_tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'evaluation_progress_tracking' 
                 AND column_name = 'tenant_id') THEN
    ALTER TABLE evaluation_progress_tracking ADD COLUMN tenant_id UUID REFERENCES tenants(id);
    CREATE INDEX IF NOT EXISTS idx_evaluation_progress_tracking_tenant ON evaluation_progress_tracking(tenant_id);
  END IF;

  -- user_progress_config
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'user_progress_config' 
                 AND column_name = 'tenant_id') THEN
    ALTER TABLE user_progress_config ADD COLUMN tenant_id UUID REFERENCES tenants(id);
    CREATE INDEX IF NOT EXISTS idx_user_progress_config_tenant ON user_progress_config(tenant_id);
  END IF;

  -- health_milestones
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'health_milestones' 
                 AND column_name = 'tenant_id') THEN
    ALTER TABLE health_milestones ADD COLUMN tenant_id UUID REFERENCES tenants(id);
    CREATE INDEX IF NOT EXISTS idx_health_milestones_tenant ON health_milestones(tenant_id);
  END IF;

  -- progress_analytics
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'progress_analytics' 
                 AND column_name = 'tenant_id') THEN
    ALTER TABLE progress_analytics ADD COLUMN tenant_id UUID REFERENCES tenants(id);
    CREATE INDEX IF NOT EXISTS idx_progress_analytics_tenant ON progress_analytics(tenant_id);
  END IF;

  -- user_progress_summary
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'user_progress_summary' 
                 AND column_name = 'tenant_id') THEN
    ALTER TABLE user_progress_summary ADD COLUMN tenant_id UUID REFERENCES tenants(id);
    CREATE INDEX IF NOT EXISTS idx_user_progress_summary_tenant ON user_progress_summary(tenant_id);
  END IF;
END $$;

-- =====================================================
-- STEP 4: Backfill tenant_id for Existing Data
-- =====================================================

-- Update all user tables to use the default tenant for existing records
DO $$
DECLARE
  default_tenant_id UUID := '00000000-0000-0000-0000-000000000001'::uuid;
BEGIN
  -- Backfill tables based on user_id column
  UPDATE avatar_analytics SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE recipe_views SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE user_budgets SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE image_generation_costs SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE recipe_comments SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE user_subscriptions SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE usernames SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE user_safety SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE cooking_preferences SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE recipe_ratings SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE user_subscription_status SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE user_hidden_ingredients SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE conversation_threads SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE evaluation_progress_tracking SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE user_progress_config SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE health_milestones SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE progress_analytics SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE user_progress_summary SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
END $$;

-- =====================================================
-- STEP 5: Create RLS Policies for PROFILES
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
-- STEP 6: Create RLS Policies for RECIPES
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
-- STEP 7: Create RLS Policies for USER_GROCERIES
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
-- STEP 8: Create RLS Policies for EVALUATION_REPORTS
-- =====================================================
-- Note: evaluation_reports table doesn't exist at this point (created later in migration 20250904212232)
-- Tenant policies for evaluation_reports should be added in a later migration after the table is created

-- Super admin can see/manage all evaluation reports
-- CREATE POLICY "evaluation_reports_super_admin_all" ON evaluation_reports
--   FOR ALL
--   USING (public.is_super_admin());

-- Users can manage their own evaluation reports in their tenant
-- CREATE POLICY "evaluation_reports_own_data" ON evaluation_reports
--   FOR ALL
--   TO authenticated
--   USING (
--     auth.uid() = user_id 
--     AND tenant_id = public.user_tenant_id()
--   );

-- =====================================================
-- STEP 9: Create RLS Policies for Other User Tables
-- =====================================================

-- For each table, we create:
-- 1. Super admin bypass
-- 2. User can manage their own data in their tenant

-- AVATAR_ANALYTICS
CREATE POLICY "avatar_analytics_super_admin_all" ON avatar_analytics
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "avatar_analytics_own_data" ON avatar_analytics
  FOR ALL TO authenticated
  USING (auth.uid() = user_id AND tenant_id = public.user_tenant_id());

-- RECIPE_VIEWS
CREATE POLICY "recipe_views_super_admin_all" ON recipe_views
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "recipe_views_own_data" ON recipe_views
  FOR ALL TO authenticated
  USING (auth.uid() = user_id AND tenant_id = public.user_tenant_id());

-- USER_BUDGETS
CREATE POLICY "user_budgets_super_admin_all" ON user_budgets
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "user_budgets_own_data" ON user_budgets
  FOR ALL TO authenticated
  USING (auth.uid() = user_id AND tenant_id = public.user_tenant_id());

-- IMAGE_GENERATION_COSTS
CREATE POLICY "image_generation_costs_super_admin_all" ON image_generation_costs
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "image_generation_costs_own_data" ON image_generation_costs
  FOR ALL TO authenticated
  USING (auth.uid() = user_id AND tenant_id = public.user_tenant_id());

-- RECIPE_COMMENTS
CREATE POLICY "recipe_comments_super_admin_all" ON recipe_comments
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "recipe_comments_own_data" ON recipe_comments
  FOR ALL TO authenticated
  USING (auth.uid() = user_id AND tenant_id = public.user_tenant_id());

-- USER_SUBSCRIPTIONS
CREATE POLICY "user_subscriptions_super_admin_all" ON user_subscriptions
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "user_subscriptions_own_data" ON user_subscriptions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id AND tenant_id = public.user_tenant_id());

-- USERNAMES
CREATE POLICY "usernames_super_admin_all" ON usernames
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "usernames_own_data" ON usernames
  FOR ALL TO authenticated
  USING (auth.uid() = user_id AND tenant_id = public.user_tenant_id());

-- USER_SAFETY
CREATE POLICY "user_safety_super_admin_all" ON user_safety
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "user_safety_own_data" ON user_safety
  FOR ALL TO authenticated
  USING (auth.uid() = user_id AND tenant_id = public.user_tenant_id());

-- COOKING_PREFERENCES
CREATE POLICY "cooking_preferences_super_admin_all" ON cooking_preferences
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "cooking_preferences_own_data" ON cooking_preferences
  FOR ALL TO authenticated
  USING (auth.uid() = user_id AND tenant_id = public.user_tenant_id());

-- RECIPE_RATINGS
CREATE POLICY "recipe_ratings_super_admin_all" ON recipe_ratings
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "recipe_ratings_own_data" ON recipe_ratings
  FOR ALL TO authenticated
  USING (auth.uid() = user_id AND tenant_id = public.user_tenant_id());

-- USER_SUBSCRIPTION_STATUS
CREATE POLICY "user_subscription_status_super_admin_all" ON user_subscription_status
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "user_subscription_status_own_data" ON user_subscription_status
  FOR ALL TO authenticated
  USING (auth.uid() = user_id AND tenant_id = public.user_tenant_id());

-- USER_HIDDEN_INGREDIENTS
CREATE POLICY "user_hidden_ingredients_super_admin_all" ON user_hidden_ingredients
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "user_hidden_ingredients_own_data" ON user_hidden_ingredients
  FOR ALL TO authenticated
  USING (auth.uid() = user_id AND tenant_id = public.user_tenant_id());

-- CONVERSATION_THREADS
CREATE POLICY "conversation_threads_super_admin_all" ON conversation_threads
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "conversation_threads_own_data" ON conversation_threads
  FOR ALL TO authenticated
  USING (auth.uid() = user_id AND tenant_id = public.user_tenant_id());

-- EVALUATION_PROGRESS_TRACKING
CREATE POLICY "evaluation_progress_tracking_super_admin_all" ON evaluation_progress_tracking
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "evaluation_progress_tracking_own_data" ON evaluation_progress_tracking
  FOR ALL TO authenticated
  USING (auth.uid() = user_id AND tenant_id = public.user_tenant_id());

-- USER_PROGRESS_CONFIG
CREATE POLICY "user_progress_config_super_admin_all" ON user_progress_config
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "user_progress_config_own_data" ON user_progress_config
  FOR ALL TO authenticated
  USING (auth.uid() = user_id AND tenant_id = public.user_tenant_id());

-- HEALTH_MILESTONES
CREATE POLICY "health_milestones_super_admin_all" ON health_milestones
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "health_milestones_own_data" ON health_milestones
  FOR ALL TO authenticated
  USING (auth.uid() = user_id AND tenant_id = public.user_tenant_id());

-- PROGRESS_ANALYTICS
CREATE POLICY "progress_analytics_super_admin_all" ON progress_analytics
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "progress_analytics_own_data" ON progress_analytics
  FOR ALL TO authenticated
  USING (auth.uid() = user_id AND tenant_id = public.user_tenant_id());

-- USER_PROGRESS_SUMMARY
CREATE POLICY "user_progress_summary_super_admin_all" ON user_progress_summary
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "user_progress_summary_own_data" ON user_progress_summary
  FOR ALL TO authenticated
  USING (auth.uid() = user_id AND tenant_id = public.user_tenant_id());

-- =====================================================
-- STEP 10: Create RLS Policies for TENANTS Table
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
-- STEP 11: Enable RLS on All Tables
-- =====================================================

-- Ensure RLS is enabled on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_groceries ENABLE ROW LEVEL SECURITY;
-- Note: evaluation_reports table doesn't exist yet
-- ALTER TABLE evaluation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatar_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_generation_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usernames ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_safety ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooking_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscription_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_hidden_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_progress_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress_summary ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- All RLS policies have been fixed and applied consistently
-- Super admins can manage all data across tenants
-- Tenant admins can manage their own tenant
-- Users can only see data in their tenant
-- Anonymous users can view public recipes
-- =====================================================

