/**
 * Clean Up Test Subscription Data
 *
 * This script helps identify and clean up test/invalid subscription data
 * that may have fake Stripe customer IDs that don't exist in Stripe.
 *
 * Usage:
 *   npx tsx scripts/stripe/cleanup-test-subscriptions.ts
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !STRIPE_SECRET_KEY) {
  console.error('❌ Missing required environment variables:');
  if (!SUPABASE_URL) console.error('  - SUPABASE_URL or VITE_SUPABASE_URL');
  if (!SUPABASE_SERVICE_KEY) console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  if (!STRIPE_SECRET_KEY) console.error('  - STRIPE_SECRET_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
});

interface SubscriptionRecord {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string;
}

async function main() {
  console.log('🔍 Checking for invalid subscription data...\n');

  // Get all subscriptions from database
  const { data: subscriptions, error } = await supabase
    .from('user_subscriptions')
    .select('id, user_id, stripe_customer_id, stripe_subscription_id, status');

  if (error) {
    console.error('❌ Failed to fetch subscriptions:', error.message);
    process.exit(1);
  }

  if (!subscriptions || subscriptions.length === 0) {
    console.log('✅ No subscriptions found in database.');
    return;
  }

  console.log(`Found ${subscriptions.length} subscription(s) in database.\n`);

  const invalidSubscriptions: SubscriptionRecord[] = [];
  const validSubscriptions: SubscriptionRecord[] = [];

  // Check each subscription
  for (const sub of subscriptions as SubscriptionRecord[]) {
    console.log(`Checking subscription for user ${sub.user_id}...`);

    // Check if customer exists in Stripe
    if (sub.stripe_customer_id) {
      try {
        const customer = await stripe.customers.retrieve(
          sub.stripe_customer_id
        );

        if (customer.deleted) {
          console.log(
            `  ⚠️  Customer exists but is deleted: ${sub.stripe_customer_id}`
          );
          invalidSubscriptions.push(sub);
        } else {
          console.log(`  ✅ Customer exists: ${sub.stripe_customer_id}`);
          validSubscriptions.push(sub);
        }
      } catch (error: any) {
        if (error.code === 'resource_missing') {
          console.log(
            `  ❌ Customer not found in Stripe: ${sub.stripe_customer_id}`
          );
          invalidSubscriptions.push(sub);
        } else {
          console.log(`  ⚠️  Error checking customer: ${error.message}`);
          invalidSubscriptions.push(sub);
        }
      }
    } else {
      console.log(`  ⚠️  No stripe_customer_id`);
      invalidSubscriptions.push(sub);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Valid subscriptions: ${validSubscriptions.length}`);
  console.log(`❌ Invalid subscriptions: ${invalidSubscriptions.length}`);

  if (invalidSubscriptions.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('🗑️  INVALID SUBSCRIPTIONS');
    console.log('='.repeat(60));

    for (const sub of invalidSubscriptions) {
      console.log(`\nUser ID: ${sub.user_id}`);
      console.log(`  Subscription ID: ${sub.id}`);
      console.log(`  Stripe Customer ID: ${sub.stripe_customer_id || 'None'}`);
      console.log(`  Status: ${sub.status}`);
    }

    // Prompt for cleanup
    console.log('\n' + '='.repeat(60));
    console.log('💡 RECOMMENDED ACTIONS');
    console.log('='.repeat(60));
    console.log('\nOption 1: Delete invalid subscriptions (RECOMMENDED)');
    console.log('  Run with --delete flag:');
    console.log(
      '  npx tsx scripts/stripe/cleanup-test-subscriptions.ts --delete\n'
    );

    console.log('Option 2: Manual cleanup via Supabase Studio');
    console.log(
      '  DELETE FROM user_subscriptions WHERE stripe_customer_id IN ('
    );
    invalidSubscriptions.forEach((sub, i) => {
      const comma = i < invalidSubscriptions.length - 1 ? ',' : '';
      console.log(`    '${sub.stripe_customer_id}'${comma}`);
    });
    console.log('  );\n');

    // Check if --delete flag is provided
    if (process.argv.includes('--delete')) {
      console.log('🗑️  Deleting invalid subscriptions...\n');

      for (const sub of invalidSubscriptions) {
        console.log(`Deleting subscription for user ${sub.user_id}...`);
        const { error: deleteError } = await supabase
          .from('user_subscriptions')
          .delete()
          .eq('id', sub.id);

        if (deleteError) {
          console.log(`  ❌ Failed: ${deleteError.message}`);
        } else {
          console.log(`  ✅ Deleted`);
        }
      }

      console.log('\n✅ Cleanup complete!');
      console.log(
        'Users will need to subscribe again to get valid Stripe data.'
      );
    }
  } else {
    console.log('\n✅ All subscriptions are valid!');
  }
}

main()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
