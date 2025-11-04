-- Add welcome popup tracking columns to profiles table
-- This enables visit count tracking and user preferences for the welcome popup system

-- Add visit tracking columns
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS visit_count INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS last_visit_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS show_welcome_popup BOOLEAN DEFAULT true NOT NULL;

-- Create index for efficient queries on last visit date
CREATE INDEX IF NOT EXISTS idx_profiles_last_visit 
  ON profiles(last_visit_at);

-- Create index for quick lookups by visit count and preference
CREATE INDEX IF NOT EXISTS idx_profiles_welcome_popup 
  ON profiles(visit_count, show_welcome_popup);

-- Add helpful comment
COMMENT ON COLUMN profiles.visit_count IS 'Number of times user has visited the app';
COMMENT ON COLUMN profiles.last_visit_at IS 'Timestamp of user''s last visit';
COMMENT ON COLUMN profiles.show_welcome_popup IS 'User preference for showing welcome popup';

