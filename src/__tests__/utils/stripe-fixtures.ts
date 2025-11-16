/**
 * Stripe Test Fixtures
 *
 * TypeScript fixtures for common Stripe objects used in testing.
 * These fixtures provide realistic test data that matches Stripe's API responses.
 */

import type Stripe from 'stripe';

// Test user IDs and metadata
export const TEST_USER_ID = 'test-user-123';
export const TEST_USER_EMAIL = 'test@example.com';
export const TEST_CUSTOMER_ID = 'cus_test123';
export const TEST_SUBSCRIPTION_ID = 'sub_test123';
export const TEST_PRICE_ID = 'price_test123';
export const TEST_SESSION_ID = 'cs_test_123';

/**
 * Mock Stripe Customer
 */
export const mockStripeCustomer: Stripe.Customer = {
  id: TEST_CUSTOMER_ID,
  object: 'customer',
  email: TEST_USER_EMAIL,
  metadata: {
    supabase_user_id: TEST_USER_ID,
  },
  created: Math.floor(Date.now() / 1000),
  livemode: false,
  description: null,
  balance: 0,
  currency: null,
  delinquent: false,
  discount: null,
  invoice_prefix: null,
  invoice_settings: {
    custom_fields: null,
    default_payment_method: null,
    footer: null,
    rendering_options: null,
  },
  preferred_locales: [],
  tax_exempt: 'none',
};

/**
 * Mock Stripe Price
 */
export const mockStripePrice: Stripe.Price = {
  id: TEST_PRICE_ID,
  object: 'price',
  active: true,
  currency: 'usd',
  type: 'recurring',
  unit_amount: 599,
  recurring: {
    interval: 'month',
    interval_count: 1,
    trial_period_days: 7,
    usage_type: 'licensed',
    aggregate_usage: null,
  },
  product: 'prod_test123',
  nickname: 'AI Tools Premium',
  livemode: false,
  created: Math.floor(Date.now() / 1000),
  billing_scheme: 'per_unit',
  lookup_key: null,
  metadata: {},
  tiers_mode: null,
  transform_quantity: null,
  unit_amount_decimal: '599',
};

/**
 * Mock Stripe Subscription
 */
export const mockStripeSubscription: Stripe.Subscription = {
  id: TEST_SUBSCRIPTION_ID,
  object: 'subscription',
  customer: TEST_CUSTOMER_ID,
  status: 'trialing',
  created: Math.floor(Date.now() / 1000),
  current_period_start: Math.floor(Date.now() / 1000),
  current_period_end: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
  trial_start: Math.floor(Date.now() / 1000),
  trial_end: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
  cancel_at_period_end: false,
  canceled_at: null,
  items: {
    object: 'list',
    data: [
      {
        id: 'si_test123',
        object: 'subscription_item',
        created: Math.floor(Date.now() / 1000),
        price: mockStripePrice,
        quantity: 1,
        subscription: TEST_SUBSCRIPTION_ID,
        metadata: {},
        billing_thresholds: null,
        tax_rates: [],
      },
    ],
    has_more: false,
    url: '/v1/subscription_items',
  },
  metadata: {
    supabase_user_id: TEST_USER_ID,
  },
  livemode: false,
  application: null,
  application_fee_percent: null,
  automatic_tax: {
    enabled: false,
    liability: null,
  },
  billing_cycle_anchor: Math.floor(Date.now() / 1000),
  billing_thresholds: null,
  cancel_at: null,
  cancellation_details: null,
  collection_method: 'charge_automatically',
  currency: 'usd',
  days_until_due: null,
  default_payment_method: null,
  default_source: null,
  default_tax_rates: [],
  description: null,
  discount: null,
  ended_at: null,
  latest_invoice: null,
  next_pending_invoice_item_invoice: null,
  on_behalf_of: null,
  pause_collection: null,
  payment_settings: null,
  pending_invoice_item_interval: null,
  pending_setup_intent: null,
  pending_update: null,
  plan: null,
  quantity: null,
  schedule: null,
  start_date: Math.floor(Date.now() / 1000),
  test_clock: null,
  transfer_data: null,
  trial_settings: null,
};

/**
 * Mock Stripe Checkout Session
 */
export const mockStripeCheckoutSession: Stripe.Checkout.Session = {
  id: TEST_SESSION_ID,
  object: 'checkout.session',
  customer: TEST_CUSTOMER_ID,
  subscription: TEST_SUBSCRIPTION_ID,
  mode: 'subscription',
  status: 'complete',
  payment_status: 'paid',
  url: `https://checkout.stripe.com/c/pay/${TEST_SESSION_ID}`,
  success_url:
    'https://example.com/subscription/success?session_id={CHECKOUT_SESSION_ID}',
  cancel_url: 'https://example.com/subscription',
  metadata: {
    supabase_user_id: TEST_USER_ID,
  },
  created: Math.floor(Date.now() / 1000),
  livemode: false,
  after_expiration: null,
  allow_promotion_codes: true,
  amount_subtotal: 599,
  amount_total: 599,
  automatic_tax: { enabled: false, liability: null, status: null },
  billing_address_collection: null,
  cancel_at: null,
  client_reference_id: null,
  client_secret: null,
  consent: null,
  consent_collection: null,
  currency: 'usd',
  currency_conversion: null,
  custom_fields: [],
  custom_text: {
    after_submit: null,
    shipping_address: null,
    submit: null,
    terms_of_service_acceptance: null,
  },
  customer_creation: null,
  customer_details: {
    email: TEST_USER_EMAIL,
    phone: null,
    tax_exempt: 'none',
    tax_ids: [],
  },
  customer_email: TEST_USER_EMAIL,
  expires_at: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
  invoice: null,
  invoice_creation: null,
  line_items: null,
  locale: null,
  payment_intent: null,
  payment_link: null,
  payment_method_collection: null,
  payment_method_configuration_details: null,
  payment_method_options: null,
  payment_method_types: ['card'],
  phone_number_collection: { enabled: false },
  recovered_from: null,
  redirect_on_completion: 'always',
  return_url: null,
  saved_payment_method_options: null,
  setup_intent: null,
  shipping_address_collection: null,
  shipping_cost: null,
  shipping_details: null,
  shipping_options: [],
  submit_type: null,
  tax_id_collection: { enabled: false, required: 'never' },
  total_details: {
    amount_discount: 0,
    amount_shipping: 0,
    amount_tax: 0,
  },
  ui_mode: 'hosted',
};

