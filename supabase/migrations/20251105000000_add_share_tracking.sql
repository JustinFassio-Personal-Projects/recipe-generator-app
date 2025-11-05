-- Create share_views table for tracking recipe shares and views
CREATE TABLE IF NOT EXISTS share_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  referrer TEXT,
  platform TEXT,
  user_agent TEXT,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  converted_to_signup BOOLEAN DEFAULT FALSE,
  converted_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_share_views_recipe_id ON share_views(recipe_id);
CREATE INDEX IF NOT EXISTS idx_share_views_viewed_at ON share_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_share_views_platform ON share_views(platform);
CREATE INDEX IF NOT EXISTS idx_share_views_referrer ON share_views(referrer);
CREATE INDEX IF NOT EXISTS idx_share_views_converted ON share_views(converted_to_signup) WHERE converted_to_signup = true;

-- Enable Row Level Security
ALTER TABLE share_views ENABLE ROW LEVEL SECURITY;

-- Allow anonymous and authenticated users to insert share tracking data
CREATE POLICY "Allow insert for tracking" ON share_views
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Allow users to read their own share views (for recipes they own)
CREATE POLICY "Users can read own recipe shares" ON share_views
  FOR SELECT TO authenticated
  USING (
    recipe_id IN (
      SELECT id FROM recipes WHERE user_id = auth.uid()
    )
  );

-- Allow admins to read all share analytics (optional - for future admin dashboard)
-- Note: Requires a role column in profiles table or similar admin identification
-- CREATE POLICY "Admins can read all shares" ON share_views
--   FOR SELECT TO authenticated
--   USING (
--     auth.uid() IN (
--       SELECT user_id FROM profiles WHERE role = 'admin'
--     )
--   );

