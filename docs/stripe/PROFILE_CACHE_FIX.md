# Profile Cache Fix - Persistent Issue Resolution

## Problem

Users returning from Stripe checkout were experiencing a persistent issue where their profile data would show as `null` even though they were authenticated. This was causing the profile page to get stuck in a loading state with "Loading profile data..." message.

## Root Cause

The `AuthProvider` was caching profile data for **5 minutes** to prevent unnecessary re-fetches. When users returned from external pages (like Stripe checkout), the cached profile was stale, and no refresh was triggered to clear it.

This was similar to the subscription caching issue we fixed earlier, but was affecting the profile data specifically.

## Solution

### 1. Reduced Profile Cache Duration

**File**: `src/contexts/AuthProvider.tsx`

Changed the profile cache duration from 5 minutes to 30 seconds:

```typescript
// Before:
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// After:
const CACHE_DURATION_MS = 30 * 1000; // 30 seconds (was 5 minutes - too long!)
```

### 2. Added Profile Refresh in SubscriptionSuccessPage

**File**: `src/pages/SubscriptionSuccessPage.tsx`

Added `refreshProfile()` calls in two places:

1. **On component mount** - to immediately refresh profile when returning from Stripe
2. **After subscription verification** - to ensure profile is in sync with subscription

```typescript
import { useAuth } from '@/contexts/AuthProvider';

export function SubscriptionSuccessPage() {
  const { refreshProfile } = useAuth();

  useEffect(() => {
    // CRITICAL FIX: Refresh profile when returning from Stripe to clear stale cache
    console.log(
      '[SubscriptionSuccess] Refreshing profile to clear stale cache'
    );
    refreshProfile();

    // ... other initialization code
  }, [queryClient, refreshProfile]);

  // Also refresh after subscription verification
  verifySubscription.mutate(
    { session_id: sessionId },
    {
      onSuccess: () => {
        // Refresh subscription status
        queryClient.invalidateQueries({ queryKey: ['subscription'] });
        queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
        // Refresh profile again to ensure it's in sync
        refreshProfile();
      },
    }
  );
}
```

### 3. Added Profile Refresh in ProfilePage

**File**: `src/pages/profile-page.tsx`

Added `refreshProfile()` call when the profile page mounts to ensure fresh data:

```typescript
export default function ProfilePage() {
  const {
    user,
    profile,
    loading: authLoading,
    error: authError,
    refreshProfile,
  } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const loadData = async () => {
      try {
        // CRITICAL FIX: Refresh profile when navigating to profile page to clear stale cache
        // This ensures fresh data after returning from external pages (like Stripe)
        refreshProfile();

        // ... load other data
      } catch {
        // Error handling
      }
    };

    loadData();
  }, [user?.id, refreshProfile]);
}
```

## Testing

### Before Fix

1. User completes Stripe checkout
2. Returns to success page
3. Navigates to profile page
4. **BUG**: Profile shows as `null`, page stuck in loading state
5. User sees "Loading profile data..." forever

### After Fix

1. User completes Stripe checkout
2. Returns to success page → **Profile refreshed automatically**
3. Navigates to profile page → **Profile refreshed again**
4. **FIXED**: Profile loads correctly with all data
5. User sees their profile information immediately

## Related Issues

This fix is related to the subscription caching issue we fixed earlier:

- **Subscription Cache Fix**: Reduced `staleTime` from 5 minutes to 30 seconds in `useSubscription.ts`
- **Profile Cache Fix**: Reduced `CACHE_DURATION_MS` from 5 minutes to 30 seconds in `AuthProvider.tsx`

Both fixes ensure that critical user data is always fresh, especially after external interactions like payment processing.

## Impact

✅ **Profile data now loads correctly** after returning from Stripe
✅ **No more stuck loading states** on profile page
✅ **Consistent behavior** across subscription and profile data
✅ **Better UX** with fresh data when users navigate

## Prevention

To prevent similar caching issues in the future:

1. **Keep cache durations short for critical user data** (30 seconds max)
2. **Always refresh data after external interactions** (Stripe, OAuth, etc.)
3. **Add `refetchOnMount: 'always'`** for React Query queries of critical data
4. **Document cache durations** with comments explaining why they were chosen

## Files Modified

1. `src/contexts/AuthProvider.tsx` - Reduced profile cache duration
2. `src/pages/SubscriptionSuccessPage.tsx` - Added profile refresh calls
3. `src/pages/profile-page.tsx` - Added profile refresh on mount

## Date

January 16, 2025
