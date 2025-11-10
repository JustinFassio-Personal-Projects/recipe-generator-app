/**
 * DaisyUI Silk Theme Configuration for Sanctuary Health
 *
 * This file documents the Silk theme colors used by the Sanctuary Health tenant.
 * The actual theme is applied via DaisyUI's built-in "silk" theme.
 *
 * DaisyUI Silk Theme Colors:
 * - Soft, professional color palette
 * - Excellent for healthcare and wellness applications
 * - High contrast for accessibility
 */

export const SILK_THEME_NAME = 'silk' as const;

/**
 * Silk theme color reference
 * These colors are automatically applied when data-theme="silk"
 *
 * Note: DaisyUI 5 uses the built-in silk theme.
 * Custom overrides can be added via the branding config in the database.
 */
export const silkThemeColors = {
  // Primary colors - Professional healthcare blue-green
  primary: '#4ade80', // Soft green
  'primary-content': '#000000',

  // Secondary colors
  secondary: '#60a5fa', // Calm blue
  'secondary-content': '#000000',

  // Accent
  accent: '#c084fc', // Soft purple
  'accent-content': '#000000',

  // Neutral
  neutral: '#1f2937',
  'neutral-content': '#ffffff',

  // Base colors - Clean, professional backgrounds
  'base-100': '#ffffff',
  'base-200': '#f3f4f6',
  'base-300': '#e5e7eb',
  'base-content': '#1f2937',

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
    'Professional, soft color palette perfect for healthcare applications',
  suitableFor: ['Healthcare', 'Wellness', 'Professional Services'],
  accessibility: 'WCAG AA compliant',
} as const;

export default SILK_THEME_NAME;
