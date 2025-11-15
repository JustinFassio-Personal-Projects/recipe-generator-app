-- Email System Migration
-- Creates tables for email preferences, queue, logs, and newsletter campaigns
-- with RLS policies and helper functions

-- ============================================================================
-- TABLES
-- ============================================================================

-- Email Preferences Table
-- Stores user opt-in/opt-out preferences for each email type
CREATE TABLE IF NOT EXISTS email_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Email type preferences (all default to true for opt-in)
  welcome_emails BOOLEAN DEFAULT true NOT NULL,
  newsletters BOOLEAN DEFAULT true NOT NULL,
  recipe_notifications BOOLEAN DEFAULT true NOT NULL,
  cooking_reminders BOOLEAN DEFAULT true NOT NULL,
  subscription_updates BOOLEAN DEFAULT true NOT NULL,
  admin_notifications BOOLEAN DEFAULT true NOT NULL,
  
  -- Unsubscribe token for one-click unsubscribe links
  unsubscribe_token TEXT UNIQUE NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Email Queue Table
-- Queue for bulk emails (newsletters, batch notifications)
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Email metadata
  type TEXT NOT NULL CHECK (type IN (
    'welcome',
    'newsletter',
    'recipe_notification',
    'cooking_reminder',
    'subscription_update',
    'admin_notification'
  )),
  recipient_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Email content
  subject TEXT NOT NULL,
  template_data JSONB DEFAULT '{}'::jsonb NOT NULL,
  
  -- Queue status
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
  scheduled_for TIMESTAMPTZ DEFAULT now() NOT NULL,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  attempts INTEGER DEFAULT 0 NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- Indexes for efficient queue processing
  CONSTRAINT email_queue_attempts_check CHECK (attempts >= 0 AND attempts <= 5)
);

