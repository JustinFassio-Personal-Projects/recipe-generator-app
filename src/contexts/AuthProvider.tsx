import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile } from '@/lib/supabase';
import { clearAuthTokens } from '@/lib/auth-utils';

interface SimpleAuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<SimpleAuthContextType | undefined>(undefined);

export function useAuth(): SimpleAuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const signOut = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setError(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const refreshProfile = async (): Promise<void> => {
    if (!user) return;

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile refresh error:', profileError);
        setError(`Profile error: ${profileError.message}`);
      } else {
        console.log('Profile refreshed:', profileData);
        setProfile(profileData);
        setError(null);
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Simple initialization with cleanup for invalid sessions
    const init = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error('Session error:', error);
          // Clear invalid session using existing utility
          await clearAuthTokens();
        }

        if (mounted) {
          if (session?.user && !error) {
            setUser(session.user);
            console.log('✅ User found:', session.user.email);
          } else {
            setUser(null);
            setProfile(null);
            console.log('❌ No user session or session invalid');
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth init error:', error);
        // Clear auth-related data on any auth error using existing utility
        await clearAuthTokens();

        if (mounted) {
          setUser(null);
          setProfile(null);
          setError(null); // Don't show error, just clear everything
          setLoading(false);
        }
      }
    };

    init();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth event:', event);
      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        console.log('✅ User signed in:', session.user.email);
      } else {
        setUser(null);
        setProfile(null);
        console.log('❌ User signed out');
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value: SimpleAuthContextType = {
    user,
    profile,
    loading,
    error,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
