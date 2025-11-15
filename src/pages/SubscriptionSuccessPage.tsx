import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { subscriptionEvents } from '@/lib/vercel-analytics';
import {
  getSubscriptionPlanDetails,
  SUBSCRIPTION_CONFIG,
} from '@/config/subscription';
import { useSubscriptionStatus } from '@/hooks/useSubscription';
import { useVerifySubscription } from '@/hooks/useVerifySubscription';

export function SubscriptionSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const queryClient = useQueryClient();
  const { data: subscriptionStatus } = useSubscriptionStatus();
  const verifySubscription = useVerifySubscription();
  const [verificationAttempted, setVerificationAttempted] = useState(false);

  useEffect(() => {
    // Track subscription conversion using centralized config
    const planDetails = getSubscriptionPlanDetails();
    subscriptionEvents.converted(
      planDetails.plan,
      planDetails.price,
      planDetails.interval
    );

    // Invalidate subscription queries to refetch updated status immediately
    queryClient.invalidateQueries({ queryKey: ['subscription'] });
    queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
  }, [queryClient]);

  // Immediately verify subscription on mount (fallback for when webhooks don't work)
  useEffect(() => {
    if (!sessionId || verificationAttempted) {
      return;
    }

    console.log(
      '[SubscriptionSuccess] Verifying subscription for session:',
      sessionId
    );
    setVerificationAttempted(true);

    verifySubscription.mutate(
      { session_id: sessionId },
      {
        onSuccess: () => {
          console.log('[SubscriptionSuccess] Subscription verified and synced');
          // Refresh subscription status
          queryClient.invalidateQueries({ queryKey: ['subscription'] });
          queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
        },
        onError: (error) => {
          console.error(
            '[SubscriptionSuccess] Failed to verify subscription:',
            error
          );
          // Continue polling as fallback
        },
      }
    );
  }, [sessionId, verificationAttempted, verifySubscription, queryClient]);

  // Separate effect for polling - stops when subscription is found
  useEffect(() => {
    // If subscription already found, no need to poll
    if (subscriptionStatus?.has_access) {
      return;
    }

    // Poll for subscription status (webhook may take a few seconds to process)
    // Check every 2 seconds, stop after 30 seconds
    const pollInterval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
    }, 2000); // Check every 2 seconds

    // Stop polling after 30 seconds
    const timeout = setTimeout(() => {
      clearInterval(pollInterval);
    }, 30000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [queryClient, subscriptionStatus?.has_access]);

  // Show loading state while verifying
  const isVerifying =
    verifySubscription.isPending && !subscriptionStatus?.has_access;

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            {isVerifying ? (
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
              </div>
            ) : subscriptionStatus?.has_access ? (
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            ) : (
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
                <AlertCircle className="h-10 w-10 text-yellow-600" />
              </div>
            )}
            <CardTitle className="text-3xl">
              {isVerifying
                ? 'Activating Your Subscription...'
                : subscriptionStatus?.has_access
                  ? 'Welcome to Premium!'
                  : 'Almost There!'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            {isVerifying ? (
              <p className="text-muted-foreground">
                Please wait while we activate your premium features...
              </p>
            ) : !subscriptionStatus?.has_access ? (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  We're still processing your subscription. This usually takes
                  just a few seconds.
                </p>
                <Button
                  onClick={() => {
                    queryClient.invalidateQueries({
                      queryKey: ['subscription-status'],
                    });
                  }}
                  variant="outline"
                >
                  <Loader2 className="mr-2 h-4 w-4" />
                  Check Status
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center gap-2 text-primary">
                  <Sparkles className="h-5 w-5" />
                  <p className="text-lg font-medium">
                    Your 7-day free trial has started
                  </p>
                </div>

                <div className="bg-muted p-6 rounded-lg space-y-3">
                  <h3 className="font-semibold text-lg">What happens next?</h3>
                  <ul className="text-sm text-left space-y-2">
                    <li>✓ You now have unlimited access to all AI features</li>
                    <li>✓ Your trial lasts for 7 days from today</li>
                    <li>
                      ✓ After the trial, you'll be charged $
                      {SUBSCRIPTION_CONFIG.PREMIUM_PLAN.price}/
                      {SUBSCRIPTION_CONFIG.PREMIUM_PLAN.interval}
                    </li>
                    <li>✓ Cancel anytime from your account settings</li>
                  </ul>
                </div>

                <div className="flex gap-4 justify-center pt-4">
                  <Button onClick={() => navigate('/recipes')} size="lg">
                    Start Creating Recipes
                  </Button>
                  <Button
                    onClick={() => navigate('/profile')}
                    variant="outline"
                    size="lg"
                  >
                    Manage Subscription
                  </Button>
                </div>
              </>
            )}

            {sessionId && (
              <p className="text-xs text-muted-foreground">
                Session ID: {sessionId.slice(0, 20)}...
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default SubscriptionSuccessPage;
