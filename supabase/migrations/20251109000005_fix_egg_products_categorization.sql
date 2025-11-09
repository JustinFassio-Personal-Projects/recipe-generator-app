-- Fix egg products categorization - eggs are proteins, not dairy
-- Eggs are often stored in the dairy section but are nutritionally proteins
-- Generated: 2025-11-09

BEGIN;

-- Move all egg products from dairy_cold to proteins/eggs_egg_products
UPDATE global_ingredients
SET category = 'proteins', subcategory = 'eggs_egg_products'
WHERE category = 'dairy_cold' 
  AND subcategory = 'milk_cream'
  AND name IN (
    'Egg Whites',
    'Egg Yolks',
    'Extra Large Eggs',
    'Large Eggs'
  );

-- Move generic 'Eggs' from fresh_produce to proteins/eggs_egg_products
UPDATE global_ingredients
SET category = 'proteins', subcategory = 'eggs_egg_products'
WHERE name = 'Eggs' 
  AND category = 'fresh_produce';

-- Also fix Parmigiano-Reggiano which is incorrectly in milk_cream (should be cheese_hard)
UPDATE global_ingredients
SET subcategory = 'cheese_hard'
WHERE name = 'Parmigiano-Reggiano'
  AND category = 'dairy_cold'
  AND subcategory = 'milk_cream';

COMMIT;

