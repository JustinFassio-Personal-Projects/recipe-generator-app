/**
 * Send Subscription Update Edge Function
 * Sends emails for subscription and payment events
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

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  try {
    // Parse request body
    const { userId, updateType, subscriptionDetails } = await req.json();

    if (!userId || !updateType) {
      return errorResponse('Missing required fields: userId, updateType');
    }

    console.log(
      `Sending subscription update email to user ${userId}: ${updateType}`
    );

    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user details
    const { data: user } = await supabase.auth.admin.getUserById(userId);

    if (!user || !user.user?.email) {
      return errorResponse('User not found or has no email');
    }

    // Check email preferences
    const { data: prefs } = await supabase
      .from('email_preferences')
      .select('subscription_updates')
      .eq('user_id', userId)
      .single();

    if (prefs && !prefs.subscription_updates) {
      return jsonResponse({
        success: true,
        message: 'User has opted out of subscription updates',
      });
    }

    // Get tenant context
    const tenantContext = await getTenantContextByUserId(userId);

    // Get user profile for name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();

    const userName = profile?.full_name || 'there';
    const baseUrl = getFrontendUrl();
    const manageUrl = `${baseUrl}/subscription`;

    // Get appropriate title and message for update type
    const { title, message, emoji } = getUpdateContent(updateType);

    // Create HTML content
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
</head>
<body style="font-family: sans-serif; background-color: #f6f9fc; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 40px;">
    <h1 style="color: #1a1a1a;">${emoji} ${title}</h1>
    <p style="color: #525252; font-size: 16px; line-height: 24px;">Hi ${userName},</p>
    <p style="color: #525252; font-size: 16px; line-height: 24px;">${message}</p>
    
    ${
      subscriptionDetails
        ? `
    <div style="background-color: #f6f9fc; border: 1px solid #e6ebf1; border-radius: 8px; padding: 24px; margin: 24px 0;">
      ${subscriptionDetails.plan ? `<p style="margin: 8px 0;"><strong>Plan:</strong> ${subscriptionDetails.plan}</p>` : ''}
      ${subscriptionDetails.amount && subscriptionDetails.currency ? `<p style="margin: 8px 0;"><strong>Amount:</strong> ${subscriptionDetails.currency}${subscriptionDetails.amount}${subscriptionDetails.interval ? ` per ${subscriptionDetails.interval}` : ''}</p>` : ''}
      ${subscriptionDetails.nextBillingDate ? `<p style="margin: 8px 0;"><strong>Next Billing Date:</strong> ${subscriptionDetails.nextBillingDate}</p>` : ''}
    </div>
    `
        : ''
    }
    
    <a href="${manageUrl}" style="display: inline-block; background-color: #6b4423; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin: 16px 0;">Manage Subscription</a>
    
    <p style="color: #525252; font-size: 16px; line-height: 24px; margin-top: 24px;">
      Thank you for being a valued member!<br>
      The ${tenantContext.branding.name} Team
    </p>
  </div>
</body>
</html>`;

    // Send email
    const resendClient = createResendClient();
    const result = await resendClient.sendEmail({
      from: formatFromField(tenantContext),
      to: user.user.email,
      subject: title,
      html: htmlContent,
      tags: [
        { name: 'type', value: 'subscription_update' },
        { name: 'update_type', value: updateType },
      ],
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to send email');
    }

    // Log the email
    await supabase.from('email_logs').insert({
      user_id: userId,
      tenant_id: tenantContext.id,
      recipient_email: user.user.email,
      email_type: 'subscription_update',
      subject: title,
      status: 'sent',
      resend_id: result.id,
      metadata: {
        update_type: updateType,
        subscription_details: subscriptionDetails,
      },
    });

    console.log(
      `Subscription update email sent successfully to ${user.user.email}`
    );

    return jsonResponse({
      success: true,
      message: 'Subscription update email sent successfully',
      emailId: result.id,
    });
  } catch (error) {
    console.error('Error sending subscription update:', error);
    return errorResponse(
      error instanceof Error
        ? error.message
        : 'Failed to send subscription update',
      500
    );
  }
});

function getUpdateContent(updateType: string) {
  switch (updateType) {
    case 'subscription_created':
      return {
        title: 'Welcome to Premium!',
        message:
          "Your subscription has been activated. You now have access to all premium features. Let's make the most of your membership!",
        emoji: '🎉',
      };
    case 'subscription_updated':
      return {
        title: 'Subscription Updated',
        message:
          'Your subscription has been successfully updated. The changes will take effect immediately.',
        emoji: '✅',
      };
    case 'subscription_cancelled':
      return {
        title: 'Subscription Cancelled',
        message:
          "We're sorry to see you go. Your subscription has been cancelled and you'll have access to premium features until the end of your billing period.",
        emoji: '👋',
      };
    case 'payment_succeeded':
      return {
        title: 'Payment Received',
        message:
          'Thank you! Your payment has been processed successfully. Your subscription continues uninterrupted.',
        emoji: '✅',
      };
    case 'payment_failed':
      return {
        title: 'Payment Failed',
        message:
          'We were unable to process your payment. Please update your payment method to continue enjoying premium features.',
        emoji: '⚠️',
      };
    case 'trial_ending':
      return {
        title: 'Trial Ending Soon',
        message:
          "Your free trial is ending soon. To continue enjoying premium features, you'll need to subscribe. We hope you've enjoyed your trial!",
        emoji: '⏰',
      };
    default:
      return {
        title: 'Subscription Update',
        message: 'There has been an update to your subscription.',
        emoji: '📬',
      };
  }
}
