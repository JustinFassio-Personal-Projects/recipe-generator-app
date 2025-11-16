// Quick test to check subscription status in browser console
console.log('=== Subscription Status Test ===');
console.log('User:', await supabase.auth.getUser());
console.log(
  'Subscription:',
  await supabase.from('user_subscriptions').select('*').maybeSingle()
);
console.log(
  'Status View:',
  await supabase.from('user_subscription_status').select('*').maybeSingle()
);
