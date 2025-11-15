# 🎨 DaisyUI Theme Management Guide

## Overview

This guide explains the theme setup for the Recipe Generator project, which uses **CSS plugin format themes** (Tailwind CSS v4) for both the main app and tenant subdomains. Themes are defined in `src/index.css` using the `@plugin "daisyui/theme"` syntax and applied automatically based on tenant configuration.

## Current Theme Setup

### Multi-Theme Support

The project supports multiple themes:

- **Caramellatte** (default): Warm brown colors with light cream background
- **Silk**: Custom dark theme with elegant styling
- **Sanctuary Health**: Luxury gold and parchment theme

Themes are applied automatically via `TenantProvider` based on the tenant's `branding.theme_name` database field.

### Theme Colors

Themes are defined using CSS custom properties in `src/index.css`. Here's an example of the caramellatte theme structure:

```css
@plugin "daisyui/theme" {
  name: 'caramellatte';
  default: false;
  prefersdark: false;
  color-scheme: 'light';
  --color-base-100: oklch(98% 0.016 73.684); /* Light cream background */
  --color-base-200: oklch(95% 0.038 75.164); /* Medium cream */
  --color-base-300: oklch(90% 0.076 70.697); /* Light cream */
  --color-base-content: oklch(40% 0.123 38.172); /* Dark brown text */
  --color-primary: oklch(0% 0 0); /* Black */
  --color-primary-content: oklch(100% 0 0); /* White text on primary */
  --color-secondary: oklch(22.45% 0.075 37.85); /* Medium brown */
  --color-secondary-content: oklch(
    90% 0.076 70.697
  ); /* Light text on secondary */
  --color-accent: oklch(46.44% 0.111 37.85); /* Lighter brown */
  --color-accent-content: oklch(90% 0.076 70.697); /* Light text on accent */
  --color-neutral: oklch(55% 0.195 38.402); /* Rich brown */
  --color-neutral-content: oklch(98% 0.016 73.684); /* Light text on neutral */
  --color-info: oklch(42% 0.199 265.638);
  --color-info-content: oklch(90% 0.076 70.697);
  --color-success: oklch(43% 0.095 166.913);
  --color-success-content: oklch(90% 0.076 70.697);
  --color-warning: oklch(82% 0.189 84.429);
  --color-warning-content: oklch(41% 0.112 45.904);
  --color-error: oklch(70% 0.191 22.216);
  --color-error-content: oklch(39% 0.141 25.723);
}
```

**Note**: Colors can be defined using either hex (`#RRGGBB`) or OKLCH (`oklch(...)`) format. The caramellatte theme uses OKLCH for better color consistency.

## Benefits of CSS Plugin Format Themes (Tailwind v4)

### ✅ **Consistency**

- All themes defined in one place (`src/index.css`)
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

- Native Tailwind v4 format
- Easy to add new themes
- Clear theme structure
- Supports both hex and OKLCH color formats

## Theme Configuration

### CSS Plugin Format (Tailwind v4)

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
  /* ... other colors */
}
```

**Note**: With Tailwind CSS v4, themes are defined using CSS plugin format in `src/index.css`, not in `tailwind.config.js`. The `tailwind.config.js` file only contains DaisyUI plugin configuration.

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

To change the theme colors, edit `src/index.css`:

```css
@plugin "daisyui/theme" {
  name: 'caramellatte';
  default: false;
  prefersdark: false;
  color-scheme: 'light';
  --color-primary: #your-primary-color; /* Main brand color */
  --color-secondary: #your-secondary-color; /* Secondary brand color */
  --color-accent: #your-accent-color; /* Accent/highlight color */
  --color-neutral: #your-neutral-color; /* Neutral/gray colors */
  --color-base-100: #your-background; /* Background color */
  --color-base-content: #your-text-color; /* Text color */
  /* ... other colors */
}
```

**Note**: After modifying themes, rebuild CSS with `npm run build:css` to see changes.

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

1. Verify hex color format: `#RRGGBB` (or OKLCH format like `oklch(98% 0.016 73.684)`)
2. Check that theme is properly defined in `src/index.css` using `@plugin "daisyui/theme"` syntax
3. Ensure DaisyUI is properly configured in `tailwind.config.js`
4. Rebuild CSS: `npm run build:css`
5. Rebuild the project: `npm run build`
6. Clear browser cache and localStorage

**Note**: Themes are defined in `src/index.css` using CSS plugin format, not in `tailwind.config.js`. Make sure to update `src/index.css` and rebuild CSS.

### Build Errors

1. Check CSS syntax in `src/index.css` - ensure proper `@plugin "daisyui/theme"` block structure
2. Verify all color values are valid (hex `#RRGGBB` or OKLCH `oklch(...)` format)
3. Ensure theme block is properly closed with `}`
4. Check for missing semicolons in CSS custom properties
5. Run `npm run build:css` to see detailed error messages

## Best Practices

1. **Theme Definition**: Always define themes in `src/index.css` using `@plugin "daisyui/theme"` syntax
2. **Colors**: Ensure sufficient contrast for accessibility
3. **Testing**: Test themes across all components and tenant subdomains
4. **Documentation**: Keep theme colors documented
5. **Multi-Tenant**: Use database-driven theme selection via `branding.theme_name`
6. **Consistency**: Use semantic DaisyUI classes (`bg-primary`, `text-base-content`) instead of hardcoded colors
7. **Rebuild**: Always run `npm run build:css` after modifying themes

## Adding New Themes

To add a new theme:

1. **Define in CSS**: Add theme using `@plugin "daisyui/theme"` syntax in `src/index.css`
2. **Add to constants**: Add theme name to `AVAILABLE_THEMES` in `src/lib/theme.ts`
3. **Rebuild CSS**: Run `npm run build:css` to compile the new theme
4. **Set in database**: Update tenant's `branding.theme_name` field in the database
5. **Test**: Verify theme applies correctly for the tenant

See `docs/theme/Adding-Custom-Themes.md` for detailed instructions.
