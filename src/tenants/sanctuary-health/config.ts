/**
 * Sanctuary Health Tenant Configuration
 *
 * This file defines the local configuration for the Sanctuary Health tenant.
 * It provides a type-safe configuration that can override database settings
 * during development or serve as a template for production setup.
 */

import type { Tenant } from '@/lib/types';
import { SILK_THEME_NAME } from './theme/silk-theme';

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
    theme_name: SILK_THEME_NAME,
    primary_color: '#4ade80', // Soft green for health/wellness
    secondary_color: '#60a5fa', // Calm blue
    // logo_url: '/tenants/sanctuary-health/assets/logo.png', // Add when available
    // favicon_url: '/tenants/sanctuary-health/assets/favicon.ico', // Add when available
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
  features: ['Silk theme', 'Health-focused recipes', 'Detailed instructions'],
  setupDate: '2025-11-10',
} as const;

export default sanctuaryHealthConfig;
