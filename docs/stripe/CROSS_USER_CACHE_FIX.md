# Cross-User Cache Contamination Fix

## Problem

**CRITICAL BUG**: When users switched accounts (logged out and logged in as a different user), they would see the previous user's subscription data. This was caused by React Query caching subscription data with keys that didn't include the user ID.

### Example

1. Alice logs in and subscribes → sees "Trial Active"
2. Alice logs out
3. Test User4 creates account and logs in
4. **BUG**: Test User4 sees "Trial Active" with Alice's trial end date (11/23/2025)

Even after clearing site data and hard refresh, the issue persisted because React Query cache wasn't user-specific.

## Root Cause

The subscription query keys were not user-specific:

```typescript
// BEFORE (BAD):
queryKey: ['subscription-status']; // Same key for all users!
queryKey: ['subscription']; // Same key for all users!
```

When a new user logged in, React Query would return the cached data from the previous user because the cache key matched.

## Solution

Added user ID to all subscription query keys to ensure each user gets their own isolated cache:

```typescript
// AFTER (GOOD):
queryKey: ['subscription-status', user?.id]; // Unique per user
queryKey: ['subscription', user?.id]; // Unique per user
```

Also added `enabled: !!user?.id` to prevent queries from running when no user is authenticated.

## Files Modified

### `src/hooks/useSubscription.ts`

1. **Import useAuth**: Added `import { useAuth } from '@/contexts/AuthProvider'`
2. **useSubscriptionStatus**:
   - Added `const { user } = useAuth()`
   - Changed `queryKey: ['subscription-status']` → `['subscription-status', user?.id]`
   - Added `enabled: !!user?.id`
   - Added guard `if (!user?.id) return null` in queryFn
3. **useSubscription**:
   - Added `const { user } = useAuth()`
   - Changed `queryKey: ['subscription']` → `['subscription', user?.id]`
   - Added `enabled: !!user?.id`
   - Added guard `if (!user?.id) return null` in queryFn

## Testing

### Before Fix

```bash
# 1. Alice logs in and subscribes
# 2. Alice logs out
# 3. Create Test User4
# 4. Test User4 sees Alice's subscription data ❌
```

### After Fix

```bash
# 1. Alice logs in and subscribes
# 2. Alice logs out
# 3. Create Test User4
# 4. Test User4 sees no subscription (correct) ✅
```

## Prevention

To prevent similar issues in the future:

1. **Always include user ID in query keys** for user-specific data:

   ```typescript
   queryKey: ['resource-name', user?.id];
   ```

2. **Use `enabled` flag** to prevent queries when data shouldn't load:

   ```typescript
   enabled: !!user?.id;
   ```

3. **Guard queryFn** with early returns:

   ```typescript
   queryFn: async () => {
     if (!user?.id) return null;
     // ... query logic
   };
   ```

4. **Test user switching** during QA to catch cache contamination bugs

## Impact

✅ **Resolves cross-user cache contamination**  
✅ **Prevents showing wrong subscription data**  
✅ **Ensures data privacy between users**  
✅ **No more "every new user is subscribed" bug**

## Related Issues

- **Profile Cache Fix** (`PROFILE_CACHE_FIX.md`) - Reduced cache duration
- **Subscription Cache Fix** (`EMERGENCY_FIX_SUBSCRIPTION_CACHE.md`) - Reduced staleTime

All three fixes work together to ensure:

1. Fresh data (reduced cache times)
2. User-specific data (user ID in keys)
3. No cross-user contamination (isolated caches)

## Date

November 16, 2025

## Status

✅ **RESOLVED** - User-specific query keys implemented
