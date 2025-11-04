import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local for local development (Vercel dev should auto-load but doesn't always)
// Load in handler to ensure it runs in serverless context
const loadEnv = () => {
  if (
    process.env.NODE_ENV !== 'production' ||
    process.env.VERCEL_ENV === 'development'
  ) {
    try {
      config({ path: resolve(process.cwd(), '.env.local'), override: false });
      config({ path: resolve(process.cwd(), '.env'), override: false });
    } catch (error) {
      console.warn('[Checkout] Failed to load .env files:', error);
    }
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Load environment variables at request time
  loadEnv();

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check environment variables
  // For server-side API routes, check both prefixed (VITE_*) and non-prefixed versions
  // Vercel dev may not expose VITE_* variables to serverless functions
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
  const supabaseUrl =
    process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim();
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const priceId = process.env.STRIPE_PRICE_ID?.trim();

  if (!stripeSecretKey || !supabaseUrl || !supabaseServiceKey || !priceId) {
    console.error('Missing required environment variables:', {
      hasStripeKey: !!stripeSecretKey,
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      hasPriceId: !!priceId,
      envKeys: Object.keys(process.env).filter(
        (k) => k.includes('SUPABASE') || k.includes('STRIPE')
      ),
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
    });
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      error: 'Stripe not configured',
      details: 'Missing required environment variables',
      debug: {
        hasStripeKey: !!stripeSecretKey,
        hasSupabaseUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey,
        hasPriceId: !!priceId,
      },
    });
  }

  // Get Supabase anon key for JWT verification
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY?.trim() ||
    process.env.VITE_SUPABASE_ANON_KEY?.trim();

  if (!supabaseAnonKey) {
    console.error('Missing Supabase anon key for JWT verification');
    return res.status(500).json({
      error: 'Server configuration error',
      details: 'Missing Supabase anon key',
    });
  }

  // Initialize clients inside handler
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2025-09-30.clover',
  });

  try {
    // Get authorization token
    const authHeader = req.headers.authorization;
    console.log('[Checkout] Auth header present:', !!authHeader);

    if (!authHeader) {
      console.error('[Checkout] No authorization header provided');
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('[Checkout] Token length:', token.length);

    // Verify user JWT with anon key client (this is the correct way)
    // Service role key can't verify user JWTs - it bypasses auth entirely
    const supabaseAnonClient = createClient(supabaseUrl, supabaseAnonKey);
    const {
      data: { user },
      error: authError,
    } = await supabaseAnonClient.auth.getUser(token);
    console.log('[Checkout] Auth error:', authError);
    console.log('[Checkout] User found:', !!user);

    if (authError || !user) {
      console.error(
        '[Checkout] Authentication failed:',
        authError?.message || 'No user'
      );
      return res.status(401).json({
        error: 'Unauthorized',
        details: authError?.message || 'No user found',
      });
    }

    console.log('[Checkout] Authenticated as:', user.email);

    // Use service role client for database operations that bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user already has a subscription
    const { data: existingSubscription } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (existingSubscription && existingSubscription.status === 'active') {
      return res
        .status(400)
        .json({ error: 'User already has an active subscription' });
    }

    // Get or create Stripe customer
    let customerId = existingSubscription?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;
    }

    // Get origin for redirect URLs
    const origin = req.headers.origin || 'http://localhost:5174';

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          supabase_user_id: user.id,
        },
      },
      success_url: `${origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/subscription`,
      metadata: {
        supabase_user_id: user.id,
      },
      allow_promotion_codes: true, // Allow coupon codes
    });

    if (!session.url) {
      console.error('[Checkout] Stripe session created but no URL returned');
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({
        error: 'Failed to create checkout session',
        details: 'Stripe did not return a checkout URL',
      });
    }

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
