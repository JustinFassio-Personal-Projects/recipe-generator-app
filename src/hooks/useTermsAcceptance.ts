import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { acceptTermsAndPrivacy } from '@/lib/auth';
import {
  CURRENT_TERMS_VERSION,
  CURRENT_PRIVACY_VERSION,
} from '@/lib/legal-constants';
import { toast } from '@/hooks/use-toast';

export function useTermsAcceptance() {
  const { user, profile, loading: authLoading } = useAuth();
  const [needsAcceptance, setNeedsAcceptance] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);

  // Track when acceptance is in progress to prevent useEffect from recalculating
  const acceptanceInProgressRef = useRef(false);

  // Track which user we've checked to prevent re-checking on profile updates
  const checkedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Don't recalculate while accepting terms to prevent race conditions
    if (isAccepting || acceptanceInProgressRef.current) {
      if (import.meta.env.DEV) {
        console.log(
          '[useTermsAcceptance] Skipping check - acceptance in progress'
        );
      }
      return;
    }

    // Wait for auth to finish loading before making decisions
    if (authLoading) {
      setIsLoading(true);
      return;
    }

    // If no user, we're definitely not loading and don't need acceptance
    if (!user) {
      setIsLoading(false);
      setNeedsAcceptance(false);
      checkedUserIdRef.current = null;
      return;
    }

    // If user exists but profile is null, profile is still loading
    if (!profile) {
      setIsLoading(true);
      return;
    }

    // CRITICAL FIX: Only check once per user session to prevent infinite loops
    // If we've already checked this user's terms, don't check again
    if (checkedUserIdRef.current === user.id) {
      if (import.meta.env.DEV) {
        console.log(
          '[useTermsAcceptance] Already checked terms for this user session'
        );
      }
      return;
    }

    // Check if user needs to accept or re-accept terms
    const termsVersionMatch =
      profile.terms_version_accepted === CURRENT_TERMS_VERSION;
    const privacyVersionMatch =
      profile.privacy_version_accepted === CURRENT_PRIVACY_VERSION;

    // User needs acceptance if either is missing or doesn't match current version
    const needsToAccept = !termsVersionMatch || !privacyVersionMatch;

    if (import.meta.env.DEV) {
      console.log('[useTermsAcceptance] Terms check:', {
        userId: user.id,
        termsVersionMatch,
        privacyVersionMatch,
        needsToAccept,
        currentTerms: CURRENT_TERMS_VERSION,
        currentPrivacy: CURRENT_PRIVACY_VERSION,
        profileTerms: profile.terms_version_accepted,
        profilePrivacy: profile.privacy_version_accepted,
      });
    }

    // Mark that we've checked this user
    checkedUserIdRef.current = user.id;

    setNeedsAcceptance(needsToAccept);
    setIsLoading(false);
  }, [user?.id, profile, isAccepting, authLoading]);

  const acceptTerms = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be signed in to accept terms',
        variant: 'destructive',
      });
      return { success: false };
    }

    // Prevent multiple simultaneous acceptance calls
    if (acceptanceInProgressRef.current) {
      return { success: false };
    }

    acceptanceInProgressRef.current = true;
    setIsAccepting(true);

    try {
      const { success, error } = await acceptTermsAndPrivacy(
        CURRENT_TERMS_VERSION,
        CURRENT_PRIVACY_VERSION
      );

      if (success) {
        // Optimistically set needsAcceptance to false
        setNeedsAcceptance(false);

        toast({
          title: 'Success',
          description: 'Terms and Privacy Policy accepted',
          variant: 'success',
        });

        // Don't call refreshProfile here - it triggers the useEffect which recalculates needsAcceptance
        // The database has been updated successfully, and we've optimistically set needsAcceptance to false
        // The profile will be refreshed naturally on the next page load or navigation

        return { success: true };
      } else {
        toast({
          title: 'Error',
          description: error?.message || 'Failed to accept terms',
          variant: 'destructive',
        });
        return { success: false };
      }
    } catch {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
      return { success: false };
    } finally {
      setIsAccepting(false);
      acceptanceInProgressRef.current = false;
    }
  };

  return {
    needsAcceptance,
    isLoading,
    isAccepting,
    acceptTerms,
  };
}
