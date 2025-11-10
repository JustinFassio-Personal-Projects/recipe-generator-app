# Super Admin Setup

## Current Super Admins

### Local Development

- **Name:** Alice Baker
- **Email:** alice@example.com
- **Password:** Password123!
- **Status:** ✅ SUPER ADMIN
- **User ID:** b5a39943-724b-4dc9-b2d8-006afae23eb9

### Production

- **Name:** Justin Fassio
- **Email:** jlfassio@gmail.com
- **Password:** AvaBelle2420\*
- **Status:** ✅ SUPER ADMIN
- **User ID:** 576def01-9f93-410c-95e5-aa613a54f7c1

## What Super Admins Can Do

1. **View All Tenants**: Access `/admin/tenants` to see all tenant configurations
2. **Create New Tenants**: Add new tenant subdomains with custom branding
3. **Edit Any Tenant**: Modify branding, settings, and AI configuration for any tenant
4. **View All Data**: Can see recipes, profiles, and data from all tenants
5. **Manage Users**: Can update user roles and tenant assignments

## How to Test Super Admin Access

### Step 1: Log In

1. Go to `http://localhost:5174/auth/signin`
2. Use the credentials above (Alice for local, Justin for production)
3. Sign in

### Step 2: Access Admin Panel

1. Navigate to `http://localhost:5174/admin/tenants`
2. You should see:
   - Blue banner saying "Super Admin Mode - You can view and manage all tenants"
   - "Create Tenant" button
   - List of all existing tenants

### Step 3: Test Super Admin Features

- **Create a Test Tenant:**
  - Click "Create Tenant"
  - Set subdomain: `test-clinic`
  - Set name: `Test Clinic`
  - Configure branding, settings, AI config
  - Save

- **Edit Existing Tenant:**
  - Click "Edit" on any tenant card
  - Modify settings
  - Save changes

- **Test Subdomain:**
  - Visit `http://test-clinic.localhost:5174`
  - See custom branding applied
  - Sign up a new user
  - Verify tenant isolation

## Making Additional Super Admins

To make another user a super admin:

```sql
-- First, ensure they're in the main tenant
UPDATE profiles
SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE id = 'USER_ID_HERE';

-- Then make them admin
UPDATE profiles
SET is_admin = true
WHERE id = 'USER_ID_HERE';
```

To find a user's ID by email:

```sql
SELECT id, email, full_name
FROM auth.users
WHERE email = 'user@example.com';
```

## Making Tenant Admins

For users who should only manage their own tenant (not all tenants):

```sql
-- Just make them admin (if they're NOT in main tenant, they'll be tenant admin)
UPDATE profiles
SET is_admin = true
WHERE id = 'USER_ID_HERE';
```

## Removing Admin Access

```sql
UPDATE profiles
SET is_admin = false
WHERE id = 'USER_ID_HERE';
```

## Super Admin vs Tenant Admin

| Feature            | Super Admin | Tenant Admin         |
| ------------------ | ----------- | -------------------- |
| View all tenants   | ✅          | ❌                   |
| Create new tenants | ✅          | ❌                   |
| Edit any tenant    | ✅          | ❌ (only own)        |
| View all users     | ✅          | ❌ (only own tenant) |
| Access all recipes | ✅          | ❌ (only own tenant) |
| Located in         | Main tenant | Any tenant           |

A **Super Admin** is simply an admin user in the main tenant (`00000000-0000-0000-0000-000000000001`).

A **Tenant Admin** is an admin user in any other tenant.

## Security Notes

1. **Password Safety**: These passwords are shown here for your reference only. Consider using a password manager.
2. **Production Passwords**: Change production passwords after initial setup.
3. **Super Admin Count**: Keep the number of super admins minimal (2-3 maximum recommended).
4. **Tenant Admins**: For clinic owners, make them tenant admins instead of super admins.

## Troubleshooting

### "Access Denied" at /admin/tenants

Check if user is properly set as admin:

```sql
SELECT
  au.email,
  p.full_name,
  p.is_admin,
  p.tenant_id,
  CASE
    WHEN p.is_admin = true AND p.tenant_id = '00000000-0000-0000-0000-000000000001'
    THEN 'SUPER ADMIN'
    WHEN p.is_admin = true
    THEN 'TENANT ADMIN'
    ELSE 'Regular User'
  END as role
FROM auth.users au
JOIN profiles p ON p.id = au.id
WHERE au.email = 'user@example.com';
```

### Can Only See Own Tenant

User is a tenant admin, not super admin. Move them to main tenant:

```sql
UPDATE profiles
SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE id = 'USER_ID_HERE';
```

## Next Steps

1. ✅ Log in as Alice (local) or Justin (production)
2. ✅ Visit `/admin/tenants`
3. ✅ Create test tenants
4. ✅ Test tenant isolation
5. ✅ Verify RLS policies are working

Your multi-tenant system is fully configured and ready to use! 🎉
