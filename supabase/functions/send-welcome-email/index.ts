/**
 * Send Welcome Email Edge Function
 * Triggered when a new user signs up
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import {
  errorResponse,
  handleCorsPreflightRequest,
  jsonResponse,
} from '../_shared/cors.ts';
import { createResendClient } from '../_shared/email-client.ts';
import { getFrontendUrl } from '../_shared/email-renderer.ts';
import {
  formatFromField,
  getTenantContextByUserId,
} from '../_shared/tenant-context.ts';
import { isValidEmail } from '../_shared/email-validator.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  try {
    // Parse request body
    const { userId, email, fullName } = await req.json();

    // Validate inputs
    if (!userId || !email || !fullName) {
      return errorResponse('Missing required fields: userId, email, fullName');
    }

    if (!isValidEmail(email)) {
      return errorResponse('Invalid email address');
    }

    console.log(`Sending welcome email to ${email} (user: ${userId})`);

    // Get tenant context for branding
    const tenantContext = await getTenantContextByUserId(userId);

    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if user has email preferences (should be created by trigger)
    const { data: prefs } = await supabase
      .from('email_preferences')
      .select('welcome_emails')
      .eq('user_id', userId)
      .single();

    if (prefs && !prefs.welcome_emails) {
      console.log(`User ${userId} has opted out of welcome emails`);
      return jsonResponse({
        success: true,
        message: 'User has opted out of welcome emails',
      });
    }

    // Create simple HTML email content
    // In production, you'd import and render the React Email template
    const baseUrl = getFrontendUrl();
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${tenantContext.branding.name}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f6f9fc; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
    <div style="padding: 40px; text-align: center; border-bottom: 1px solid #e6ebf1;">
      <h1 style="color: #6b4423; font-size: 28px; margin: 0;">${tenantContext.branding.name}</h1>
    </div>
    <div style="padding: 40px;">
      <h2 style="color: #1a1a1a; font-size: 32px; margin: 0 0 16px 0;">Welcome, ${fullName}! 🎉</h2>
      <p style="color: #525252; font-size: 16px; line-height: 24px;">
        We're thrilled to have you join ${tenantContext.branding.name}. Get ready to discover, create, and share incredible recipes with our community.
      </p>
      <div style="margin: 32px 0;">
        <a href="${baseUrl}/recipes" style="display: inline-block; background-color: #6b4423; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600;">Get Started</a>
      </div>
      <h3 style="color: #1a1a1a; font-size: 20px; margin: 24px 0 16px 0;">What's Next?</h3>
      <div style="margin: 16px 0;">
        <p style="color: #1a1a1a; font-weight: 600; margin: 0 0 4px 0;">🍳 Create Your First Recipe</p>
        <p style="color: #666666; font-size: 14px; margin: 0;">Use our AI-powered chat to generate personalized recipes, or add your own family favorites.</p>
      </div>
      <div style="margin: 16px 0;">
        <p style="color: #1a1a1a; font-weight: 600; margin: 0 0 4px 0;">🛒 Build Your Shopping List</p>
        <p style="color: #666666; font-size: 14px; margin: 0;">Add ingredients to your virtual kitchen and get smart recipe suggestions.</p>
      </div>
      <div style="margin: 16px 0;">
        <p style="color: #1a1a1a; font-weight: 600; margin: 0 0 4px 0;">📱 Explore Recipes</p>
        <p style="color: #666666; font-size: 14px; margin: 0;">Browse our collection, filter by dietary preferences, and save your favorites.</p>
      </div>
      <p style="color: #525252; font-size: 16px; line-height: 24px; margin-top: 32px;">
        Happy cooking!<br>
        The ${tenantContext.branding.name} Team
      </p>
    </div>
    <div style="padding: 24px; border-top: 1px solid #e6ebf1; text-align: center;">
      <p style="color: #8898aa; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} ${tenantContext.branding.name}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

    // Send email via Resend
    const resendClient = createResendClient();
    const result = await resendClient.sendEmail({
      from: formatFromField(tenantContext),
      to: email,
      subject: `Welcome to ${tenantContext.branding.name}!`,
      html: htmlContent,
      tags: [
        { name: 'type', value: 'welcome' },
        { name: 'tenant', value: tenantContext.id },
      ],
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to send email');
    }

    // Log the email send
    await supabase.from('email_logs').insert({
      user_id: userId,
      tenant_id: tenantContext.id,
      recipient_email: email,
      email_type: 'welcome',
      subject: `Welcome to ${tenantContext.branding.name}!`,
      status: 'sent',
      resend_id: result.id,
      metadata: {
        full_name: fullName,
      },
    });

    console.log(`Welcome email sent successfully to ${email}`);

    return jsonResponse({
      success: true,
      message: 'Welcome email sent successfully',
      emailId: result.id,
    });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to send welcome email',
      500
    );
  }
});
