/**
 * DaisyUI Silk Theme Configuration
 *
 * This file documents the Silk theme colors.
 * The actual theme is defined in src/index.css.
 *
 * NOTE: Sanctuary Health now uses its own custom theme (sanctuary-health)
 * instead of the Silk theme. This file is kept for reference.
 *
 * DaisyUI Silk Theme Colors:
 * - Dark theme with professional color palette
 * - Excellent for healthcare and wellness applications
 * - High contrast for accessibility
 * - Dark backgrounds with green/blue accents
 */

export const SILK_THEME_NAME = 'silk' as const;

/**
 * Silk theme color reference
 * These colors are automatically applied when data-theme="silk"
 *
 * Note: The actual theme uses OKLCH color format in CSS.
 * These hex values are approximate conversions for reference.
 */
export const silkThemeColors = {
  // Primary colors - Professional healthcare green
  primary: '#4ade80', // Soft green (oklch(68% 0.162 75.834))
  'primary-content': '#ffffff', // Light text on primary

  // Secondary colors
  secondary: '#60a5fa', // Calm blue (oklch(44% 0.011 73.639))
  'secondary-content': '#ffffff', // Light text on secondary

  // Accent
  accent: '#c084fc', // Soft purple (oklch(54% 0.245 262.881))
  'accent-content': '#ffffff', // Light text on accent

  // Neutral
  neutral: '#1f2937', // Dark gray (oklch(26% 0.007 34.298))
  'neutral-content': '#ffffff', // Light text on neutral

  // Base colors - Dark professional backgrounds
  // Note: Actual CSS uses oklch(14% 0.004 49.25) which is very dark
  'base-100': '#1a1a1a', // Very dark background (~14% lightness)
  'base-200': '#2a2a2a', // Slightly lighter dark (~21% lightness)
  'base-300': '#3a3a3a', // Medium dark (~26% lightness)
  'base-content': '#f5f5f5', // Light text on dark background (~97% lightness)

  // Semantic colors
  info: '#3b82f6',
  'info-content': '#ffffff',
  success: '#22c55e',
  'success-content': '#ffffff',
  warning: '#f59e0b',
  'warning-content': '#000000',
  error: '#ef4444',
  'error-content': '#ffffff',
} as const;

/**
 * Theme metadata
 */
export const silkThemeMetadata = {
  name: 'Silk',
  description:
    'Professional dark theme with soft color accents, perfect for healthcare applications',
  suitableFor: ['Healthcare', 'Wellness', 'Professional Services'],
  accessibility: 'WCAG AA compliant',
  colorScheme: 'dark' as const,
} as const;

export default SILK_THEME_NAME;
