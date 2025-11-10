# Multi-Tenant Local Development Setup

## Subdomain Testing Configuration

To test tenant subdomains locally, you need to configure your `/etc/hosts` file to route subdomains to localhost.

### Step 1: Edit /etc/hosts

Open your hosts file with administrator privileges:

```bash
sudo nano /etc/hosts
```

### Step 2: Add Local Subdomain Mappings

Add the following lines to map test subdomains to localhost:

```
127.0.0.1 drsmith.localhost
127.0.0.1 clinic.localhost
127.0.0.1 test-tenant.localhost
```

Save and close the file (Ctrl+O, Enter, Ctrl+X in nano).

### Step 3: Start Development Servers

Run both the Vite dev server and Vercel API server:

```bash
# Terminal 1: Vite frontend dev server
npm run dev

# Terminal 2: Vercel serverless functions (API routes)
npm run dev:api
```

### Step 4: Access Tenants

You can now access different tenants:

- Main app: `http://localhost:5174`
- Tenant 1: `http://drsmith.localhost:5174`
- Tenant 2: `http://clinic.localhost:5174`
- Test tenant: `http://test-tenant.localhost:5174`

## Testing Workflow

### 1. Create Test Tenants

Navigate to the admin panel:

```
http://localhost:5174/admin/tenants
```

Create test tenants with different configurations:

**Example: Dr. Smith's Clinic**

- Subdomain: `drsmith`
- Name: `Dr. Smith's Wellness Clinic`
- Restricted Ingredients: `peanuts, shellfish`
- Primary Color: `#3B82F6`

**Example: Nutrition Center**

- Subdomain: `clinic`
- Name: `Community Nutrition Center`
- Restricted Ingredients: `alcohol`
- Primary Color: `#10B981`

### 2. Test Tenant Isolation

1. Create a user account on the main app
2. Create recipes and data
3. Access a tenant subdomain (e.g., `drsmith.localhost:5174`)
4. Verify that you cannot see the main app's data
5. Create new data on the tenant subdomain
6. Verify data isolation

### 3. Test Tenant Features

#### Branding

- [ ] Logo displays correctly
- [ ] Primary color applies to UI
- [ ] Favicon changes
- [ ] App name displays in header

#### Restricted Ingredients

- [ ] AI respects ingredient restrictions
- [ ] Recipes cannot use restricted ingredients
- [ ] User receives appropriate messages

#### AI Customization

- [ ] Custom system prompts apply
- [ ] Persona overrides work correctly

### 4. Test Middleware

Verify the middleware is working:

1. Open browser dev tools → Network tab
2. Navigate to a tenant subdomain
3. Check request headers for `x-tenant-subdomain`
4. Check cookies for `tenant-subdomain`

## Troubleshooting

### Issue: Subdomain not resolving

**Solution:** Verify `/etc/hosts` entries:

```bash
cat /etc/hosts | grep localhost
```

### Issue: Tenant not loading

**Check:**

1. Ensure migrations have run successfully
2. Verify tenant exists in database:
   ```sql
   SELECT * FROM tenants WHERE subdomain = 'drsmith';
   ```
3. Check browser console for errors

### Issue: Middleware not applying

**Check:**

1. Restart dev servers
2. Clear browser cache
3. Verify `middleware.ts` is in project root

## Database Setup

### Run Migrations

Apply the multi-tenant migrations:

```bash
# If using local Supabase
npm run db:reset

# Or apply migrations manually
npx supabase migration up
```

### Seed Test Data

Create the default tenant and test tenants:

```sql
-- This is already created by migration
SELECT * FROM tenants WHERE subdomain = 'app';

-- Create test tenants manually if needed
INSERT INTO tenants (subdomain, name, owner_id, is_active)
VALUES
  ('drsmith', 'Dr. Smith''s Clinic', NULL, true),
  ('clinic', 'Community Nutrition Center', NULL, true);
```

## Next Steps

After local testing is successful:

1. ✅ Verify all features work across tenants
2. ✅ Test RLS policies prevent data leakage
3. ✅ Test admin panel CRUD operations
4. ✅ Check performance (should add < 100ms overhead)
5. ✅ Run full test suite: `npm test`

Ready for production deployment? See `MULTI_TENANT_DEPLOYMENT.md`
