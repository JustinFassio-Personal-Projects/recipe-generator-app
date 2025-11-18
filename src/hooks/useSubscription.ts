import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthProvider';

export interface SubscriptionStatus {
  user_id: string;
  status: string;
  trial_end: string | null;
  current_period_end: string | null;
  has_access: boolean;
  is_in_trial: boolean;
  trial_ended: boolean;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  status: string;
  trial_start: string | null;
  trial_end: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Hook to get user's subscription status (simplified view)
 * CRITICAL FIX: Include user ID in query key to prevent cross-user cache contamination
 */
export function useSubscriptionStatus() {
  const { user } = useAuth();

  return useQuery<SubscriptionStatus | null>({
    queryKey: ['subscription-status', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return null;
      }

      const { data, error } = await supabase
        .from('user_subscription_status')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        // If no subscription exists, return null (not an error)
        if (error.code === 'PGRST116') {
          return null;
        }
        // If table doesn't exist, return null gracefully
        if (error.code === '42P01' || error.code === 'PGRST205') {
          if (import.meta.env.DEV) {
            console.warn(
              '[useSubscriptionStatus] Subscription table not found - migration may not be applied yet'
            );
          }
          return null;
        }
        if (import.meta.env.DEV) {
          console.error('[useSubscriptionStatus] Error:', error);
        }
        throw error;
      }

      return data;
    },
    enabled: !!user?.id, // Only run query when user is authenticated
    retry: false, // Don't retry if table doesn't exist
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes - subscription data changes infrequently
    gcTime: 1000 * 60, // Keep in memory for 1 minute (was cacheTime in React Query v4)
    refetchOnMount: 'always', // Always check on component mount to ensure fresh data after checkout
  });
}

/**
 * Hook to get user's full subscription details
 * CRITICAL FIX: Include user ID in query key to prevent cross-user cache contamination
 */
export function useSubscription() {
  const { user } = useAuth();

  return useQuery<UserSubscription | null>({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return null;
      }

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        // If table doesn't exist, return null gracefully
        if (error.code === '42P01' || error.code === 'PGRST205') {
          if (import.meta.env.DEV) {
            console.warn(
              '[useSubscription] Subscription table not found - migration may not be applied yet'
            );
          }
          return null;
        }
        if (import.meta.env.DEV) {
          console.error('[useSubscription] Error:', error);
        }
        throw error;
      }

      return data;
    },
    enabled: !!user?.id, // Only run query when user is authenticated
    retry: false, // Don't retry if table doesn't exist
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes - subscription data changes infrequently
    gcTime: 1000 * 60, // Keep in memory for 1 minute (was cacheTime in React Query v4)
    refetchOnMount: 'always', // Always check on component mount to ensure fresh data after checkout
  });
}

/**
 * Helper function to check if user has premium access
 */
export function useHasPremiumAccess() {
  const { data: status, isLoading } = useSubscriptionStatus();

  return {
    hasAccess: status?.has_access ?? false,
    isInTrial: status?.is_in_trial ?? false,
    isLoading,
    status: status?.status ?? 'none',
  };
}
