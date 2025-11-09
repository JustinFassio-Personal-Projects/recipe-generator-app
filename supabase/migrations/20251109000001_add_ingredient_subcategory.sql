-- Add subcategory column to global_ingredients table
-- This enables hierarchical organization within main categories

BEGIN;

-- Add subcategory column
ALTER TABLE global_ingredients 
ADD COLUMN subcategory VARCHAR(50);

-- Add comment for documentation
COMMENT ON COLUMN global_ingredients.subcategory IS 
'Subcategory for fine-grained ingredient organization (e.g., pasta_noodles, alliums, ground_spices)';

-- Create compound index for efficient category + subcategory filtering
CREATE INDEX idx_global_ingredients_category_subcategory 
ON global_ingredients(category, subcategory)
WHERE subcategory IS NOT NULL;

-- Create index on subcategory alone for direct subcategory queries
CREATE INDEX idx_global_ingredients_subcategory 
ON global_ingredients(subcategory)
WHERE subcategory IS NOT NULL;

-- RLS policies automatically inherit from existing policies on global_ingredients
-- No additional policy changes needed

COMMIT;

