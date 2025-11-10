import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { Loader2, ShieldAlert } from 'lucide-react';

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user exists and has admin privileges
  if (!user) {
    return <Navigate to="/auth/signin" replace />;
  }

  if (!profile?.is_admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md rounded-lg border border-red-200 bg-white p-8 text-center shadow-sm">
          <ShieldAlert className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">
            Access Denied
          </h2>
          <p className="mt-2 text-gray-600">
            You do not have administrator privileges to access this page.
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-6 rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
