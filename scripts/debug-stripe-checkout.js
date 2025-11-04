#!/usr/bin/env node

/**
 * Debug script for Stripe checkout API endpoint
 * Tests environment variables, authentication, and API connectivity
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Load environment variables
dotenv.config({ path: join(projectRoot, '.env.local') });
dotenv.config({ path: join(projectRoot, '.env') });

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function checkEnvVar(name, value, required = true) {
  const exists = !!value?.trim();
  const status = exists ? '✅' : '❌';
  const color = exists ? 'green' : 'red';

  log(`${status} ${name}: ${exists ? 'Set' : 'Missing'}`, color);

  if (exists && name.includes('KEY')) {
    const preview =
      value.substring(0, 20) + '...' + value.substring(value.length - 10);
    log(`   Preview: ${preview}`, 'yellow');
  } else if (exists && name.includes('URL')) {
    log(`   Value: ${value}`, 'yellow');
  }

  if (required && !exists) {
    log(`   ⚠️  Required but missing!`, 'red');
  }

  return exists;
}

async function testEnvironmentVariables() {
  logSection('1. Environment Variables Check');

  // Check all possible environment variable names
  const envVars = {
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    SUPABASE_URL: process.env.SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_PRICE_ID: process.env.STRIPE_PRICE_ID,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  };

  const results = {};
  for (const [name, value] of Object.entries(envVars)) {
    const required = !name.includes('WEBHOOK_SECRET');
    results[name] = checkEnvVar(name, value, required);
  }

  // Determine which Supabase URL/key to use
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;

  log('\n📋 Summary:', 'blue');
  log(
    `   Supabase URL: ${supabaseUrl ? '✅' : '❌'}`,
    supabaseUrl ? 'green' : 'red'
  );
  log(
    `   Supabase Anon Key: ${supabaseAnonKey ? '✅' : '❌'}`,
    supabaseAnonKey ? 'green' : 'red'
  );
  log(
    `   Supabase Service Key: ${supabaseServiceKey ? '✅' : '❌'}`,
    supabaseServiceKey ? 'green' : 'red'
  );
  log(
    `   Stripe Secret Key: ${stripeSecretKey ? '✅' : '❌'}`,
    stripeSecretKey ? 'green' : 'red'
  );
  log(
    `   Stripe Price ID: ${priceId ? '✅' : '❌'}`,
    priceId ? 'green' : 'red'
  );

  return {
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceKey,
    stripeSecretKey,
    priceId,
    allPresent: !!(
      supabaseUrl &&
      supabaseAnonKey &&
      supabaseServiceKey &&
      stripeSecretKey &&
      priceId
    ),
  };
}

async function testSupabaseClients(env) {
  logSection('2. Supabase Client Initialization');

  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    log(
      '❌ Cannot test Supabase clients - missing environment variables',
      'red'
    );
    return { anonClient: null, serviceClient: null };
  }

  try {
    log('Testing Anon Key Client...', 'blue');
    const anonClient = createClient(env.supabaseUrl, env.supabaseAnonKey);
    log('✅ Anon key client created', 'green');

    let serviceClient = null;
    if (env.supabaseServiceKey) {
      log('Testing Service Role Key Client...', 'blue');
      serviceClient = createClient(env.supabaseUrl, env.supabaseServiceKey);
      log('✅ Service role client created', 'green');
    } else {
      log('❌ Cannot test service role client - missing key', 'red');
    }

    return { anonClient, serviceClient };
  } catch (error) {
    log(`❌ Error creating Supabase clients: ${error.message}`, 'red');
    return { anonClient: null, serviceClient: null };
  }
}

async function testStripeClient(env) {
  logSection('3. Stripe Client Initialization');

  if (!env.stripeSecretKey) {
    log('❌ Cannot test Stripe client - missing secret key', 'red');
    return null;
  }

  try {
    const stripe = new Stripe(env.stripeSecretKey, {
      apiVersion: '2025-09-30.clover',
    });

    // Test Stripe connection by fetching account
    log('Testing Stripe API connection...', 'blue');
    const account = await stripe.accounts.retrieve();
    log(`✅ Stripe client connected`, 'green');
    log(`   Account ID: ${account.id}`, 'yellow');
    log(`   Account Type: ${account.type}`, 'yellow');

    // Test price ID
    if (env.priceId) {
      log(`\nTesting Price ID: ${env.priceId}...`, 'blue');
      try {
        const price = await stripe.prices.retrieve(env.priceId);
        log(`✅ Price ID is valid`, 'green');
        log(`   Product: ${price.product}`, 'yellow');
        log(
          `   Amount: ${price.unit_amount ? `$${(price.unit_amount / 100).toFixed(2)}` : 'N/A'}`,
          'yellow'
        );
        log(`   Currency: ${price.currency}`, 'yellow');
        log(`   Recurring: ${price.recurring ? 'Yes' : 'No'}`, 'yellow');
      } catch (error) {
        log(`❌ Price ID is invalid: ${error.message}`, 'red');
      }
    }

    return stripe;
  } catch (error) {
    log(`❌ Error creating Stripe client: ${error.message}`, 'red');
    if (error.message.includes('Invalid API Key')) {
      log('   ⚠️  Check that your Stripe secret key is correct', 'yellow');
    }
    return null;
  }
}

async function testAuthentication(supabaseClients) {
  logSection('4. Authentication Test');

  if (!supabaseClients.anonClient) {
    log('❌ Cannot test authentication - missing Supabase client', 'red');
    return null;
  }

  try {
    log('Testing authentication flow...', 'blue');

    // Try to get current session (will fail if not logged in, which is expected)
    const {
      data: { session },
      error: sessionError,
    } = await supabaseClients.anonClient.auth.getSession();

    if (sessionError) {
      log(`⚠️  No active session: ${sessionError.message}`, 'yellow');
      log("   This is expected if you're not logged in", 'yellow');
      log(
        '   To test fully, you need to be authenticated in the app',
        'yellow'
      );
    } else if (session) {
      log('✅ Active session found', 'green');
      log(`   User ID: ${session.user.id}`, 'yellow');
      log(`   Email: ${session.user.email}`, 'yellow');
      log(
        `   Token expires: ${new Date(session.expires_at * 1000).toLocaleString()}`,
        'yellow'
      );

      // Test token verification with service role client
      if (supabaseClients.serviceClient) {
        log('\nTesting token verification with service role client...', 'blue');
        const {
          data: { user },
          error: userError,
        } = await supabaseClients.serviceClient.auth.getUser(
          session.access_token
        );

        if (userError) {
          log(`❌ Token verification failed: ${userError.message}`, 'red');
        } else {
          log('✅ Token verified successfully', 'green');
          log(`   Verified User ID: ${user.id}`, 'yellow');
        }
      }

      return session;
    } else {
      log('⚠️  No session found', 'yellow');
      log('   You need to be logged in to test the checkout flow', 'yellow');
    }

    return session;
  } catch (error) {
    log(`❌ Authentication test error: ${error.message}`, 'red');
    return null;
  }
}

async function testApiEndpoint(session, env) {
  logSection('5. API Endpoint Test');

  const apiUrl = 'http://localhost:3000/api/stripe/create-checkout';

  log(`Testing API endpoint: ${apiUrl}`, 'blue');

  // Check if server is running
  try {
    const healthCheck = await fetch('http://localhost:3000/api/health').catch(
      () => null
    );
    if (!healthCheck || !healthCheck.ok) {
      log('❌ Vercel dev server is not running on port 3000', 'red');
      log('   Start it with: npx vercel dev --listen 3000', 'yellow');
      return false;
    }
    log('✅ Vercel dev server is running', 'green');
  } catch (error) {
    log('❌ Cannot reach Vercel dev server', 'red');
    log('   Start it with: npx vercel dev --listen 3000', 'yellow');
    return false;
  }

  if (!session) {
    log('⚠️  Skipping API test - no active session', 'yellow');
    log('   Log in to the app first, then run this script again', 'yellow');
    return false;
  }

  try {
    log(`\nMaking POST request with auth token...`, 'blue');
    log(`   Token length: ${session.access_token.length}`, 'yellow');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    log(
      `\nResponse Status: ${response.status} ${response.statusText}`,
      response.ok ? 'green' : 'red'
    );

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    if (response.ok) {
      log('✅ API request successful!', 'green');
      log(`   Session ID: ${responseData.sessionId}`, 'yellow');
      log(`   Checkout URL: ${responseData.url}`, 'yellow');
    } else {
      log('❌ API request failed', 'red');
      log(`   Error: ${JSON.stringify(responseData, null, 2)}`, 'red');

      // Provide helpful diagnostics
      if (response.status === 401) {
        log('\n🔍 Authentication Issue:', 'yellow');
        log('   - Check that the JWT token is valid', 'yellow');
        log('   - Verify SUPABASE_SERVICE_ROLE_KEY is correct', 'yellow');
        log("   - Check that the token hasn't expired", 'yellow');
      } else if (response.status === 500) {
        log('\n🔍 Server Error:', 'yellow');
        log('   - Check Vercel dev server logs', 'yellow');
        log('   - Verify all environment variables are set', 'yellow');
        log('   - Check that Stripe API key is valid', 'yellow');
      }
    }

    return response.ok;
  } catch (error) {
    log(`❌ API request error: ${error.message}`, 'red');
    if (
      error.message.includes('fetch failed') ||
      error.message.includes('ECONNREFUSED')
    ) {
      log('   ⚠️  Cannot connect to API server', 'yellow');
      log(
        '   Make sure Vercel dev server is running: npx vercel dev --listen 3000',
        'yellow'
      );
    }
    return false;
  }
}

async function checkApiRouteCode(env) {
  logSection('6. API Route Code Analysis');

  try {
    const apiRoutePath = join(
      projectRoot,
      'api',
      'stripe',
      'create-checkout.ts'
    );
    const code = readFileSync(apiRoutePath, 'utf-8');

    log('Checking API route code...', 'blue');

    // Check for environment variable usage
    const usesVitePrefix = code.includes('VITE_SUPABASE_URL');
    const usesNonVitePrefix = code.includes('process.env.SUPABASE_URL');

    log(
      `   Uses VITE_SUPABASE_URL: ${usesVitePrefix ? '✅' : '❌'}`,
      usesVitePrefix ? 'green' : 'yellow'
    );
    log(
      `   Uses SUPABASE_URL: ${usesNonVitePrefix ? '✅' : '❌'}`,
      usesNonVitePrefix ? 'green' : 'yellow'
    );

    if (usesVitePrefix && !usesNonVitePrefix) {
      log('   ⚠️  WARNING: API route only checks VITE_SUPABASE_URL', 'yellow');
      log(
        '      Vercel serverless functions may not have access to VITE_* variables',
        'yellow'
      );
      log(
        '      Consider adding fallback: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL',
        'yellow'
      );
    }

    // Check for service role key usage
    const usesServiceKey = code.includes('SUPABASE_SERVICE_ROLE_KEY');
    log(
      `   Uses SUPABASE_SERVICE_ROLE_KEY: ${usesServiceKey ? '✅' : '❌'}`,
      usesServiceKey ? 'green' : 'red'
    );

    // Check authentication method
    const usesGetUser = code.includes('supabase.auth.getUser');
    log(
      `   Uses getUser() for auth: ${usesGetUser ? '✅' : '❌'}`,
      usesGetUser ? 'green' : 'yellow'
    );
  } catch (error) {
    log(`❌ Error reading API route: ${error.message}`, 'red');
  }
}

async function main() {
  log('\n🔍 Stripe Checkout Debug Script', 'cyan');
  log('================================\n', 'cyan');

  // Test 1: Environment Variables
  const env = await testEnvironmentVariables();

  if (!env.allPresent) {
    log('\n❌ Missing required environment variables!', 'red');
    log('   Please check your .env.local file', 'yellow');
    process.exit(1);
  }

  // Test 2: Supabase Clients
  const supabaseClients = await testSupabaseClients(env);

  // Test 3: Stripe Client
  const stripeClient = await testStripeClient(env);

  // Test 4: Authentication
  const session = await testAuthentication(supabaseClients);

  // Test 5: API Route Code Analysis
  await checkApiRouteCode(env);

  // Test 6: API Endpoint
  const apiSuccess = await testApiEndpoint(session, env);

  // Final Summary
  logSection('Summary');

  const allTests = [
    { name: 'Environment Variables', passed: env.allPresent },
    {
      name: 'Supabase Clients',
      passed: !!supabaseClients.anonClient && !!supabaseClients.serviceClient,
    },
    { name: 'Stripe Client', passed: !!stripeClient },
    { name: 'API Endpoint', passed: apiSuccess },
  ];

  allTests.forEach((test) => {
    const status = test.passed ? '✅' : '❌';
    const color = test.passed ? 'green' : 'red';
    log(`${status} ${test.name}`, color);
  });

  if (allTests.every((t) => t.passed)) {
    log('\n🎉 All tests passed!', 'green');
  } else {
    log('\n⚠️  Some tests failed. Review the output above.', 'yellow');
  }

  log('\n💡 Tips:', 'blue');
  log('   - If API endpoint fails, check Vercel dev server logs', 'yellow');
  log("   - Ensure you're logged in to test the full flow", 'yellow');
  log('   - Check that .env.local has all required variables', 'yellow');
  log(
    '   - Verify VITE_* variables are available to serverless functions',
    'yellow'
  );
}

main().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
