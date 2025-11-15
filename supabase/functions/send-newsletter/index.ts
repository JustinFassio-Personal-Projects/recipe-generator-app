/**
 * Send Newsletter Edge Function
 * Processes newsletter queue and sends emails in batches
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import {
  errorResponse,
  handleCorsPreflightRequest,
  jsonResponse,
} from '../_shared/cors.ts';
import { createResendClient } from '../_shared/email-client.ts';
import { buildUnsubscribeUrl } from '../_shared/email-renderer.ts';
import {
  formatFromField,
  getTenantContext,
} from '../_shared/tenant-context.ts';
import { getRateLimiter } from '../_shared/rate-limiter.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  try {
    // Parse request body
    const { campaignId, batchSize = 50 } = await req.json();

    if (!campaignId) {
      return errorResponse('Missing required field: campaignId');
    }

    console.log(`Processing newsletter campaign: ${campaignId}`);

    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('newsletter_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return errorResponse('Campaign not found');
    }

    // Get tenant context
    const tenantContext = await getTenantContext(campaign.tenant_id);

    // Get pending emails from queue for this campaign
    const { data: queueItems, error: queueError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('type', 'newsletter')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .limit(batchSize);

    if (queueError) {
      throw new Error(`Failed to fetch queue: ${queueError.message}`);
    }

    if (!queueItems || queueItems.length === 0) {
      return jsonResponse({
        success: true,
        message: 'No pending emails in queue',
        sent: 0,
      });
    }

    console.log(`Found ${queueItems.length} emails to send`);

    // Initialize rate limiter and email client
    const rateLimiter = getRateLimiter();
    const resendClient = createResendClient();

    let sentCount = 0;
    let failedCount = 0;

    // Process each queue item
    for (const item of queueItems) {
      try {
        // Wait if rate limit is reached
        await rateLimiter.waitIfNeeded();

        // Get user's email using Admin API
        const { data: userData, error: userError } =
          await supabase.auth.admin.getUserById(item.recipient_user_id);

        if (userError || !userData?.user || !userData.user.email) {
          console.warn(
            `User ${item.recipient_user_id} not found or has no email`
          );
          continue;
        }

        const user = userData.user;

        // Get unsubscribe token
        const { data: prefs } = await supabase
          .from('email_preferences')
          .select('unsubscribe_token')
          .eq('user_id', item.recipient_user_id)
          .single();

        const unsubscribeUrl = prefs
          ? buildUnsubscribeUrl(prefs.unsubscribe_token)
          : undefined;

        // Create HTML content (simplified version)
        const templateData = item.template_data as Record<string, unknown>;
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${campaign.title}</title>
</head>
<body style="font-family: sans-serif; background-color: #f6f9fc; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 40px;">
    <h1 style="color: #1a1a1a;">${campaign.title}</h1>
    <p style="color: #525252; font-size: 16px; line-height: 24px;">
      ${templateData.message || 'Check out our latest recipes and tips!'}
    </p>
    ${unsubscribeUrl ? `<p style="color: #8898aa; font-size: 12px; margin-top: 32px;"><a href="${unsubscribeUrl}">Unsubscribe</a></p>` : ''}
  </div>
</body>
</html>`;

        // Send email
        const result = await resendClient.sendEmail({
          from: formatFromField(tenantContext),
          to: user.email,
          subject: item.subject,
          html: htmlContent,
          tags: [
            { name: 'type', value: 'newsletter' },
            { name: 'campaign', value: campaignId },
          ],
        });

        if (result.success) {
          // Update queue status
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
            tenant_id: campaign.tenant_id,
            recipient_email: user.email,
            email_type: 'newsletter',
            subject: item.subject,
            status: 'sent',
            resend_id: result.id,
            metadata: { campaign_id: campaignId },
          });

          sentCount++;
          rateLimiter.recordSent();
        } else {
          throw new Error(result.error || 'Send failed');
        }
      } catch (error) {
        console.error(
          `Failed to send email to ${item.recipient_user_id}:`,
          error
        );
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

    // Update campaign stats
    await supabase
      .from('newsletter_campaigns')
      .update({
        sent_count: campaign.sent_count + sentCount,
        status: 'sending',
      })
      .eq('id', campaignId);

    console.log(
      `Newsletter batch complete: ${sentCount} sent, ${failedCount} failed`
    );

    return jsonResponse({
      success: true,
      message: 'Newsletter batch processed',
      sent: sentCount,
      failed: failedCount,
    });
  } catch (error) {
    console.error('Error processing newsletter:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to process newsletter',
      500
    );
  }
});
