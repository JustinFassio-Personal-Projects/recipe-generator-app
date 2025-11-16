import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Vitest configuration for Stripe-specific tests
 *
 * Separate configuration to allow isolated testing of Stripe integration
 * with appropriate mocks and environment setup.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    name: 'stripe',
    globals: true,
    environment: 'node', // Stripe tests run in Node environment
    setupFiles: ['./src/__tests__/setup/stripe-setup.ts'],
    include: [
      'api/stripe/**/*.test.ts',
      'src/__tests__/integration/stripe-*.test.ts',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'api/stripe/**/*.ts',
        'src/hooks/useCreateCheckout.ts',
        'src/hooks/useSubscription.ts',
        'src/hooks/useVerifySubscription.ts',
      ],
      exclude: [
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/node_modules/**',
        '**/__tests__/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
    testTimeout: 10000, // 10 seconds for tests with async operations
    hookTimeout: 10000,
    env: {
      // Test environment variables
      STRIPE_SECRET_KEY: 'sk_test_mock_key_for_testing',
      STRIPE_WEBHOOK_SECRET: 'whsec_test_mock_secret',
      STRIPE_PRICE_ID: 'price_test123',
      SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test_service_role_key',
      SUPABASE_ANON_KEY: 'test_anon_key',
      VITE_SUPABASE_ANON_KEY: 'test_anon_key',
      NODE_ENV: 'test',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
