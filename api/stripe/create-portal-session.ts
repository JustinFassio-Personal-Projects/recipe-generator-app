import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

/**
 * Create Stripe Customer Portal Session
 *
 * This endpoint creates a Stripe billing portal session URL that allows users to:
 * - Cancel their subscription
 * - Update payment methods
 * - View billing history
 * - Download invoices
 *
 * The portal is hosted by Stripe and handles all subscription management securely.
 */

// Load environment variables for local development
const loadEnv = () => {
  const isActualProduction =
    process.env.NODE_ENV === 'production' &&
    process.env.VERCEL_ENV === 'production';

  if (!isActualProduction) {
    try {
      const envLocalPath = resolve(process.cwd(), '.env.local');
      const envPath = resolve(process.cwd(), '.env');

      const envLocalResult = config({ path: envLocalPath, override: true });
      const envResult = config({ path: envPath, override: false });

      if (envLocalResult.parsed || envResult.parsed) {
        console.log('[PortalSession] Loaded .env files for local development');
      }
    } catch (error) {
      console.warn(
        '[PortalSession] Failed to load .env files (OK if using Vercel env vars):',
        error
      );
    }
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Load environment variables
    loadEnv();

    // Only allow POST requests
    if (req.method !== 'POST') {
      res.setHeader('Content-Type', 'application/json');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get environment variables
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
    const supabaseUrl =
      process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim();
    const supabaseAnonKey =
      process.env.SUPABASE_ANON_KEY?.trim() ||
      process.env.VITE_SUPABASE_ANON_KEY?.trim();
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (
      !stripeSecretKey ||
      !supabaseUrl ||
      !supabaseAnonKey ||
      !supabaseServiceKey
    ) {
      const missingVars = [];
      if (!stripeSecretKey) missingVars.push('STRIPE_SECRET_KEY');
      if (!supabaseUrl) missingVars.push('SUPABASE_URL or VITE_SUPABASE_URL');
      if (!supabaseAnonKey)
        missingVars.push('SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY');
      if (!supabaseServiceKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');

      console.error(
        '[PortalSession] Missing required environment variables:',
        missingVars
      );
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({
        error: 'Server configuration error',
        details: `Missing required environment variables: ${missingVars.join(', ')}`,
      });
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-09-30.clover',
    });

    // Verify user authentication
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.error('[PortalSession] No authorization header provided');
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAnonClient = createClient(supabaseUrl, supabaseAnonKey);
    const {
      data: { user },
      error: authError,
    } = await supabaseAnonClient.auth.getUser(token);

    if (authError || !user) {
      console.error(
        '[PortalSession] Authentication failed:',
        authError?.message || 'No user'
      );
      return res.status(401).json({
        error: 'Unauthorized',
        details: authError?.message || 'No user found',
      });
    }

    console.log('[PortalSession] Authenticated as:', user.email);

    // Use service role client to get subscription
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's subscription to find their Stripe customer ID
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('stripe_customer_id, status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (subError) {
      console.error('[PortalSession] Database error:', subError);
      return res.status(500).json({
        error: 'Database error',
        details: subError.message,
      });
    }

    if (!subscription || !subscription.stripe_customer_id) {
      console.error('[PortalSession] No subscription found for user:', user.id);
      return res.status(404).json({
        error: 'No subscription found',
        details:
          'You need an active subscription to access the customer portal. Please subscribe first.',
      });
    }

    console.log(
      '[PortalSession] Found customer ID:',
      subscription.stripe_customer_id
    );

    // Validate customer exists in Stripe before creating portal session
    // This prevents errors with test/invalid customer IDs
    try {
      const customer = await stripe.customers.retrieve(
        subscription.stripe_customer_id
      );

      if (customer.deleted) {
        console.error(
          '[PortalSession] Customer has been deleted in Stripe:',
          subscription.stripe_customer_id
        );
        return res.status(400).json({
          error: 'Customer account deleted',
          details:
            'Your customer account has been deleted in Stripe. Please contact support to resolve this issue.',
        });
      }

      console.log('[PortalSession] Verified customer exists in Stripe');
    } catch (stripeError: unknown) {
      const error = stripeError as { message?: string; code?: string };
      console.error(
        '[PortalSession] Failed to retrieve customer from Stripe:',
        {
          customerId: subscription.stripe_customer_id,
          error: error.message,
          code: error.code,
        }
      );

      // Handle specific Stripe errors
      if (error.code === 'resource_missing') {
        return res.status(400).json({
          error: 'Invalid customer account',
          details:
            'Your customer account could not be found in Stripe. This may be due to test data. Please subscribe again or contact support.',
          debug: {
            customerId: subscription.stripe_customer_id,
            suggestion:
              'This subscription may contain test data. Please create a new subscription.',
          },
        });
      }

      // Re-throw other Stripe errors
      throw stripeError;
    }

    // Get origin for return URL
    const origin =
      req.headers.origin || req.headers.referer || 'http://localhost:5174';
    // Remove trailing slash and any path from origin
    const baseOrigin = origin.split('?')[0].replace(/\/$/, '');
    const returnUrl = `${baseOrigin}/subscription`;

    console.log(
      '[PortalSession] Creating portal session with return URL:',
      returnUrl
    );

    // Create Stripe billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: returnUrl,
    });

    console.log('[PortalSession] ✅ Portal session created:', portalSession.id);

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      url: portalSession.url,
      sessionId: portalSession.id,
    });
  } catch (error) {
    console.error('[PortalSession] Unhandled error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (res.headersSent) {
      console.error('[PortalSession] Response already sent');
      return;
    }

    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
      details: 'Failed to create portal session',
    });
  }
}
