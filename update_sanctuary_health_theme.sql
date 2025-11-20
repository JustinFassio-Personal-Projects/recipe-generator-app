-- Quick SQL update to fix Sanctuary Health theme
-- Run this in your Supabase SQL Editor if you can't run migrations

UPDATE tenants 
SET branding = jsonb_set(
  COALESCE(branding, '{}'::jsonb),
  '{theme_name}',
  '"sanctuary-health"'
)
WHERE subdomain = 'sanctuaryhealth';

-- Verify the update
SELECT subdomain, name, branding->>'theme_name' as theme_name
FROM tenants 
WHERE subdomain = 'sanctuaryhealth';



