# 🎨 Adding Custom DaisyUI Themes

This guide shows you how to add custom themes like "Caramellatte" to your Recipe Generator project.

## ⚠️ Important: Tailwind CSS v4 & DaisyUI 5 Compatibility

**This project uses Tailwind CSS v4 with DaisyUI 5**, which requires the **CSS plugin format** for theme definitions.

### CSS Plugin Format (Current Project) ✅

The project uses the **CSS plugin format** in `src/index.css`. All themes are defined here using `@plugin "daisyui/theme"` syntax:

```css
/* src/index.css */
@import 'tailwindcss';
@plugin 'daisyui';

/* Caramellatte Theme */
@plugin "daisyui/theme" {
  name: 'caramellatte';
  default: false;
  prefersdark: false;
  color-scheme: 'light';
  --color-base-100: oklch(98% 0.016 73.684);
  --color-base-200: oklch(95% 0.038 75.164);
  --color-primary: oklch(0% 0 0);
  --color-primary-content: oklch(100% 0 0);
  --color-secondary: oklch(22.45% 0.075 37.85);
  --color-secondary-content: oklch(90% 0.076 70.697);
  /* ... other colors */
}

/* Silk Theme */
@plugin "daisyui/theme" {
  name: 'silk';
  default: false;
  prefersdark: false;
  color-scheme: 'dark';
  --color-base-100: oklch(14% 0.004 49.25);
  --color-primary: oklch(68% 0.162 75.834);
  /* ... other colors (OKLCH format supported) */
}

/* Sanctuary Health Theme */
@plugin "daisyui/theme" {
  name: 'sanctuary-health';
  default: false;
  prefersdark: false;
  color-scheme: 'light';
  --color-primary: #d4af37;
  /* ... other colors */
}
```

**Note**: With Tailwind CSS v4, themes MUST be defined in `src/index.css` using CSS plugin format. The `tailwind.config.js` file only contains DaisyUI plugin configuration, not theme definitions.

## Quick Start: Adding a Custom Theme

### Step 1: Define the Theme Colors

Edit `src/index.css` and add your theme using `@plugin "daisyui/theme"` syntax:

```css
/* src/index.css */
@import 'tailwindcss';
@plugin 'daisyui';

/* Your existing themes... */

/* Your New Theme */
@plugin "daisyui/theme" {
  name: 'your-new-theme';
  default: false;
  prefersdark: false;
  color-scheme: 'light';
  --color-base-100: #fef7ed; /* Cream background */
  --color-base-200: #f5e6d3; /* Medium cream */
  --color-base-300: #e7d5c4; /* Light cream */
  --color-base-content: #3d2817; /* Dark brown text */
  --color-primary: #3d2817; /* Dark brown (was black) */
  --color-primary-content: #ffffff; /* White text on primary */
  --color-secondary: #6b4423; /* Medium brown */
  --color-secondary-content: #e7d5c4; /* Light text on secondary */
  --color-accent: #8b5a2b; /* Lighter brown */
  --color-accent-content: #e7d5c4; /* Light text on accent */
  --color-neutral: #5d4037; /* Rich brown */
  --color-neutral-content: #fef7ed; /* Light text on neutral */
  --color-info: #3abff8; /* Blue */
  --color-info-content: #e7d5c4;
  --color-success: #36d399; /* Green */
  --color-success-content: #e7d5c4;
  --color-warning: #fbbd23; /* Yellow */
  --color-warning-content: #3d2817;
  --color-error: #f87272; /* Red */
  --color-error-content: #3d2817;
}
```

### Step 2: Rebuild CSS

After adding your theme, rebuild the CSS to compile it:

```bash
npm run build:css
```

### Step 3: Add to Theme Constants

Edit `src/lib/theme.ts`:

```javascript
export const AVAILABLE_THEMES = {
  caramellatte: 'caramellatte',
  silk: 'silk',
  'sanctuary-health': 'sanctuary-health',
  'your-new-theme': 'your-new-theme', // ← Add here
} as const;
```

### Step 4: Set Theme in Database (for tenants)

For tenant subdomains, set the theme in the database:

```sql
UPDATE tenants
SET branding = jsonb_set(
  branding,
  '{theme_name}',
  '"your-new-theme"'
)
WHERE subdomain = 'your-tenant';
```

Or use the Admin Panel → Tenant Settings to set the theme.

### Step 5: Test Your Theme

