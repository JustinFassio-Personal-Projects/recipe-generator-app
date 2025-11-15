# 🎨 DaisyUI Theme Management Guide

## Overview

This guide explains the theme setup for the Recipe Generator project, which uses **Tailwind config-based themes** for both the main app and tenant subdomains. Themes are defined in `tailwind.config.js` and applied automatically based on tenant configuration.

## Current Theme Setup

### Multi-Theme Support

The project supports multiple themes:

- **Caramellatte** (default): Warm brown colors with light cream background
- **Silk**: Custom dark theme with elegant styling
- **Sanctuary Health**: Luxury gold and parchment theme

Themes are applied automatically via `TenantProvider` based on the tenant's `branding.theme_name` database field.

### Theme Colors

```javascript
caramellatte: {
  primary: '#3d2817',      // Dark brown (was black)
  secondary: '#6b4423',    // Medium brown
  accent: '#8b5a2b',       // Lighter brown
  neutral: '#5d4037',      // Rich brown
  'base-100': '#fef7ed',   // Light cream background
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

## Benefits of Tailwind Config-Based Themes

### ✅ **Consistency**

- All themes defined in one place (`tailwind.config.js`)
- Consistent theme structure across all themes
- Easy to maintain and update

### ✅ **Performance**

- Themes are compiled at build time
- No runtime CSS injection needed
- Efficient theme switching

### ✅ **Multi-Tenant Support**

- Each tenant can have its own theme
- Themes applied automatically from database
- No code changes needed to change tenant themes

### ✅ **Developer Experience**

- Type-safe theme definitions
- Easy to add new themes
- Clear theme structure

## Theme Configuration

### Tailwind Config

```javascript
// tailwind.config.js
daisyui: {
  themes: [
    {
      caramellatte: {
        // ... theme colors (see above)
      },
    },
  ],
  base: true,
  styled: true,
  utils: true,
  prefix: '',
  logs: true,
  themeRoot: ':root',
}
```

### Automatic Theme Application

Themes are automatically applied via the `TenantProvider` component:

```javascript
// src/contexts/TenantContext.tsx
// Theme is applied based on tenant.branding.theme_name from database
if (branding?.theme_name) {
  document.documentElement.setAttribute('data-theme', branding.theme_name);
  localStorage.setItem('theme', branding.theme_name);
} else {
  // Fallback to default caramellatte theme
  document.documentElement.setAttribute('data-theme', 'caramellatte');
  localStorage.setItem('theme', 'caramellatte');
}
```

**For the main app**: Uses `caramellatte` theme by default  
**For tenant subdomains**: Uses the theme specified in the tenant's `branding.theme_name` database field

## Customizing the Theme

### Modifying Colors

To change the theme colors, edit `tailwind.config.js`:

```javascript
caramellatte: {
  primary: '#your-primary-color',    // Main brand color
  secondary: '#your-secondary-color', // Secondary brand color
  accent: '#your-accent-color',       // Accent/highlight color
  neutral: '#your-neutral-color',     // Neutral/gray colors
  'base-100': '#your-background',     // Background color
  'base-content': '#your-text-color', // Text color
  // ... other colors
}
```

### Color Guidelines

- **Primary**: Main brand color (buttons, links)
- **Secondary**: Supporting brand color
- **Accent**: Highlight color for special elements
- **Base-100**: Main background color
- **Base-content**: Main text color
- **Neutral**: Gray tones for borders, dividers

### Accessibility

- Ensure sufficient contrast ratios (WCAG AA: 4.5:1)
- Test with color blindness simulators
- Maintain readability across all components

## Troubleshooting

### Theme Not Applying

1. Check if the theme name is correct: `caramellatte`
2. Verify `data-theme` attribute is set on `:root`
3. Clear localStorage: `localStorage.removeItem('theme')`
4. Refresh the page

### Colors Not Updating

1. Verify hex color format: `#RRGGBB` (or OKLCH format for silk theme)
2. Check that theme is properly defined in `tailwind.config.js`
3. Ensure DaisyUI is properly configured
4. Rebuild the project: `npm run build`
5. Clear browser cache and localStorage

**Note**: Themes are now defined in `tailwind.config.js`, not in CSS. Make sure to update the Tailwind config, not CSS files.

### Build Errors

1. Check JSON syntax in `tailwind.config.js`
2. Verify all color values are valid hex codes
3. Ensure theme object structure is correct
4. Check for missing commas or brackets

## Best Practices

1. **Theme Definition**: Always define themes in `tailwind.config.js`, not in CSS
2. **Colors**: Ensure sufficient contrast for accessibility
3. **Testing**: Test themes across all components and tenant subdomains
4. **Documentation**: Keep theme colors documented
5. **Multi-Tenant**: Use database-driven theme selection via `branding.theme_name`
6. **Consistency**: Use semantic DaisyUI classes (`bg-primary`, `text-base-content`) instead of hardcoded colors

## Adding New Themes

To add a new theme:

1. **Define in Tailwind config**: Add theme object to `daisyui.themes` array in `tailwind.config.js`
2. **Add to constants**: Add theme name to `AVAILABLE_THEMES` in `src/lib/theme.ts`
3. **Set in database**: Update tenant's `branding.theme_name` field in the database
4. **Test**: Verify theme applies correctly for the tenant

See `docs/theme/Adding-Custom-Themes.md` for detailed instructions.
