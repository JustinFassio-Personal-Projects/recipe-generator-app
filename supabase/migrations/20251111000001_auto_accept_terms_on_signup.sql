-- Create a trigger to automatically set terms acceptance on profile creation
-- This ensures new signups automatically have current terms version recorded

CREATE OR REPLACE FUNCTION set_initial_terms_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set if terms fields are NULL (i.e., new signup)
  IF NEW.terms_accepted_at IS NULL THEN
    NEW.terms_accepted_at := now();
    NEW.terms_version_accepted := '1.0';
    NEW.privacy_accepted_at := now();
    NEW.privacy_version_accepted := '1.0';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires before insert on profiles
CREATE TRIGGER trigger_set_initial_terms_acceptance
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_initial_terms_acceptance();

-- Comment for documentation
COMMENT ON FUNCTION set_initial_terms_acceptance() IS 'Automatically sets terms and privacy acceptance to current version when a new profile is created';


