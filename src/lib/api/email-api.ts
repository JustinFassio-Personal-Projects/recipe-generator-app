/**
 * Email API Module
 * Handles email preferences and sending operations
 */

import { supabase } from '../supabase';

// Supabase error type with code property
interface SupabaseError {
  code?: string;
  message: string;
  details?: string;
  hint?: string;
}

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
 * Creates default preferences if they don't exist (for existing users)
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

    // First, try to get existing preferences
    // Use maybeSingle() instead of single() to avoid 404 errors when no record exists
    const { data: existingData, error: selectError } = await supabase
      .from('email_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    // If preferences exist, return them
    if (existingData) {
      return { data: existingData, error: null };
    }

    // If no preferences exist (no data and no error, or PGRST116 error code),
    // create default preferences for existing users
    if (
      !existingData &&
      (!selectError || (selectError as SupabaseError)?.code === 'PGRST116')
    ) {
      // Get user's profile to retrieve tenant_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .maybeSingle();

      if (
        profileError &&
        (profileError as SupabaseError)?.code !== 'PGRST116'
      ) {
        console.warn('Error fetching profile for tenant_id:', profileError);
      }

      // Generate unsubscribe token (base64 encoded random bytes)
      // Using crypto API if available, fallback to simple encoding
      const generateToken = () => {
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
          const array = new Uint8Array(32);
          crypto.getRandomValues(array);
          return btoa(String.fromCharCode(...array))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
        }
        // Fallback for environments without crypto API
        return btoa(
          `${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}`
        )
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '');
      };
      const unsubscribeToken = generateToken();

      // Create default preferences (all enabled except admin_notifications)
      const defaultPreferences = {
        user_id: user.id,
        tenant_id: profile?.tenant_id || null,
        welcome_emails: true,
        newsletters: true,
        recipe_notifications: true,
        cooking_reminders: true,
        subscription_updates: true,
        admin_notifications: false,
        unsubscribe_token: unsubscribeToken,
      };

      const { data: newData, error: insertError } = await supabase
        .from('email_preferences')
        .insert(defaultPreferences)
        .select()
        .single();

      if (insertError) {
        console.error(
          'Failed to create default email preferences:',
          insertError
        );
        return {
          data: null,
          error: new Error(
            `Failed to create email preferences: ${insertError.message}`
          ),
        };
      }

      return { data: newData, error: null };
    }

    // Other errors (e.g., RLS policy blocking access, table doesn't exist)
    if (selectError) {
      console.error('Error fetching email preferences:', selectError);
      return {
        data: null,
        error: new Error(
          `Failed to fetch email preferences: ${selectError.message}`
        ),
      };
    }

    // Should not reach here, but handle gracefully
    return {
      data: null,
      error: new Error('Unexpected error: no data and no error returned'),
    };
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
 * Uses upsert to create preferences if they don't exist
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

    // Check if preferences already exist
    const { data: existing, error: checkError } = await supabase
      .from('email_preferences')
      .select('unsubscribe_token, tenant_id')
      .eq('user_id', user.id)
      .maybeSingle();

    const preferencesExist =
      !!existing &&
      (!checkError || (checkError as SupabaseError)?.code === 'PGRST116');

    // Get user's profile to retrieve tenant_id (needed for insert)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError && (profileError as SupabaseError)?.code !== 'PGRST116') {
      console.warn(
        'Error fetching profile for tenant_id in update:',
        profileError
      );
    }

    // If preferences exist, use UPDATE instead of UPSERT
    if (preferencesExist) {
      const { data, error } = await supabase
        .from('email_preferences')
        .update(preferences)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data, error: null };
    }

    // If preferences don't exist, create them with INSERT
    const generateToken = () => {
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return btoa(String.fromCharCode(...array))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '');
      }
      return btoa(
        `${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}`
      )
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    };

    const insertData = {
      user_id: user.id,
      tenant_id: profile?.tenant_id || null,
      ...preferences,
      unsubscribe_token: generateToken(),
    };

    const { data, error } = await supabase
      .from('email_preferences')
      .insert(insertData)
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
