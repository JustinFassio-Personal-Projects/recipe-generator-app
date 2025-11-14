-- Setup script for Sanctuary Health tenant
-- Run this in your Supabase SQL Editor to create the tenant

-- Insert the Sanctuary Health tenant with Silk theme configuration
INSERT INTO tenants (
  subdomain,
  name,
  branding,
  settings,
  ai_config,
  is_active,
  created_at,
  updated_at
)
VALUES (
  'sanctuary-health',
  'Sanctuary Health',
  jsonb_build_object(
    'theme_name', 'silk',
    'primary_color', '#4ade80',
    'secondary_color', '#60a5fa',
    'accent_color', '#c084fc'
  ),
  jsonb_build_object(
    'specialty', 'Holistic Wellness',
    'restricted_ingredients', '[]'::jsonb,
    'instruction_style', 'detailed'
  ),
  jsonb_build_object(
    'system_prompt_override', 'You are a health-focused recipe generator for Sanctuary Health. Prioritize nutritious, balanced meals with fresh ingredients.'
  ),
  true,
  NOW(),
  NOW()
)
ON CONFLICT (subdomain) 
DO UPDATE SET
  name = EXCLUDED.name,
  branding = EXCLUDED.branding,
  settings = EXCLUDED.settings,
  ai_config = EXCLUDED.ai_config,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Verify the tenant was created
SELECT 
  id,
  subdomain,
  name,
  branding->>'theme_name' as theme,
  is_active,
  created_at
FROM tenants
WHERE subdomain = 'sanctuary-health';

