import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { supabase } from '@/lib/supabase';
import type { Tenant } from '@/lib/types';

interface TenantContextType {
  tenant: Tenant | null;
  loading: boolean;
  error: string | null;
  isMainApp: boolean;
  refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

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

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const subdomain = getSubdomainFromClient();
  const isMainApp = !subdomain;

  const fetchTenant = useCallback(async () => {
    if (!subdomain) {
      // Main app - load default tenant
      try {
        const { data, error: fetchError } = await supabase
          .from('tenants')
          .select('*')
          .eq('subdomain', 'app')
          .single();

        if (fetchError) throw fetchError;
        setTenant(data);
      } catch (err) {
        console.error('Failed to load default tenant:', err);
        setError('Failed to load tenant configuration');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Tenant subdomain - fetch tenant config
    try {
      const { data, error: fetchError } = await supabase
        .from('tenants')
        .select('*')
        .eq('subdomain', subdomain)
        .eq('is_active', true)
        .maybeSingle(); // Use maybeSingle instead of single to avoid 406 errors

      if (fetchError) {
        console.error('Tenant fetch error:', fetchError);
        setError(`Failed to load tenant configuration: ${fetchError.message}`);
      } else if (!data) {
        setError(
          `Tenant "${subdomain}" not found. Please create this tenant in the admin panel first.`
        );
      } else {
        setTenant(data);
      }
    } catch (err) {
      console.error('Failed to load tenant:', err);
      setError('Failed to load tenant configuration');
    } finally {
      setLoading(false);
    }
  }, [subdomain]);

  useEffect(() => {
    fetchTenant();
  }, [fetchTenant]);

  // Apply tenant branding
  useEffect(() => {
    if (!tenant) return;

    const { branding } = tenant;

    // Apply theme if specified in branding
    if (branding?.theme_name) {
      document.documentElement.setAttribute('data-theme', branding.theme_name);
      localStorage.setItem('theme', branding.theme_name);
    } else {
      // Fallback to default caramellatte theme
      document.documentElement.setAttribute('data-theme', 'caramellatte');
      localStorage.setItem('theme', 'caramellatte');
    }

    // Apply primary color override (if provided)
    if (branding?.primary_color) {
      document.documentElement.style.setProperty(
        '--primary',
        branding.primary_color
      );
    }

    // Apply secondary color override (if provided)
    if (branding?.secondary_color) {
      document.documentElement.style.setProperty(
        '--secondary',
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
