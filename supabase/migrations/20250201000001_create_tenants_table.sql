-- Tenants table for multi-tenant configuration
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subdomain TEXT UNIQUE NOT NULL CHECK (subdomain ~ '^[a-z0-9-]+$'),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  
  -- Customization
  branding JSONB DEFAULT '{}'::jsonb, -- {logo_url, primary_color, favicon_url}
  settings JSONB DEFAULT '{}'::jsonb, -- {specialty, restricted_ingredients, instruction_style}
  ai_config JSONB DEFAULT '{}'::jsonb, -- {system_prompt_override, persona_overrides}
  
  -- Subscription & billing
  subscription_tier TEXT DEFAULT 'starter' CHECK (subscription_tier IN ('starter', 'pro', 'enterprise')),
  stripe_customer_id TEXT,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Policies: Tenants are public-readable (for subdomain lookup), owner-editable
CREATE POLICY "tenants_select_all" ON tenants FOR SELECT USING (true);
CREATE POLICY "tenants_update_owner" ON tenants FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "tenants_insert_admin" ON tenants FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Indexes
CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX idx_tenants_owner ON tenants(owner_id);

-- Auto-update timestamp
CREATE TRIGGER tenants_set_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

