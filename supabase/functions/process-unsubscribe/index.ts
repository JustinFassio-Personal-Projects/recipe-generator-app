/**
 * Process Unsubscribe Edge Function
 * Handles unsubscribe requests via token
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import {
  errorResponse,
  handleCorsPreflightRequest,
  jsonResponse,
} from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  try {
    // Parse request body
    const { token } = await req.json();

    if (!token) {
      return errorResponse('Missing required field: token');
    }

    console.log(
      `Processing unsubscribe request for token: ${token.substring(0, 10)}...`
    );

    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Use the database function to validate and process unsubscribe
    const { data, error } = await supabase.rpc('validate_unsubscribe_token', {
      token,
    });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return errorResponse('Invalid or expired unsubscribe token', 404);
    }

    const result = data[0];

    if (!result.success) {
      return errorResponse(result.message || 'Failed to unsubscribe', 400);
    }

    console.log(`Successfully unsubscribed user ${result.user_id}`);

    return jsonResponse({
      success: true,
      message:
        result.message || 'Successfully unsubscribed from marketing emails',
      userId: result.user_id,
    });
  } catch (error) {
    console.error('Error processing unsubscribe:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to process unsubscribe',
      500
    );
  }
});
