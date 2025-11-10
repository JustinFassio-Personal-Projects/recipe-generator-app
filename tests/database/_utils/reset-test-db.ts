/**
 * Database Reset Utility for CI/Test Environments
 *
 * This script helps reset the test database to a clean state,
 * particularly useful for CI environments where migrations may
 * have already been applied.
 */

import { SupabaseClient } from '@supabase/supabase-js';

export async function resetTestDatabase(admin: SupabaseClient): Promise<void> {
  console.log('Resetting test database...');

  try {
    // Drop all tables in dependency order
    const tables = [
      'evaluation_progress_tracking',
      'conversation_threads',
      'user_hidden_ingredients',
      'recipe_ratings',
      'cooking_preferences',
      'user_safety',
      'usernames',
      'user_subscriptions',
      'recipe_comments',
      'image_generation_costs',
      'user_budgets',
      'recipe_views',
      'avatar_analytics',
      'evaluation_reports',
      'user_groceries',
      'recipes',
      'profiles',
      'global_ingredients',
      'tenants',
    ];

    for (const table of tables) {
      try {
        await admin.from(table).delete().neq('id', '__never__');
        console.log(`✓ Truncated table: ${table}`);
      } catch {
        // Table might not exist, which is fine
        console.log(`- Skipped table: ${table}`);
      }
    }

    console.log('✓ Test database reset complete');
  } catch (error) {
    console.error('Failed to reset test database:', error);
    throw error;
  }
}

/**
 * For CI environments: Check if we need to handle migration conflicts
 * This doesn't reset migrations (that requires superuser), but provides
 * information about the current state
 */
export async function checkDatabaseState(admin: SupabaseClient): Promise<{
  tablesExist: boolean;
  migrationsApplied: boolean;
}> {
  try {
    // Check if tenants table exists (our multi-tenant tables)
    const { error: tenantsError } = await admin
      .from('tenants')
      .select('id')
      .limit(1);

    return {
      tablesExist: !tenantsError,
      migrationsApplied: !tenantsError,
    };
  } catch {
    return {
      tablesExist: false,
      migrationsApplied: false,
    };
  }
}
