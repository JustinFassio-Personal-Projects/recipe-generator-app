import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

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
        console.log('[VerifySession] Loaded .env files for local development');
      }
    } catch (error) {
      console.warn('[VerifySession] Failed to load .env files:', error);
    }
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    loadEnv();

    if (req.method !== 'POST') {
      res.setHeader('Content-Type', 'application/json');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get session_id from request body
    const { session_id } = req.body as { session_id?: string };

    if (!session_id) {
      return res.status(400).json({ error: 'Missing session_id' });
    }

    // Get environment variables
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
    const supabaseUrl =
      process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim();
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    const supabaseAnonKey =
      process.env.SUPABASE_ANON_KEY?.trim() ||
      process.env.VITE_SUPABASE_ANON_KEY?.trim();

    if (
      !stripeSecretKey ||
      !supabaseUrl ||
      !supabaseServiceKey ||
      !supabaseAnonKey
    ) {
      const missingVars = [];
      if (!stripeSecretKey) missingVars.push('STRIPE_SECRET_KEY');
      if (!supabaseUrl) missingVars.push('SUPABASE_URL or VITE_SUPABASE_URL');
      if (!supabaseServiceKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
      if (!supabaseAnonKey)
        missingVars.push('SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY');

      console.error(
        '[VerifySession] Missing required environment variables:',
        missingVars
      );
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
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAnonClient = createClient(supabaseUrl, supabaseAnonKey);
    const {
      data: { user },
      error: authError,
    } = await supabaseAnonClient.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        error: 'Unauthorized',
        details: authError?.message || 'No user found',
      });
    }

    console.log('[VerifySession] Verifying session for user:', user.email);

    // Retrieve checkout session from Stripe with subscription and customer expanded
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['subscription', 'customer'],
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Verify this session belongs to the authenticated user
    // Method 1: Check metadata (for app-created checkouts)
    const sessionUserId = session.metadata?.supabase_user_id;

    // Method 2: Check customer email (for Payment Links and app-created checkouts)
    const customerEmail =
      typeof session.customer === 'object' && session.customer
        ? session.customer.email
        : session.customer_details?.email;

    const isOwner = sessionUserId === user.id || customerEmail === user.email;

    if (!isOwner) {
      console.error('[VerifySession] Ownership verification failed:', {
        sessionUserId,
        expectedUserId: user.id,
        customerEmail,
        expectedEmail: user.email,
      });
      return res.status(403).json({ error: 'Session does not belong to user' });
    }

    console.log('[VerifySession] ✅ Ownership verified for user:', user.email);

    // Check if subscription already exists in database
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: existingSubscription } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingSubscription) {
      console.log(
        '[VerifySession] Subscription already exists, returning existing data'
      );
      return res.status(200).json({
        success: true,
        subscription: existingSubscription,
        message: 'Subscription already synced',
      });
    }

    // Get subscription details from Stripe
    if (!session.subscription) {
      return res.status(400).json({ error: 'No subscription in session' });
    }

    // Since we expanded subscription, it's already an object - use it directly
    const subscription = session.subscription as Stripe.Subscription & {
      current_period_start: number;
      current_period_end: number;
    };

    console.log('[VerifySession] Retrieved subscription from Stripe:', {
      subscriptionId: subscription.id,
      status: subscription.status,
      customerId: subscription.customer,
    });

    // Extract customer ID (session.customer can be an object if expanded)
    const customerId =
      typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id || null;

    // Sync subscription to database
    const { data: subscriptionData, error: dbError } = await supabaseAdmin
      .from('user_subscriptions')
      .upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        stripe_price_id: subscription.items.data[0]?.price?.id,
        status: subscription.status,
        trial_start: subscription.trial_start
          ? new Date(subscription.trial_start * 1000).toISOString()
          : null,
        trial_end: subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null,
        current_period_start: subscription.current_period_start
          ? new Date(subscription.current_period_start * 1000).toISOString()
          : new Date().toISOString(), // Fallback to now if missing
        current_period_end: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Fallback to 30 days from now
        cancel_at_period_end: subscription.cancel_at_period_end,
      })
      .select()
      .single();

    if (dbError) {
      console.error('[VerifySession] Database operation failed:', dbError);
      return res.status(500).json({
        error: 'Failed to sync subscription',
        details: dbError.message,
      });
    }

    console.log(
      '[VerifySession] ✅ Successfully synced subscription to database'
    );

    return res.status(200).json({
      success: true,
      subscription: subscriptionData,
      message: 'Subscription synced successfully',
    });
  } catch (error) {
    console.error('[VerifySession] Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
