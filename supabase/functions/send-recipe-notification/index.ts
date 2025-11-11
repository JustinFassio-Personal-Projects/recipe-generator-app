/**
 * Send Recipe Notification Edge Function
 * Notifies users when a new recipe is published
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import {
  errorResponse,
  handleCorsPreflightRequest,
  jsonResponse,
} from '../_shared/cors.ts';
import { getFrontendUrl } from '../_shared/email-renderer.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  try {
    // Parse request body
    const { recipeId, authorId } = await req.json();

    if (!recipeId || !authorId) {
      return errorResponse('Missing required fields: recipeId, authorId');
    }

    console.log(`Queueing recipe notification for recipe: ${recipeId}`);

    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get recipe details
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .select('*, profiles:user_id(*)')
      .eq('id', recipeId)
      .single();

    if (recipeError || !recipe) {
      return errorResponse('Recipe not found');
    }

    // Only send notifications for public recipes
    if (!recipe.is_public) {
      return jsonResponse({
        success: true,
        message: 'Recipe is not public, skipping notifications',
      });
    }

    // Get users who want recipe notifications (excluding the author)
    const { data: eligibleUsers, error: usersError } = await supabase.rpc(
      'get_users_for_email_type',
      {
        email_type_param: 'recipe_notification',
        tenant_id_param: recipe.tenant_id,
      }
    );

    if (usersError) {
      throw new Error(`Failed to get eligible users: ${usersError.message}`);
    }

    if (!eligibleUsers || eligibleUsers.length === 0) {
      return jsonResponse({
        success: true,
        message: 'No users to notify',
        queued: 0,
      });
    }

    // Filter out the author
    const recipientsToNotify = eligibleUsers.filter(
      (u: { user_id: string; email: string }) => u.user_id !== authorId
    );

    const baseUrl = getFrontendUrl();
    const recipeUrl = `${baseUrl}/recipe/${recipeId}`;

    // Queue emails for all eligible users
    const queueItems = recipientsToNotify.map((user: { user_id: string }) => ({
      type: 'recipe_notification',
      recipient_user_id: user.user_id,
      tenant_id: recipe.tenant_id,
      subject: `New Recipe: ${recipe.title}`,
      template_data: {
        recipeName: recipe.title,
        recipeDescription: recipe.description || '',
        recipeImage: recipe.image_url,
        authorName: recipe.profiles?.full_name || 'A community member',
        recipeUrl,
      },
      status: 'pending',
      scheduled_for: new Date().toISOString(),
    }));

    const { error: queueError } = await supabase
      .from('email_queue')
      .insert(queueItems);

    if (queueError) {
      throw new Error(`Failed to queue emails: ${queueError.message}`);
    }

    console.log(`Queued ${recipientsToNotify.length} recipe notifications`);

    return jsonResponse({
      success: true,
      message: 'Recipe notifications queued',
      queued: recipientsToNotify.length,
    });
  } catch (error) {
    console.error('Error queueing recipe notifications:', error);
    return errorResponse(
      error instanceof Error
        ? error.message
        : 'Failed to queue recipe notifications',
      500
    );
  }
});
