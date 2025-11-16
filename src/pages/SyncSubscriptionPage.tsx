import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useVerifySubscription } from '@/hooks/useVerifySubscription';
import { useAuth } from '@/contexts/AuthProvider';

/**
 * Temporary utility page to manually sync subscriptions from Stripe
 * This is a workaround until we fix the success_url redirect issue
 */
export function SyncSubscriptionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { user } = useAuth();
  const verifySubscription = useVerifySubscription();
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (!sessionId || synced) return;

    console.log('[Sync] Syncing subscription for session:', sessionId);

    verifySubscription.mutate(
      { session_id: sessionId },
      {
        onSuccess: () => {
          console.log('[Sync] Subscription synced successfully');
          setSynced(true);
        },
        onError: (error) => {
          console.error('[Sync] Failed to sync:', error);
        },
      }
    );
  }, [sessionId, synced, verifySubscription]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
        <Button onClick={() => navigate('/auth/signin')}>Sign In</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Syncing Subscription</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {verifySubscription.isPending && (
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Syncing your subscription from Stripe...</span>
            </div>
          )}

          {verifySubscription.isSuccess && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span>Subscription synced successfully!</span>
              </div>
              <Button
                onClick={() => navigate('/subscription')}
                className="w-full"
              >
                View Subscription
              </Button>
            </div>
          )}

          {verifySubscription.isError && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <span>Failed to sync subscription</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {verifySubscription.error?.message || 'Unknown error'}
              </p>
              <Button
                onClick={() => navigate('/subscription')}
                variant="outline"
                className="w-full"
              >
                Go to Subscription Page
              </Button>
            </div>
          )}

          {!sessionId && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-yellow-600">
                <AlertCircle className="h-5 w-5" />
                <span>No session ID provided</span>
              </div>
              <p className="text-sm text-muted-foreground">
                This page requires a session_id parameter from Stripe
              </p>
              <Button
                onClick={() => navigate('/subscription')}
                variant="outline"
                className="w-full"
              >
                Go to Subscription Page
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default SyncSubscriptionPage;
