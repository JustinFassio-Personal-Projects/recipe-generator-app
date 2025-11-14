/**
 * Centralized theme management utility
 *
 * This module provides a single source of truth for theme initialization
 * and management across the application.
 *
 * Supports multiple DaisyUI themes for multi-tenant customization.
 */

// Default theme for main application
export const DEFAULT_THEME_NAME = 'caramellatte' as const;

// Legacy export for backward compatibility
export const THEME_NAME = DEFAULT_THEME_NAME;

/**
 * Available DaisyUI themes in the application
 * Add new themes here as they are configured
 */
export const AVAILABLE_THEMES = {
  caramellatte: 'caramellatte',
  silk: 'silk',
  'sanctuary-health': 'sanctuary-health',
} as const;

export type ThemeName = keyof typeof AVAILABLE_THEMES;

/**
 * Theme Management Architecture
 *
 * IMPORTANT: Themes are purely database-driven. The actual theme for each tenant
 * is stored in the `tenants.branding.theme_name` database field and applied
 * automatically by TenantProvider at runtime.
 *
 * To add a new tenant theme:
 * 1. Define the theme CSS in src/index.css using [data-theme='theme-name']
 * 2. Add the theme to AVAILABLE_THEMES constant above
 * 3. Set the theme_name in the tenant's branding column in the database
 *    (via Admin Panel → Tenant Settings)
 *
 * No code changes are needed to change a tenant's theme - just update the database!
 *
 * @see TenantContext.tsx - Handles all theme initialization from database
 */

/**
 * Initialize the DaisyUI theme by setting the data-theme attribute
 * and storing the theme preference in localStorage
 *
 * NOTE: This function is for manual theme management only.
 * In the multi-tenant app, theme initialization is handled automatically
 * by TenantProvider based on the tenant's database configuration.
 *
 * @param themeName - The theme to initialize (defaults to caramellatte)
 * @param debug - Whether to log debug information
 */
export function initializeTheme(
  themeName: string = DEFAULT_THEME_NAME,
  debug: boolean = false
): void {
  // Validate theme name
  const validTheme = isValidTheme(themeName) ? themeName : DEFAULT_THEME_NAME;

  // Set the theme on the document element
  document.documentElement.setAttribute('data-theme', validTheme);

  // Store theme preference in localStorage for persistence
  localStorage.setItem('theme', validTheme);

  if (debug) {
    console.log(`Theme initialized: ${validTheme}`);
    if (validTheme !== themeName) {
      console.warn(
        `Invalid theme "${themeName}" provided, using default: ${validTheme}`
      );
    }
    console.log(
      'Current theme attribute:',
      document.documentElement.getAttribute('data-theme')
    );
    console.log('Stored theme preference:', localStorage.getItem('theme'));
  }
}

/**
 * Check if a theme name is valid
 *
 * @param themeName - The theme name to validate
 * @returns True if the theme is registered in AVAILABLE_THEMES
 */
export function isValidTheme(themeName: string): boolean {
  return Object.keys(AVAILABLE_THEMES).includes(themeName);
}

/**
 * Get the current active theme
 *
 * @returns The currently active theme name
 */
export function getCurrentTheme(): string | null {
  return document.documentElement.getAttribute('data-theme');
}

/**
 * Get the stored theme preference from localStorage
 *
 * @returns The stored theme preference or null if not set
 */
export function getStoredTheme(): string | null {
  return localStorage.getItem('theme');
}

/**
 * Apply the caramellatte theme with debug logging
 * This is a convenience function for the current fixed theme setup
 */
export function applyCaramellatteTheme(): void {
  initializeTheme(THEME_NAME, true);

  // Additional debug info for caramellatte theme
  console.log('Caramellatte theme applied globally');
  console.log(
    'Background color:',
    getComputedStyle(document.body).backgroundColor
  );
}

// ========================================
// FONT SIZE MANAGEMENT (Future Implementation)
// ========================================

export type FontSize = 'small' | 'medium' | 'large' | 'extra-large';

export const FONT_SIZE_CLASSES = {
  small: 'text-sm',
  medium: 'text-base', // Default
  large: 'text-lg',
  'extra-large': 'text-xl',
} as const;

/**
 * Future implementation for older adults (60+)
 * Apply font size settings across the application
 *
 * @param fontSize - The font size to apply
 */
export function applyFontSize(fontSize: FontSize): void {
  // TODO: Implement font size application
  // This will be used by AccessibilityProvider in the future

  // Store preference
  localStorage.setItem('font-size', fontSize);

  // Apply CSS classes or CSS custom properties
  // document.documentElement.style.setProperty('--base-font-size', getFontSizeValue(fontSize));

  console.log(`Font size preference saved: ${fontSize}`);
}

/**
 * Get the stored font size preference
 *
 * @returns The stored font size or default 'medium'
 */
export function getStoredFontSize(): FontSize {
  const stored = localStorage.getItem('font-size') as FontSize;
  return stored && Object.keys(FONT_SIZE_CLASSES).includes(stored)
    ? stored
    : 'medium';
}
