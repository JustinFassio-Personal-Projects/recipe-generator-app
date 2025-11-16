/**
 * Stripe Test Helpers
 *
 * Utilities for testing Stripe integrations including webhook event generation,
 * signature verification mocking, and Supabase interaction helpers.
 */

import type Stripe from 'stripe';
import { createHash, createHmac } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  TEST_USER_ID,
  TEST_CUSTOMER_ID,
  TEST_SUBSCRIPTION_ID,
  TEST_SESSION_ID,
  mockStripeSubscription,
  mockStripeCheckoutSession,
  mockStripeInvoice,
  mockStripeCustomer,
} from './stripe-fixtures';

/**
 * Generate a mock Stripe webhook event
 */
export function createMockWebhookEvent<T = unknown>(
  type: string,
  data: T
): Stripe.Event {
  return {
    id: `evt_${Date.now()}`,
    object: 'event',
    api_version: '2025-09-30',
    created: Math.floor(Date.now() / 1000),
    type,
    data: {
      object: data,
    },
    livemode: false,
    pending_webhooks: 0,
    request: {
      id: `req_${Date.now()}`,
      idempotency_key: null,
    },
  } as Stripe.Event;
}

/**
 * Generate Stripe webhook signature for testing
 * Mimics Stripe's webhook signature generation for local testing
 */
export function generateWebhookSignature(
  payload: string,
  secret: string,
  timestamp?: number
): string {
  const t = timestamp || Math.floor(Date.now() / 1000);
  const signedPayload = `${t}.${payload}`;
  const signature = createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  return `t=${t},v1=${signature}`;
}

/**
 * Create raw webhook request body
 */
export function createWebhookRequestBody(event: Stripe.Event): Buffer {
  return Buffer.from(JSON.stringify(event), 'utf-8');
}

/**
 * Mock Stripe webhook events for common scenarios
 */
export const mockWebhookEvents = {
  /**
   * checkout.session.completed event
   */
  checkoutSessionCompleted: () =>
    createMockWebhookEvent(
      'checkout.session.completed',
      mockStripeCheckoutSession
    ),

  /**
   * checkout.session.completed with missing metadata
   */
  checkoutSessionCompletedNoMetadata: () => {
    const session = { ...mockStripeCheckoutSession, metadata: {} };
    return createMockWebhookEvent('checkout.session.completed', session);
  },

  /**
   * customer.subscription.updated event
   */
  subscriptionUpdated: (status: Stripe.Subscription.Status = 'active') => {
    const subscription = { ...mockStripeSubscription, status };
    return createMockWebhookEvent(
      'customer.subscription.updated',
      subscription
    );
  },

  /**
   * customer.subscription.deleted event
   */
  subscriptionDeleted: () => {
    const subscription = {
      ...mockStripeSubscription,
      status: 'canceled' as Stripe.Subscription.Status,
      canceled_at: Math.floor(Date.now() / 1000),
    };
    return createMockWebhookEvent(
      'customer.subscription.deleted',
      subscription
    );
  },

  /**
   * invoice.payment_succeeded event
   */
  paymentSucceeded: () =>
    createMockWebhookEvent('invoice.payment_succeeded', mockStripeInvoice),

  /**
   * invoice.payment_failed event
   */
  paymentFailed: () => {
    const failedInvoice = {
      ...mockStripeInvoice,
      status: 'open' as Stripe.Invoice.Status,
      attempted: true,
      paid: false,
    };
    return createMockWebhookEvent('invoice.payment_failed', failedInvoice);
  },
};

/**
 * Mock Supabase client for testing
 */
