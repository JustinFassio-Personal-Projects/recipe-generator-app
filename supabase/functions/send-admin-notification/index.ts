/**
 * Send Admin Notification Edge Function
 * Sends system alerts and notifications to admin users
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import {
  errorResponse,
  handleCorsPreflightRequest,
  jsonResponse,
} from '../_shared/cors.ts';
import { createResendClient } from '../_shared/email-client.ts';
import {
  formatFromField,
  getTenantContext,
} from '../_shared/tenant-context.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  try {
    // Parse request body
    const { alertType, message, details, actionUrl, tenantId } =
      await req.json();

    if (!alertType || !message) {
      return errorResponse('Missing required fields: alertType, message');
    }

    console.log(`Sending admin notification: ${alertType}`);

    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get admin users
    const { data: adminProfiles, error: adminsError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('is_admin', true);

    if (adminsError) {
      throw new Error(`Failed to get admin users: ${adminsError.message}`);
    }

    if (!adminProfiles || adminProfiles.length === 0) {
      return jsonResponse({
        success: true,
        message: 'No admin users to notify',
      });
    }

    // Get admin users' emails and preferences
    const adminUsers = [];
    for (const profile of adminProfiles) {
      const { data: user } = await supabase.auth.admin.getUserById(profile.id);
      const { data: prefs } = await supabase
        .from('email_preferences')
        .select('admin_notifications')
        .eq('user_id', profile.id)
        .single();

      if (user?.user?.email && prefs?.admin_notifications !== false) {
        adminUsers.push({
          email: user.user.email,
          name: profile.full_name || 'Admin',
          userId: profile.id,
        });
      }
    }

    if (adminUsers.length === 0) {
      return jsonResponse({
        success: true,
        message: 'No admins with notifications enabled',
      });
    }

    // Get tenant context
    const tenantContext = tenantId
      ? await getTenantContext(tenantId)
      : {
          id: 'default',
          branding: { name: 'Recipe Generator' },
          emailConfig: {},
        };

    const { title, emoji, severity } = getAlertContent(alertType);

    // Create HTML content
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
</head>
<body style="font-family: monospace; background-color: #f6f9fc; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 40px;">
    <div style="background-color: ${getSeverityColor(severity)}; border: 2px solid ${getSeverityBorder(severity)}; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="font-weight: 600; margin: 0;">${emoji} ${title}</p>
    </div>
    
    <h2 style="color: #1a1a1a;">Admin Notification</h2>
    
    <p style="color: #525252; font-size: 16px; line-height: 24px;">${message}</p>
    
    ${
      details
        ? `
    <div style="background-color: #1a1a1a; color: #f6f9fc; padding: 16px; border-radius: 4px; margin: 24px 0; overflow-x: auto;">
      <pre style="margin: 0; font-size: 12px;">${JSON.stringify(details, null, 2)}</pre>
    </div>
    `
        : ''
    }
    
    ${
      actionUrl
        ? `
    <a href="${actionUrl}" style="display: inline-block; background-color: #6b4423; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin: 16px 0;">Take Action</a>
    `
        : ''
    }
    
    <p style="color: #8898aa; font-size: 12px; margin-top: 32px;">
      This is an automated notification sent to system administrators.
    </p>
    <p style="color: #8898aa; font-size: 11px; font-family: monospace; margin: 8px 0 0 0;">
      Sent: ${new Date().toISOString()}
    </p>
  </div>
</body>
</html>`;

    // Send emails to all admins
    const resendClient = createResendClient();
    let sentCount = 0;

    for (const admin of adminUsers) {
      try {
        const result = await resendClient.sendEmail({
          from: formatFromField(tenantContext),
          to: admin.email,
          subject: `[Admin] ${title}`,
          html: htmlContent,
          tags: [
            { name: 'type', value: 'admin_notification' },
            { name: 'alert_type', value: alertType },
          ],
        });

        if (result.success) {
          // Log the email
          await supabase.from('email_logs').insert({
            user_id: admin.userId,
            tenant_id: tenantId || null,
            recipient_email: admin.email,
            email_type: 'admin_notification',
            subject: `[Admin] ${title}`,
            status: 'sent',
            resend_id: result.id,
            metadata: details
              ? {
                  alert_type: alertType,
                  details,
                }
              : {
                  alert_type: alertType,
                },
          });

          sentCount++;
        }
      } catch (error) {
        console.error(`Failed to send to ${admin.email}:`, error);
      }
    }

    console.log(
      `Admin notifications sent to ${sentCount}/${adminUsers.length} admins`
    );

    return jsonResponse({
      success: true,
      message: 'Admin notifications sent',
      sent: sentCount,
      total: adminUsers.length,
    });
  } catch (error) {
    console.error('Error sending admin notification:', error);
    return errorResponse(
      error instanceof Error
        ? error.message
        : 'Failed to send admin notification',
      500
    );
  }
});

function getAlertContent(alertType: string) {
  switch (alertType) {
    case 'error':
      return { title: 'System Error', emoji: '🚨', severity: 'error' };
    case 'warning':
      return { title: 'Warning', emoji: '⚠️', severity: 'warning' };
    case 'info':
      return { title: 'Information', emoji: 'ℹ️', severity: 'info' };
    case 'new_user':
      return { title: 'New User Signup', emoji: '👤', severity: 'info' };
    case 'new_recipe':
      return { title: 'New Recipe Created', emoji: '🍳', severity: 'info' };
    case 'payment_issue':
      return { title: 'Payment Issue', emoji: '💳', severity: 'warning' };
    case 'security':
      return { title: 'Security Alert', emoji: '🔒', severity: 'error' };
    default:
      return { title: 'Notification', emoji: '📬', severity: 'info' };
  }
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'error':
      return '#fee';
    case 'warning':
      return '#fff4e6';
    default:
      return '#e6f4ff';
  }
}

function getSeverityBorder(severity: string): string {
  switch (severity) {
    case 'error':
      return '#dc2626';
    case 'warning':
      return '#f59e0b';
    default:
      return '#3b82f6';
  }
}
