# How to Create Your First Tenant

## Current Status

✅ Migrations applied
✅ Admin user created
✅ Default tenant exists (`app`)
❌ Test tenant doesn't exist yet

## Step-by-Step Guide

### Step 1: Access Admin Panel

1. Make sure you're logged in as the admin user:
   - Username: `taken_vl5xeq`
   - (or any user with `is_admin = true`)

2. Navigate to admin panel:
   ```
   http://localhost:5174/admin/tenants
   ```

### Step 2: Create Test Tenant

Click **"Create Tenant"** and fill in:

**Basic Info:**

- **Subdomain:** `test-clinic` ⚠️ IMPORTANT: Use lowercase, no spaces
- **Name:** `Test Medical Clinic`
- **Subscription Tier:** `starter`
- **Status:** `Active`

**Branding (Optional):**

- **Logo URL:** Leave blank for now
- **Primary Color:** `#3B82F6` (or pick any color)

**Restrictions (Optional):**

- **Restricted Ingredients:** `peanuts, shellfish`

**AI Configuration (Optional):**

- **System Prompt Override:** Leave blank for now

Click **"Create Tenant"**

### Step 3: Add Subdomain to /etc/hosts

```bash
sudo nano /etc/hosts
```

Add this line:

```
127.0.0.1 test-clinic.localhost
```

Save and exit (Ctrl+O, Enter, Ctrl+X)

### Step 4: Test Tenant Access

Visit: `http://test-clinic.localhost:5174`

You should now see:

- ✅ The app loads successfully
- ✅ Custom branding (if you set it)
- ✅ "Test Medical Clinic" in the header

## Quick SQL Method (Alternative)

If you prefer SQL, run this in Supabase SQL Editor:

```sql
INSERT INTO tenants (
  subdomain,
  name,
  branding,
  settings,
  is_active
)
VALUES (
  'test-clinic',
  'Test Medical Clinic',
  '{"primary_color": "#3B82F6"}'::jsonb,
  '{"restricted_ingredients": ["peanuts", "shellfish"]}'::jsonb,
  true
);

-- Verify creation
SELECT id, subdomain, name, is_active FROM tenants;
```

## Common Errors

### Error: "Tenant not found"

**Solution:** The tenant hasn't been created yet. Follow steps above.

### Error: "Configuration Error"

**Solution:** Check the tenant exists and is active:

```sql
SELECT subdomain, name, is_active FROM tenants WHERE subdomain = 'test-clinic';
```

### Error: "406 Not Acceptable"

**Solution:**

1. Make sure migrations were applied
2. Grant SELECT permission:
   ```sql
   GRANT SELECT ON tenants TO anon;
   GRANT SELECT ON tenants TO authenticated;
   ```
3. Use `maybeSingle()` instead of `single()` in queries

## Verification

After creating the tenant, verify it exists:

```sql
SELECT
  subdomain,
  name,
  branding,
  settings,
  is_active,
  created_at
FROM tenants
WHERE subdomain = 'test-clinic';
```

Expected result:

```
subdomain    | name                  | is_active
-------------|----------------------|----------
test-clinic  | Test Medical Clinic  | true
```

## Next Steps

Once your tenant is created:

1. ✅ Visit subdomain: `http://test-clinic.localhost:5174`
2. ✅ Create a test user account on the tenant
3. ✅ Test data isolation (data on main app shouldn't appear)
4. ✅ Test restricted ingredients with AI
5. ✅ Customize branding

## Tenant List

Current tenants in your database:

| Subdomain     | Name                 | Status    |
| ------------- | -------------------- | --------- |
| `app`         | Recipe Generator     | Active ✅ |
| `test-clinic` | _(Create this next)_ | ⏳        |

---

**Need Help?**

- Admin panel: `http://localhost:5174/admin/tenants`
- Check Supabase logs
- Review `TenantContext.tsx` for errors
