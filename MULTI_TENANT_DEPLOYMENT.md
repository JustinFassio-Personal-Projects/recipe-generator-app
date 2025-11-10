# Multi-Tenant Production Deployment Guide

## Prerequisites

- [ ] All local testing completed successfully
- [ ] Database migrations ready
- [ ] Vercel account with domain `recipegenerator.app`
- [ ] DNS access for domain configuration

## Phase 1: Vercel Configuration

### 1.1 Update vercel.json

The `vercel.json` file has been updated to support wildcard domains:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [...],
  "headers": [...],
  "trailingSlash": false,
  "domains": [
    "recipegenerator.app",
    "*.recipegenerator.app"
  ]
}
```

### 1.2 Configure Wildcard Domain in Vercel

1. Navigate to Vercel Dashboard → Your Project → Settings → Domains
2. Add the following domains:
   - `recipegenerator.app` (main domain)
   - `*.recipegenerator.app` (wildcard for all subdomains)

3. Vercel will provide DNS configuration instructions

## Phase 2: DNS Configuration

### 2.1 Add DNS Records

Add the following DNS records to your domain registrar:

**For Main Domain:**

```
Type: A
Name: @
Value: 76.76.21.21 (Vercel's IP)
```

**For Wildcard Subdomains:**

```
Type: CNAME
Name: *
Value: cname.vercel-dns.com
```

**Alternative (A Record):**

```
Type: A
Name: *
Value: 76.76.21.21
```

### 2.2 Verify DNS Propagation

Wait for DNS propagation (usually 5-30 minutes):

```bash
# Check main domain
dig recipegenerator.app

# Check wildcard
dig test.recipegenerator.app
```

## Phase 3: Database Migration

### 3.1 Backup Production Database

Before running migrations, backup your production database:

```bash
npm run db:backup
```

### 3.2 Apply Migrations

Using Supabase CLI:

```bash
# Link to production project
npx supabase link --project-ref YOUR_PROJECT_REF

# Apply migrations
npx supabase db push
```

Or manually in Supabase Dashboard → SQL Editor:

1. Run migration: `20250201000001_create_tenants_table.sql`
2. Run migration: `20250201000002_add_tenant_id_columns.sql`
3. Run migration: `20250201000003_tenant_rls_policies.sql`

### 3.3 Verify Migrations

Check that tables and policies were created:

```sql
-- Verify tenants table
SELECT * FROM tenants LIMIT 1;

-- Verify columns added
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name = 'tenant_id';

-- Verify RLS policies
SELECT * FROM pg_policies
WHERE tablename IN ('profiles', 'recipes', 'tenants');
```

## Phase 4: Environment Variables

### 4.1 Verify Production Environment Variables

Ensure these are set in Vercel → Settings → Environment Variables:

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
OPENAI_API_KEY=sk-xxx...
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

### 4.2 Add Multi-Tenant Variables (Optional)

```
VITE_ENABLE_MULTI_TENANCY=true
TENANT_ISOLATION_ENABLED=true
```

## Phase 5: Deploy

### 5.1 Deploy to Production

```bash
# Deploy via Vercel CLI
vercel --prod

# Or push to main branch (if auto-deployment enabled)
git push origin main
```

### 5.2 Verify Deployment

1. Check deployment status in Vercel Dashboard
2. Monitor build logs for errors
3. Verify Edge Middleware is running

## Phase 6: Create Initial Tenants

### 6.1 Access Admin Panel

Navigate to:

```
https://recipegenerator.app/admin/tenants
```

### 6.2 Create Production Tenants

Create your first production tenant:

**Example:**

- Subdomain: `drsmith`
- Name: `Dr. Smith's Wellness Clinic`
- Logo URL: `https://...`
- Primary Color: `#3B82F6`
- Restricted Ingredients: `peanuts, shellfish`
- Subscription Tier: `pro`
- Status: `Active`

### 6.3 Test Tenant Access

1. Visit: `https://drsmith.recipegenerator.app`
2. Verify branding loads correctly
3. Create test user account
4. Create test recipes
5. Verify data isolation

## Phase 7: SSL Verification

### 7.1 Check SSL Certificates

Vercel automatically provisions SSL certificates for all subdomains:

1. Main domain: `https://recipegenerator.app` ✅
2. Wildcard: `https://*.recipegenerator.app` ✅

Verify in browser:

- Look for padlock icon
- Check certificate details
- Ensure "Secure" indicator

### 7.2 Force HTTPS

All HTTP traffic is automatically redirected to HTTPS by Vercel.

## Phase 8: Monitoring & Testing

### 8.1 Create Monitoring Dashboard

Monitor key metrics:

- Tenant load times
- API response times
- Error rates per tenant
- Database query performance

### 8.2 Test Production Tenants

**Functional Tests:**

- [ ] Tenant subdomain resolves correctly
- [ ] Branding applies (logo, colors, favicon)
- [ ] AI respects tenant configurations
- [ ] Data isolation works (RLS policies)
- [ ] Admin panel functions correctly

**Performance Tests:**

- [ ] Page load time < 3s
- [ ] Time to Interactive < 5s
- [ ] Middleware overhead < 100ms

**Security Tests:**

- [ ] Cross-tenant data access blocked
- [ ] RLS policies enforced
- [ ] SSL/TLS working
- [ ] CORS configured correctly

## Phase 9: User Migration

### 9.1 Assign Users to Tenants

For existing users, assign them to the default tenant:

```sql
-- All existing users go to main app tenant
UPDATE profiles
SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;
```

### 9.2 Migrate Specific Users

To move users to a specific tenant:

```sql
-- Get tenant ID
SELECT id FROM tenants WHERE subdomain = 'drsmith';

-- Assign users to tenant
UPDATE profiles
SET tenant_id = '<tenant-id>'
WHERE user_id IN ('user-id-1', 'user-id-2');
```

## Phase 10: Rollback Plan

If issues arise, follow this rollback procedure:

### 10.1 Database Rollback

```sql
-- Restore all users to default tenant
UPDATE profiles
SET tenant_id = '00000000-0000-0000-0000-000000000001';

UPDATE recipes
SET tenant_id = '00000000-0000-0000-0000-000000000001';

-- Disable new RLS policies
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE recipes DISABLE ROW LEVEL SECURITY;

-- Re-enable old policies (from backup)
-- ...
```

### 10.2 Code Rollback

```bash
# Revert to previous deployment
vercel rollback
```

### 10.3 DNS Rollback

Remove wildcard DNS record if needed (revert to single domain).

## Production Checklist

- [ ] DNS configured with wildcard CNAME
- [ ] SSL certificates active for all subdomains
- [ ] Database migrations applied successfully
- [ ] RLS policies tested and working
- [ ] Default tenant created
- [ ] Test tenant created and verified
- [ ] Admin panel accessible
- [ ] Monitoring enabled
- [ ] Backup created
- [ ] Rollback plan documented
- [ ] Team notified of new architecture

## Support

For issues or questions:

1. Check logs in Vercel Dashboard → Deployments → Logs
2. Check database logs in Supabase Dashboard → Logs
3. Review middleware execution in Edge Function logs
4. Monitor error tracking service

## Next Steps

After successful deployment:

1. Create onboarding documentation for new tenants
2. Set up automated tenant provisioning
3. Configure billing/subscription management
4. Create tenant analytics dashboard
5. Plan tenant-specific feature flags
