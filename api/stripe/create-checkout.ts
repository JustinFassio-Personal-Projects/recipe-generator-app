import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local for local development (Vercel dev should auto-load but doesn't always)
// Load in handler to ensure it runs in serverless context
const loadEnv = () => {
  // Determine if we're in actual production deployment
  // VERCEL_ENV can be undefined, 'development', 'preview', or 'production'
  // When running `vercel dev`, VERCEL_ENV is typically 'development' or undefined
  // VERCEL=1 is set in production deployments, but also in vercel dev sometimes
  const isActualProduction =
    process.env.NODE_ENV === 'production' &&
    process.env.VERCEL_ENV === 'production';

  // Always try to load .env.local when not in actual production
  // This ensures local development works even if Vercel dev doesn't auto-load
  if (!isActualProduction) {
    try {
      // Try .env.local first (highest priority), then .env
      const envLocalPath = resolve(process.cwd(), '.env.local');
      const envPath = resolve(process.cwd(), '.env');

      // Use override: true for .env.local to ensure it takes precedence
      // Then load .env with override: false so .env.local values aren't overwritten
      const envLocalResult = config({ path: envLocalPath, override: true });
      const envResult = config({ path: envPath, override: false });

      if (envLocalResult.parsed || envResult.parsed) {
        console.log('[Checkout] Loaded .env files for local development', {
          loadedLocal: !!envLocalResult.parsed,
          loadedEnv: !!envResult.parsed,
          nodeEnv: process.env.NODE_ENV,
          vercelEnv: process.env.VERCEL_ENV,
        });
      }
    } catch (error) {
      // Don't fail if .env files don't exist - they might be in Vercel env vars
      console.warn(
        '[Checkout] Failed to load .env files (this is OK if using Vercel env vars):',
        error
      );
    }
  } else {
    console.log('[Checkout] Running in production, skipping .env file loading');
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
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
      const missingVars = [];
      if (!stripeSecretKey) missingVars.push('STRIPE_SECRET_KEY');
      if (!supabaseUrl) missingVars.push('SUPABASE_URL or VITE_SUPABASE_URL');
      if (!supabaseServiceKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
      if (!priceId) missingVars.push('STRIPE_PRICE_ID');

      // Get all available env vars for debugging
      const availableEnvVars = Object.keys(process.env).filter(
        (k) => k.includes('SUPABASE') || k.includes('STRIPE')
      );
      const availableEnvVarsWithValues = availableEnvVars.reduce(
        (acc, key) => {
          const value = process.env[key];
          // Only show first few chars of sensitive values
          acc[key] = value ? `${value.substring(0, 10)}...` : 'undefined';
          return acc;
        },
        {} as Record<string, string>
      );

      console.error('[Checkout] Missing required environment variables:', {
        missing: missingVars,
        hasStripeKey: !!stripeSecretKey,
        hasSupabaseUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey,
        hasPriceId: !!priceId,
        availableEnvVars,
        availableEnvVarsWithValues,
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        vercel: process.env.VERCEL,
        cwd: process.cwd(),
      });

      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({
        error: 'Stripe not configured',
        details: `Missing required environment variables: ${missingVars.join(', ')}. Please ensure these are set in .env.local for local development or in Vercel environment variables for production.`,
        missingVariables: missingVars,
        debug: {
          hasStripeKey: !!stripeSecretKey,
          hasSupabaseUrl: !!supabaseUrl,
          hasServiceKey: !!supabaseServiceKey,
          hasPriceId: !!priceId,
          nodeEnv: process.env.NODE_ENV,
          vercelEnv: process.env.VERCEL_ENV,
          availableEnvVarNames: availableEnvVars,
        },
      });
    }

    // Get Supabase anon key for JWT verification
    const supabaseAnonKey =
      process.env.SUPABASE_ANON_KEY?.trim() ||
      process.env.VITE_SUPABASE_ANON_KEY?.trim();

    if (!supabaseAnonKey) {
      const availableEnvVars = Object.keys(process.env).filter(
        (k) => k.includes('SUPABASE') || k.includes('ANON')
      );
      console.error(
        '[Checkout] Missing Supabase anon key for JWT verification',
        {
          availableEnvVars,
          nodeEnv: process.env.NODE_ENV,
          vercelEnv: process.env.VERCEL_ENV,
        }
      );
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({
        error: 'Server configuration error',
        details:
          'Missing Supabase anon key. Please set SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY in .env.local for local development or in Vercel environment variables for production.',
        debug: {
          availableEnvVarNames: availableEnvVars,
          nodeEnv: process.env.NODE_ENV,
          vercelEnv: process.env.VERCEL_ENV,
        },
      });
    }

    // Initialize clients inside handler
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-09-30.clover',
    });

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
    // This catch block handles errors from the entire handler
    console.error('[Checkout] Unhandled error in checkout handler:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      errorType: error?.constructor?.name,
      errorString: String(error),
    });

    // Ensure we always return a valid JSON response
    try {
      // Check if response has already been sent
      if (res.headersSent) {
        console.error(
          '[Checkout] Response already sent, cannot send error response'
        );
        return;
      }

      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
        details:
          error instanceof Error
            ? error.stack?.split('\n').slice(0, 5).join('\n')
            : 'Unknown error occurred',
      });
    } catch (responseError) {
      // If we can't send JSON response, log and try plain text
      console.error('[Checkout] Failed to send error response:', responseError);
      if (!res.headersSent) {
        return res
          .status(500)
          .send(
            `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
      }
    }
  }
}
