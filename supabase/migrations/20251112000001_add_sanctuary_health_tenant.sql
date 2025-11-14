-- Add Sanctuary Health Tenant
-- This migration adds the Sanctuary Health tenant to the database

INSERT INTO tenants (
  subdomain,
  name,
  owner_id,
  branding,
  settings,
  subscription_tier,
  is_active
)
VALUES (
  'sanctuary-health',
  'Sanctuary Health',
  NULL, -- System tenant, no specific owner
  jsonb_build_object(
    'theme_name', 'silk',
    'primary_color', '#4ade80',
    'secondary_color', '#60a5fa'
  ),
  jsonb_build_object(
    'specialty', 'General Health & Wellness',
    'instruction_style', 'detailed',
    'default_units', 'imperial'
  ),
  'pro',
  true
)
ON CONFLICT (subdomain) DO UPDATE SET
  name = EXCLUDED.name,
  branding = EXCLUDED.branding,
  settings = EXCLUDED.settings,
  subscription_tier = EXCLUDED.subscription_tier,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

