BEGIN;

-- =====================================================================
-- Migration #7: Fix Fresh Aromatics Category Mismatch
-- =====================================================================
-- This migration addresses GitHub Copilot feedback:
-- Comment #6: fresh_aromatics subcategory appears in both 
-- FLAVOR_BUILDERS_SUBCATEGORIES and database has it in fresh_produce,
-- causing validation issues.
--
-- Resolution: Move fresh aromatics from fresh_produce to flavor_builders
-- to match the code definition where fresh_aromatics is only defined
-- under FLAVOR_BUILDERS_SUBCATEGORIES.
-- =====================================================================

-- Move all fresh aromatic ingredients from fresh_produce to flavor_builders
UPDATE global_ingredients
SET category = 'flavor_builders'
WHERE category = 'fresh_produce' 
  AND subcategory = 'fresh_aromatics';

COMMIT;

