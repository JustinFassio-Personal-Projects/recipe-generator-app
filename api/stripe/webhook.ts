import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Disable body parsing, need raw body for webhook verification
export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable: NodeJS.ReadableStream) {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// Helper function to trigger subscription update emails
async function sendSubscriptionEmail(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  updateType: string,
  subscriptionDetails?: Record<string, string | number>
) {
  try {
    await supabase.functions.invoke('send-subscription-update', {
      body: {
        userId,
        updateType,
        subscriptionDetails,
      },
    });
  } catch (error) {
    console.error('Failed to send subscription email:', error);
    // Don't fail webhook if email fails
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Initialize Stripe client inside handler (after env var validation)
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!stripeSecretKey || !stripeWebhookSecret) {
    console.error('[Webhook] Missing Stripe environment variables:', {
      hasSecretKey: !!stripeSecretKey,
      hasWebhookSecret: !!stripeWebhookSecret,
    });
    return res.status(500).json({
      error: 'Stripe not configured',
      details: 'Missing required Stripe environment variables',
    });
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2025-09-30.clover',
  });

  // Initialize Supabase client with fallback for environment variable names
  const supabaseUrl =
    process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim();
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[Webhook] Missing Supabase environment variables:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      availableEnvVars: Object.keys(process.env).filter((k) =>
        k.includes('SUPABASE')
      ),
    });
    return res.status(500).json({
      error: 'Supabase not configured',
      details: 'Missing required Supabase environment variables',
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    return res.status(400).json({ error: 'No signature' });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, stripeWebhookSecret);
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err);
    return res.status(400).json({
      error: err instanceof Error ? err.message : 'Webhook verification failed',
    });
  }

  // Log webhook event received
  console.log(`[Webhook] Received event: ${event.type} (id: ${event.id})`);

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(
          `[Webhook] Processing checkout.session.completed for session: ${session.id}`
        );

        // Try to get user_id from session metadata, fallback to customer metadata
        let userId = session.metadata?.supabase_user_id;

        if (!userId && session.customer) {
          try {
            const customer = await stripe.customers.retrieve(
              session.customer as string
            );
            userId = customer.metadata?.supabase_user_id;
            console.log(
              `[Webhook] Retrieved user_id from customer metadata: ${userId}`
            );
          } catch (customerError) {
            console.error(
              '[Webhook] Failed to retrieve customer:',
              customerError
            );
          }
        }

        if (!userId) {
          console.error(
            '[Webhook] No user ID found in checkout session metadata',
            {
              sessionId: session.id,
              sessionMetadata: session.metadata,
              customerId: session.customer,
            }
          );
          return res.status(400).json({
            error: 'Missing user ID in checkout session metadata',
            details:
              'Could not determine user_id from session or customer metadata',
          });
        }

        // Get subscription details with error handling
        let subscription: Stripe.Subscription & {
          current_period_start: number;
          current_period_end: number;
        };

        try {
          if (!session.subscription) {
            console.error('[Webhook] No subscription ID in checkout session', {
              sessionId: session.id,
            });
            return res.status(400).json({
              error: 'No subscription ID in checkout session',
            });
          }

          subscription = (await stripe.subscriptions.retrieve(
            session.subscription as string
          )) as unknown as Stripe.Subscription & {
            current_period_start: number;
            current_period_end: number;
          };
        } catch (subscriptionError) {
          console.error('[Webhook] Failed to retrieve subscription:', {
            subscriptionId: session.subscription,
            error: subscriptionError,
          });
          return res.status(500).json({
            error: 'Failed to retrieve subscription details',
            details:
              subscriptionError instanceof Error
                ? subscriptionError.message
                : 'Unknown error',
          });
        }

        // Extract customer ID (session.customer can be an object if expanded)
        const customerId =
          typeof session.customer === 'string'
            ? session.customer
            : session.customer?.id || null;

        // Create or update subscription record with error handling
        const { data: subscriptionData, error: dbError } = await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: userId,
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
          .select();

        if (dbError) {
          console.error('[Webhook] Database operation failed:', {
            error: dbError,
            userId,
            subscriptionId: subscription.id,
            sessionId: session.id,
          });
          return res.status(500).json({
            error: 'Database operation failed',
            details: dbError.message,
          });
        }

        if (!subscriptionData || subscriptionData.length === 0) {
          console.error('[Webhook] Upsert returned no data', {
            userId,
            subscriptionId: subscription.id,
          });
          return res.status(500).json({
            error: 'Failed to create subscription record',
            details: 'Database upsert returned no data',
          });
        }

        // Send welcome to premium email (non-blocking)
        void sendSubscriptionEmail(supabase, userId, 'subscription_created', {
          plan: subscription.items.data[0]?.price?.nickname || 'Premium',
          nextBillingDate: new Date(
            subscription.current_period_end * 1000
          ).toLocaleDateString(),
        }).catch((emailError) => {
          console.error(
            '[Webhook] Email sending failed (non-blocking):',
            emailError
          );
        });

        console.log(
          `[Webhook] ✅ Subscription created for user ${userId} (subscription: ${subscription.id})`
        );
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription & {
          current_period_start: number;
          current_period_end: number;
        };

        console.log(
          `[Webhook] Processing customer.subscription.updated for subscription: ${subscription.id}`
        );

        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
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
            canceled_at: subscription.canceled_at
              ? new Date(subscription.canceled_at * 1000).toISOString()
              : null,
          })
          .eq('stripe_subscription_id', subscription.id);

        if (updateError) {
          console.error('[Webhook] Failed to update subscription:', {
            error: updateError,
            subscriptionId: subscription.id,
          });
          return res.status(500).json({
            error: 'Database update failed',
            details: updateError.message,
          });
        }

        // Get user ID from subscription to send email
        const { data: subData } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (subData?.user_id) {
          void sendSubscriptionEmail(
            supabase,
            subData.user_id,
            'subscription_updated',
            {
              nextBillingDate: new Date(
                subscription.current_period_end * 1000
              ).toLocaleDateString(),
            }
          ).catch((emailError) => {
            console.error(
              '[Webhook] Email sending failed (non-blocking):',
              emailError
            );
          });
        }

        console.log(`[Webhook] ✅ Subscription updated: ${subscription.id}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        console.log(
          `[Webhook] Processing customer.subscription.deleted for subscription: ${subscription.id}`
        );

        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (updateError) {
          console.error('[Webhook] Failed to cancel subscription:', {
            error: updateError,
            subscriptionId: subscription.id,
          });
          return res.status(500).json({
            error: 'Database update failed',
            details: updateError.message,
          });
        }

        // Get user ID to send cancellation email
        const { data: cancelData } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (cancelData?.user_id) {
          void sendSubscriptionEmail(
            supabase,
            cancelData.user_id,
            'subscription_cancelled'
          ).catch((emailError) => {
            console.error(
              '[Webhook] Email sending failed (non-blocking):',
              emailError
            );
          });
        }

        console.log(`[Webhook] ✅ Subscription canceled: ${subscription.id}`);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string;
        };

        // Send payment confirmation email
        if (invoice.subscription) {
          const { data: paymentData } = await supabase
            .from('user_subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', invoice.subscription)
            .single();

          if (paymentData?.user_id) {
            void sendSubscriptionEmail(
              supabase,
              paymentData.user_id,
              'payment_succeeded',
              {
                amount: ((invoice.amount_paid || 0) / 100).toFixed(2),
                currency: (invoice.currency || 'usd').toUpperCase(),
              }
            ).catch((emailError) => {
              console.error(
                '[Webhook] Email sending failed (non-blocking):',
                emailError
              );
            });
          }
        }

        console.log(`✅ Payment succeeded for customer: ${invoice.customer}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string;
        };

        console.log(
          `[Webhook] Processing invoice.payment_failed for invoice: ${invoice.id}`
        );

        // Update subscription status to past_due
        if (invoice.subscription) {
          const { error: updateError } = await supabase
            .from('user_subscriptions')
            .update({ status: 'past_due' })
            .eq('stripe_subscription_id', invoice.subscription);

          if (updateError) {
            console.error(
              '[Webhook] Failed to update subscription status to past_due:',
              {
                error: updateError,
                subscriptionId: invoice.subscription,
                invoiceId: invoice.id,
              }
            );
            return res.status(500).json({
              error: 'Database update failed',
              details: updateError.message,
            });
          }

          // Send payment failure notification
          const { data: failureData } = await supabase
            .from('user_subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', invoice.subscription)
            .single();

          if (failureData?.user_id) {
            void sendSubscriptionEmail(
              supabase,
              failureData.user_id,
              'payment_failed'
            ).catch((emailError) => {
              console.error(
                '[Webhook] Email sending failed (non-blocking):',
                emailError
              );
            });
          }
        }

        console.log(
          `[Webhook] ❌ Payment failed for customer: ${invoice.customer}`
        );
        break;
      }

      default:
        console.log(
          `[Webhook] Unhandled event type: ${event.type} (id: ${event.id})`
        );
    }

    console.log(
      `[Webhook] ✅ Successfully processed event: ${event.type} (id: ${event.id})`
    );
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('[Webhook] Error processing webhook:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      eventType: event?.type,
      eventId: event?.id,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : 'Webhook processing failed',
    });
  }
}
