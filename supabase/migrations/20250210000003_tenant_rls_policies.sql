-- Drop existing policies
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;

DROP POLICY IF EXISTS "recipes_select_public" ON recipes;
DROP POLICY IF EXISTS "recipes_select_own" ON recipes;
DROP POLICY IF EXISTS "recipes_insert_own" ON recipes;
DROP POLICY IF EXISTS "recipes_update_own" ON recipes;
DROP POLICY IF EXISTS "recipes_delete_own" ON recipes;

-- Profiles: Tenant-scoped
CREATE POLICY "profiles_select_same_tenant" ON profiles
  FOR SELECT
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Recipes: Tenant-scoped with public visibility within tenant
CREATE POLICY "recipes_select_same_tenant_public" ON recipes
  FOR SELECT
  USING (
    is_public = true 
    AND tenant_id = (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "recipes_select_own" ON recipes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "recipes_insert_own_tenant" ON recipes
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND tenant_id = (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "recipes_update_own" ON recipes
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "recipes_delete_own" ON recipes
  FOR DELETE
  USING (auth.uid() = user_id);

-- User Groceries: Tenant-scoped
CREATE POLICY "user_groceries_tenant_scoped" ON user_groceries
  FOR ALL
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())
  );

-- Note: evaluation_reports table doesn't exist at this point in migration timeline
-- It will be created later by 20250904212232_create_evaluation_reports_table.sql
-- Tenant policies for evaluation_reports should be added in a later migration

