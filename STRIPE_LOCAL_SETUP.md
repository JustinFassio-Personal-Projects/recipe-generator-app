# Stripe Checkout Local Setup Fix

## 🔴 Issue Found

The `SUPABASE_SERVICE_ROLE_KEY` is **missing** from your `.env.local` file. This is required for the API route to verify JWT tokens.

## ✅ Solution

### Step 1: Get Your Service Role Key

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/sxvdkipywmjycithdfpp
2. Navigate to **Settings** → **API**
3. Find the **service_role** key (NOT the anon key)
4. Copy the entire key (it's a long JWT string)

### Step 2: Add to .env.local

Add this line to your `.env.local` file:

```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Step 3: Also Add Stripe Keys (if missing)

Make sure you also have these in `.env.local`:

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
```

### Step 4: Restart Vercel Dev Server

After adding the keys, restart your Vercel dev server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npx vercel dev --listen 3000
```

## 🔍 Why This Fixes the Error

The error `"invalid JWT: unable to parse or verify signature"` occurs because:

1. **Frontend** creates a JWT token using the Supabase anon key
2. **API Route** tries to verify that token
3. **Without the service role key**, the API route can't verify the token's signature

The service role key has the JWT secret needed to verify tokens signed by the same Supabase project.

## ⚠️ Security Note

- ✅ **Service role key is safe** to use in API routes (server-side only)
- ❌ **Never expose** the service role key to the frontend/client-side code
- ✅ **Anon key is safe** to expose (already in your frontend code)

## 📋 Current .env.local Structure

Your `.env.local` should have:

```bash
# Supabase (Frontend)
VITE_SUPABASE_URL=https://sxvdkipywmjycithdfpp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase (Backend API Routes)
SUPABASE_URL=https://sxvdkipywmjycithdfpp.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # ← ADD THIS

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
```

## 🧪 Testing

After adding the service role key and restarting:

1. Make sure you're logged in
2. Try the checkout flow again
3. Check the Vercel dev server console for `[Checkout]` logs
4. You should see `[Checkout] Authenticated as: your-email@example.com`
