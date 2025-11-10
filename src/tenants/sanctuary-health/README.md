# Sanctuary Health Tenant

**Created:** November 10, 2025  
**Theme:** DaisyUI Silk  
**Status:** Active

## Overview

Sanctuary Health is a fully customizable tenant implementation for the Recipe Generator platform, featuring a clean, professional healthcare-focused design with the DaisyUI Silk theme.

## Directory Structure

```
src/tenants/sanctuary-health/
├── README.md                    # This file
├── config.ts                    # Tenant configuration
├── theme/
│   └── silk-theme.ts           # Silk theme definition
├── assets/                      # Branding assets
│   └── .gitkeep
└── components/                  # Custom components
    └── .gitkeep
```

## Features

- **Custom Theme:** Professional Silk theme with healthcare-appropriate colors
- **Isolated Configuration:** All tenant-specific settings in one directory
- **Type-Safe:** Full TypeScript support with existing type system
- **Database + Local Config:** Supports both approaches for flexibility
- **Production Ready:** Can be deployed with database configuration

## Theme Details

### Silk Theme Colors

The Silk theme provides a soft, professional color palette perfect for healthcare applications:

- **Primary:** `#4ade80` - Soft green (health/wellness)
- **Secondary:** `#60a5fa` - Calm blue
- **Accent:** `#c084fc` - Soft purple
- **Base Background:** `#ffffff` - Clean white
- **Text:** `#1f2937` - Dark gray for readability

### Accessibility

- WCAG AA compliant contrast ratios
- Professional, calming color scheme
- High readability for health-conscious users

## Local Development Setup

### 1. Add Subdomain to Hosts File

Edit your `/etc/hosts` file:

```bash
sudo nano /etc/hosts
```

Add this line:

```
127.0.0.1 sanctuary-health.localhost
```

Save and exit (Ctrl+O, Enter, Ctrl+X)

### 2. Create Database Tenant Record (Optional)

If you want to test database-driven configuration, create the tenant via SQL or admin panel:

**Via SQL:**

```sql
INSERT INTO tenants (subdomain, name, branding, is_active)
VALUES (
  'sanctuary-health',
  'Sanctuary Health',
  '{"theme_name": "silk", "primary_color": "#4ade80", "secondary_color": "#60a5fa"}'::jsonb,
  true
);
```

**Via Admin Panel:**

1. Navigate to `http://localhost:5174/admin/tenants`
2. Click "Create Tenant"
3. Fill in:
   - Subdomain: `sanctuary-health`
   - Name: `Sanctuary Health`
   - Theme: Add `"theme_name": "silk"` to branding JSON
   - Status: Active

### 3. Access the Tenant

Visit: `http://sanctuary-health.localhost:5174`

You should see:

- Silk theme colors applied
- "Sanctuary Health" in the header
- Professional, healthcare-focused design

## Configuration Options

### Theme Configuration

Edit `theme/silk-theme.ts` to:

- Document theme colors
- Add custom color overrides
- Update theme metadata

### Tenant Settings

Edit `config.ts` to customize:

```typescript
export const sanctuaryHealthConfig = {
  subdomain: 'sanctuary-health',
  name: 'Sanctuary Health',

  branding: {
    theme_name: 'silk',
    primary_color: '#4ade80',
    secondary_color: '#60a5fa',
    logo_url: '/tenants/sanctuary-health/assets/logo.png',
    favicon_url: '/tenants/sanctuary-health/assets/favicon.ico',
  },

  settings: {
    specialty: 'General Health & Wellness',
    restricted_ingredients: [], // Add restrictions if needed
    instruction_style: 'detailed',
    default_units: 'imperial',
  },

  ai_config: {
    system_prompt_override: 'Custom AI instructions...',
  },
};
```

## Adding Branding Assets

### Logo

1. Add logo file to `assets/` directory:

   ```
   assets/logo.png
   assets/logo.svg
   ```

2. Update `config.ts`:
   ```typescript
   branding: {
     logo_url: '/tenants/sanctuary-health/assets/logo.png',
   }
   ```

### Favicon

1. Add favicon to `assets/`:

   ```
   assets/favicon.ico
   assets/favicon.svg
   ```

2. Update `config.ts`:
   ```typescript
   branding: {
     favicon_url: '/tenants/sanctuary-health/assets/favicon.ico',
   }
   ```

## Custom Components

To create tenant-specific component overrides:

1. Create component in `components/` directory:

   ```typescript
   // components/CustomHeader.tsx
   export function CustomHeader() {
     return <header>Sanctuary Health Custom Header</header>;
   }
   ```

