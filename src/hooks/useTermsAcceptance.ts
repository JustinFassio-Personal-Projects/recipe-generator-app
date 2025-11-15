import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { acceptTermsAndPrivacy } from '@/lib/auth';
import {
  CURRENT_TERMS_VERSION,
  CURRENT_PRIVACY_VERSION,
} from '@/lib/legal-constants';
import { toast } from '@/hooks/use-toast';

export function useTermsAcceptance() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const [needsAcceptance, setNeedsAcceptance] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);

  // Track when acceptance is in progress to prevent useEffect from recalculating
  const acceptanceInProgressRef = useRef(false);

  // Track which user we've checked to prevent re-checking on profile updates
  const checkedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[useTermsAcceptance] useEffect RAN', {
        isAccepting,
        acceptanceInProgress: acceptanceInProgressRef.current,
        authLoading,
        hasUser: !!user,
        hasProfile: !!profile,
        profileTerms: profile?.terms_version_accepted,
        profilePrivacy: profile?.privacy_version_accepted,
      });
    }

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
      if (import.meta.env.DEV) {
        console.log(
          '[useTermsAcceptance] Waiting for auth to load, keeping isLoading=true'
        );
      }
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
    // But allow re-evaluation when terms acceptance data becomes available
    // (e.g., when detailed profile loads after immediate profile)
    const hasTermsData =
      profile.terms_version_accepted !== null ||
      profile.privacy_version_accepted !== null;

    if (checkedUserIdRef.current === user.id && hasTermsData) {
      if (import.meta.env.DEV) {
        console.log(
          '[useTermsAcceptance] Already checked terms for this user session with full data'
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
  }, [
    user?.id,
    profile,
    isAccepting,
    authLoading,
    // Also depend on terms acceptance fields to re-evaluate when profile loads from database
    profile?.terms_version_accepted,
    profile?.privacy_version_accepted,
  ]);

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

        // Refresh profile to get updated terms acceptance data from database
        // This ensures the profile context has the latest data
        try {
          // DON'T clear checkedUserIdRef here - keep the guard active during refresh!
          // We'll update it in the callback once we confirm the updated profile

          await refreshProfile((updatedProfile) => {
            if (import.meta.env.DEV) {
              console.log(
                '[useTermsAcceptance] Profile refreshed after terms acceptance',
                {
                  termsAcceptedAt: updatedProfile?.terms_accepted_at,
                  termsVersion: updatedProfile?.terms_version_accepted,
                  privacyAcceptedAt: updatedProfile?.privacy_accepted_at,
                  privacyVersion: updatedProfile?.privacy_version_accepted,
                }
              );
            }

            // Mark user as checked now that we have the updated profile
            // Only clear flags AFTER we confirm the profile has terms data
            if (
              updatedProfile &&
              updatedProfile.terms_version_accepted === CURRENT_TERMS_VERSION
            ) {
              checkedUserIdRef.current = user.id;
              // Clear flags here, inside the callback, after confirming success
              acceptanceInProgressRef.current = false;
              setIsAccepting(false);
            } else {
              // Profile didn't have expected terms data - something went wrong
              console.error(
                '[useTermsAcceptance] Profile refresh completed but terms not found'
              );
              acceptanceInProgressRef.current = false;
              setIsAccepting(false);
            }
          });
        } catch (refreshError) {
          // Don't fail the acceptance if refresh fails - the database is already updated
          console.error(
            '[useTermsAcceptance] Profile refresh failed after acceptance:',
            refreshError
          );

          // Clear the flags even on error
          acceptanceInProgressRef.current = false;
          setIsAccepting(false);
        }

        return { success: true };
      } else {
        toast({
          title: 'Error',
          description: error?.message || 'Failed to accept terms',
          variant: 'destructive',
        });

        // Clear flags on failure
        setIsAccepting(false);
        acceptanceInProgressRef.current = false;

        return { success: false };
      }
    } catch {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });

      // Clear flags on unexpected error
      setIsAccepting(false);
      acceptanceInProgressRef.current = false;

      return { success: false };
    }
  };

  return {
    needsAcceptance,
    isLoading,
    isAccepting,
    acceptTerms,
  };
}
