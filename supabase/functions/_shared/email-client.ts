/**
 * Resend Email Client Wrapper
 * Provides a typed interface for sending emails via Resend API
 */

export interface EmailOptions {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
}

export interface EmailResponse {
  id: string;
  success: boolean;
  error?: string;
}

export class ResendClient {
  private apiKey: string;
  private baseUrl = 'https://api.resend.com';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Resend API key is required');
    }
    this.apiKey = apiKey;
  }

  async sendEmail(options: EmailOptions): Promise<EmailResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          from: options.from,
          to: Array.isArray(options.to) ? options.to : [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text,
          reply_to: options.replyTo,
          tags: options.tags,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Resend API error:', data);
        return {
          id: '',
          success: false,
          error: data.message || 'Failed to send email',
        };
      }

      return {
        id: data.id,
        success: true,
      };
    } catch (error) {
      console.error('Error sending email:', error);
      return {
        id: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Verify that the API key is valid by making a test request
   */
  async verifyApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api-keys/verify`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error verifying API key:', error);
      return false;
    }
  }
}

/**
 * Create and return a configured Resend client instance
 */
export function createResendClient(): ResendClient {
  const apiKey = Deno.env.get('RESEND_API_KEY');

  if (!apiKey) {
    throw new Error(
      'RESEND_API_KEY environment variable is not set. Please configure it in Supabase Edge Function secrets.'
    );
  }

  return new ResendClient(apiKey);
}
