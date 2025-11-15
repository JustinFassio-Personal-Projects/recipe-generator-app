import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { supabase } from '@/lib/supabase';
import type { Tenant } from '@/lib/types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('TenantProvider');

interface TenantContextType {
  tenant: Tenant | null;
  loading: boolean;
  error: string | null;
  isMainApp: boolean;
  refreshTenant: () => Promise<void>;
}

export const TenantContext = createContext<TenantContextType | undefined>(
  undefined
);

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}

function getSubdomainFromClient(): string | null {
  if (typeof window === 'undefined') return null;

  const hostname = window.location.hostname;
  const parts = hostname.split('.');

  // Local development: drsmith.localhost
  if (hostname.includes('localhost')) {
    return parts.length > 1 ? parts[0] : null;
  }

  // Production: drsmith.recipegenerator.app
  if (parts.length >= 3) {
    const subdomain = parts[0];
    return subdomain === 'www' || subdomain === 'app' ? null : subdomain;
  }

  return null;
}

/**
 * Creates a fallback tenant object for error/timeout scenarios
 * @param fallbackSubdomain - Optional subdomain to use (defaults to 'app')
 */
function createFallbackTenant(fallbackSubdomain?: string | null): Tenant {
  return {
    id: 'default',
    subdomain: fallbackSubdomain || 'app',
    name: 'Recipe Generator',
    is_active: true,
    branding: undefined,
    owner_id: '00000000-0000-0000-0000-000000000000',
    subscription_tier: 'starter',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const subdomain = getSubdomainFromClient();
  const isMainApp = !subdomain;

  const fetchTenant = useCallback(async () => {
    logger.debug('🏢 Fetching tenant for subdomain:', subdomain || 'app');

    // Set a timeout to prevent infinite loading
    const TENANT_FETCH_TIMEOUT = 10000; // 10 seconds
    const timeoutId = setTimeout(() => {
      logger.error('🏢 Tenant fetch timeout - using fallback');
      setLoading(false);
      // Use a default tenant if fetch times out
      setTenant(createFallbackTenant());
    }, TENANT_FETCH_TIMEOUT);

    try {
      if (!subdomain) {
        // Main app - load default tenant
        try {
          const queryPromise = supabase
            .from('tenants')
            .select('*')
            .eq('subdomain', 'app')
            .single();

          const { data, error: fetchError } = await queryPromise;

          clearTimeout(timeoutId);

          if (fetchError) {
            logger.error('Failed to load default tenant:', fetchError);
            // Use fallback tenant instead of error
            setTenant(createFallbackTenant());
          } else {
            logger.debug('🏢 Loaded main app tenant:', data);
            setTenant(data);
          }
        } catch (err) {
          clearTimeout(timeoutId);
          logger.error('Failed to load default tenant:', err);
          // Use fallback tenant instead of error
          setTenant(createFallbackTenant());
        } finally {
          setLoading(false);
        }
        return;
      }

      // Tenant subdomain - fetch tenant config
      try {
        const queryPromise = supabase
          .from('tenants')
          .select('*')
          .eq('subdomain', subdomain)
          .eq('is_active', true)
          .maybeSingle(); // Use maybeSingle instead of single to avoid 406 errors

        const { data, error: fetchError } = await queryPromise;

        clearTimeout(timeoutId);

        if (fetchError) {
          logger.error('Tenant fetch error:', fetchError);
          setError(
            `Failed to load tenant configuration: ${fetchError.message}`
          );
        } else if (!data) {
          logger.error(`🏢 Tenant "${subdomain}" not found in database`);
          setError(
            `Tenant "${subdomain}" not found. Please create this tenant in the admin panel first.`
          );
        } else {
          logger.debug('🏢 Loaded tenant:', data);
          setTenant(data);
        }
      } catch (err) {
        clearTimeout(timeoutId);
        logger.error('Failed to load tenant:', err);
        setError('Failed to load tenant configuration');
      } finally {
        setLoading(false);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      logger.error('Unexpected error in fetchTenant:', err);
      setLoading(false);
      // Use fallback tenant
      setTenant(createFallbackTenant(subdomain));
    }
  }, [subdomain]);

  useEffect(() => {
    fetchTenant();
  }, [fetchTenant]);

  // Apply tenant branding
  useEffect(() => {
    if (!tenant) return;

    const { branding } = tenant;

    logger.debug('🎨 Applying tenant branding:', {
      subdomain: tenant.subdomain,
      theme_name: branding?.theme_name,
      hasTheme: !!branding?.theme_name,
    });

    // Apply theme if specified in branding
    if (branding?.theme_name) {
      logger.debug(`🎨 Setting theme to: ${branding.theme_name}`);
      document.documentElement.setAttribute('data-theme', branding.theme_name);
      localStorage.setItem('theme', branding.theme_name);

      // Trigger style recalculation without hiding content
      // Modern browsers handle CSS custom property changes automatically,
      // but this ensures immediate application if needed
      void getComputedStyle(document.documentElement).getPropertyValue(
        '--color-primary'
      );

      logger.debug(
        '🎨 Theme applied:',
        document.documentElement.getAttribute('data-theme')
      );
    } else {
      // Fallback to default caramellatte theme
      logger.debug('🎨 No theme specified, using caramellatte');
      document.documentElement.setAttribute('data-theme', 'caramellatte');
      localStorage.setItem('theme', 'caramellatte');
    }

    // DEPRECATED: Color overrides via primary_color/secondary_color
    // These are kept for backward compatibility but should NOT be used with custom themes.
    // Instead, create a custom theme in src/index.css and set theme_name in the database.
    // Custom themes follow DaisyUI best practices and are easier for admins to manage.
    if (branding?.primary_color) {
      logger.warn(
        '⚠️ Using deprecated primary_color override. Consider creating a custom theme instead.'
      );
      document.documentElement.style.setProperty(
        '--color-primary',
        branding.primary_color
      );
    }

    if (branding?.secondary_color) {
      logger.warn(
        '⚠️ Using deprecated secondary_color override. Consider creating a custom theme instead.'
      );
      document.documentElement.style.setProperty(
        '--color-secondary',
        branding.secondary_color
      );
    }

    // Apply favicon
    if (branding?.favicon_url) {
      const link = document.querySelector(
        "link[rel*='icon']"
      ) as HTMLLinkElement;
      if (link) {
        link.href = branding.favicon_url;
      }
    }

    // Set document title
    document.title = tenant.name;
  }, [tenant]);

  return (
    <TenantContext.Provider
      value={{
        tenant,
        loading,
        error,
        isMainApp,
        refreshTenant: fetchTenant,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}
