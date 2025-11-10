-- =====================================================
-- Add tenant_id to Phase 1 Tables (Tables that exist at Feb 10, 2025)
-- =====================================================
-- Only includes tables created before this migration point:
-- - profiles, recipes, usernames, user_safety, cooking_preferences (Jan 21)
-- - avatar_analytics (Jan 22)  
-- - user_subscriptions (Jan 10)
-- - user_groceries, global_ingredients, user_hidden_ingredients (Feb 1-2)

-- Add tenant_id columns
ALTER TABLE profiles ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE recipes ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE usernames ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE user_safety ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE cooking_preferences ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE avatar_analytics ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE user_subscriptions ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE user_groceries ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE global_ingredients ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE user_hidden_ingredients ADD COLUMN tenant_id UUID REFERENCES tenants(id);

-- Add is_admin column to profiles for admin/super admin access control
ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT false NOT NULL;

-- Create indexes for performance
CREATE INDEX idx_profiles_tenant ON profiles(tenant_id);
CREATE INDEX idx_recipes_tenant ON recipes(tenant_id);
CREATE INDEX idx_usernames_tenant ON usernames(tenant_id);
CREATE INDEX idx_user_safety_tenant ON user_safety(tenant_id);
CREATE INDEX idx_cooking_preferences_tenant ON cooking_preferences(tenant_id);
CREATE INDEX idx_avatar_analytics_tenant ON avatar_analytics(tenant_id);
CREATE INDEX idx_user_subscriptions_tenant ON user_subscriptions(tenant_id);
CREATE INDEX idx_user_groceries_tenant ON user_groceries(tenant_id);
CREATE INDEX idx_global_ingredients_tenant ON global_ingredients(tenant_id);
CREATE INDEX idx_user_hidden_ingredients_tenant ON user_hidden_ingredients(tenant_id);

-- Create default tenant for existing data
INSERT INTO tenants (id, subdomain, name, owner_id, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'app',
  'Recipe Generator (Main)',
  NULL, -- System tenant
  true
);

-- Migrate existing data to default tenant
UPDATE profiles SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
UPDATE recipes SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
UPDATE usernames SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
UPDATE user_safety SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
UPDATE cooking_preferences SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
UPDATE avatar_analytics SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
UPDATE user_subscriptions SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
UPDATE user_groceries SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
UPDATE global_ingredients SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
UPDATE user_hidden_ingredients SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;

-- Make tenant_id NOT NULL after migration
ALTER TABLE profiles ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE recipes ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE usernames ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE user_safety ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE cooking_preferences ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE avatar_analytics ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE user_subscriptions ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE user_groceries ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE global_ingredients ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE user_hidden_ingredients ALTER COLUMN tenant_id SET NOT NULL;

