/**
 * Send Cooking Reminder Edge Function
 * Sends scheduled cooking reminders to users
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import {
  errorResponse,
  handleCorsPreflightRequest,
  jsonResponse,
} from '../_shared/cors.ts';
import { createResendClient } from '../_shared/email-client.ts';
import {
  getFrontendUrl,
  buildUnsubscribeUrl,
} from '../_shared/email-renderer.ts';
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
    const { userId, recipeId } = await req.json();

    if (!userId || !recipeId) {
      return errorResponse('Missing required fields: userId, recipeId');
    }

    console.log(
      `Sending cooking reminder to user ${userId} for recipe ${recipeId}`
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
      .select('cooking_reminders, unsubscribe_token')
      .eq('user_id', userId)
      .single();

    if (prefs && !prefs.cooking_reminders) {
      return jsonResponse({
        success: true,
        message: 'User has opted out of cooking reminders',
      });
    }

    // Get recipe details
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .select('title, image_url, cooking_time, instructions')
      .eq('id', recipeId)
      .single();

    if (recipeError || !recipe) {
      return errorResponse('Recipe not found');
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
    const recipeUrl = `${baseUrl}/recipe/${recipeId}`;
    const unsubscribeUrl = prefs
      ? buildUnsubscribeUrl(prefs.unsubscribe_token)
      : '';

    // Create HTML content
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Time to Cook!</title>
</head>
<body style="font-family: sans-serif; background-color: #f6f9fc; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 40px;">
    <h1 style="color: #1a1a1a;">Time to Cook! ⏰</h1>
    <p style="color: #525252; font-size: 16px; line-height: 24px;">
      Hi ${userName}, just a friendly reminder that you planned to make this recipe today:
    </p>
    <div style="border: 1px solid #e6ebf1; border-radius: 8px; padding: 16px; margin: 24px 0;">
      ${recipe.image_url ? `<img src="${recipe.image_url}" alt="${recipe.title}" style="width: 100%; border-radius: 4px; margin-bottom: 12px;">` : ''}
      <h2 style="color: #1a1a1a; font-size: 20px; margin: 0 0 8px 0;">${recipe.title}</h2>
      ${recipe.cooking_time ? `<p style="color: #8898aa; font-size: 14px; margin: 0;">⏱️ ${recipe.cooking_time}</p>` : ''}
    </div>
    <a href="${recipeUrl}" style="display: inline-block; background-color: #6b4423; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin: 16px 0;">View Recipe</a>
    <p style="color: #525252; font-size: 16px; line-height: 24px; margin-top: 24px;">
      Have all your ingredients ready? Let's get cooking!
    </p>
    <p style="color: #525252; font-size: 16px; line-height: 24px;">
      Happy cooking!<br>
      The ${tenantContext.branding.name} Team
    </p>
    ${unsubscribeUrl ? `<p style="color: #8898aa; font-size: 12px; margin-top: 32px;"><a href="${unsubscribeUrl}">Unsubscribe from cooking reminders</a></p>` : ''}
  </div>
</body>
</html>`;

    // Send email
    const resendClient = createResendClient();
    const result = await resendClient.sendEmail({
      from: formatFromField(tenantContext),
      to: user.user.email,
      subject: `Time to cook: ${recipe.title}`,
      html: htmlContent,
      tags: [
        { name: 'type', value: 'cooking_reminder' },
        { name: 'recipe', value: recipeId },
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
      email_type: 'cooking_reminder',
      subject: `Time to cook: ${recipe.title}`,
      status: 'sent',
      resend_id: result.id,
      metadata: {
        recipe_id: recipeId,
        recipe_title: recipe.title,
      },
    });

    console.log(`Cooking reminder sent successfully to ${user.user.email}`);

    return jsonResponse({
      success: true,
      message: 'Cooking reminder sent successfully',
      emailId: result.id,
    });
  } catch (error) {
    console.error('Error sending cooking reminder:', error);
    return errorResponse(
      error instanceof Error
        ? error.message
        : 'Failed to send cooking reminder',
      500
    );
  }
});
