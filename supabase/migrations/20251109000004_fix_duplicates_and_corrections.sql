-- Fix duplicates and correct miscategorizations from previous migration
-- Generated: 2025-11-09

BEGIN;

-- First, let's fix the items that ended up in wrong categories

-- Fix Mirin and Sake - should be in cooking_essentials/cooking_wines_spirits
UPDATE global_ingredients
SET category = 'cooking_essentials', subcategory = 'cooking_wines_spirits'
WHERE name IN ('Mirin', 'Sake') 
  AND (category != 'cooking_essentials' OR subcategory != 'cooking_wines_spirits');

-- Fix Olive Oil - should be in cooking_essentials/cooking_oils
UPDATE global_ingredients
SET category = 'cooking_essentials', subcategory = 'cooking_oils'
WHERE name = 'Olive Oil' 
  AND (category != 'cooking_essentials' OR subcategory != 'cooking_oils');

-- Fix Lard - should be in cooking_essentials/cooking_oils  
UPDATE global_ingredients
SET category = 'cooking_essentials', subcategory = 'cooking_oils'
WHERE name = 'Lard' 
  AND (category != 'cooking_essentials' OR subcategory != 'cooking_oils');

-- Fix Kosher Salt - should be in flavor_builders/salt_pepper
UPDATE global_ingredients
SET category = 'flavor_builders', subcategory = 'salt_pepper'
WHERE name = 'Kosher Salt' AND subcategory IS NULL;

-- Fix Sea Salt duplicate - should be in flavor_builders/salt_pepper
UPDATE global_ingredients
SET subcategory = 'salt_pepper'
WHERE name = 'Sea Salt' 
  AND category = 'flavor_builders' 
  AND subcategory IS NULL;

-- Fix Butter - should have butter_spreads subcategory
UPDATE global_ingredients
SET subcategory = 'butter_spreads'
WHERE name = 'Butter' 
  AND category = 'dairy_cold' 
  AND subcategory IS NULL;

-- Now remove duplicates, keeping only one instance per ingredient
-- We'll use a CTE to identify duplicates and delete all but the first one (by id)

WITH duplicates AS (
  SELECT id, 
         name,
         ROW_NUMBER() OVER (PARTITION BY name ORDER BY id) as rn
  FROM global_ingredients
  WHERE name IN ('Kosher Salt', 'Sea Salt', 'Olive Oil')
)
DELETE FROM global_ingredients
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

COMMIT;

