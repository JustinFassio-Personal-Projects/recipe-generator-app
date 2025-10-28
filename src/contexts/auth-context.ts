import { createContext } from 'react';
import type { User, Profile } from '@/lib/types';

export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refreshProfile: (
    onComplete?: (profile: Profile | null) => void
  ) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
