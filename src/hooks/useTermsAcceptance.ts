import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { acceptTermsAndPrivacy } from '@/lib/auth';
import {
  CURRENT_TERMS_VERSION,
  CURRENT_PRIVACY_VERSION,
} from '@/lib/legal-constants';
import { toast } from '@/hooks/use-toast';

export function useTermsAcceptance() {
  const { user, profile } = useAuth();
  const [needsAcceptance, setNeedsAcceptance] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    if (!user || !profile) {
      setIsLoading(false);
      setNeedsAcceptance(false);
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
  }, [user, profile]);

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
        setNeedsAcceptance(false);
        toast({
          title: 'Success',
          description: 'Terms and Privacy Policy accepted',
          variant: 'success',
        });
        // Trigger a profile refresh by reloading the page or updating context
        window.location.reload();
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
    }
  };

  return {
    needsAcceptance,
    isLoading,
    isAccepting,
    acceptTerms,
  };
}
