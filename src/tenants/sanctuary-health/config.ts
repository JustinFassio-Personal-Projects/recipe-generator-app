/**
 * Sanctuary Health Tenant Configuration
 *
 * This file defines the local configuration for the Sanctuary Health tenant.
 * It provides a type-safe configuration that can override database settings
 * during development or serve as a template for production setup.
 */

import type { Tenant } from '@/lib/types';
import { SANCTUARY_HEALTH_THEME_NAME } from './theme/sanctuary-health-theme';

/**
 * Sanctuary Health tenant configuration
 *
 * This configuration is used for:
 * 1. Local development overrides
 * 2. Documentation of tenant settings
 * 3. Template for database configuration
 */
export const sanctuaryHealthConfig: Partial<Tenant> = {
  subdomain: 'sanctuaryhealth',
  name: 'Sanctuary Health',

  // Theme and branding
  branding: {
    // Custom Sanctuary Health theme with gold/parchment colors
    // Theme is defined in src/index.css - no color overrides needed
    theme_name: SANCTUARY_HEALTH_THEME_NAME,
    logo_url: '/tenants/sanctuaryhealth/logo.svg',
    favicon_url: '/tenants/sanctuaryhealth/logo.svg',
  },

  // Tenant-specific settings
  settings: {
    specialty: 'General Health & Wellness',
    // restricted_ingredients: [], // Add any restrictions if needed
    instruction_style: 'detailed', // Detailed instructions for health-conscious users
    default_units: 'imperial', // US-based healthcare typically uses imperial
  },

  // AI configuration (optional)
  ai_config: {
    // system_prompt_override: 'You are a health-focused recipe assistant...',
    // persona_overrides: {},
  },

  subscription_tier: 'pro',
  is_active: true,
};

/**
 * Tenant metadata for internal use
 */
export const sanctuaryHealthMetadata = {
  displayName: 'Sanctuary Health',
  description: 'Health and wellness focused recipe platform',
  targetAudience: 'Health-conscious individuals and families',
  features: [
    'Sanctuary Health theme (gold/parchment)',
    'Health-focused recipes',
    'Detailed instructions',
  ],
  setupDate: '2025-11-10',
} as const;

export default sanctuaryHealthConfig;
