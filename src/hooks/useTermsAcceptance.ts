import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { acceptTermsAndPrivacy } from '@/lib/auth';
import {
  CURRENT_TERMS_VERSION,
  CURRENT_PRIVACY_VERSION,
} from '@/lib/legal-constants';
import { toast } from '@/hooks/use-toast';
import type { Profile } from '@/lib/types';

export function useTermsAcceptance() {
  const { user, profile, refreshProfile, loading: authLoading } = useAuth();
  const [needsAcceptance, setNeedsAcceptance] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const refreshInProgressRef = useRef(false);

  useEffect(() => {
    // Don't recalculate while accepting terms to prevent race conditions
    if (isAccepting) {
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
      return;
    }

    // If user exists but profile is null, profile is still loading
    if (!profile) {
      setIsLoading(true);
      return;
    }

    // Check if user needs to accept or re-accept terms
    const termsVersionMatch =
      profile.terms_version_accepted === CURRENT_TERMS_VERSION;
    const privacyVersionMatch =
      profile.privacy_version_accepted === CURRENT_PRIVACY_VERSION;

    // User needs acceptance if either is missing or doesn't match current version
    const needsToAccept = !termsVersionMatch || !privacyVersionMatch;

    setNeedsAcceptance(needsToAccept);
    setIsLoading(false);
  }, [user, profile, isAccepting, authLoading]);

  const acceptTerms = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be signed in to accept terms',
        variant: 'destructive',
      });
      return { success: false };
    }

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

        // Refresh profile to get updated terms acceptance data
        // Use a promise with retry limit to prevent infinite loops
        await new Promise<void>((resolve) => {
          // Prevent concurrent refresh calls
          if (refreshInProgressRef.current) {
            console.warn('Profile refresh already in progress, skipping');
            resolve();
            return;
          }

          refreshInProgressRef.current = true;
          let retryCount = 0;
          const maxRetries = 3;
          let isResolved = false;

          const checkAndRefresh = (updatedProfile: Profile | null) => {
            // Prevent multiple resolutions
            if (isResolved) return;

            // Verify the profile was actually updated
            if (updatedProfile) {
              const termsMatch =
                updatedProfile.terms_version_accepted === CURRENT_TERMS_VERSION;
              const privacyMatch =
                updatedProfile.privacy_version_accepted ===
                CURRENT_PRIVACY_VERSION;

              if (!termsMatch || !privacyMatch) {
                // If profile still doesn't match and we haven't exceeded retries
                if (retryCount < maxRetries) {
                  retryCount++;
                  console.warn(
                    `Profile refresh incomplete, retrying (${retryCount}/${maxRetries})...`
                  );
                  setTimeout(() => {
                    if (!isResolved) {
                      refreshProfile(checkAndRefresh);
                    }
                  }, 1000 * retryCount); // Exponential backoff
                } else {
                  // Max retries exceeded, resolve anyway to prevent infinite loop
                  console.warn(
                    'Max retries exceeded for profile refresh, resolving anyway'
                  );
                  isResolved = true;
                  refreshInProgressRef.current = false;
                  resolve();
                }
              } else {
                // Profile matches, we're done
                isResolved = true;
                refreshInProgressRef.current = false;
                resolve();
              }
            } else {
              // No profile returned, resolve to prevent infinite loop
              isResolved = true;
              refreshInProgressRef.current = false;
              resolve();
            }
          };

          refreshProfile(checkAndRefresh);
        });

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
      refreshInProgressRef.current = false;
    }
  };

  return {
    needsAcceptance,
    isLoading,
    isAccepting,
    acceptTerms,
  };
}
