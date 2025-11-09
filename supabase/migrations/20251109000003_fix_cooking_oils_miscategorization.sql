-- Fix miscategorized items in cooking_oils subcategory
-- Items that don't belong in cooking oils should be moved to appropriate subcategories
-- Generated: 2025-11-09

BEGIN;

-- Move extracts and flavorings from cooking_essentials to flavor_builders
UPDATE global_ingredients
SET category = 'flavor_builders', subcategory = 'extracts_flavorings'
WHERE category = 'cooking_essentials' AND subcategory = 'cooking_oils' AND name IN (
  'Almond Extract',
  'Liquid Smoke'
);

-- Move salt and pepper from cooking_essentials to flavor_builders
UPDATE global_ingredients
SET category = 'flavor_builders', subcategory = 'salt_pepper'
WHERE category = 'cooking_essentials' AND subcategory = 'cooking_oils' AND name IN (
  'Black Peppercorns',
  'Kosher Salt',
  'Sea Salt'
);

-- Move juices to pantry_staples condiments (more appropriate for bottled juices used as ingredients)
UPDATE global_ingredients
SET category = 'pantry_staples', subcategory = 'condiments'
WHERE category = 'cooking_essentials' AND subcategory = 'cooking_oils' AND name IN (
  'Lemon Juice',
  'Lime Juice',
  'Orange Juice'
);

-- Move cooking wines to correct subcategory within cooking_essentials
UPDATE global_ingredients
SET subcategory = 'cooking_wines_spirits'
WHERE category = 'cooking_essentials' AND subcategory = 'cooking_oils' AND name IN (
  'Mirin',
  'Sake'
);

-- Move Worcestershire Sauce to sauces_western
UPDATE global_ingredients
SET subcategory = 'sauces_western'
WHERE category = 'cooking_essentials' AND subcategory = 'cooking_oils' AND name IN (
  'Worcestershire Sauce'
);

-- Move butter and margarine to dairy_cold butter_spreads
UPDATE global_ingredients
SET category = 'dairy_cold', subcategory = 'butter_spreads'
WHERE category = 'cooking_essentials' AND subcategory = 'cooking_oils' AND name IN (
  'Butter',
  'Margarine'
);

COMMIT;

