-- Update default tenant name to remove "(Main)" suffix
UPDATE tenants 
SET name = 'Recipe Generator'
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