export function createMockSupabaseClient() {
  const mockData = new Map<string, any>();

  const mockClient = {
    from: (table: string) => ({
      select: (columns = '*') => ({
        eq: (column: string, value: any) => ({
          single: async () => ({
            data: mockData.get(`${table}_${value}`),
            error: null,
          }),
          maybeSingle: async () => ({
            data: mockData.get(`${table}_${value}`) || null,
            error: null,
          }),
        }),
      }),
      insert: (data: any) => ({
        select: () => ({
          single: async () => {
            const key = `${table}_${data.user_id}`;
            mockData.set(key, data);
            return { data, error: null };
          },
        }),
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          select: () => ({
            single: async () => {
              const key = `${table}_${value}`;
              const existing = mockData.get(key) || {};
              const updated = { ...existing, ...data };
              mockData.set(key, updated);
              return { data: updated, error: null };
            },
          }),
        }),
      }),
      upsert: (data: any) => ({
        select: () => ({
          single: async () => {
            const key = `${table}_${data.user_id}`;
            mockData.set(key, data);
            return { data: [data], error: null };
          },
        }),
      }),
    }),
    auth: {
      getUser: async (token: string) => {
        if (token === 'valid_token') {
          return {
            data: {
              user: {
                id: TEST_USER_ID,
                email: 'test@example.com',
              },
            },
            error: null,
          };
        }
        return {
          data: { user: null },
          error: { message: 'Invalid token' },
        };
      },
      getSession: async () => ({
        data: {
          session: {
            access_token: 'valid_token',
            user: {
              id: TEST_USER_ID,
              email: 'test@example.com',
            },
          },
        },
        error: null,
      }),
    },
    functions: {
      invoke: async (functionName: string, options: any) => {
        // Mock Edge Function calls (e.g., email sending)
        console.log(`Mock Edge Function called: ${functionName}`, options);
        return { data: { success: true }, error: null };
      },
    },
  };

  // Helper to seed mock data
  const seedData = (table: string, key: string, data: any) => {
    mockData.set(`${table}_${key}`, data);
  };

  // Helper to get mock data
  const getData = (table: string, key: string) => {
    return mockData.get(`${table}_${key}`);
  };

  // Helper to clear all mock data
  const clearData = () => {
    mockData.clear();
  };

  return {
    client: mockClient as unknown as SupabaseClient,
    helpers: {
      seedData,
      getData,
      clearData,
    },
  };
}

/**
 * Mock Stripe client for testing
 */