2. Import and use in your tenant-specific pages
3. Conditionally render based on tenant context

## Testing

### Verify Theme Application

1. **Open DevTools** (F12)
2. **Inspect `<html>` element**
3. **Check `data-theme` attribute:**
   ```html
   <html data-theme="silk"></html>
   ```

### Verify Colors

1. **Check computed styles** in DevTools
2. **Primary color** should be `#4ade80`
3. **Background** should be white (`#ffffff`)
4. **Text** should be dark gray (`#1f2937`)

### Verify Tenant Isolation

1. Visit main app: `http://localhost:5174`
   - Should use `caramellatte` theme
   - Should show "Recipe Generator" branding

2. Visit tenant: `http://sanctuary-health.localhost:5174`
   - Should use `silk` theme
   - Should show "Sanctuary Health" branding

### Verify Persistence

1. Reload the page
2. Theme should persist (stored in localStorage)
3. Check localStorage: `localStorage.getItem('theme')` should return `'silk'`

## Production Deployment

### Database Configuration

In production, the tenant configuration should be stored in the database:

```sql
INSERT INTO tenants (
  subdomain,
  name,
  branding,
  settings,
  subscription_tier,
  is_active
) VALUES (
  'sanctuary-health',
  'Sanctuary Health',
  '{"theme_name": "silk", "primary_color": "#4ade80", "secondary_color": "#60a5fa", "logo_url": "https://cdn.example.com/sanctuary-health-logo.png"}'::jsonb,
  '{"specialty": "General Health & Wellness", "instruction_style": "detailed", "default_units": "imperial"}'::jsonb,
  'pro',
  true
);
```

### DNS Configuration

1. Add DNS A record: `sanctuary-health.yourdomain.com` → Server IP
2. Configure Vercel wildcard domain: `*.yourdomain.com`
3. SSL certificate will be auto-provisioned by Vercel

### Verification Checklist

- [ ] DNS resolves to correct server
- [ ] SSL certificate is active
- [ ] Theme applies correctly
- [ ] Branding assets load
- [ ] Data isolation works (can't see other tenant data)
- [ ] Performance is acceptable (<100ms overhead)

## Troubleshooting

### Theme Not Applying

**Problem:** Theme stays as caramellatte instead of silk

**Solutions:**

1. Check database tenant record exists
2. Verify `branding.theme_name` is set to `'silk'`
3. Clear localStorage: `localStorage.clear()`
4. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
5. Check browser console for errors

### Subdomain Not Resolving

**Problem:** `sanctuary-health.localhost` doesn't load

**Solutions:**

1. Verify `/etc/hosts` entry is correct
2. Try `http://` instead of `https://` for local dev
3. Restart browser after editing hosts file
4. Flush DNS cache: `sudo dscacheutil -flushcache` (Mac)

### Colors Not Matching

**Problem:** Colors don't match Silk theme

**Solutions:**

1. Check DaisyUI is installed: `npm list daisyui`
2. Verify `src/index.css` includes silk: `themes: caramellatte silk`
3. Check browser DevTools for CSS conflicts
4. Clear build cache: `rm -rf node_modules/.vite`

### Database Tenant Not Found

**Problem:** "Tenant not found" error

**Solutions:**

1. Create tenant record in database (see setup instructions)
2. Verify subdomain is correct (lowercase, no spaces)
3. Check tenant is active: `is_active = true`
4. Grant permissions if needed (see multi-tenant setup docs)

## Next Steps

### Immediate

- [ ] Add logo and favicon assets
- [ ] Test local development setup
- [ ] Verify theme application
- [ ] Create database tenant record

### Future Enhancements

- [ ] Custom header component
- [ ] Tenant-specific landing page
- [ ] Health-focused recipe filters
- [ ] Custom AI prompts for nutrition
- [ ] Integration with health tracking systems

## Support

For questions or issues:

1. Check main multi-tenant docs: `MULTI_TENANT_IMPLEMENTATION_SUMMARY.md`
2. Review tenant creation guide: `TENANT_CREATION_STEPS.md`
3. Check local setup guide: `MULTI_TENANT_LOCAL_SETUP.md`

## References

- [DaisyUI Themes](https://daisyui.com/docs/themes/)
- [Multi-Tenant Architecture](../../MULTI_TENANT_IMPLEMENTATION_SUMMARY.md)
- [Tenant Context Provider](../../contexts/TenantContext.tsx)
- [Theme Library](../../lib/theme.ts)
