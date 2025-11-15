/**
 * Tenant Context Utilities
 * Handles tenant-specific configuration and branding for emails
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

export interface TenantBranding {
  name: string;
  logo?: string;
  primaryColor?: string;
  domain?: string;
}

export interface TenantEmailConfig {
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  footerText?: string;
}

export interface TenantContext {
  id: string;
  subdomain: string;
  branding: TenantBranding;
  emailConfig: TenantEmailConfig;
}

/**
 * Default tenant configuration
 */
const DEFAULT_TENANT: TenantContext = {
  id: 'default',
  subdomain: 'app',
  branding: {
    name: 'Recipe Generator',
    logo: undefined,
    primaryColor: '#6b4423',
    domain: 'recipegenerator.app',
  },
  emailConfig: {
    fromName: 'Recipe Generator',
    fromEmail: 'justin@recipegenerator.app',
    replyTo: 'justin@recipegenerator.app',
  },
};

/**
 * Get tenant context from database
 */
export async function getTenantContext(
  tenantId: string
): Promise<TenantContext> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('id, subdomain, name, branding, settings')
      .eq('id', tenantId)
      .single();

    if (error || !tenant) {
      console.warn(`Tenant ${tenantId} not found, using default`);
      return DEFAULT_TENANT;
    }

    // Parse branding and email config
    const branding =
      (tenant.branding as Partial<TenantBranding>) ||
      ({} as Partial<TenantBranding>);
    const settings = (tenant.settings as Record<string, unknown>) || {};
    const emailConfig =
      (settings.email as Partial<TenantEmailConfig>) ||
      ({} as Partial<TenantEmailConfig>);

    return {
      id: tenant.id,
      subdomain: tenant.subdomain,
      branding: {
        name: tenant.name || branding.name || DEFAULT_TENANT.branding.name,
        logo: branding.logo,
        primaryColor:
          branding.primaryColor || DEFAULT_TENANT.branding.primaryColor,
        domain: branding.domain || `${tenant.subdomain}.recipegenerator.app`,
      },
      emailConfig: {
        fromName:
          emailConfig.fromName ||
          tenant.name ||
          DEFAULT_TENANT.emailConfig.fromName,
        fromEmail:
          emailConfig.fromEmail || DEFAULT_TENANT.emailConfig.fromEmail,
        replyTo: emailConfig.replyTo || DEFAULT_TENANT.emailConfig.replyTo,
        footerText: emailConfig.footerText,
      },
    };
  } catch (error) {
    console.error('Error fetching tenant context:', error);
    return DEFAULT_TENANT;
  }
}

/**
 * Get tenant context by user ID
 */
export async function getTenantContextByUserId(
  userId: string
): Promise<TenantContext> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', userId)
      .single();

    if (error || !profile || !profile.tenant_id) {
      return DEFAULT_TENANT;
    }

    return await getTenantContext(profile.tenant_id);
  } catch (error) {
    console.error('Error fetching tenant context by user ID:', error);
    return DEFAULT_TENANT;
  }
}

/**
 * Format the "from" field for emails
 */
export function formatFromField(context: TenantContext): string {
  const fromName = context.emailConfig.fromName || context.branding.name;
  const fromEmail =
    context.emailConfig.fromEmail || DEFAULT_TENANT.emailConfig.fromEmail;

  return `${fromName} <${fromEmail}>`;
}

/**
 * Get reply-to address
 */
export function getReplyToAddress(context: TenantContext): string {
  return (
    context.emailConfig.replyTo ||
    context.emailConfig.fromEmail ||
    DEFAULT_TENANT.emailConfig.replyTo!
  );
}