export function createMockStripeClient() {
  const mockData = {
    customers: new Map<string, Stripe.Customer>(),
    subscriptions: new Map<string, Stripe.Subscription>(),
    sessions: new Map<string, Stripe.Checkout.Session>(),
  };

  // Seed with default test data
  mockData.customers.set(TEST_CUSTOMER_ID, mockStripeCustomer);
  mockData.subscriptions.set(TEST_SUBSCRIPTION_ID, mockStripeSubscription);
  mockData.sessions.set(TEST_SESSION_ID, mockStripeCheckoutSession);

  const mockStripe = {
    customers: {
      create: async (params: Stripe.CustomerCreateParams) => {
        const customer: Stripe.Customer = {
          ...mockStripeCustomer,
          id: `cus_${Date.now()}`,
          email: params.email || null,
          metadata: params.metadata || {},
        };
        mockData.customers.set(customer.id, customer);
        return customer;
      },
      retrieve: async (id: string) => {
        const customer = mockData.customers.get(id);
        if (!customer) {
          throw new Error(`Customer not found: ${id}`);
        }
        return customer;
      },
    },
    subscriptions: {
      create: async (params: Stripe.SubscriptionCreateParams) => {
        const subscription: Stripe.Subscription = {
          ...mockStripeSubscription,
          id: `sub_${Date.now()}`,
          customer: params.customer as string,
          metadata: params.metadata || {},
        };
        mockData.subscriptions.set(subscription.id, subscription);
        return subscription;
      },
      retrieve: async (id: string) => {
        const subscription = mockData.subscriptions.get(id);
        if (!subscription) {
          throw new Error(`Subscription not found: ${id}`);
        }
        return subscription;
      },
      update: async (id: string, params: Stripe.SubscriptionUpdateParams) => {
        const subscription = mockData.subscriptions.get(id);
        if (!subscription) {
          throw new Error(`Subscription not found: ${id}`);
        }
        const updated = { ...subscription, ...params };
        mockData.subscriptions.set(id, updated);
        return updated;
      },
    },
    checkout: {
      sessions: {
        create: async (params: Stripe.Checkout.SessionCreateParams) => {
          const session: Stripe.Checkout.Session = {
            ...mockStripeCheckoutSession,
            id: `cs_${Date.now()}`,
            customer: params.customer as string,
            metadata: params.metadata || {},
            url: `https://checkout.stripe.com/c/pay/cs_${Date.now()}`,
          };
          mockData.sessions.set(session.id, session);
          return session;
        },
        retrieve: async (id: string, params?: { expand?: string[] }) => {
          const session = mockData.sessions.get(id);
          if (!session) {
            throw new Error(`Session not found: ${id}`);
          }
          // Handle expand parameter for subscription
          if (params?.expand?.includes('subscription')) {
            const subscription = mockData.subscriptions.get(
              session.subscription as string
            );
            return { ...session, subscription };
          }
          return session;
        },
      },
    },
    webhooks: {
      constructEvent: (payload: Buffer, signature: string, secret: string) => {
        // Simple mock - in real tests you'd verify the signature
        try {
          const event = JSON.parse(payload.toString()) as Stripe.Event;
          return event;
        } catch (error) {
          throw new Error('Webhook signature verification failed');
        }
      },
    },
    billingPortal: {
      sessions: {
        create: async (params: Stripe.BillingPortal.SessionCreateParams) => {
          return {
            id: `bps_${Date.now()}`,
            object: 'billing_portal.session',
            url: `https://billing.stripe.com/session/bps_${Date.now()}`,
            customer: params.customer,
            return_url: params.return_url,
            created: Math.floor(Date.now() / 1000),
            livemode: false,
          } as Stripe.BillingPortal.Session;
        },
      },
    },
  };

  return {
    stripe: mockStripe,
    helpers: {
      seedCustomer: (customer: Stripe.Customer) => {
        mockData.customers.set(customer.id, customer);
      },
      seedSubscription: (subscription: Stripe.Subscription) => {
        mockData.subscriptions.set(subscription.id, subscription);
      },
      seedSession: (session: Stripe.Checkout.Session) => {
        mockData.sessions.set(session.id, session);
      },
      clearData: () => {
        mockData.customers.clear();
        mockData.subscriptions.clear();
        mockData.sessions.clear();
        // Re-seed defaults
        mockData.customers.set(TEST_CUSTOMER_ID, mockStripeCustomer);
        mockData.subscriptions.set(
          TEST_SUBSCRIPTION_ID,
          mockStripeSubscription
        );
        mockData.sessions.set(TEST_SESSION_ID, mockStripeCheckoutSession);
      },
    },
  };
}

/**
 * Helper to create mock Vercel request/response for API testing
 */
export function createMockVercelRequest(options: {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}): any {
  const readable = Buffer.from(JSON.stringify(options.body || {}));

  return {
    method: options.method || 'POST',
    headers: options.headers || {},
    body: options.body,
    // Make request readable as a stream
    [Symbol.asyncIterator]: async function* () {
      yield readable;
    },
  };
}

export function createMockVercelResponse(): {
  response: any;
  helpers: {
    getStatus: () => number;
    getBody: () => any;
    getHeaders: () => Record<string, string>;
  };
} {
  let status = 200;
  let body: any = null;
  const headers: Record<string, string> = {};

  const response = {
    status: (code: number) => {
      status = code;
      return response;
    },
    json: (data: any) => {
      body = data;
      return response;
    },
    send: (data: any) => {
      body = data;
      return response;
    },
    setHeader: (key: string, value: string) => {
      headers[key] = value;
      return response;
    },
    headersSent: false,
  };

  return {
    response,
    helpers: {
      getStatus: () => status,
      getBody: () => body,
      getHeaders: () => headers,
    },
  };
}

/**
 * Wait helper for async testing
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a test subscription in the database format
 */
export function createTestSubscription(overrides: Record<string, any> = {}) {
  return {
    id: 'test-sub-uuid',
    user_id: TEST_USER_ID,
    stripe_customer_id: TEST_CUSTOMER_ID,
    stripe_subscription_id: TEST_SUBSCRIPTION_ID,
    stripe_price_id: 'price_test123',
    status: 'trialing',
    trial_start: new Date().toISOString(),
    trial_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString(),
    cancel_at_period_end: false,
    canceled_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}