/**
 * Mock Stripe Invoice
 */
export const mockStripeInvoice: Stripe.Invoice = {
  id: 'in_test123',
  object: 'invoice',
  customer: TEST_CUSTOMER_ID,
  subscription: TEST_SUBSCRIPTION_ID,
  status: 'paid',
  amount_paid: 599,
  amount_due: 599,
  currency: 'usd',
  created: Math.floor(Date.now() / 1000),
  livemode: false,
  account_country: 'US',
  account_name: 'Test Account',
  account_tax_ids: null,
  amount_remaining: 0,
  amount_shipping: 0,
  application: null,
  application_fee_amount: null,
  attempt_count: 1,
  attempted: true,
  auto_advance: true,
  automatic_tax: { enabled: false, liability: null, status: null },
  billing_reason: 'subscription_create',
  charge: 'ch_test123',
  collection_method: 'charge_automatically',
  custom_fields: null,
  customer_address: null,
  customer_email: TEST_USER_EMAIL,
  customer_name: null,
  customer_phone: null,
  customer_shipping: null,
  customer_tax_exempt: 'none',
  customer_tax_ids: [],
  default_payment_method: null,
  default_source: null,
  default_tax_rates: [],
  description: null,
  discount: null,
  discounts: [],
  due_date: null,
  effective_at: null,
  ending_balance: 0,
  footer: null,
  from_invoice: null,
  hosted_invoice_url: `https://invoice.stripe.com/i/test`,
  invoice_pdf: `https://invoice.stripe.com/i/test/pdf`,
  issuer: { type: 'self' },
  last_finalization_error: null,
  latest_revision: null,
  lines: {
    object: 'list',
    data: [],
    has_more: false,
    url: '/v1/invoices/in_test123/lines',
  },
  metadata: {},
  next_payment_attempt: null,
  number: 'TEST-001',
  on_behalf_of: null,
  paid: true,
  paid_out_of_band: false,
  payment_intent: 'pi_test123',
  payment_settings: {
    default_mandate: null,
    payment_method_options: null,
    payment_method_types: null,
  },
  period_end: Math.floor(Date.now() / 1000),
  period_start: Math.floor(Date.now() / 1000),
  post_payment_credit_notes_amount: 0,
  pre_payment_credit_notes_amount: 0,
  quote: null,
  receipt_number: null,
  rendering: null,
  rendering_options: null,
  shipping_cost: null,
  shipping_details: null,
  starting_balance: 0,
  statement_descriptor: null,
  status_transitions: {
    finalized_at: Math.floor(Date.now() / 1000),
    marked_uncollectible_at: null,
    paid_at: Math.floor(Date.now() / 1000),
    voided_at: null,
  },
  subscription_details: null,
  subtotal: 599,
  subtotal_excluding_tax: null,
  tax: null,
  test_clock: null,
  total: 599,
  total_discount_amounts: [],
  total_excluding_tax: null,
  total_tax_amounts: [],
  transfer_data: null,
  webhooks_delivered_at: null,
};

/**
 * Factory functions for creating custom test fixtures
 */

export function createMockSubscription(
  overrides: Partial<Stripe.Subscription> = {}
): Stripe.Subscription {
  return {
    ...mockStripeSubscription,
    ...overrides,
  };
}

export function createMockCheckoutSession(
  overrides: Partial<Stripe.Checkout.Session> = {}
): Stripe.Checkout.Session {
  return {
    ...mockStripeCheckoutSession,
    ...overrides,
  };
}

export function createMockCustomer(
  overrides: Partial<Stripe.Customer> = {}
): Stripe.Customer {
  return {
    ...mockStripeCustomer,
    ...overrides,
  };
}

export function createMockInvoice(
  overrides: Partial<Stripe.Invoice> = {}
): Stripe.Invoice {
  return {
    ...mockStripeInvoice,
    ...overrides,
  };
}

/**
 * Active subscription (after trial)
 */
export const mockActiveSubscription = createMockSubscription({
  status: 'active',
  trial_start: null,
  trial_end: null,
});

/**
 * Canceled subscription
 */
export const mockCanceledSubscription = createMockSubscription({
  status: 'canceled',
  canceled_at: Math.floor(Date.now() / 1000),
  cancel_at_period_end: false,
});

/**
 * Past due subscription
 */
export const mockPastDueSubscription = createMockSubscription({
  status: 'past_due',
});

/**
 * Failed invoice
 */
export const mockFailedInvoice = createMockInvoice({
  status: 'open',
  attempted: true,
  paid: false,
  amount_remaining: 599,
});
