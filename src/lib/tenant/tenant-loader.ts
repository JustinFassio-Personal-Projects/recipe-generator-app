/**
 * Tenant Configuration Loader
 *
 * This utility provides type-safe access to tenant configurations
 * and allows local config overrides for development.
 */

import type { Tenant } from '@/lib/types';
import sanctuaryHealthConfig from '@/tenants/sanctuary-health/config';

/**
 * Registry of available tenant configurations
 * Add new tenants here as they are created
 */
const TENANT_CONFIGS: Record<string, Partial<Tenant>> = {
  sanctuaryhealth: sanctuaryHealthConfig,
  // Add more tenants here as needed
  // 'another-tenant': anotherTenantConfig,
};

/**
 * Get local tenant configuration by subdomain
 *
 * @param subdomain - The tenant subdomain
 * @returns Tenant configuration or null if not found
 */
export function getLocalTenantConfig(
  subdomain: string
): Partial<Tenant> | null {
  return TENANT_CONFIGS[subdomain] || null;
}

/**
 * Check if a tenant has a local configuration
 *
 * @param subdomain - The tenant subdomain
 * @returns True if local config exists
 */
export function hasLocalConfig(subdomain: string): boolean {
  return subdomain in TENANT_CONFIGS;
}

/**
 * Get all registered tenant subdomains
 *
 * @returns Array of registered subdomain strings
 */
export function getRegisteredTenants(): string[] {
  return Object.keys(TENANT_CONFIGS);
}

/**
 * Merge database tenant config with local overrides
 *
 * Priority: Local config > Database config
 * This is useful for development where you want local
 * settings to override what's in the database.
 *
 * @param dbTenant - Tenant configuration from database
 * @param subdomain - Tenant subdomain
 * @returns Merged tenant configuration
 */
export function mergeTenantConfig(dbTenant: Tenant, subdomain: string): Tenant {
  const localConfig = getLocalTenantConfig(subdomain);

  if (!localConfig) {
    return dbTenant;
  }

  // Deep merge with local config taking precedence
  return {
    ...dbTenant,
    ...localConfig,
    branding: {
      ...dbTenant.branding,
      ...localConfig.branding,
    },
    settings: {
      ...dbTenant.settings,
      ...localConfig.settings,
    },
    ai_config: {
      ...dbTenant.ai_config,
      ...localConfig.ai_config,
    },
  };
}

/**
 * Get tenant theme name with fallback
 *
 * @param tenant - Tenant configuration
 * @returns Theme name or default 'caramellatte'
 */
export function getTenantTheme(tenant: Tenant | null): string {
  return tenant?.branding?.theme_name || 'caramellatte';
}

/**
 * Development helper: Enable local config override
 *
 * Set this to true in development to always use local configs
 * over database configs when available.
 */
export const USE_LOCAL_CONFIG_IN_DEV =
  import.meta.env.MODE === 'development' &&
  import.meta.env.VITE_USE_LOCAL_TENANT_CONFIG === 'true';

/**
 * Tenant configuration metadata
 */
export const tenantMetadata = {
  totalRegistered: getRegisteredTenants().length,
  registeredSubdomains: getRegisteredTenants(),
  lastUpdated: new Date().toISOString(),
} as const;

export default {
  getLocalTenantConfig,
  hasLocalConfig,
  getRegisteredTenants,
  mergeTenantConfig,
  getTenantTheme,
  USE_LOCAL_CONFIG_IN_DEV,
  tenantMetadata,
};
