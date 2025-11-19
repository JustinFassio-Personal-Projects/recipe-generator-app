-- Update Sanctuary Health Tenant Logo
-- This migration updates the Sanctuary Health tenant branding to use the new primary_logo.png

UPDATE tenants
SET branding = jsonb_set(
  jsonb_set(
    COALESCE(branding, '{}'::jsonb),
    '{logo_url}',
    '"\/tenants\/sanctuaryhealth\/primary_logo.png"'::jsonb
  ),
  '{favicon_url}',
  '"\/tenants\/sanctuaryhealth\/primary_logo.png"'::jsonb
)
WHERE subdomain = 'sanctuaryhealth';

