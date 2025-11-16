# CRITICAL BUG FIX: Missing User ID Filter in Subscription Queries

## Date

November 16, 2025

## Severity

🚨 **CRITICAL** - Production blocking

## Bug Description

New users were seeing existing users' subscription data (trial status, trial end dates) even though they had no subscription in the database.

### Symptoms

1. Brand new user creates account
2. User immediately sees "Trial Active" badge in navigation
3. Subscription page shows "Current Subscription" with another user's trial end date
4. Database shows no subscription record for the new user

### Example

- **New User:** mac@example.com (ID: `c01ce45a-9656-403a-b279-5dc345cc7d6a`)
- **Displayed Trial End:** 11/23/2025 (belonged to Alice Baker)
- **Database Status:** NO subscription record for mac@example.com

## Root Cause

The Supabase queries in `useSubscriptionStatus()` and `useSubscription()` hooks were **missing the user ID filter**.

**File:** `src/hooks/useSubscription.ts`

### useSubscriptionStatus() - Lines 49-53 (BEFORE)

```typescript
const { data, error } = await supabase
  .from('user_subscription_status')
  .select('*')
  .maybeSingle(); // ❌ NO FILTER - returns first subscription found
```

**Result:** Query returned the first row in `user_subscription_status` view (Alice's subscription) for EVERY user.

### useSubscription() - Lines 102-106 (BEFORE)

```typescript
const { data, error } = await supabase
  .from('user_subscriptions')
  .select('*')
  .maybeSingle(); // ❌ NO FILTER - returns first subscription found
```

**Result:** Query returned the first row in `user_subscriptions` table for EVERY user.

## Fix Applied

Added `.eq('user_id', user.id)` to both queries to filter by the authenticated user's ID.

### useSubscriptionStatus() - Lines 49-53 (AFTER)

```typescript
const { data, error } = await supabase
  .from('user_subscription_status')
  .select('*')
  .eq('user_id', user.id) // ✅ FILTER BY USER ID
  .maybeSingle();
```

### useSubscription() - Lines 102-106 (AFTER)

```typescript
const { data, error } = await supabase
  .from('user_subscriptions')
  .select('*')
  .eq('user_id', user.id) // ✅ FILTER BY USER ID
  .maybeSingle();
```

## Why This Wasn't Caught Earlier

1. **Initial Development:** Tested with single user (Alice) - worked fine
2. **No Multi-User Testing:** Never tested user switching or new user creation
3. **Cache Confusion:** Initially thought it was a React Query caching issue
4. **Production URL Testing:** User tested on production first (which didn't have the fix)

## How It Was Discovered

1. User reported: "Every new user is automatically on a trial"
2. Cleared cache, hard refresh, new browser - issue persisted
3. Database queries confirmed new users had NO subscription
4. Debug panel revealed: new user's UI showed different user's `user_id` in subscription data
5. Examined queries and found missing `.eq('user_id', user.id)`

## Testing Verification

### Before Fix

```javascript
// New user: mac@example.com (ID: c01ce45a-9656-403a-b279-5dc345cc7d6a)
Status: {
  user_id: "b5a39943-724b-4dc9-b2d8-006afae23eb9",  // ❌ Alice's ID!
  status: "trialing",
  trial_end: "2025-11-23T19:20:28+00:00",  // ❌ Alice's trial!
  has_access: true,
  is_in_trial: true
}
```

### After Fix

```javascript
// New user: mac@example.com (ID: c01ce45a-9656-403a-b279-5dc345cc7d6a)
Status: null; // ✅ Correct - no subscription
Subscription: null; // ✅ Correct - no subscription
hasActiveSubscription: undefined; // ✅ Correct - falsy
isInTrial: undefined; // ✅ Correct - falsy
```

## Impact

### Before Fix (BROKEN)

- ❌ All users saw same subscription data
- ❌ New users appeared to have active trials
- ❌ Users couldn't subscribe (thought they were already subscribed)
- ❌ Privacy violation (showing other users' data)
- ❌ **PRODUCTION BLOCKING**

### After Fix (WORKING)

- ✅ Each user sees only their own subscription data
- ✅ New users see "Upgrade to Premium"
- ✅ Users can subscribe correctly
- ✅ No data leakage between users
- ✅ **Production ready**

## Related Fixes

This was the ACTUAL root cause. Previous attempted fixes were red herrings:

1. **React Query Cache Invalidation** (`REACT_QUERY_CACHE_INVALIDATION_FIX.md`)
   - Added `queryClient.clear()` on sign in/out
   - Good practice, but didn't fix this bug
   - Queries were returning wrong data regardless of cache

2. **User ID in Query Keys** (`CROSS_USER_CACHE_FIX.md`)
   - Added `user?.id` to query keys
   - Good practice, but didn't fix this bug
   - Queries were still not filtering by user ID

3. **Profile Cache Duration** (`PROFILE_CACHE_FIX.md`)
   - Reduced cache time to 30 seconds
   - Good practice, unrelated to this bug

## Lessons Learned

1. **Always filter by user ID** in RLS-protected queries
2. **Test with multiple users** before assuming features work
3. **Check database directly** when frontend shows unexpected data
4. **Debug panels are essential** for identifying data mismatches
5. **Caching issues look similar** to query filter issues - verify actual query

## Checklist for Future Subscription Queries

When adding new subscription-related queries:

```typescript
// ✅ CORRECT Pattern
const { data } = await supabase
  .from('user_subscriptions')
  .select('*')
  .eq('user_id', user.id) // 👈 ALWAYS FILTER BY USER ID
  .maybeSingle();

// ❌ WRONG Pattern
const { data } = await supabase
  .from('user_subscriptions')
  .select('*')
  .maybeSingle(); // 👈 MISSING FILTER - WILL RETURN WRONG DATA
```

## Production Deployment

This fix is **CRITICAL** and must be deployed immediately:

1. ✅ Fix verified in localhost
2. ⏳ Verify with multiple test users locally
3. ⏳ Deploy to production
4. ⏳ Test in production with multiple accounts
5. ⏳ Monitor for any issues

## Status

✅ **FIXED** in local development  
⏳ Pending production deployment

## Files Modified

- `src/hooks/useSubscription.ts` (lines 52 and 105)
