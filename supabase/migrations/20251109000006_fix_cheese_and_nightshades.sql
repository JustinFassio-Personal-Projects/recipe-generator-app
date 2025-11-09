BEGIN;

-- =====================================================================
-- Migration #6: Fix Cheese and Nightshades Categorization
-- =====================================================================
-- This migration addresses GitHub Copilot feedback:
-- 1. Comment #4: Multiple cheeses miscategorized in milk_cream
-- 2. Comment #5: Non-nightshade vegetables incorrectly in nightshades
-- =====================================================================

-- =====================================================================
-- FIX #1: Cheese Categorization (Comment #4)
-- =====================================================================
-- Move hard cheeses from milk_cream to cheese_hard
UPDATE global_ingredients
SET subcategory = 'cheese_hard'
WHERE category = 'dairy_cold' 
  AND subcategory = 'milk_cream'
  AND name IN (
    'Asiago',
    'Gruyere',
    'Romano'
  );

-- Move soft/semi-soft cheeses from milk_cream to cheese_soft
UPDATE global_ingredients
SET subcategory = 'cheese_soft'
WHERE category = 'dairy_cold'
  AND subcategory = 'milk_cream'
  AND name IN (
    'Blue Cheese',
    'Gorgonzola',
    'Monterey Jack',
    'Pepper Jack',
    'Provolone'
  );

-- =====================================================================
-- FIX #2: Non-Nightshade Vegetables (Comment #5)
-- =====================================================================
-- Nightshades are ONLY Solanaceae family: tomatoes, peppers, eggplants, potatoes

-- Move cucumbers from nightshades to squash_gourds (botanically related, Cucurbitaceae family)
UPDATE global_ingredients
SET subcategory = 'squash_gourds'
WHERE category = 'fresh_produce'
  AND subcategory = 'nightshades'
  AND name IN ('Cucumbers');

-- Move other non-nightshades to new other_vegetables subcategory
UPDATE global_ingredients
SET subcategory = 'other_vegetables'
WHERE category = 'fresh_produce'
  AND subcategory = 'nightshades'
  AND name IN (
    'Asparagus',
    'Celery',
    'Green Beans',
    'Mushrooms'
  );

COMMIT;

