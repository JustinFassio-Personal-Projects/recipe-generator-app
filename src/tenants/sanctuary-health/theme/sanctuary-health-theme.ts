/**
 * Sanctuary Health Custom Theme Configuration
 *
 * This file documents the Sanctuary Health custom theme colors.
 * The theme is defined in src/index.css and uses DaisyUI's theme system.
 *
 * Theme Colors:
 * - Primary: Luxury Gold (#d4af37) - Main brand color
 * - Secondary: Warm Parchment (#f7f1d3) - Background accent
 * - Accent: Rich Gold (#b8941f) - Highlight color
 * - Base: Light Parchment (#fef7ed) - Main background
 *
 * This theme provides a premium, healthcare-focused aesthetic with
 * warm, inviting colors that convey trust and wellness.
 */

export const SANCTUARY_HEALTH_THEME_NAME = 'sanctuary-health' as const;

/**
 * Sanctuary Health theme color reference
 * These colors are automatically applied when data-theme="sanctuary-health"
 *
 * Note: The theme is defined in src/index.css using CSS custom properties.
 * Admins can change the theme by updating the theme_name in the database.
 */
export const sanctuaryHealthThemeColors = {
  // Primary colors - Luxury Gold
  primary: '#d4af37',
  'primary-content': '#1a1400',

  // Secondary colors - Warm Parchment
  secondary: '#f7f1d3',
  'secondary-content': '#3d2817',

  // Accent - Rich Gold
  accent: '#b8941f',
  'accent-content': '#1a1400',

  // Neutral - Warm Gray-Brown
  neutral: '#5d4e37',
  'neutral-content': '#fef7ed',

  // Base colors - Light Parchment backgrounds
  'base-100': '#fef7ed',
  'base-200': '#f7f1d3',
  'base-300': '#e8dfc4',
  'base-content': '#3d2817',

  // Semantic colors
  info: '#3b82f6',
  'info-content': '#ffffff',
  success: '#22c55e',
  'success-content': '#ffffff',
  warning: '#f59e0b',
  'warning-content': '#1a1400',
  error: '#ef4444',
  'error-content': '#ffffff',
} as const;

/**
 * Theme metadata
 */
export const sanctuaryHealthThemeMetadata = {
  name: 'Sanctuary Health',
  description:
    'Premium healthcare theme with luxury gold and warm parchment colors',
  suitableFor: ['Healthcare', 'Wellness', 'Premium Services'],
  accessibility: 'WCAG AA compliant',
  colors: {
    primary: 'Luxury Gold',
    secondary: 'Warm Parchment',
    accent: 'Rich Gold',
  },
} as const;

export default SANCTUARY_HEALTH_THEME_NAME;
