-- Convert instructions column from text to text[] array
-- Split existing string instructions by periods (.) first, then fallback to newlines

BEGIN;

-- Step 1: Add a temporary column to store the converted array
ALTER TABLE recipes ADD COLUMN instructions_array text[];

-- Step 2: Convert existing string instructions to array
-- Split by periods first, then by newlines if no periods found
-- Handle edge cases: empty strings, single instruction, etc.
UPDATE recipes
SET instructions_array = CASE
  -- If instructions is empty or null, set to empty array
  WHEN instructions IS NULL OR trim(instructions) = '' THEN '{}'::text[]
  
  -- If instructions contains periods, split by periods
  WHEN instructions ~ '\.' THEN 
    -- Split by period followed by space or newline, then clean up
    array_remove(
      array(
        SELECT trim(unnest(string_to_array(
          regexp_replace(instructions, '\.(\s|\n)', '|||SPLIT|||', 'g'),
          '|||SPLIT|||'
        )))
      )),
      ''
    )
  
  -- Otherwise, split by newlines
  ELSE 
    array_remove(
      array(
        SELECT trim(unnest(string_to_array(instructions, E'\n')))
      ),
      ''
    )
END;

-- Step 3: Ensure we have at least one instruction (handle edge cases)
UPDATE recipes
SET instructions_array = CASE
  WHEN array_length(instructions_array, 1) IS NULL OR array_length(instructions_array, 1) = 0
  THEN ARRAY[COALESCE(instructions, '')]
  ELSE instructions_array
END;

-- Step 4: Drop the old instructions column
ALTER TABLE recipes DROP COLUMN instructions;

-- Step 5: Rename the new column to instructions
ALTER TABLE recipes RENAME COLUMN instructions_array TO instructions;

-- Step 6: Set NOT NULL constraint and default
ALTER TABLE recipes 
  ALTER COLUMN instructions SET DEFAULT '{}'::text[],
  ALTER COLUMN instructions SET NOT NULL;

-- Step 7: Add comment to explain the instructions field
COMMENT ON COLUMN recipes.instructions IS 'Array of cooking instruction steps, each step separated as individual array element';

-- Step 8: Also update recipe_versions table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recipe_versions') THEN
    -- Add temporary column
    ALTER TABLE recipe_versions ADD COLUMN instructions_array text[];
    
    -- Convert existing data
    UPDATE recipe_versions
    SET instructions_array = CASE
      WHEN instructions IS NULL OR trim(instructions) = '' THEN '{}'::text[]
      WHEN instructions ~ '\.' THEN 
        array_remove(
          array(
            SELECT trim(unnest(string_to_array(
              regexp_replace(instructions, '\.(\s|\n)', '|||SPLIT|||', 'g'),
              '|||SPLIT|||'
            )))
          )),
          ''
        )
      ELSE 
        array_remove(
          array(
            SELECT trim(unnest(string_to_array(instructions, E'\n')))
          ),
          ''
        )
    END;
    
    -- Handle empty arrays
    UPDATE recipe_versions
    SET instructions_array = CASE
      WHEN array_length(instructions_array, 1) IS NULL OR array_length(instructions_array, 1) = 0
      THEN ARRAY[COALESCE(instructions, '')]
      ELSE instructions_array
    END;
    
    -- Drop old column and rename
    ALTER TABLE recipe_versions DROP COLUMN instructions;
    ALTER TABLE recipe_versions RENAME COLUMN instructions_array TO instructions;
    ALTER TABLE recipe_versions 
      ALTER COLUMN instructions SET DEFAULT '{}'::text[],
      ALTER COLUMN instructions SET NOT NULL;
    
    COMMENT ON COLUMN recipe_versions.instructions IS 'Array of cooking instruction steps, each step separated as individual array element';
  END IF;
END $$;

COMMIT;

