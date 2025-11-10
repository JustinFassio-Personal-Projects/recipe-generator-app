import type { SupabaseClient } from '@supabase/supabase-js';

// Truncate tables in dependency order to avoid FK violations
export async function truncatePhase1Tables(admin: SupabaseClient) {
  // Using RPC or raw SQL would be faster; with supabase-js we can call a SQL function if present.
  // Fallback: delete with cascade order
  await admin.from('usernames').delete().neq('username', '__never__');
  await admin.from('profiles').delete().neq('id', '__never__');
}

// Check if migrations need to be reset (for CI environments)
export async function checkMigrationsState(admin: SupabaseClient): Promise<{
  needsReset: boolean;
  appliedVersions: string[];
}> {
  try {
    // Query the migrations table to see what's applied
    const { data, error } = await admin.rpc('sql', {
      query:
        'SELECT version FROM supabase_migrations.schema_migrations ORDER BY version',
    });

    if (error) {
      console.warn('Could not check migrations state:', error);
      return { needsReset: false, appliedVersions: [] };
    }

    return {
      needsReset: false,
      appliedVersions:
        data?.map((row: { version: string }) => row.version) || [],
    };
  } catch (error) {
    console.warn('Error checking migrations:', error);
    return { needsReset: false, appliedVersions: [] };
  }
}
