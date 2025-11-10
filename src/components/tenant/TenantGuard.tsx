import { useTenant } from '@/contexts/TenantContext';
import { Loader2 } from 'lucide-react';

export function TenantGuard({ children }: { children: React.ReactNode }) {
  const { loading, error } = useTenant();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-gray-600">Loading configuration...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <h2 className="mb-2 text-xl font-semibold text-red-900">
            Configuration Error
          </h2>
          <p className="text-red-700">{error}</p>
          <p className="mt-4 text-sm text-red-600">
            Please contact support if this issue persists.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