1. Run `npm run build:css` to compile the theme
2. Run `npm run build` to ensure no errors
3. For main app: Theme will default to `caramellatte`
4. For tenant: Set `branding.theme_name` in database and verify theme applies
5. Check that all components render correctly with the new theme

## Color Format Support

The CSS plugin format supports both hex and OKLCH color formats:

```css
/* Hex format (most themes) */
@plugin "daisyui/theme" {
  name: 'caramellatte';
  --color-primary: #3d2817;
  --color-secondary: #6b4423;
  /* ... */
}

/* OKLCH format (used in silk theme) */
@plugin "daisyui/theme" {
  name: 'silk';
  --color-base-100: oklch(14% 0.004 49.25);
  --color-primary: oklch(68% 0.162 75.834);
  /* ... */
}
```

### Color Conversion Tools

- Use [OKLCH to Hex Converter](https://oklch.com/) to convert between formats
- Or use browser dev tools to convert colors
- Both formats work in CSS plugin format - choose what works best for your theme

## Theme Color Guidelines

### Essential Colors (Required)

```javascript
{
  themeName: {
    primary: '#color',        // Main brand color
    secondary: '#color',      // Secondary brand color
    accent: '#color',         // Accent/highlight color
    neutral: '#color',        // Neutral/gray colors
    'base-100': '#color',     // Background color
    info: '#color',           // Info messages
    success: '#color',        // Success messages
    warning: '#color',        // Warning messages
    error: '#color',          // Error messages
  }
}
```

### Optional Advanced Colors

```javascript
{
  themeName: {
    // Standard colors...
    primary: '#color',

    // Advanced customization
    'primary-focus': '#color',      // Focus state
    'primary-content': '#color',    // Text on primary
    'secondary-focus': '#color',    // Focus state
    'secondary-content': '#color',  // Text on secondary

    // Component-specific
    'btn-primary': '#color',
    'btn-primary-hover': '#color',
    'card-bg': '#color',
    'card-border': '#color',
  }
}
```

## Popular Theme Color Palettes

### Coffee & Latte Themes

**Caramellatte** (Current theme):

```javascript
caramellatte: {
  primary: '#3d2817',      // Dark brown (was black)
  secondary: '#6b4423',    // Medium brown
  accent: '#8b5a2b',       // Lighter brown
  neutral: '#5d4037',      // Rich brown
  'base-100': '#fef7ed',   // Cream background
  'base-200': '#f5e6d3',   // Medium cream
  'base-300': '#e7d5c4',   // Light cream
  'base-content': '#3d2817', // Dark brown text
  'primary-content': '#ffffff', // White text on primary
  'secondary-content': '#e7d5c4', // Light text on secondary
  'accent-content': '#e7d5c4', // Light text on accent
  'neutral-content': '#fef7ed', // Light text on neutral
  info: '#3abff8',
  'info-content': '#e7d5c4',
  success: '#36d399',
  'success-content': '#e7d5c4',
  warning: '#fbbd23',
  'warning-content': '#3d2817',
  error: '#f87272',
  'error-content': '#3d2817',
}
```

**Mocha**:

```javascript
mocha: {
  primary: '#8b4513',      // Saddle brown
  secondary: '#654321',    // Dark brown
  accent: '#d2691e',       // Chocolate
  neutral: '#2f1b14',      // Very dark brown
  'base-100': '#f5f5dc',   // Beige
  info: '#3abff8',
  success: '#36d399',
  warning: '#fbbd23',
  error: '#f87272',
}
```

**Espresso**:

```javascript
espresso: {
  primary: '#3e2723',      // Dark brown
  secondary: '#5d4037',    // Brown grey
  accent: '#8d6e63',       // Brown
  neutral: '#1b1b1b',      // Almost black
  'base-100': '#fafafa',   // Off white
  info: '#3abff8',
  success: '#36d399',
  warning: '#fbbd23',
  error: '#f87272',
}
```

### Food & Kitchen Themes

**Spice Cabinet**:

```javascript
spiceCabinet: {
  primary: '#dc2626',      // Red pepper
  secondary: '#ea580c',    // Orange spice
  accent: '#f59e0b',       // Turmeric
  neutral: '#374151',      // Charcoal
  'base-100': '#fefefe',   // Clean white
  info: '#3abff8',
  success: '#36d399',
  warning: '#fbbd23',
  error: '#f87272',
}
```

**Fresh Herbs**:

```javascript
freshHerbs: {
  primary: '#059669',      // Sage green
  secondary: '#10b981',    // Mint green
  accent: '#84cc16',       // Lime green
  neutral: '#374151',
  'base-100': '#f0fdf4',   // Light green tint
  info: '#3abff8',
  success: '#36d399',
  warning: '#fbbd23',
  error: '#f87272',
}
```

## Using DaisyUI Theme Generator

1. **Visit**: [DaisyUI Theme Generator](https://daisyui.com/theme-generator/)
2. **Customize**: Use the visual editor to create your theme
3. **Export**: Copy the generated theme object
4. **Paste**: Add it to your `tailwind.config.js`

## Testing Your Theme

### Manual Testing

```javascript
// Set theme programmatically
document.documentElement.setAttribute('data-theme', 'yourThemeName');

// Check current theme
console.log(document.documentElement.getAttribute('data-theme'));
```

### Visual Testing Checklist

- [ ] Primary buttons look good
- [ ] Secondary buttons are readable
- [ ] Text has sufficient contrast
- [ ] Cards and backgrounds work well
- [ ] Error/success messages are visible
- [ ] Forms are readable
- [ ] Navigation elements are clear

## Troubleshooting

### Theme Not Appearing

1. Check theme name spelling in both config files
2. Ensure theme is in both `quickThemes` and `allThemes` arrays
3. Clear localStorage: `localStorage.removeItem('theme')`
4. Refresh the page

### Colors Not Updating

1. Verify color format: `#RRGGBB` for hex or `oklch(...)` for OKLCH
2. Ensure theme is properly defined in `tailwind.config.js`
3. Check that theme name matches exactly (case-sensitive)
4. Verify theme is added to `AVAILABLE_THEMES` in `src/lib/theme.ts`
5. Rebuild the project: `npm run build`
6. Clear browser cache and localStorage

**Important**: Themes are now defined in `tailwind.config.js` only. Do NOT define themes in CSS files - they will conflict with the Tailwind config.

### Build Errors

1. Check JSON syntax in `tailwind.config.js`
2. Verify all color values are valid hex codes
3. Ensure theme object structure is correct
4. Check for missing commas or brackets

### Theme Application Issues

1. **Themes are applied via TenantProvider** - check tenant's `branding.theme_name` in database
2. **Main app** defaults to `caramellatte` theme
3. **Tenant subdomains** use theme from database configuration
4. Verify `data-theme` attribute is set on `document.documentElement`
5. Check browser console for theme-related errors

## Best Practices

1. **Naming**: Use descriptive, kebab-case names (e.g., `caramellatte`, `sanctuary-health`)
2. **Colors**: Ensure sufficient contrast for accessibility (WCAG AA: 4.5:1)
3. **Testing**: Test themes across all components and tenant subdomains
4. **Documentation**: Add theme descriptions to your docs
5. **Organization**: Group related themes together in the config
6. **Format**: Use Tailwind config format - themes are NOT defined in CSS
7. **Multi-Tenant**: Set themes via database `branding.theme_name` field
8. **Constants**: Always add new themes to `AVAILABLE_THEMES` in `src/lib/theme.ts`

## Example: Complete Theme Addition

Here's a complete example of adding a "Sunset Kitchen" theme:

### 1. Add to `tailwind.config.js`:

```javascript
sunsetKitchen: {
  primary: '#f97316',      // Orange
  secondary: '#dc2626',    // Red
  accent: '#f59e0b',       // Amber
  neutral: '#374151',      // Gray
  'base-100': '#fef7ed',   // Warm white
  info: '#3abff8',
  success: '#36d399',
  warning: '#fbbd23',
  error: '#f87272',
}
```

### 2. Add to `src/lib/theme.ts`:

```javascript
export const AVAILABLE_THEMES = {
  caramellatte: 'caramellatte',
  silk: 'silk',
  'sanctuary-health': 'sanctuary-health',
  'sunset-kitchen': 'sunset-kitchen', // ← Add here
} as const;
```

### 3. Set in Database (for tenant):

```sql
UPDATE tenants
SET branding = jsonb_set(branding, '{theme_name}', '"sunset-kitchen"')
WHERE subdomain = 'your-tenant';
```

### 3. Test:

```bash
npm run build
```

That's it! Your new theme is now available in the theme toggle. 🎨
