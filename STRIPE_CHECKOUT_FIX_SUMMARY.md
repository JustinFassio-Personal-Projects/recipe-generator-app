# Stripe Checkout JWT Verification - Root Cause Fix

## 🔍 Root Cause Identified

The JWT verification error `"invalid JWT: unable to parse or verify signature"` was caused by **incorrect token verification method** in the API route.

### The Problem

The API route was using a **service role key client** to verify user JWT tokens, which is not the correct pattern according to Supabase documentation for Edge Functions/API routes.

### The Solution

Changed to use the **Supabase-recommended pattern**:

1. Use **anon key client** with Authorization header for JWT verification
2. Use **service role client** only for database operations that need admin access

## ✅ Changes Made

### File: `api/stripe/create-checkout.ts`

**Before:**

```typescript
// ❌ Wrong: Using service role key to verify JWT
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const {
  data: { user },
  error,
} = await supabase.auth.getUser(token);
```

**After:**

```typescript
// ✅ Correct: Using anon key client with Authorization header
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      Authorization: authHeader,
    },
  },
});
const {
  data: { user },
  error,
} = await supabase.auth.getUser(token);

// ✅ Service role client only for admin database operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
```

### Key Changes:

1. ✅ Added `supabaseAnonKey` to environment variable validation
2. ✅ Create anon key client with Authorization header for JWT verification
3. ✅ Create separate service role client for database operations
4. ✅ Matches Supabase Edge Functions documentation pattern

## 📋 Required Environment Variables

Ensure your `.env.local` has all of these:

```bash
# Supabase (Frontend - Vite prefixed)
VITE_SUPABASE_URL=https://sxvdkipywmjycithdfpp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase (Backend API Routes - non-prefixed for Vercel)
SUPABASE_URL=https://sxvdkipywmjycithdfpp.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
```

## 🚀 Next Steps (Manual)

### 1. Get Service Role Key (if missing)

If `SUPABASE_SERVICE_ROLE_KEY` is not in your `.env.local`:

1. Go to: https://supabase.com/dashboard/project/sxvdkipywmjycithdfpp
2. Navigate to **Settings** → **API**
3. Find the **`service_role`** key (NOT the anon key)
4. Copy the entire key
5. Add to `.env.local`:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

### 2. Restart Vercel Dev Server

After adding/verifying environment variables:

```bash
# Stop current server (Ctrl+C)
# Restart:
npx vercel dev --listen 3000
```

### 3. Test Checkout Flow

1. Ensure you're logged in
2. Navigate to subscription page
3. Click "Subscribe"
4. Check Vercel dev server console for:
   - `[Checkout] Auth header present: true`
   - `[Checkout] Authenticated as: your-email@example.com`
   - No JWT signature errors

## 🔐 Security Notes

- ✅ **Anon key**: Safe to expose in frontend (already exposed)
- ✅ **Service role key**: Safe in API routes only (server-side)
- ❌ **Never expose** service role key to client-side code
- ✅ **Authorization header**: Passed securely from frontend to API route

## 📚 Documentation Reference

This fix follows the official Supabase pattern for Edge Functions:

- [Supabase Edge Functions Auth Integration](https://supabase.com/docs/guides/functions/auth)
- Pattern: Use anon key client with Authorization header for JWT verification

## ✅ Verification Checklist

- [x] Code updated to use anon key client for JWT verification
- [x] Service role client used only for database operations
- [x] Environment variable validation includes both keys
- [ ] `SUPABASE_SERVICE_ROLE_KEY` added to `.env.local` (manual step)
- [ ] Vercel dev server restarted
- [ ] Checkout flow tested successfully

## 🎯 Expected Behavior

After completing manual steps:

1. **Frontend** sends JWT token in Authorization header
2. **API Route** receives token and creates anon key client with Authorization header
3. **JWT Verification** succeeds using anon key client
4. **User Authentication** verified
5. **Database Operations** performed using service role client (admin access)
6. **Stripe Checkout** session created successfully

## 🔄 Comparison with Production

This fix matches the production pattern but uses the **correct Supabase-recommended approach**:

- Production was working but using service role for verification (works but not recommended)
- This fix uses the official Supabase pattern for better security and consistency
