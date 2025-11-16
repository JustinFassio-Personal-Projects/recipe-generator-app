import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface PortalResponse {
  url: string;
  sessionId: string;
}

/**
 * Hook to create Stripe Customer Portal session and redirect user
 *
 * The Customer Portal allows users to:
 * - Cancel their subscription
 * - Update payment methods
 * - View billing history
 * - Download invoices
 *
 * Usage:
 * ```tsx
 * const { mutate: openPortal, isPending } = useCustomerPortal();
 *
 * <Button onClick={() => openPortal()} disabled={isPending}>
 *   {isPending ? 'Loading...' : 'Manage Subscription'}
 * </Button>
 * ```
 */
export function useCustomerPortal() {
  return useMutation({
    mutationFn: async () => {
      console.log('[CustomerPortal] Creating portal session...');

      // Get current session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error('[CustomerPortal] No valid session found');
        throw new Error('You must be logged in to access the customer portal');
      }

      console.log('[CustomerPortal] User authenticated:', session.user?.email);

      // Call API to create portal session
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log('[CustomerPortal] API response status:', response.status);

      // Parse response
      const responseText = await response.text();
      let responseData: PortalResponse | { error?: string; details?: string };

      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error(
          '[CustomerPortal] Failed to parse JSON response:',
          parseError
        );
        console.error('[CustomerPortal] Response text:', responseText);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        console.error('[CustomerPortal] API error:', responseData);
        const errorData = responseData as { error?: string; details?: string };

        // Build detailed error message
        let errorMessage = errorData.error || 'Failed to create portal session';
        if (errorData.details) {
          errorMessage += `: ${errorData.details}`;
        }

        // Special handling for no subscription error
        if (response.status === 404) {
          throw new Error(
            'No active subscription found. Please subscribe first before accessing the customer portal.'
          );
        }

        throw new Error(errorMessage);
      }

      console.log('[CustomerPortal] ✅ Portal session created successfully');
      return responseData as PortalResponse;
    },
    onSuccess: (data) => {
      // Redirect to Stripe Customer Portal
      console.log('[CustomerPortal] Redirecting to portal:', data.url);
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('[CustomerPortal] No URL in response');
        throw new Error('No portal URL received from server');
      }
    },
    onError: (error) => {
      console.error('[CustomerPortal] Error:', error);
      // Error will be displayed by the UI component
    },
  });
}
