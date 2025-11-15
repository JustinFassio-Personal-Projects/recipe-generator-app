-- Fix email preferences trigger to not fail user creation
-- This makes the trigger defensive so test user creation doesn't fail

CREATE OR REPLACE FUNCTION create_default_email_preferences()
RETURNS TRIGGER AS $$
BEGIN
  -- Attempt to create default email preferences
  -- Don't fail user creation if this fails (e.g., profile doesn't exist yet)
  BEGIN
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
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error but don't fail the user creation
      -- This is important for test environments and edge cases
      RAISE WARNING 'Failed to create email preferences for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: The trigger itself doesn't need to be recreated, just the function
-- The existing trigger on_auth_user_created_email_prefs will use this updated function

