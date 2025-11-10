# Database Integration Tests

## Overview

This directory contains integration tests that run against a real Supabase database instance.

## Setup

### Environment Variables

Ensure these environment variables are set:

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Local Development

For local testing, migrations should be applied using:

```bash
npm run db:reset
```

This command will:

1. Reset the database to a clean state
2. Apply all migrations from `supabase/migrations/`
3. Prepare the database for tests

### CI/CD Environments

#### Migration Conflict Error

If you encounter this error in CI:

```
ERROR: duplicate key value violates unique constraint "schema_migrations_pkey"
Key (version)=(20250201000001) already exists.
```

This means migrations were already applied to your test database in a previous run.

#### Solutions

**Option 1: Use a Fresh Database (Recommended for CI)**

Configure your CI to use an ephemeral Supabase instance or reset the database before each run:

```yaml
# Example for GitHub Actions
- name: Reset test database
  run: npx supabase db reset
```

**Option 2: Use a Dedicated Test Project**

Create a separate Supabase project specifically for CI tests:

1. Create a new Supabase project for testing
2. Set the CI environment variables to use this project
3. Add a cleanup step in CI to reset the database

```yaml
# Example CI step
- name: Clean test database
  run: npm run db:reset
  env:
    SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.TEST_SERVICE_ROLE_KEY }}
```

**Option 3: Skip Migration Re-application**

If your CI database already has migrations applied and you just want to run tests:

1. Ensure the database is in the correct state
2. Skip the migration step in CI
3. Just run the tests:

```bash
npm test
```

#### Important Notes

1. **Never reset production database**: The `db:reset` command will wipe all data
2. **Service Role Key**: Integration tests require the service role key for admin operations
3. **Migration Order**: Migrations must be applied in order (handled automatically by Supabase CLI)

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Only Integration Tests

```bash
npm test -- tests/database
```

### Run Specific Test File

```bash
npm test -- src/__tests__/database/profile-functions.test.ts
```

## Troubleshooting

### Tests are Skipped

If you see "skipping" messages, check that all required environment variables are set:

```bash
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY
echo $SUPABASE_SERVICE_ROLE_KEY
```

### Connection Errors

1. Verify Supabase project is running (local) or accessible (cloud)
2. Check that API keys are valid
3. Ensure network access to Supabase endpoint

### Migration Errors

1. Reset local database: `npm run db:reset`
2. Verify migration files are in `supabase/migrations/`
3. Check Supabase CLI version: `npx supabase --version`

## Multi-Tenancy Tests

Our integration tests now include multi-tenancy features. The tests automatically:

1. Create users with the default tenant ID
2. Test tenant isolation
3. Verify RLS policies

The default tenant ID used in tests is: `00000000-0000-0000-0000-000000000001`

## Best Practices

1. **Always clean up test data**: Use `afterEach` hooks to clean up created resources
2. **Use unique identifiers**: Generate random usernames/emails to avoid conflicts
3. **Don't hardcode IDs**: Use the returned IDs from creation operations
4. **Test in isolation**: Each test should be independent and not rely on other tests

## Additional Resources

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Supabase Testing Best Practices](https://supabase.com/docs/guides/testing)
