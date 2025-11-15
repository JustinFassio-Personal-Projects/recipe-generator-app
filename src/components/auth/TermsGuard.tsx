import { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useTermsAcceptance } from '@/hooks/useTermsAcceptance';
import { useAuth } from '@/contexts/AuthProvider';
import { TermsDialog } from '@/components/legal/TermsDialog';

interface TermsGuardProps {
  children: ReactNode;
}

export function TermsGuard({ children }: TermsGuardProps) {
  const { needsAcceptance, isLoading, isAccepting, acceptTerms } =
    useTermsAcceptance();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth/signin');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Show loading state while checking
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-200">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-spinner loading-lg text-success"></span>
          <p className="text-base-content/70">Loading...</p>
        </div>
      </div>
    );
  }

  // If user needs to accept terms, show the modal and block access
  if (needsAcceptance) {
    return (
      <>
        {/* Blocking overlay */}
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-base-200">
          <div className="w-full max-w-md rounded-lg border border-base-300 bg-base-100 p-8 text-center shadow-xl">
            <h2 className="mb-4 text-2xl font-bold text-base-content">
              Terms Update Required
            </h2>
            <p className="mb-6 text-base-content/70">
              We've updated our Terms & Conditions and Privacy Policy. You must
              review and accept them to continue using Recipe Generator.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => setDialogOpen(true)}
                className="btn btn-success w-full"
                disabled={isAccepting}
              >
                {isAccepting ? 'Processing...' : 'Review and Accept'}
              </button>
              <button
                onClick={handleSignOut}
                className="btn btn-ghost w-full text-base-content/70 hover:text-base-content"
                disabled={isAccepting}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out Instead
              </button>
            </div>
          </div>
        </div>

        {/* Terms Dialog */}
        <TermsDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
          }}
          showAcceptButton={true}
          preventDismiss={true}
          onAccept={async () => {
            await acceptTerms();
            setDialogOpen(false);
          }}
        />
      </>
    );
  }

  // User has accepted terms, render children
  return <>{children}</>;
}
