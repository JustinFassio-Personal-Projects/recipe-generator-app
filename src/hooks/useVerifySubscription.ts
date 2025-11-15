import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface VerifySubscriptionRequest {
  session_id: string;
}

interface VerifySubscriptionResponse {
  success: boolean;
  subscription: {
    id: string;
    user_id: string;
    stripe_customer_id: string;
    stripe_subscription_id: string;
    status: string;
    trial_end: string | null;
    current_period_end: string;
  };
  message: string;
}

/**
 * Hook to verify and sync subscription from Stripe after checkout
 * This is a fallback for when webhooks don't fire (local dev) or are delayed
 */
export function useVerifySubscription() {
  return useMutation({
    mutationFn: async ({ session_id }: VerifySubscriptionRequest) => {
      // Get current session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('You must be logged in');
      }

      console.log(
        '[VerifySubscription] Calling verify endpoint with session:',
        session_id
      );

      // Call our API route to verify and sync subscription
      const response = await fetch('/api/stripe/verify-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ session_id }),
      });

      const responseText = await response.text();
      let data: VerifySubscriptionResponse;

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        console.error(
          '[VerifySubscription] Failed to parse response:',
          responseText
        );
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        const errorData = data as { error?: string; details?: string };
        const errorMessage = errorData.error || 'Failed to verify subscription';
        console.error('[VerifySubscription] API error:', errorData);
        throw new Error(errorMessage);
      }

      console.log('[VerifySubscription] Success:', data);
      return data;
    },
  });
}
