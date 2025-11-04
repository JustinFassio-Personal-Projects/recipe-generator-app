/**
 * Subscription Configuration
 *
 * Central configuration for subscription plans, pricing, and intervals.
 * Update these values when pricing or plan details change.
 */

export const SUBSCRIPTION_CONFIG = {
  PREMIUM_PLAN: {
    name: 'Premium Plan',
    price: 5.99,
    interval: 'monthly',
    trialDays: 7,
  },
} as const;

/**
 * Get subscription plan details for analytics
 */
export function getSubscriptionPlanDetails() {
  return {
    plan: SUBSCRIPTION_CONFIG.PREMIUM_PLAN.name,
    price: SUBSCRIPTION_CONFIG.PREMIUM_PLAN.price,
    interval: SUBSCRIPTION_CONFIG.PREMIUM_PLAN.interval,
  };
}
