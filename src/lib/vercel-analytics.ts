/**
 * Vercel Analytics Integration
 *
 * Centralized analytics tracking for business events, user actions, and conversions.
 * Uses @vercel/analytics track() API for custom event tracking.
 */

import { track } from '@vercel/analytics';
import { supabase } from './supabase';

// ============================================================================
// Event Type Definitions
// ============================================================================

export type AnalyticsEvent =
  // Authentication Events
  | 'user_signed_up'
  | 'user_signed_in'
  | 'user_signed_out'
  | 'magic_link_requested'
  | 'password_reset_requested'
  // Recipe Events
  | 'recipe_created'
  | 'recipe_updated'
  | 'recipe_deleted'
  | 'recipe_viewed'
  | 'recipe_saved'
  | 'recipe_shared'
  | 'recipe_rated'
  | 'recipe_commented'
  // Search & Filter Events
  | 'recipe_search'
  | 'recipe_filtered'
  | 'ingredient_searched'
  // AI Events
  | 'ai_recipe_generated'
  | 'ai_chat_started'
  | 'ai_chat_message_sent'
  | 'ai_image_generated'
  // Subscription Events
  | 'subscription_plan_viewed'
  | 'subscription_checkout_started'
  | 'subscription_converted'
  | 'subscription_cancelled'
  | 'subscription_updated'
  // Engagement Events
  | 'grocery_list_created'
  | 'grocery_item_added'
  | 'profile_updated'
  | 'avatar_uploaded'
  // Error Events
  | 'error_occurred'
  | 'api_error'
  // Performance Events
  | 'web_vital'
  | 'page_view';

export interface EventProperties {
  // User context
  user_id?: string;
  user_email?: string;
  is_authenticated?: boolean;

  // Recipe context
  recipe_id?: string;
  recipe_title?: string;
  recipe_category?: string[];
  recipe_difficulty?: string;
  recipe_cooking_time?: number;

  // Search/Filter context
  search_query?: string;
  filter_type?: string;
  filter_value?: string;
  results_count?: number;

  // AI context
  ai_model?: string;
  ai_tokens_used?: number;
  ai_cost?: number;
  ai_duration?: number;

  // Subscription context
  subscription_plan?: string;
  subscription_price?: number;
  subscription_interval?: string;

  // Error context
  error_message?: string;
  error_category?: string;
  error_level?: 'error' | 'warning' | 'info';
  error_stack?: string;

  // Performance context
  metric?: string;
  value?: number;
  rating?: string;

  // Page context
  page_path?: string;
  page_title?: string;
  referrer?: string;

  // Generic properties
  [key: string]: string | number | boolean | string[] | undefined | null;
}

// ============================================================================
// User Context
// ============================================================================

let currentUserId: string | null = null;
let currentUserEmail: string | null = null;

/**
 * Initialize user context for analytics
 */
export async function initializeUserContext(): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      currentUserId = user.id;
      currentUserEmail = user.email || null;
    }
  } catch (error) {
    console.warn('[Analytics] Failed to initialize user context:', error);
  }
}

/**
 * Update user context (call after sign in/out)
 */
export function setUserContext(
  userId: string | null,
  email?: string | null
): void {
  currentUserId = userId;
  currentUserEmail = email || null;
}

/**
 * Get current user context
 */
export function getUserContext(): {
  user_id?: string;
  user_email?: string;
  is_authenticated: boolean;
} {
  return {
    user_id: currentUserId || undefined,
    user_email: currentUserEmail || undefined,
    is_authenticated: !!currentUserId,
  };
}

// ============================================================================
// Analytics Opt-Out
// ============================================================================

const OPT_OUT_KEY = 'analytics-opt-out';

/**
 * Check if user has opted out of analytics
 */
