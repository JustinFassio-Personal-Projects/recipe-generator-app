/**
 * Email Template Renderer
 * Converts React Email components to HTML strings
 *
 * Note: In production Edge Functions, we'll use the @react-email/render package
 * For now, we'll use a simplified approach that works with Deno
 */

import { render } from 'npm:@react-email/render@1.0.0';

export interface RenderOptions {
  pretty?: boolean;
}

/**
 * Render a React Email component to HTML string
 */
export async function renderEmail(
  component: React.ReactElement,
  options: RenderOptions = {}
): Promise<string> {
  try {
    const html = await render(component, {
      pretty: options.pretty ?? false,
    });

    return html;
  } catch (error) {
    console.error('Error rendering email template:', error);
    throw new Error(
      `Failed to render email template: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Render email to plain text (fallback for email clients that don't support HTML)
 */
export async function renderEmailAsText(
  component: React.ReactElement
): Promise<string> {
  try {
    const text = await render(component, {
      plainText: true,
    });

    return text;
  } catch (error) {
    console.error('Error rendering email as text:', error);
    // Return a basic fallback
    return 'Please view this email in an HTML-compatible email client.';
  }
}

/**
 * Helper to load and render email templates dynamically
 * This is useful for queueing emails where template data is stored in the database
 */
export interface TemplateData {
  templateName: string;
  props: Record<string, unknown>;
}

/**
 * Get the base URL for the frontend (used in email links)
 */
export function getFrontendUrl(): string {
  return Deno.env.get('FRONTEND_URL') || 'https://recipegenerator.app';
}

/**
 * Get the sender email address
 */
export function getSenderEmail(tenantDomain?: string): string {
  // Default sender
  const defaultSender = 'justin@recipegenerator.app';

  // For multi-tenant, could customize per tenant
  if (tenantDomain) {
    return `noreply@${tenantDomain}`;
  }

  return defaultSender;
}

/**
 * Build an unsubscribe URL for a given token
 */
export function buildUnsubscribeUrl(token: string): string {
  const baseUrl = getFrontendUrl();
  return `${baseUrl}/unsubscribe?token=${encodeURIComponent(token)}`;
}
