/**
 * Process Email Queue Edge Function
 * Cron job that processes pending emails from the queue
 * Schedule: Every 15 minutes via Supabase Cron
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { jsonResponse, errorResponse } from '../_shared/cors.ts';
import { createResendClient } from '../_shared/email-client.ts';
import { buildUnsubscribeUrl } from '../_shared/email-renderer.ts';
import {
  formatFromField,
  getTenantContext,
} from '../_shared/tenant-context.ts';
import { getRateLimiter } from '../_shared/rate-limiter.ts';

Deno.serve(async () => {
  try {
    console.log('Starting email queue processing...');

    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get pending emails (limit to 50 per batch)
    const { data: queueItems, error: queueError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .lt('attempts', 5) // Max 5 attempts
      .order('created_at', { ascending: true })
      .limit(50);

    if (queueError) {
      throw new Error(`Failed to fetch queue: ${queueError.message}`);
    }

    if (!queueItems || queueItems.length === 0) {
      console.log('No pending emails to process');
      return jsonResponse({
        success: true,
        message: 'No pending emails',
        processed: 0,
      });
    }

    console.log(`Found ${queueItems.length} emails to process`);

    const rateLimiter = getRateLimiter();
    const resendClient = createResendClient();

    let sentCount = 0;
    let failedCount = 0;

    for (const item of queueItems) {
      try {
        // Wait if rate limit reached
        await rateLimiter.waitIfNeeded();

        // Get user email
        const { data: userData } = await supabase.auth.admin.getUserById(
          item.recipient_user_id
        );

        if (!userData?.user?.email) {
          console.warn(
            `User ${item.recipient_user_id} not found or has no email`
          );
          // Mark as failed
          await supabase
            .from('email_queue')
            .update({ status: 'failed', error_message: 'User not found' })
            .eq('id', item.id);
          failedCount++;
          continue;
        }

        // Get email preferences
        const { data: prefs } = await supabase
          .from('email_preferences')
          .select('*')
          .eq('user_id', item.recipient_user_id)
          .single();

        // Check if user has opted out of this email type
        if (prefs) {
          const preference = prefs[`${item.type}s` as keyof typeof prefs]; // e.g., newsletters, recipe_notifications
          if (preference === false) {
            console.log(
              `User ${item.recipient_user_id} has opted out of ${item.type}`
            );
            // Mark as sent (skip)
            await supabase
              .from('email_queue')
              .update({ status: 'sent', sent_at: new Date().toISOString() })
              .eq('id', item.id);
            sentCount++;
            continue;
          }
        }

        // Get tenant context
        const { data: profile } = await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('id', item.recipient_user_id)
          .single();

        const tenantContext = profile?.tenant_id
          ? await getTenantContext(profile.tenant_id)
          : null;

        // Build unsubscribe URL
        const unsubscribeUrl = prefs
          ? buildUnsubscribeUrl(prefs.unsubscribe_token)
          : '';

        // Create simple HTML email
        const templateData = item.template_data as Record<string, unknown>;
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${item.subject}</title>
</head>
<body style="font-family: sans-serif; background-color: #f6f9fc; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 40px;">
    <h1 style="color: #1a1a1a;">${item.subject}</h1>
    <p style="color: #525252; font-size: 16px; line-height: 24px;">
      ${templateData.message || 'New content from Recipe Generator'}
    </p>
    ${templateData.actionUrl ? `<a href="${templateData.actionUrl}" style="display: inline-block; background-color: #6b4423; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin: 16px 0;">View Now</a>` : ''}
    ${unsubscribeUrl ? `<p style="color: #8898aa; font-size: 12px; margin-top: 32px;"><a href="${unsubscribeUrl}">Unsubscribe</a></p>` : ''}
  </div>
</body>
</html>`;

        // Send email
        const result = await resendClient.sendEmail({
          from: tenantContext
            ? formatFromField(tenantContext)
            : 'Recipe Generator <justin@recipegenerator.app>',
          to: userData.user.email,
          subject: item.subject,
          html: htmlContent,
          tags: [
            { name: 'type', value: item.type },
            { name: 'queue_item', value: item.id },
          ],
        });

        if (result.success) {
          // Update queue
          await supabase
            .from('email_queue')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
            })
            .eq('id', item.id);

          // Log email
          await supabase.from('email_logs').insert({
            user_id: item.recipient_user_id,
            tenant_id: item.tenant_id,
            recipient_email: userData.user.email,
            email_type: item.type,
            subject: item.subject,
            status: 'sent',
            resend_id: result.id,
            metadata: templateData,
          });

          sentCount++;
          rateLimiter.recordSent();
        } else {
          throw new Error(result.error || 'Send failed');
        }
      } catch (error) {
        console.error(`Failed to process email ${item.id}:`, error);
        failedCount++;

        // Update queue with error
        await supabase
          .from('email_queue')
          .update({
            status: item.attempts >= 4 ? 'failed' : 'pending',
            attempts: item.attempts + 1,
            error_message:
              error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', item.id);
      }
    }

    console.log(
      `Queue processing complete: ${sentCount} sent, ${failedCount} failed`
    );

    return jsonResponse({
      success: true,
      message: 'Queue processed',
      sent: sentCount,
      failed: failedCount,
      total: queueItems.length,
    });
  } catch (error) {
    console.error('Error processing email queue:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to process queue',
      500
    );
  }
});
