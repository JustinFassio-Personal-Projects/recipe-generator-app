-- Add function to search within instructions array
-- This enables text search within instruction array elements using ILIKE

CREATE OR REPLACE FUNCTION search_instructions_array(
  instructions_array text[],
  search_term text
)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Return true if any instruction step contains the search term (case-insensitive)
  RETURN EXISTS (
    SELECT 1
    FROM unnest(instructions_array) AS instruction
    WHERE instruction ILIKE '%' || search_term || '%'
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION search_instructions_array TO authenticated, anon;

-- Add comment
COMMENT ON FUNCTION search_instructions_array IS 'Searches for a term within instruction array elements using case-insensitive pattern matching';

