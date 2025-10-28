import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import type { Profile } from '@/lib/types';

export type WelcomeFlowType =
  | 'first-time'
  | 'welcome-back'
  | 'quick-nav'
  | 'chat-recipe'
  | null;
export type WelcomeFlowContext = 'general' | 'chat-recipe';

interface UseWelcomePopupReturn {
  shouldShow: boolean;
  flowType: WelcomeFlowType;
  isLoading: boolean;
  dismissPopup: () => void;
  disablePopupPermanently: () => Promise<void>;
}

export function useWelcomePopup(
  context: WelcomeFlowContext = 'general'
): UseWelcomePopupReturn {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [shouldShow, setShouldShow] = useState(false);
  const [flowType, setFlowType] = useState<WelcomeFlowType>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasIncrementedVisit, setHasIncrementedVisit] = useState(false);

  // Determine which welcome flow to show based on user profile
  const determineFlowType = useCallback(
    (userProfile: Profile | null): WelcomeFlowType => {
      if (!userProfile) return null;

      const visitCount = userProfile.visit_count || 0;
      const lastVisit = userProfile.last_visit_at;
      const showPopup = userProfile.show_welcome_popup;

      // User has disabled the popup permanently
      if (!showPopup) {
        return null;
      }

      // First-time user (0 or 1 visits)
      if (visitCount <= 1) {
        return 'first-time';
      }

      // Returning user after 7+ days
      if (lastVisit) {
        const lastVisitDate = new Date(lastVisit);
        const daysSinceLastVisit = Math.floor(
          (Date.now() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceLastVisit >= 7) {
          return 'welcome-back';
        }
      }

      // Frequent user (10+ visits) - show quick navigation
      if (visitCount >= 10) {
        return 'quick-nav';
      }

      // Default: don't show popup
      return null;
    },
    []
  );

  // Increment visit count and update last visit timestamp
  const incrementVisitCount = useCallback(async () => {
    if (!user || !profile || hasIncrementedVisit) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          visit_count: (profile.visit_count || 0) + 1,
          last_visit_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        console.error('Failed to increment visit count:', error);
      } else {
        setHasIncrementedVisit(true);
        // Refresh profile to get updated visit count
        await refreshProfile();
      }
    } catch (err) {
      console.error('Error incrementing visit count:', err);
    }
  }, [user, profile, hasIncrementedVisit, refreshProfile]);

  // Initialize popup visibility on mount
  useEffect(() => {
    if (!profile) {
      setIsLoading(false);
      return;
    }

    // Handle chat-recipe context
    if (context === 'chat-recipe') {
      setFlowType('chat-recipe');
      setShouldShow(true);
      setIsLoading(false);
      return;
    }

    // Handle general context (main app pages)
    const flow = determineFlowType(profile);
    setFlowType(flow);
    setShouldShow(flow !== null);
    setIsLoading(false);

    // Only increment visit count for general context
    if (context === 'general') {
      incrementVisitCount();
    }
  }, [profile, determineFlowType, incrementVisitCount, context]);

  // Dismiss popup temporarily (just for this session)
  const dismissPopup = useCallback(() => {
    setShouldShow(false);
  }, []);

  // Disable popup permanently (update user preference in database)
  const disablePopupPermanently = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ show_welcome_popup: false })
        .eq('id', user.id);

      if (error) {
        console.error('Failed to disable popup permanently:', error);
        toast({
          title: 'Error',
          description: 'Failed to save your preference. Please try again.',
          variant: 'destructive',
        });
      } else {
        setShouldShow(false);
        setFlowType(null);
        // Refresh profile to get updated preference
        await refreshProfile();
        toast({
          title: 'Preference Saved',
          description: 'Welcome popup has been disabled.',
        });
      }
    } catch (err) {
      console.error('Error disabling popup:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  }, [user, refreshProfile, toast]);

  return {
    shouldShow,
    flowType,
    isLoading,
    dismissPopup,
    disablePopupPermanently,
  };
}
