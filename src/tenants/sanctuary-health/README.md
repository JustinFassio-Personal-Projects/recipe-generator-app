# Sanctuary Health Tenant Configuration

## Theme Management

Sanctuary Health uses a **custom DaisyUI theme** called `sanctuary-health` with luxury gold and warm parchment colors.

### For Admins: How to Update the Theme

The theme is managed entirely through the **database** - no code changes needed!

#### To Change the Theme:

1. **Go to Admin Panel** → Tenant Settings
2. **Find Sanctuary Health tenant** (subdomain: `sanctuaryhealth`)
3. **Edit the `branding` column** → `theme_name` field
4. **Set to**: `sanctuary-health` (or any other available theme)
5. **Save** - Changes apply immediately

#### Available Themes:

- `sanctuary-health` - Custom gold/parchment theme (current)
- `silk` - Dark theme with green/blue accents
- `caramellatte` - Default warm brown theme

### Theme Colors

The `sanctuary-health` theme uses:

- **Primary**: Luxury Gold (`#d4af37`) - Main brand color
- **Secondary**: Warm Parchment (`#f7f1d3`) - Background accent
- **Accent**: Rich Gold (`#b8941f`) - Highlight color
- **Base**: Light Parchment (`#fef7ed`) - Main background

### Customizing Theme Colors

If you need to change the colors:

1. **Contact a developer** to update `src/index.css`
2. **Or** switch to a different pre-built theme via the admin panel

### Technical Details

- **Theme Definition**: `src/index.css` → `[data-theme='sanctuary-health']`
- **Theme Registration**: `src/lib/theme.ts` → `AVAILABLE_THEMES`
- **Config Reference**: `src/tenants/sanctuary-health/config.ts`

---

## Tenant Settings

- **Subdomain**: `sanctuaryhealth`
- **Name**: Sanctuary Health
- **Specialty**: General Health & Wellness
- **Default Units**: Imperial
- **Instruction Style**: Detailed

---

## Files

- `config.ts` - Tenant configuration (for development)
- `theme/sanctuary-health-theme.ts` - Theme documentation
- `theme/silk-theme.ts` - Silk theme reference (not used)
