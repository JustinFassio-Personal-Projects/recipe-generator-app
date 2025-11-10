-- =====================================================
-- Add Multi-Tenant Support to Recipe Versioning Tables
-- =====================================================
-- This migration adds tenant_id to recipe versioning tables
-- Runs after 20250916160000_add_recipe_versioning.sql and 20250916152713_add_rating_system.sql
-- =====================================================

-- Add tenant_id columns
ALTER TABLE recipe_ratings ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE recipe_versions ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE recipe_views ADD COLUMN tenant_id UUID REFERENCES tenants(id);

-- Create indexes for performance
CREATE INDEX idx_recipe_ratings_tenant ON recipe_ratings(tenant_id);
CREATE INDEX idx_recipe_versions_tenant ON recipe_versions(tenant_id);
CREATE INDEX idx_recipe_views_tenant ON recipe_views(tenant_id);

-- Backfill existing data with default tenant
UPDATE recipe_ratings 
SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid 
WHERE tenant_id IS NULL;

UPDATE recipe_versions 
SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid 
WHERE tenant_id IS NULL;

UPDATE recipe_views 
SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid 
WHERE tenant_id IS NULL;

-- Make tenant_id NOT NULL after backfill
ALTER TABLE recipe_ratings ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE recipe_versions ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE recipe_views ALTER COLUMN tenant_id SET NOT NULL;

-- =====================================================
-- RLS Policies for RECIPE_RATINGS
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read all recipe ratings" ON recipe_ratings;
DROP POLICY IF EXISTS "Users can insert their own ratings" ON recipe_ratings;
DROP POLICY IF EXISTS "Users can update their own ratings" ON recipe_ratings;
DROP POLICY IF EXISTS "Users can delete their own ratings" ON recipe_ratings;

-- Super admin can see/manage all ratings
CREATE POLICY "recipe_ratings_super_admin_all" ON recipe_ratings
  FOR ALL
  USING (public.is_super_admin());

-- Users can view all ratings in their tenant
CREATE POLICY "recipe_ratings_select_same_tenant" ON recipe_ratings
  FOR SELECT
  TO authenticated
  USING (tenant_id = public.user_tenant_id());

-- Users can insert ratings in their tenant
CREATE POLICY "recipe_ratings_insert_own_tenant" ON recipe_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    AND tenant_id = public.user_tenant_id()
  );

-- Users can update their own ratings
CREATE POLICY "recipe_ratings_update_own" ON recipe_ratings
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    AND tenant_id = public.user_tenant_id()
  );

-- Users can delete their own ratings
CREATE POLICY "recipe_ratings_delete_own" ON recipe_ratings
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id 
    AND tenant_id = public.user_tenant_id()
  );

-- =====================================================
-- RLS Policies for RECIPE_VERSIONS
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read all recipe versions" ON recipe_versions;
DROP POLICY IF EXISTS "Users can insert versions of their own recipes" ON recipe_versions;
DROP POLICY IF EXISTS "Users can update versions of their own recipes" ON recipe_versions;

-- Super admin can see/manage all versions
CREATE POLICY "recipe_versions_super_admin_all" ON recipe_versions
  FOR ALL
  USING (public.is_super_admin());

-- Users can view all versions in their tenant
CREATE POLICY "recipe_versions_select_same_tenant" ON recipe_versions
  FOR SELECT
  TO authenticated
  USING (tenant_id = public.user_tenant_id());

-- Users can insert versions for their own recipes in their tenant
CREATE POLICY "recipe_versions_insert_own_tenant" ON recipe_versions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes 
      WHERE recipes.id = recipe_versions.original_recipe_id 
      AND recipes.user_id = auth.uid()
      AND recipes.tenant_id = public.user_tenant_id()
    )
    AND tenant_id = public.user_tenant_id()
  );

-- Users can update versions of their own recipes
CREATE POLICY "recipe_versions_update_own" ON recipe_versions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM recipes 
      WHERE recipes.id = recipe_versions.original_recipe_id 
      AND recipes.user_id = auth.uid()
      AND recipes.tenant_id = public.user_tenant_id()
    )
  );

-- =====================================================
-- RLS Policies for RECIPE_VIEWS
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read all recipe views" ON recipe_views;
DROP POLICY IF EXISTS "Users can insert their own views" ON recipe_views;

-- Super admin can see/manage all views
CREATE POLICY "recipe_views_super_admin_all" ON recipe_views
  FOR ALL
  USING (public.is_super_admin());

-- Users can view all recipe views in their tenant
CREATE POLICY "recipe_views_select_same_tenant" ON recipe_views
  FOR SELECT
  TO authenticated
  USING (tenant_id = public.user_tenant_id());

-- Users can insert their own views in their tenant
CREATE POLICY "recipe_views_insert_own_tenant" ON recipe_views
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    AND tenant_id = public.user_tenant_id()
  );

