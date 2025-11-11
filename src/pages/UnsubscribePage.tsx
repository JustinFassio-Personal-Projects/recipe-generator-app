import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { unsubscribeByToken } from '@/lib/api/email-api';

export default function UnsubscribePage() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setLoading(false);
      setMessage('Invalid unsubscribe link');
      return;
    }

    handleUnsubscribe(token);
  }, [searchParams]);

  const handleUnsubscribe = async (token: string) => {
    setLoading(true);

    try {
      const result = await unsubscribeByToken(token);

      setSuccess(result.success);
      setMessage(
        result.message ||
          (result.success
            ? 'Successfully unsubscribed'
            : 'Failed to unsubscribe')
      );
    } catch {
      setSuccess(false);
      setMessage('An error occurred while processing your request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Email Preferences</CardTitle>
          <CardDescription>
            {loading ? 'Processing your request...' : 'Unsubscribe from emails'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Please wait while we process your request...
              </p>
            </div>
          ) : success ? (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
              <div className="space-y-2">
                <p className="font-semibold text-lg">
                  Successfully Unsubscribed
                </p>
                <p className="text-sm text-muted-foreground">{message}</p>
                <p className="text-xs text-muted-foreground mt-4">
                  You will still receive important account-related emails.
                </p>
              </div>
              <Button
                onClick={() => (window.location.href = '/')}
                className="mt-4"
              >
                Return to Home
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <XCircle className="h-12 w-12 text-red-600" />
              <div className="space-y-2">
                <p className="font-semibold text-lg">Unsubscribe Failed</p>
                <p className="text-sm text-muted-foreground">{message}</p>
              </div>
              <Button
                onClick={() => (window.location.href = '/')}
                variant="outline"
                className="mt-4"
              >
                Return to Home
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
