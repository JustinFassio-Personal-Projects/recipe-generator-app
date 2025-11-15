/**
 * CORS Headers Helper
 * Provides consistent CORS handling for Edge Functions
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

/**
 * Create a CORS preflight response
 */
export function handleCorsPreflightRequest(): Response {
  return new Response('ok', {
    headers: corsHeaders,
  });
}

/**
 * Add CORS headers to a response
 */
export function addCorsHeaders(response: Response): Response {
  const headers = new Headers(response.headers);

  for (const [key, value] of Object.entries(corsHeaders)) {
    headers.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Create a JSON response with CORS headers
 */
export function jsonResponse(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

/**
 * Create an error response with CORS headers
 */
export function errorResponse(message: string, status: number = 400): Response {
  return jsonResponse({ error: message }, status);
}
