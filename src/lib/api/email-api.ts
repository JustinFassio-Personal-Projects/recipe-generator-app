/**
 * Email API Module
 * Handles email preferences and sending operations
 */

import { supabase } from '../supabase';

export interface EmailPreferences {
  user_id: string;
  tenant_id: string | null;
  welcome_emails: boolean;
  newsletters: boolean;
  recipe_notifications: boolean;
  cooking_reminders: boolean;
  subscription_updates: boolean;
  admin_notifications: boolean;
  unsubscribe_token: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateEmailPreferencesParams {
  welcome_emails?: boolean;
  newsletters?: boolean;
  recipe_notifications?: boolean;
  cooking_reminders?: boolean;
  subscription_updates?: boolean;
  admin_notifications?: boolean;
}

/**
 * Get email preferences for the current user
 */
export async function getEmailPreferences(): Promise<{
  data: EmailPreferences | null;
  error: Error | null;
}> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: new Error('Not authenticated') };
    }

    const { data, error } = await supabase
      .from('email_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error
          : new Error('Failed to fetch preferences'),
    };
  }
}

/**
 * Update email preferences for the current user
 */
export async function updateEmailPreferences(
  preferences: UpdateEmailPreferencesParams
): Promise<{
  data: EmailPreferences | null;
  error: Error | null;
}> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: new Error('Not authenticated') };
    }

    const { data, error } = await supabase
      .from('email_preferences')
      .update({
        ...preferences,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error
          : new Error('Failed to update preferences'),
    };
  }
}

/**
 * Unsubscribe from all marketing emails (keeps transactional)
 */
export async function unsubscribeAll(): Promise<{
  success: boolean;
  error: Error | null;
}> {
  try {
    const result = await updateEmailPreferences({
      newsletters: false,
      recipe_notifications: false,
      cooking_reminders: false,
    });

    if (result.error) {
      return { success: false, error: result.error };
    }

    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error : new Error('Failed to unsubscribe'),
    };
  }
}

/**
 * Process unsubscribe via token (for email unsubscribe links)
 */
export async function unsubscribeByToken(token: string): Promise<{
  success: boolean;
  message?: string;
  error?: Error;
}> {
  try {
    const { data, error } = await supabase.functions.invoke(
      'process-unsubscribe',
      {
        body: { token },
      }
    );

    if (error) {
      return {
        success: false,
        error: new Error(error.message),
      };
    }

    return {
      success: data.success || false,
      message: data.message,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error
          : new Error('Failed to process unsubscribe'),
    };
  }
}

/**
 * Send a test email (admin only)
 */
export async function sendTestEmail(emailType: string): Promise<{
  success: boolean;
  error: Error | null;
}> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: new Error('Not authenticated') };
    }

    let functionName = '';
    let payload = {};

    switch (emailType) {
      case 'welcome':
        functionName = 'send-welcome-email';
        payload = {
          userId: user.id,
          email: user.email,
          fullName: user.user_metadata?.full_name || 'Test User',
        };
        break;
      case 'cooking_reminder':
        functionName = 'send-cooking-reminder';
        // Would need a recipe ID - skip for now
        return {
          success: false,
          error: new Error('Test not implemented for this type'),
        };
      default:
        return {
          success: false,
          error: new Error('Unknown email type'),
        };
    }

    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload,
    });

    if (error) {
      return { success: false, error: new Error(error.message) };
    }

    return { success: data.success || false, error: null };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error : new Error('Failed to send test email'),
    };
  }
}