export function isOptedOut(): boolean {
  try {
    return localStorage.getItem(OPT_OUT_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Opt user out of analytics
 */
export function optOut(): void {
  try {
    localStorage.setItem(OPT_OUT_KEY, 'true');
  } catch (error) {
    console.warn('[Analytics] Failed to set opt-out:', error);
  }
}

/**
 * Opt user back in to analytics
 */
export function optIn(): void {
  try {
    localStorage.removeItem(OPT_OUT_KEY);
  } catch (error) {
    console.warn('[Analytics] Failed to remove opt-out:', error);
  }
}

// ============================================================================
// Core Tracking Functions
// ============================================================================

/**
 * Track a custom event with Vercel Analytics
 */
export function trackEvent(
  eventName: AnalyticsEvent,
  properties: EventProperties = {}
): void {
  // Check opt-out
  if (isOptedOut()) {
    if (import.meta.env.DEV) {
      console.log('[Analytics] Event blocked - user opted out:', eventName);
    }
    return;
  }

  // Add user context automatically
  const enrichedProperties: EventProperties = {
    ...getUserContext(),
    ...properties,
    timestamp: Date.now(),
  };

  // Remove undefined/null values and convert arrays to strings
  // Vercel Analytics only accepts: string, number, boolean, or null
  const cleanProperties = Object.entries(enrichedProperties).reduce(
    (acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        // Convert arrays to comma-separated strings
        if (Array.isArray(value)) {
          acc[key] = value.join(',');
        } else {
          acc[key] = value;
        }
      }
      return acc;
    },
    {} as Record<string, string | number | boolean>
  );

  try {
    // Send to Vercel Analytics
    track(eventName, cleanProperties);

    // Log in development
    if (import.meta.env.DEV) {
      console.log(`[Analytics] ${eventName}`, cleanProperties);
    }
  } catch (error) {
    console.warn('[Analytics] Failed to track event:', error);
  }
}

/**
 * Track page view
 */
export function trackPageView(path: string, title?: string): void {
  trackEvent('page_view', {
    page_path: path,
    page_title: title || document.title,
    referrer: document.referrer || undefined,
  });
}

// ============================================================================
// Convenience Functions for Common Events
// ============================================================================

/**
 * Track authentication events
 */
export const authEvents = {
  signUp: (userId: string, email?: string) => {
    setUserContext(userId, email);
    trackEvent('user_signed_up', {
      user_id: userId,
      user_email: email,
    });
  },

  signIn: (userId: string, email?: string) => {
    setUserContext(userId, email);
    trackEvent('user_signed_in', {
      user_id: userId,
      user_email: email,
    });
  },

  signOut: () => {
    trackEvent('user_signed_out');
    setUserContext(null, null);
  },

  magicLink: (email: string) => {
    trackEvent('magic_link_requested', {
      user_email: email,
    });
  },

  passwordReset: (email: string) => {
    trackEvent('password_reset_requested', {
      user_email: email,
    });
  },
};

/**
 * Track recipe events
 */
export const recipeEvents = {
  created: (recipeId: string, title: string, categories?: string[]) => {
    trackEvent('recipe_created', {
      recipe_id: recipeId,
      recipe_title: title,
      recipe_category: categories,
    });
  },

  updated: (recipeId: string, title: string) => {
    trackEvent('recipe_updated', {
      recipe_id: recipeId,
      recipe_title: title,
    });
  },

  deleted: (recipeId: string) => {
    trackEvent('recipe_deleted', {
      recipe_id: recipeId,
    });
  },

  viewed: (recipeId: string, title?: string) => {
    trackEvent('recipe_viewed', {
      recipe_id: recipeId,
      recipe_title: title,
    });
  },

  saved: (recipeId: string) => {
    trackEvent('recipe_saved', {
      recipe_id: recipeId,
    });
  },

  shared: (recipeId: string) => {
    trackEvent('recipe_shared', {
      recipe_id: recipeId,
    });
  },

  rated: (recipeId: string, rating: number) => {
    trackEvent('recipe_rated', {
      recipe_id: recipeId,
      value: rating,
    });
  },

  commented: (recipeId: string) => {
    trackEvent('recipe_commented', {
      recipe_id: recipeId,
    });
  },
};

/**
 * Track search and filter events
 */
export const searchEvents = {
  search: (query: string, resultsCount: number) => {
    trackEvent('recipe_search', {
      search_query: query,
      results_count: resultsCount,
    });
  },

  filter: (filterType: string, filterValue: string, resultsCount: number) => {
    trackEvent('recipe_filtered', {
      filter_type: filterType,
      filter_value: filterValue,
      results_count: resultsCount,
    });
  },

  ingredientSearch: (query: string, resultsCount: number) => {
    trackEvent('ingredient_searched', {
      search_query: query,
      results_count: resultsCount,
    });
  },
};

/**
 * Track AI events
 */
export const aiEvents = {
  recipeGenerated: (tokensUsed?: number, duration?: number) => {
    trackEvent('ai_recipe_generated', {
      ai_tokens_used: tokensUsed,
      ai_duration: duration,
    });
  },

  chatStarted: () => {
    trackEvent('ai_chat_started');
  },

  chatMessage: (tokensUsed?: number) => {
    trackEvent('ai_chat_message_sent', {
      ai_tokens_used: tokensUsed,
    });
  },

  imageGenerated: (cost?: number, duration?: number) => {
    trackEvent('ai_image_generated', {
      ai_cost: cost,
      ai_duration: duration,
    });
  },
};

/**
 * Track subscription events
 */
export const subscriptionEvents = {
  planViewed: (plan: string, price: number) => {
    trackEvent('subscription_plan_viewed', {
      subscription_plan: plan,
      subscription_price: price,
    });
  },

  checkoutStarted: (plan: string, price: number) => {
    trackEvent('subscription_checkout_started', {
      subscription_plan: plan,
      subscription_price: price,
    });
  },

  converted: (plan: string, price: number, interval: string) => {
    trackEvent('subscription_converted', {
      subscription_plan: plan,
      subscription_price: price,
      subscription_interval: interval,
    });
  },

  cancelled: (plan: string) => {
    trackEvent('subscription_cancelled', {
      subscription_plan: plan,
    });
  },

  updated: (oldPlan: string, newPlan: string) => {
    trackEvent('subscription_updated', {
      subscription_plan: newPlan,
      old_plan: oldPlan,
    });
  },
};

/**
 * Track engagement events
 */
export const engagementEvents = {
  groceryListCreated: () => {
    trackEvent('grocery_list_created');
  },

  groceryItemAdded: (itemName: string) => {
    trackEvent('grocery_item_added', {
      item_name: itemName,
    });
  },

  profileUpdated: () => {
    trackEvent('profile_updated');
  },

  avatarUploaded: (fileSize: number) => {
    trackEvent('avatar_uploaded', {
      file_size: fileSize,
    });
  },
};

/**
 * Track error events
 */
export const errorEvents = {
  error: (
    message: string,
    category: string,
    level: 'error' | 'warning' | 'info' = 'error',
    stack?: string
  ) => {
    trackEvent('error_occurred', {
      error_message: message,
      error_category: category,
      error_level: level,
      error_stack: stack,
    });
  },

  apiError: (endpoint: string, statusCode: number, message: string) => {
    trackEvent('api_error', {
      api_endpoint: endpoint,
      api_status_code: statusCode,
      error_message: message,
    });
  },
};

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize analytics on app load
 */
export async function initializeAnalytics(): Promise<void> {
  await initializeUserContext();

  if (import.meta.env.DEV) {
    console.log('[Analytics] Initialized', {
      optedOut: isOptedOut(),
      userContext: getUserContext(),
    });
  }
}
