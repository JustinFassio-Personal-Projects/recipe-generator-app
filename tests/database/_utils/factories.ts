import { SupabaseClient } from '@supabase/supabase-js';

export async function createUserAndProfile(
  admin?: SupabaseClient,
  options?: { username?: string | null }
) {
  const email = `test+${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;
  const password = 'Password123!';

  if (admin) {
    // Create a real user via Supabase Auth API for integration tests
    console.log('Creating real user via Supabase Auth API');

    // Check if admin.auth.admin exists
    if (!admin.auth || !admin.auth.admin) {
      throw new Error(
        'Supabase client does not have admin auth access. Ensure service role key is used.'
      );
    }

    const { data: authData, error: authError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError) {
      const errorDetails = authError as {
        message: string;
        status?: number;
        code?: string;
      };
      console.error('Auth error details:', {
        message: errorDetails.message,
        status: errorDetails.status,
        code: errorDetails.code,
      });
      throw new Error(`Failed to create user: ${errorDetails.message}`);
    }

    if (!authData) {
      console.error('Auth data is null/undefined');
      throw new Error('Failed to create user: auth data is null');
    }

    if (!authData.user) {
      console.error(
        'Auth data.user is null/undefined. Full authData:',
        authData
      );
      throw new Error(
        'Failed to create user: user object is missing from auth data'
      );
    }

    if (!authData.user.id) {
      console.error(
        'Auth data.user.id is null/undefined. User object:',
        authData.user
      );
      throw new Error('Failed to create user: user ID is missing');
    }

    const userId = authData.user.id;
    console.log('User created with ID:', userId);

    // Create profile for the real user
    console.log('Creating profile for user:', userId);

    // Only create profile if username is not explicitly set to null
    if (options?.username !== null) {
      const profileData: {
        id: string;
        username?: string;
        full_name: string;
        created_at: string;
        updated_at: string;
      } = {
        id: userId,
        full_name: 'Test User',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (options?.username) {
        profileData.username = options.username;
      } else {
        profileData.username = uniqueUsername();
      }

      const { error: profileError } = await admin
        .from('profiles')
        .insert(profileData);

      if (profileError) {
        console.warn(`Profile creation failed:`, profileError);
        // Don't throw - profile might already exist or have other issues
      } else {
        console.log('Profile created successfully');
      }
    }

    return {
      user: authData.user,
      email,
      password,
    };
  } else {
    // Create a mock user for unit tests (no database operations)
    const userId = crypto.randomUUID();
    const mockUser = {
      id: userId,
      email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('Created mock user for unit tests (no database operations)');

    return {
      user: mockUser,
      email,
      password,
    };
  }
}

export function uniqueUsername(base = 'user'): string {
  return `${base}_${Math.random().toString(36).slice(2, 8)}`.toLowerCase();
}
