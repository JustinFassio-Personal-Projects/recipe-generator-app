import { useContext } from 'react';
import { AuthContext, type AuthContextType } from './auth-context';

// Global fallback state for development hot reloads
let globalAuthFallback: AuthContextType | null = null;

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  // Enhanced error handling with hot reload recovery
  if (context === undefined) {
    // In development, try to use global fallback during hot reloads
    if (import.meta.env.DEV && globalAuthFallback) {
      console.warn(
        'AuthProvider context is undefined, using global fallback during hot reload'
      );
      return globalAuthFallback;
    }
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

// Export the global fallback setter for development
export function setGlobalAuthFallback(fallback: AuthContextType | null) {
  globalAuthFallback = fallback;
}
