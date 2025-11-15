import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import {
  User,
  AuthChangeEvent,
  Session,
  PostgrestError,
} from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';
import { ensureUserProfile } from '@/lib/auth-utils';
import { createLogger } from '@/lib/logger';

/**
 * Creates a minimal profile object for fallback scenarios
 */
function createMinimalProfile(userId: string): Profile {
  return {
    id: userId,
    username: null,
    full_name: null,
    bio: null,
    avatar_url: null,
    region: null,
    country: null,
    state_province: null,
    city: null,
    language: null,
    units: null,
    time_per_meal: null,
    skill_level: null,
    visit_count: 0,
    last_visit_at: null,
    show_welcome_popup: true,
    terms_accepted_at: null,
    terms_version_accepted: null,
    privacy_accepted_at: null,
    privacy_version_accepted: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Creates an immediate profile from user metadata for instant loading
 * @param user - The authenticated user
 * @param preserveTermsFrom - Optional existing profile to preserve terms data from during refresh
 */
function createImmediateProfile(
  user: User,
  preserveTermsFrom?: Profile | null
): Profile {
  return {
    id: user.id,
    username: null,
    full_name:
      user.user_metadata?.full_name || user.email?.split('@')[0] || null,
    bio: null,
    avatar_url: user.user_metadata?.avatar_url || null,
    region: null,
    country: null,
    state_province: null,
    city: null,
    language: 'en',
    units: 'imperial',
    time_per_meal: 30,
    skill_level: 'beginner',
    visit_count: 0,
    last_visit_at: null,
    show_welcome_popup: true,
    // CRITICAL: Preserve terms data from existing profile during refresh to prevent modal flashing
    terms_accepted_at: preserveTermsFrom?.terms_accepted_at ?? null,
    terms_version_accepted: preserveTermsFrom?.terms_version_accepted ?? null,
    privacy_accepted_at: preserveTermsFrom?.privacy_accepted_at ?? null,
    privacy_version_accepted:
      preserveTermsFrom?.privacy_version_accepted ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refreshProfile: (
    onComplete?: (profile: Profile | null) => void
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Global fallback state for development hot reloads
let globalAuthFallback: AuthContextType | null = null;

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  // Enhanced error handling with hot reload recovery
  if (context === undefined) {
    // In development, try to use global fallback during hot reloads
    if (import.meta.env.DEV && globalAuthFallback) {
      console.warn('🔧 [useAuth] Using global fallback during hot reload');
      return globalAuthFallback;
    }

    // Create emergency fallback context for development
    if (import.meta.env.DEV) {
      console.error('🔧 [useAuth] Creating emergency fallback context');
      const emergencyContext: AuthContextType = {
        user: null,
        profile: null,
        loading: true,
        error: 'AuthProvider context lost during hot reload',
        signOut: async () => {
          console.log('Emergency signOut - reloading page');
          window.location.reload();
        },
        refreshProfile: async () => {
          console.log('Emergency refreshProfile - reloading page');
          window.location.reload();
        },
      };
      return emergencyContext;
    }

    throw new Error('useAuth must be used within an AuthProvider');
  }

  // Update global fallback for hot reload scenarios
  if (import.meta.env.DEV) {
    globalAuthFallback = context;
  }

  return context;
}

// Enhanced state persistence for hot reload recovery
const persistAuthState = (
  user: User | null,
  profile: Profile | null,
  loading: boolean,
  error: string | null
) => {
  if (!import.meta.env.DEV || typeof window === 'undefined') return;

  try {
    const state = {
      hasUser: !!user,
      userEmail: user?.email,
      userId: user?.id,
      profile: profile
        ? {
            id: profile.id,
            username: profile.username,
            full_name: profile.full_name,
            country: profile.country,
            region: profile.region,
          }
        : null,
      loading,
      error,
      timestamp: Date.now(),
    };

    sessionStorage.setItem('auth-debug-state', JSON.stringify(state));

    // Also persist in global fallback
    if (globalAuthFallback && user) {
      globalAuthFallback.user = user;
      globalAuthFallback.profile = profile;
      globalAuthFallback.loading = loading;
      globalAuthFallback.error = error;
    }
  } catch {
    // Ignore persistence errors
  }
};

const getPersistedAuthState = () => {
  if (!import.meta.env.DEV || typeof window === 'undefined') return null;

  try {
    const persisted = sessionStorage.getItem('auth-debug-state');
    if (persisted) {
      const state = JSON.parse(persisted);
      // Only use persisted state if it's recent (within 5 minutes)
      if (Date.now() - state.timestamp < 5 * 60 * 1000) {
        return state;
      }
    }
  } catch {
    // Ignore errors
  }
  return null;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Initialize with persisted state if available (hot reload recovery)
  const persistedState = getPersistedAuthState();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(
    persistedState?.hasUser ? false : true
  );
  const [error, setError] = useState<string | null>(
    persistedState?.error || null
  );

  // Persist auth state changes during development
  useEffect(() => {
    persistAuthState(user, profile, loading, error);
  }, [user, profile, loading, error]);

  // Static logger to prevent dependency loops
  const logger = useRef(createLogger('AuthProvider')).current;

  // Track retry attempts to prevent infinite loops
  const retryAttempts = useRef<Map<string, number>>(new Map());
  const maxRetries = 3;

  // Simple cache to prevent unnecessary re-fetches
  const profileCache = useRef<
    Map<string, { profile: Profile; timestamp: number }>
  >(new Map());
  const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

  // Store current fetchProfile function to avoid dependency issues
  const fetchProfileRef = useRef<typeof fetchProfile>();

  // Enhanced initialization state to prevent race conditions during page refresh
  const initializationState = useRef<{
    promise: Promise<void> | null;
    completed: boolean;
    timestamp: number;
  }>({ promise: null, completed: false, timestamp: 0 });

  // Track if a profile refresh is currently in progress to prevent race conditions
  const refreshInProgress = useRef(false);
  const lastRefreshCompletedAt = useRef<number>(0);

  // Backoff delays: 1s, 2s, 4s
  const getBackoffDelay = (attempt: number): number =>
    Math.min(1000 * Math.pow(2, attempt), 4000);

  // Reset retry counter for user
  const resetRetries = useCallback((userId: string) => {
    retryAttempts.current.delete(userId);
  }, []);

  // Check if we should retry
  const shouldRetry = useCallback((userId: string): boolean => {
    const attempts = retryAttempts.current.get(userId) || 0;
    return attempts < maxRetries;
  }, []);

  // Increment retry counter
  const incrementRetries = useCallback((userId: string): number => {
    const attempts = (retryAttempts.current.get(userId) || 0) + 1;
    retryAttempts.current.set(userId, attempts);
    return attempts;
  }, []);

  // Profile fetch with exponential backoff and circuit breaker
  const fetchProfile = useCallback(
    async (userId: string): Promise<Profile | null> => {
      // Check cache first
      const cached = profileCache.current.get(userId);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
        logger.db(`Using cached profile for user: ${userId}`);
        return cached.profile;
      }

      if (!shouldRetry(userId)) {
        logger.error(`Max retries exceeded for user ${userId}, skipping fetch`);
        return null;
      }

      const attempt = incrementRetries(userId);

      try {
        logger.db(
          `Querying profiles table for user: ${userId} (attempt ${attempt})`
        );

        // Add performance timing
        const queryStartTime = Date.now();

        // Skip session validation - we already have authenticated user context
        // The original session validation was causing failures during hot reloads
        logger.db('Skipping session validation - using existing user context');

        // Optimized timeout for better responsiveness
        const queryPromise = supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        // Increased timeout to handle network latency and potential auth delays
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(
            () => reject(new Error('Profile query timeout')),
            import.meta.env.DEV ? 15000 : 10000
          );
        });

        const { data, error } = (await Promise.race([
          queryPromise,
          timeoutPromise,
        ])) as { data: Profile | null; error: PostgrestError | null };

        const queryDuration = Date.now() - queryStartTime;
        logger.db('Supabase query result', {
          hasData: !!data,
          error: error?.message,
          errorCode: error?.code,
          attempt,
          duration: `${queryDuration}ms`,
        });

        // Add detailed debugging for profile data
        if (data && import.meta.env.DEV) {
          console.log('🔍 Profile data returned from database:', {
            id: data.id,
            username: data.username,
            full_name: data.full_name,
            terms_accepted_at: data.terms_accepted_at,
            terms_version_accepted: data.terms_version_accepted,
            privacy_accepted_at: data.privacy_accepted_at,
            privacy_version_accepted: data.privacy_version_accepted,
            usernameType: typeof data.username,
            usernameIsNull: data.username === null,
            usernameIsUndefined: data.username === undefined,
          });
        }

        if (error) {
          if (error.code === 'PGRST116') {
            logger.user('Profile not found, attempting to create...');

            // Only try to create profile on first attempt to prevent loops
            if (attempt === 1) {
              const { success } = await ensureUserProfile();
              if (success) {
                logger.success('Profile created, fetching again...');
                // Recursive call will increment retry counter
                return await fetchProfile(userId);
              } else {
                logger.failure('Profile creation failed');
                return null;
              }
            } else {
              logger.failure('Profile creation already attempted, skipping');
              return null;
            }
          } else {
            logger.error('Database error:', error);

            // Network errors - log backoff delay for debugging
            if (
              error.message?.includes('Failed to fetch') ||
              error.message?.includes('ERR_INSUFFICIENT_RESOURCES')
            ) {
              const delay = getBackoffDelay(attempt - 1);
              logger.error(
                `Network error, would back off for ${delay}ms (retry mechanism not implemented)`
              );
            }

            // If this is the last attempt, create a minimal profile
            if (attempt >= 3) {
              logger.warn(
                'Creating minimal profile due to persistent database errors'
              );
              return createMinimalProfile(userId);
            }

            return null;
          }
        }

        // Success - reset retry counter and cache the profile
        resetRetries(userId);
        if (data) {
          profileCache.current.set(userId, {
            profile: data,
            timestamp: Date.now(),
          });
          logger.success('Profile found successfully and cached');
        }
        return data;
      } catch (err) {
        logger.error('Profile fetch exception:', err);

        // Handle network errors with backoff
        if (
          err instanceof Error &&
          (err.message.includes('Failed to fetch') ||
            err.message.includes('ERR_INSUFFICIENT_RESOURCES') ||
            err.message.includes('Profile query timeout'))
        ) {
          const delay = getBackoffDelay(attempt - 1);
          logger.error(
            `Network exception, backing off for ${delay}ms before next possible retry`
          );
        }

        return null;
      }
    },
    [shouldRetry, incrementRetries, resetRetries, logger, CACHE_DURATION_MS]
  );

  // Store the current fetchProfile function in ref
  fetchProfileRef.current = fetchProfile;

  // Stable refresh function that won't cause loops
  const refreshProfile = useCallback(
    async (onComplete?: (profile: Profile | null) => void) => {
      if (!user?.id) {
        logger.auth('No user ID, skipping profile refresh');
        onComplete?.(null);
        return;
      }

      logger.auth(`🔐 Refreshing profile for user: ${user.id}`);

      // CRITICAL FIX: Prevent race conditions from multiple simultaneous refreshes
      // If a refresh is already in progress, skip this one
      if (refreshInProgress.current) {
        logger.debug(
          '⏭️ Refresh already in progress - skipping duplicate refresh call'
        );
        return;
      }

      // Mark refresh as in progress
      refreshInProgress.current = true;

      // Clear cache for this user to force fresh data
      logger.db('🗑️ Clearing profile cache for user');
      profileCache.current.delete(user.id);

      // CRITICAL FIX: Don't replace existing profile during refresh
      // Setting immediate profile during refresh can cause race conditions with terms acceptance
      // If we already have a profile, keep it while we fetch the updated one
      // Also skip if a refresh completed very recently AND we have terms data (to prevent loop after acceptance)
      const timeSinceLastRefresh = Date.now() - lastRefreshCompletedAt.current;
      const recentRefresh = timeSinceLastRefresh < 2000;
      const hasTermsData =
        profile?.terms_version_accepted !== null ||
        profile?.privacy_version_accepted !== null;

      // Create immediate profile variable outside conditional for error handling
      let immediateProfile: Profile | null = null;

      // Only skip immediate profile if:
      // 1. We already have a profile, OR
      // 2. A refresh just completed AND we have terms data (prevents loop after acceptance)
      if (!profile && !(recentRefresh && hasTermsData)) {
        immediateProfile = createImmediateProfile(user, profile);
        setProfile(immediateProfile);
        logger.success('✅ Immediate profile set during refresh');
      } else if (recentRefresh && hasTermsData) {
        logger.debug(
          `⏭️ Skipping immediate profile - recent refresh with terms data completed ${timeSinceLastRefresh}ms ago`
        );
      } else {
        // Keep the existing profile - don't create an immediate profile that might lose data
        logger.debug(
          '⏭️ Keeping existing profile during refresh (no immediate profile needed)'
        );
      }

      // Fetch detailed profile in background
      try {
        const detailedProfileData = await fetchProfile(user.id);

        if (detailedProfileData) {
          logger.db('✅ Detailed profile refresh result:', {
            userId: detailedProfileData.id,
            username: detailedProfileData.username,
            avatarUrl: detailedProfileData.avatar_url,
            hasAvatar: !!detailedProfileData.avatar_url,
          });
          setProfile(detailedProfileData);
          logger.success('✅ Profile refreshed successfully');
          onComplete?.(detailedProfileData);
        } else {
          logger.warn(
            '⚠️ Detailed profile refresh returned null - keeping immediate profile'
          );
          onComplete?.(immediateProfile);
        }
      } catch (refreshError) {
        logger.error('Detailed profile refresh failed:', refreshError);
        logger.success('✅ Using immediate profile as fallback');
        onComplete?.(immediateProfile);
      } finally {
        // CRITICAL: Clear refresh flag and record completion time to prevent race conditions
        refreshInProgress.current = false;
        lastRefreshCompletedAt.current = Date.now();
        logger.debug('🔓 Refresh completed - cleared refresh lock');
      }
    },
    [user?.id, fetchProfile, logger]
  );

  const signOut = async () => {
    try {
      logger.auth('Signing out user');
      await supabase.auth.signOut();

      // Clear all state
      setUser(null);
      setProfile(null);
      setError(null);

      // Clear retry counters and cache
      retryAttempts.current.clear();
      profileCache.current.clear();

      logger.success('User signed out successfully');
    } catch (err) {
      logger.error('Sign out error:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let authSubscription: { unsubscribe: () => void } | null = null;

    // Get initial session with timeout and error handling
    const getInitialSession = async () => {
      // Prevent multiple simultaneous initialization attempts
      if (initializationState.current.promise) {
        logger.auth('Initialization already in progress, waiting...');
        await initializationState.current.promise;
        return;
      }

      // Check if initialization was recently completed to prevent rapid re-initialization
      const timeSinceLastInit =
        Date.now() - initializationState.current.timestamp;
      if (initializationState.current.completed && timeSinceLastInit < 1000) {
        logger.auth(
          'Initialization recently completed, skipping duplicate attempt'
        );
        return;
      }

      // Create initialization promise with enhanced state tracking
      initializationState.current.promise = (async () => {
        initializationState.current.timestamp = Date.now();
        try {
          logger.auth('Initializing AuthProvider...');

          // Increased session timeout to handle network latency and auth delays
          const SESSION_TIMEOUT_MS = import.meta.env.DEV ? 20000 : 15000; // More generous timeouts for reliability

          // Add timing for session fetch
          const sessionStartTime = Date.now();
          logger.auth(
            `Starting session fetch with ${SESSION_TIMEOUT_MS}ms timeout`
          );

          const sessionPromise = supabase.auth.getSession();
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(
              () => reject(new Error('Initial session timeout')),
              SESSION_TIMEOUT_MS
            );
          });

          const {
            data: { session },
          } = (await Promise.race([sessionPromise, timeoutPromise])) as {
            data: { session: Session | null };
          };

          const sessionDuration = Date.now() - sessionStartTime;
          logger.auth(`Session fetch completed in ${sessionDuration}ms`);

          // CRITICAL FIX: Always set loading to false, even if component unmounted
          // This prevents stuck loading states during hot reloads
          logger.auth(
            '🔧 CRITICAL: Setting loading to false after session fetch completion'
          );
          setLoading(false);

          if (!isMounted) {
            logger.auth(
              'Component unmounted during session fetch - continuing with state update'
            );
            // Don't return early - still need to process the session result
          }

          if (session?.user) {
            logger.auth(`Initial session found: ${session.user.id}`);
            setUser(session.user);

            // Fetch profile non-blocking with error boundaries
            try {
              let profileData = null;
              if (
                fetchProfileRef.current &&
                typeof fetchProfileRef.current === 'function'
              ) {
                profileData = await fetchProfileRef.current(session.user.id);
              } else {
                logger.error(
                  'fetchProfileRef.current is not set or not a function'
                );
              }

              // Only update state if component is still mounted to avoid React warnings
              if (isMounted) {
                logger.db(`Initial profile fetch result: ${!!profileData}`);
                setProfile(profileData);

                if (import.meta.env.DEV) {
                  console.log('[AuthProvider] setProfile CALLED:', {
                    isMounted,
                    username: profileData?.username,
                    terms: profileData?.terms_version_accepted,
                    privacy: profileData?.privacy_version_accepted,
                  });
                }
              }
            } catch (profileError) {
              logger.error('Initial profile fetch failed:', profileError);
              // In development, be more lenient with profile fetch failures
              if (import.meta.env.DEV) {
                logger.auth(
                  'Development mode: continuing without profile, will retry on demand'
                );
              }
              // Continue without profile - don't block app initialization
            }
          } else {
            logger.auth('No initial session found');
          }

          // Always set loading to false after initial session check
          logger.success(
            '🔧 Setting loading to false after initial session check'
          );
          setLoading(false);

          // Mark initialization as completed
          initializationState.current.completed = true;
        } catch (err) {
          logger.error('Initial session error:', err);

          // Always set loading to false on error, regardless of mount state
          logger.error('🔧 Setting loading to false after session error');
          setLoading(false);

          if (isMounted) {
            // Don't treat session timeouts as critical errors
            if (err instanceof Error && err.message.includes('timeout')) {
              logger.error('Session timeout - continuing without session');
            } else {
              setError(
                err instanceof Error ? err.message : 'Authentication error'
              );
            }
          }

          // Mark initialization as completed even on error
          initializationState.current.completed = true;
        } finally {
          // Clear initialization promise when done but preserve completion state
          initializationState.current.promise = null;
        }
      })();

      // Wait for initialization to complete
      await initializationState.current.promise;
    };

    // Set up auth state listener with error boundaries
    const setupAuthListener = () => {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(
        async (event: AuthChangeEvent, session: Session | null) => {
          logger.auth(`Auth state change: ${event}`, session?.user?.id);

          if (!isMounted) {
            logger.auth('Component unmounted during auth state change');
            return;
          }

          try {
            if (event === 'SIGNED_IN' && session?.user) {
              logger.user(`User signed in: ${session.user.id}`);
              setUser(session.user);
              setError(null);

              // Reset retry counters for new user
              retryAttempts.current.clear();

              // Set loading to false IMMEDIATELY when user signs in
              logger.auth(
                'Setting loading to false immediately after SIGNED_IN'
              );
              setLoading(false);

              // PHASE 4.3: Create immediate profile from user metadata
              const immediateProfile = createImmediateProfile(session.user);
              setProfile(immediateProfile);
              logger.success('✅ Immediate profile created from user metadata');

              // PHASE 4.4: Progressive profile loading - fetch detailed data in background (non-blocking)
              setTimeout(async () => {
                if (!isMounted) return;

                try {
                  logger.db(
                    `🔄 Starting background detailed profile fetch for user: ${session.user.id}`
                  );

                  let detailedProfileData = null;
                  if (
                    fetchProfileRef.current &&
                    typeof fetchProfileRef.current === 'function'
                  ) {
                    detailedProfileData = await fetchProfileRef.current(
                      session.user.id
                    );
                  } else {
                    logger.error(
                      'fetchProfileRef.current is not set or not a function'
                    );
                  }

                  // Only update if we got detailed data and component is still mounted
                  if (import.meta.env.DEV) {
                    console.log('[AuthProvider] After fetchProfile:', {
                      hasDetailedProfile: !!detailedProfileData,
                      isMounted,
                      termsAccepted: detailedProfileData?.terms_accepted_at,
                      termsVersion: detailedProfileData?.terms_version_accepted,
                    });
                  }

                  if (detailedProfileData && isMounted) {
                    setProfile(detailedProfileData);
                    logger.success(
                      '✅ Detailed profile loaded from database - replacing immediate profile'
                    );
                  } else if (isMounted) {
                    logger.warn(
                      '⚠️ Detailed profile fetch returned null - keeping immediate profile'
                    );
                  } else {
                    logger.warn(
                      '⚠️ Component unmounted before detailed profile could be set'
                    );
                  }
                } catch (profileError) {
                  logger.error(
                    'Background detailed profile fetch error:',
                    profileError
                  );
                  logger.auth(
                    'Keeping immediate profile - detailed fetch failed'
                  );
                  // Keep the immediate profile - don't set to null
                }
              }, 100); // Small delay to ensure immediate profile is set first
            } else if (event === 'SIGNED_OUT') {
              logger.auth('User signed out');
              setUser(null);
              setProfile(null);
              setError(null);
              setLoading(false);

              // Clear retry counters and cache
              retryAttempts.current.clear();
              profileCache.current.clear();
            } else if (event === 'TOKEN_REFRESHED') {
              logger.auth('Token refreshed - no profile fetch needed');
            }
          } catch (authError) {
            logger.error('Auth state change error:', authError);
            // Don't crash the app on auth state errors
            if (isMounted) {
              setError(
                authError instanceof Error
                  ? authError.message
                  : 'Authentication error'
              );
            }
          }
        }
      );

      authSubscription = subscription;
      logger.auth('Auth state listener established');
    };

    // Initialize everything
    getInitialSession();
    setupAuthListener();

    // Cleanup function
    return () => {
      logger.auth('Cleaning up AuthProvider...');
      isMounted = false;

      if (authSubscription) {
        authSubscription.unsubscribe();
        authSubscription = null;
      }

      // Clear retry counters and cache - capture ref values to avoid warning
      const currentRetryAttempts = retryAttempts.current;
      const currentProfileCache = profileCache.current;
      currentRetryAttempts.clear();
      currentProfileCache.clear();
    };
  }, [logger]); // Include logger to satisfy exhaustive-deps

  const value: AuthContextType = {
    user,
    profile,
    loading,
    error,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
