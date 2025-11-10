# Sanctuary Health Theme Troubleshooting Guide

## Changes Made

### 1. Fixed CSS Variable Names

- Changed `--primary` → `--color-primary`
- Changed `--secondary` → `--color-secondary`

### 2. Added Debug Logging

Added comprehensive console logging to track:

- Tenant fetching
- Theme application
- Branding configuration

### 3. Database Verification

Confirmed database has correct configuration:

```json
{
  "subdomain": "sanctuaryhealth",
  "name": "Sanctuary Health",
  "is_active": true,
  "branding": {
    "theme_name": "silk"
  }
}
```

## Troubleshooting Steps

### Step 1: Clear Browser Cache

1. Open DevTools (F12 or Cmd+Option+I)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

OR

1. Go to DevTools → Application → Storage
2. Click "Clear site data"
3. Refresh the page

### Step 2: Check Console Logs

After refreshing, check the console for these debug messages:

**Expected logs:**

```
🏢 [TenantProvider] Fetching tenant for subdomain: sanctuaryhealth
🏢 [TenantProvider] Loaded tenant: {subdomain: "sanctuaryhealth", ...}
🎨 [TenantProvider] Applying tenant branding: {subdomain: "sanctuaryhealth", theme_name: "silk", hasTheme: true}
🎨 [TenantProvider] Setting theme to: silk
🎨 [TenantProvider] Theme applied: silk
```

**Screenshot these logs and share them if the theme still isn't working.**

### Step 3: Verify DOM Attributes

In the console, run these commands:

```javascript
// Check what theme is set on the HTML element
document.documentElement.getAttribute('data-theme');
// Should return: "silk"

// Check localStorage
localStorage.getItem('theme');
// Should return: "silk"

// Check if CSS variable is defined
getComputedStyle(document.documentElement).getPropertyValue('--color-primary');
// Should return: " #4ade80" (note the space)

// Check actual background color
getComputedStyle(document.body).backgroundColor;
// Should return: "rgb(255, 255, 255)" for silk theme
```

### Step 4: Check Network Tab

1. Open DevTools → Network tab
2. Filter by "CSS"
3. Look for `index.css` or any CSS file
4. Check if it's loaded successfully (status 200)
5. Click on it and verify the silk theme CSS is present:

```css
[data-theme='silk'] {
  color-scheme: light;
  --color-primary: #4ade80;
  --color-base-100: #ffffff;
  /* ... more styles ... */
}
```

### Step 5: Check for CSS Conflicts

In the console, run:

```javascript
// Check all stylesheets
Array.from(document.styleSheets).map((sheet) => ({
  href: sheet.href,
  rules: sheet.cssRules?.length,
}));
```

### Step 6: Force Theme Application

If the theme still isn't working, try manually forcing it in the console:

```javascript
// Manually set theme
document.documentElement.setAttribute('data-theme', 'silk');

// Force a style recalculation
document.body.style.display = 'none';
document.body.offsetHeight; // Trigger reflow
document.body.style.display = '';

// Check if it worked
getComputedStyle(document.body).backgroundColor;
```

## Common Issues & Solutions

### Issue 1: "Tenant not found" Error

**Solution:** The database has the correct tenant now. If you still see this:

- Check you're accessing `sanctuaryhealth.localhost:3000` (no hyphen)
- Clear cache and hard reload

### Issue 2: Theme Loads But Wrong Colors

**Possible causes:**

- Old cached CSS file
- Another stylesheet overriding the theme
- CSS not rebuilt after changes

**Solution:**

```bash
# Stop the server
# Clear node_modules/.vite cache
rm -rf node_modules/.vite

# Rebuild and restart
npm run dev
```

### Issue 3: Theme Flickers or Changes After Load

**Possible causes:**

- Another component setting theme after TenantProvider
- Race condition with other providers

**Solution:** Check if any other components are calling `document.documentElement.setAttribute('data-theme', ...)`

## Expected Visual Differences

### Silk Theme (Sanctuary Health)

- Background: White (#ffffff)
- Primary: Green (#4ade80)
- Secondary: Blue (#60a5fa)
- Accent: Purple (#c084fc)
- Text: Dark gray (#1f2937)

### Caramellatte Theme (Main App)

- Background: Cream (#fef7ed)
- Primary: Dark brown (#3d2817)
- Secondary: Medium brown (#6b4423)
- Accent: Light brown (#8b5a2b)
- Text: Dark brown (#3d2817)

## Next Steps

1. Follow the troubleshooting steps above
2. **Share the console logs** from Step 2
3. **Share the results** from the DOM attribute checks in Step 3
4. **Take a screenshot** of the Network tab showing the CSS file loaded

This will help identify exactly where the theme application is failing.

## Testing on Different Environments

### Local Development

URL: `http://sanctuaryhealth.localhost:3000`
Make sure `/etc/hosts` has: `127.0.0.1 sanctuaryhealth.localhost`

### Production (if deployed)

URL: `https://sanctuaryhealth.recipegenerator.app`

## Files Modified

- `src/contexts/TenantContext.tsx` - Added debug logging, fixed CSS variable names
- `src/lib/theme.ts` - Updated subdomain to 'sanctuaryhealth'
- `src/tenants/sanctuary-health/config.ts` - Updated subdomain
- `src/lib/tenant/tenant-loader.ts` - Updated tenant registry
- Database: Updated tenant record with correct subdomain and theme
