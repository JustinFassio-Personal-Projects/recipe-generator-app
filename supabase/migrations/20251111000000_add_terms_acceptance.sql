-- Add terms and privacy policy acceptance tracking to profiles table

-- Add terms acceptance fields
ALTER TABLE profiles
  ADD COLUMN terms_accepted_at timestamptz,
  ADD COLUMN terms_version_accepted text,
  ADD COLUMN privacy_accepted_at timestamptz,
  ADD COLUMN privacy_version_accepted text;

-- Create indexes for efficient querying
CREATE INDEX idx_profiles_terms_version ON profiles(terms_version_accepted);
CREATE INDEX idx_profiles_privacy_version ON profiles(privacy_version_accepted);

-- Add comments for documentation
COMMENT ON COLUMN profiles.terms_accepted_at IS 'Timestamp when user accepted Terms & Conditions';
COMMENT ON COLUMN profiles.terms_version_accepted IS 'Version of Terms & Conditions that user accepted (e.g., "1.0")';
COMMENT ON COLUMN profiles.privacy_accepted_at IS 'Timestamp when user accepted Privacy Policy';
COMMENT ON COLUMN profiles.privacy_version_accepted IS 'Version of Privacy Policy that user accepted (e.g., "1.0")';


