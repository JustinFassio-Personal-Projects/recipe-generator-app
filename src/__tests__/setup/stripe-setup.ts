/**
 * Stripe Test Setup
 *
 * Global setup and teardown for Stripe tests.
 * This file is automatically loaded before running Stripe tests.
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// Global test setup
beforeAll(() => {
  console.log('🔧 Setting up Stripe test environment...');

  // Set test environment variables if not already set
  if (!process.env.STRIPE_SECRET_KEY) {
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key_for_testing';
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_mock_secret';
  }
  if (!process.env.STRIPE_PRICE_ID) {
    process.env.STRIPE_PRICE_ID = 'price_test123';
  }

  console.log('✅ Stripe test environment ready');
});

// Global test teardown
afterAll(() => {
  console.log('🧹 Cleaning up Stripe test environment...');
});

// Per-test setup
beforeEach(() => {
  // Reset any global state if needed
});

// Per-test teardown
afterEach(() => {
  // Clean up after each test
});