-- Email Logs Table
-- Audit trail of all emails sent
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Recipient info
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  
  -- Email details
  email_type TEXT NOT NULL CHECK (email_type IN (
    'welcome',
    'newsletter',
    'recipe_notification',
    'cooking_reminder',
    'subscription_update',
    'admin_notification'
  )),
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'sent' NOT NULL CHECK (status IN ('sent', 'delivered', 'failed', 'bounced', 'complained')),
  
  -- External service tracking
  resend_id TEXT,
  
  -- Additional metadata (e.g., template version, campaign ID)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Engagement tracking
  sent_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  
  -- Indexes
  CONSTRAINT email_logs_email_check CHECK (recipient_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Newsletter Campaigns Table
-- Management of newsletter campaigns
CREATE TABLE IF NOT EXISTS newsletter_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Campaign details
  title TEXT NOT NULL,
  content JSONB DEFAULT '{}'::jsonb NOT NULL, -- Stores featured recipes, tips, etc.
  
  -- Campaign status
  status TEXT DEFAULT 'draft' NOT NULL CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  
  -- Metrics
  recipients_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  
  -- Creator
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  CONSTRAINT newsletter_campaigns_counts_check CHECK (
    sent_count >= 0 AND 
    opened_count >= 0 AND 
    clicked_count >= 0 AND
    sent_count <= recipients_count
  )
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Email queue indexes for efficient processing
CREATE INDEX IF NOT EXISTS idx_email_queue_status_scheduled 
  ON email_queue(status, scheduled_for) 
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_email_queue_recipient 
  ON email_queue(recipient_user_id);

CREATE INDEX IF NOT EXISTS idx_email_queue_tenant 
  ON email_queue(tenant_id);

-- Email logs indexes for reporting
CREATE INDEX IF NOT EXISTS idx_email_logs_user 
  ON email_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_email_logs_tenant 
  ON email_logs(tenant_id);

CREATE INDEX IF NOT EXISTS idx_email_logs_type_sent 
  ON email_logs(email_type, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_logs_resend 
  ON email_logs(resend_id) 
  WHERE resend_id IS NOT NULL;

-- Newsletter campaigns indexes
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_tenant 
  ON newsletter_campaigns(tenant_id);

CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_status 
  ON newsletter_campaigns(status, scheduled_for);

-- Email preferences indexes
CREATE INDEX IF NOT EXISTS idx_email_preferences_tenant 
  ON email_preferences(tenant_id);

CREATE INDEX IF NOT EXISTS idx_email_preferences_token 
  ON email_preferences(unsubscribe_token);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_campaigns ENABLE ROW LEVEL SECURITY;

-- Email Preferences Policies
-- Users can read and update their own preferences
CREATE POLICY "Users can view own email preferences"
  ON email_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own email preferences"
  ON email_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert email preferences"
  ON email_preferences FOR INSERT
  WITH CHECK (true);

-- Admins can view all preferences
CREATE POLICY "Admins can view all email preferences"
  ON email_preferences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Email Queue Policies
-- Only system and admins can access queue
CREATE POLICY "Admins can view email queue"
  ON email_queue FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "System can manage email queue"
  ON email_queue FOR ALL
  USING (true)
  WITH CHECK (true);

-- Email Logs Policies
-- Users can view their own email logs
CREATE POLICY "Users can view own email logs"
  ON email_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all logs
CREATE POLICY "Admins can view all email logs"
  ON email_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "System can insert email logs"
  ON email_logs FOR INSERT
  WITH CHECK (true);

-- Newsletter Campaigns Policies
-- Admins can manage campaigns
CREATE POLICY "Admins can manage newsletter campaigns"
  ON newsletter_campaigns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to generate a secure unsubscribe token
CREATE OR REPLACE FUNCTION generate_unsubscribe_token()
RETURNS TEXT AS $$
BEGIN
  -- Generate a random token using gen_random_uuid and encode it
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create default email preferences on user signup
CREATE OR REPLACE FUNCTION create_default_email_preferences()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default email preferences for new user
  INSERT INTO email_preferences (
    user_id,
    tenant_id,
    welcome_emails,
    newsletters,
    recipe_notifications,
    cooking_reminders,
    subscription_updates,
    admin_notifications,
    unsubscribe_token
  )
  VALUES (
    NEW.id,
    (SELECT tenant_id FROM profiles WHERE id = NEW.id),
    true,
    true,
    true,
    true,
    true,
    false, -- Admin notifications off by default
    generate_unsubscribe_token()
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create email preferences on user creation
CREATE TRIGGER on_auth_user_created_email_prefs
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_email_preferences();

-- Function to validate and process unsubscribe requests
CREATE OR REPLACE FUNCTION validate_unsubscribe_token(token TEXT)
RETURNS TABLE (
  success BOOLEAN,
  user_id UUID,
  message TEXT
) AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Find user by unsubscribe token
  SELECT email_preferences.user_id INTO v_user_id
  FROM email_preferences
  WHERE email_preferences.unsubscribe_token = token;
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, 'Invalid or expired unsubscribe token'::TEXT;
    RETURN;
  END IF;
  
  -- Unsubscribe from all marketing emails (keep transactional)
  UPDATE email_preferences
  SET 
    newsletters = false,
    recipe_notifications = false,
    cooking_reminders = false,
    updated_at = now()
  WHERE email_preferences.user_id = v_user_id;
  
  RETURN QUERY SELECT true, v_user_id, 'Successfully unsubscribed from marketing emails'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update email_queue attempts and status
CREATE OR REPLACE FUNCTION increment_email_queue_attempt(queue_id UUID, error_msg TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  UPDATE email_queue
  SET 
    attempts = attempts + 1,
    status = CASE 
      WHEN attempts >= 4 THEN 'failed'
      ELSE 'pending'
    END,
    error_message = COALESCE(error_msg, error_message),
    updated_at = now()
  WHERE id = queue_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get users eligible for a specific email type
CREATE OR REPLACE FUNCTION get_users_for_email_type(
  email_type_param TEXT,
  tenant_id_param UUID DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  tenant_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    p.full_name,
    p.tenant_id
  FROM auth.users u
  JOIN profiles p ON p.id = u.id
  JOIN email_preferences ep ON ep.user_id = u.id
  WHERE 
    u.email IS NOT NULL
    AND (tenant_id_param IS NULL OR p.tenant_id = tenant_id_param)
    AND CASE email_type_param
      WHEN 'welcome' THEN ep.welcome_emails
      WHEN 'newsletter' THEN ep.newsletters
      WHEN 'recipe_notification' THEN ep.recipe_notifications
      WHEN 'cooking_reminder' THEN ep.cooking_reminders
      WHEN 'subscription_update' THEN ep.subscription_updates
      WHEN 'admin_notification' THEN ep.admin_notifications
      ELSE false
    END = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers
CREATE TRIGGER update_email_preferences_updated_at
  BEFORE UPDATE ON email_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_newsletter_campaigns_updated_at
  BEFORE UPDATE ON newsletter_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE email_preferences IS 'User email subscription preferences with granular opt-in/opt-out controls';
COMMENT ON TABLE email_queue IS 'Queue for batch email processing with retry logic';
COMMENT ON TABLE email_logs IS 'Complete audit trail of all emails sent through the system';
COMMENT ON TABLE newsletter_campaigns IS 'Newsletter campaign management and analytics';

COMMENT ON COLUMN email_preferences.unsubscribe_token IS 'Unique token for one-click unsubscribe links';
COMMENT ON COLUMN email_queue.template_data IS 'JSON data to populate email template (recipes, user info, etc.)';
COMMENT ON COLUMN email_logs.resend_id IS 'External Resend service message ID for tracking';
COMMENT ON COLUMN email_logs.metadata IS 'Additional tracking data (template version, campaign ID, etc.)';
COMMENT ON COLUMN newsletter_campaigns.content IS 'Campaign content (featured recipes, tips, custom sections)';

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON email_preferences TO authenticated;
GRANT SELECT ON email_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON newsletter_campaigns TO authenticated;

