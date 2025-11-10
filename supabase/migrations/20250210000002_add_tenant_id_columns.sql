-- Add tenant_id to existing tables
ALTER TABLE profiles ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE recipes ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE user_groceries ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE evaluation_reports ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE global_ingredients ADD COLUMN tenant_id UUID REFERENCES tenants(id);

-- Create indexes for performance
CREATE INDEX idx_profiles_tenant ON profiles(tenant_id);
CREATE INDEX idx_recipes_tenant ON recipes(tenant_id);
CREATE INDEX idx_user_groceries_tenant ON user_groceries(tenant_id);
CREATE INDEX idx_evaluation_reports_tenant ON evaluation_reports(tenant_id);
CREATE INDEX idx_global_ingredients_tenant ON global_ingredients(tenant_id);

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
UPDATE user_groceries SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
UPDATE evaluation_reports SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;

-- Make tenant_id NOT NULL after migration
ALTER TABLE profiles ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE recipes ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE user_groceries ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE evaluation_reports ALTER COLUMN tenant_id SET NOT NULL;

