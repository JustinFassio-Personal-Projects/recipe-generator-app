import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface CheckoutResponse {
  sessionId: string;
  url: string;
}

/**
 * Hook to create a Stripe checkout session and redirect user
 */
export function useCreateCheckout() {
  return useMutation({
    mutationFn: async () => {
      // Get current session
      console.log('[Checkout] Fetching session...');
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      console.log('[Checkout] Session exists:', !!session);
      console.log('[Checkout] Session error:', sessionError);

      if (sessionError || !session) {
        console.error('[Checkout] No valid session found');
        throw new Error('You must be logged in to subscribe');
      }

      console.log('[Checkout] User email:', session.user?.email);
      console.log('[Checkout] Calling API...');

      // Call our API route to create checkout session
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log('[Checkout] API response status:', response.status);

      // Safely parse response - handle empty or invalid JSON
      let responseData:
        | CheckoutResponse
        | { error?: string; details?: string; debug?: unknown };
      const responseText = await response.text();

      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('[Checkout] Failed to parse JSON response:', parseError);
        console.error('[Checkout] Response text:', responseText);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        console.error('[Checkout] API error:', responseData);
        const errorData = responseData as {
          error?: string;
          details?: string;
          missingVariables?: string[];
          debug?: unknown;
        };

        // Build detailed error message
        let errorMessage =
          errorData.error || 'Failed to create checkout session';
        if (errorData.details) {
          errorMessage += `: ${errorData.details}`;
        }
        if (
          errorData.missingVariables &&
          errorData.missingVariables.length > 0
        ) {
          errorMessage += `\nMissing variables: ${errorData.missingVariables.join(', ')}`;
        }

        console.error('[Checkout] Full error details:', {
          error: errorData.error,
          details: errorData.details,
          missingVariables: errorData.missingVariables,
          debug: errorData.debug,
        });

        throw new Error(errorMessage);
      }

      console.log('[Checkout] Success! Redirecting to Stripe...');
      return responseData as CheckoutResponse;
    },
    onSuccess: (data) => {
      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });
}
