# PR Summary: Fix Subscription, Terms, and Profile Loading Issues

## 🎯 Overview

This PR fixes critical issues preventing users from accessing premium features after subscription and incorrectly showing terms acceptance dialogs on every login.

## 🐛 Issues Fixed

### 1. Subscription Sync Failure

**Problem**: Users completing Stripe checkout weren't getting premium access because subscriptions weren't syncing to the database.

**Root Causes**:

- Stripe webhooks don't work in local development (can't reach localhost)
- `verify-session` endpoint had a bug passing subscription object instead of string to Stripe API
- Vercel dev server needed restart to pick up code changes

**Solution**:

- Created `/api/stripe/verify-session` endpoint for manual subscription sync
- Fixed Stripe API call to use expanded subscription object directly
- Added auto-verification on subscription success page
- Improved error handling and logging

### 2. Profile RLS Circular Dependency

**Problem**: Profile data wasn't loading, blocking subscription status checks.

**Root Cause**: RLS policy `profiles_select_same_tenant` required `user_tenant_id()` function, which itself needed to query profiles table → circular dependency.

**Solution**:

- Added `profiles_select_own` policy allowing users to SELECT their own profile
- This breaks the circular dependency and allows profile loading

### 3. Terms Acceptance Dialog Loop

**Problem**: Users who already accepted terms were seeing the acceptance dialog on every login.

**Root Causes**:

- `useTermsAcceptance` hook was checking incomplete "immediate profile" before database profile loaded
- Hook had early return that forgot to set `isLoading = false`

**Solution**:

- Added guard to wait for database profile with terms data before making decisions
- Fixed early return to properly set loading state
- Preserved terms data in immediate profile creation

### 4. Environment Variable Loading

**Problem**: Local checkout endpoint returning 500 errors due to missing environment variables.

**Root Cause**: `loadEnv()` function incorrectly identified `vercel dev` as production, preventing `.env.local` from loading.

**Solution**:

- Fixed production detection to only check `NODE_ENV === 'production' && VERCEL_ENV === 'production'`
- Improved error messages with available environment variable names
- Always load `.env.local` when not in actual production

## 📁 Files Changed

### New Files

- `api/stripe/verify-session.ts` - Manual subscription sync endpoint
- `src/hooks/useVerifySubscription.ts` - Hook for subscription verification
- `SUBSCRIPTION_SYNC_FIX.md` - Documentation of fixes
- `supabase/migrations/fix_profile_rls_select_own.sql` - RLS policy fix

### Modified Files

- `api/stripe/create-checkout.ts` - Fixed environment loading
- `api/stripe/webhook.ts` - Improved error handling
- `src/pages/SubscriptionSuccessPage.tsx` - Added auto-verification
- `src/hooks/useCreateCheckout.ts` - Improved error handling
- `src/hooks/useTermsAcceptance.ts` - Fixed premature terms check
- `src/contexts/AuthProvider.tsx` - Preserve terms in immediate profile
- `src/contexts/TenantContext.tsx` - Fixed TypeScript errors (unrelated)
- `src/lib/supabase.ts` - Removed unused variable

## ✅ Verification Checklist

- [x] **Linting**: All errors fixed
- [x] **TypeScript**: Compiles successfully
- [x] **Formatting**: Prettier compliant
- [x] **Build**: Production build succeeds
- [x] **Critical Path Tests**: All 12 tests passing
- [x] **Security**: No secrets in client code
- [x] **Database Migration**: Applied successfully

## 🧪 Testing

### Manual Testing Required

1. **Subscription Flow**:
   - Start checkout → Complete payment → Verify subscription syncs
   - Check database for subscription record
   - Verify user can save recipes without being blocked

2. **Terms Acceptance**:
   - Sign in as user who already accepted terms
   - Verify terms dialog does NOT appear
   - Sign in as new user → Verify terms dialog appears correctly

3. **Profile Loading**:
   - Sign in → Verify profile loads without errors
   - Check console for profile loading logs

## 🔒 Security Notes

- All Stripe operations use server-side API routes
- Service role keys only in server-side code
- No secrets exposed to client
- RLS policies properly configured

## 📊 Impact

- ✅ Users can now access premium features after subscription
- ✅ Terms acceptance dialog only shows when needed
- ✅ Profile loading works reliably
- ✅ Better error messages for debugging

## 🚀 Deployment Notes

1. **Database Migration**: `fix_profile_rls_select_own` must be applied
2. **Environment Variables**: Ensure all Stripe/Supabase vars are set
3. **Vercel Dev**: Restart server after deployment to pick up changes

## 📝 Related Issues

- Subscription sync not working in local dev
- Terms dialog showing on every login
- Profile not loading for some users
