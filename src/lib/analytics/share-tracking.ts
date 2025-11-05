/**
 * Share tracking and analytics utilities
 * Tracks recipe shares, views, and conversions
 */

import { supabase } from '@/lib/supabase';

export interface ShareViewEvent {
  recipe_id: string;
  referrer?: string;
  platform?: string;
  user_agent?: string;
  viewed_at?: string;
}

export interface ShareClickEvent {
  recipe_id: string;
  method: 'native_share' | 'clipboard' | 'social_button';
  has_ref: boolean;
  platform?: string;
}

/**
 * Detect platform from user agent string
 */
export function detectPlatform(userAgent?: string | null): string {
  if (!userAgent) return 'unknown';

  const ua = userAgent.toLowerCase();

  // Social media platforms
  if (ua.includes('fban') || ua.includes('fbav') || ua.includes('fb_iab'))
    return 'facebook';
  if (ua.includes('twitter')) return 'twitter';
  if (ua.includes('whatsapp')) return 'whatsapp';
  if (ua.includes('instagram')) return 'instagram';
  if (ua.includes('linkedin')) return 'linkedin';
  if (ua.includes('pinterest')) return 'pinterest';
  if (ua.includes('telegram')) return 'telegram';

  // Messaging apps
  if (ua.includes('line/')) return 'line';
  if (ua.includes('kakaotalk')) return 'kakaotalk';
  if (ua.includes('wechat')) return 'wechat';

  // Email clients
  if (ua.includes('outlook')) return 'outlook';
  if (ua.includes('gmail')) return 'gmail';

  return 'other';
}

/**
 * Track when a shared recipe is viewed
 * Called when a user opens a recipe with ?shared=true parameter
 */
export async function trackShareView(event: ShareViewEvent): Promise<void> {
  try {
    const platform = event.platform || detectPlatform(event.user_agent);

    const { error } = await supabase.from('share_views').insert({
      recipe_id: event.recipe_id,
      referrer: event.referrer || null,
      platform,
      user_agent: event.user_agent || null,
      viewed_at: event.viewed_at || new Date().toISOString(),
    });

    if (error) {
      console.error('❌ Failed to track share view:', error);
      return;
    }

    console.log('✅ Share view tracked:', {
      recipe_id: event.recipe_id,
      platform,
      referrer: event.referrer,
    });
  } catch (error) {
    console.error('❌ Error tracking share view:', error);
  }
}

/**
 * Track when a user clicks the share button
 * This is a client-side analytics event (not stored in database)
 */
export function trackShareClick(event: ShareClickEvent): void {
  try {
    console.log('📤 Share button clicked:', event);

    // You can integrate with analytics services here
    // Example: Google Analytics, Mixpanel, Amplitude, etc.
    if (typeof window !== 'undefined') {
      const windowWithGtag = window as Window & {
        gtag?: (
          command: string,
          action: string,
          params?: Record<string, unknown>
        ) => void;
      };

      if (windowWithGtag.gtag) {
        windowWithGtag.gtag('event', 'share_recipe', {
          recipe_id: event.recipe_id,
          method: event.method,
          has_ref: event.has_ref,
          platform: event.platform,
        });
      }
    }
  } catch (error) {
    console.error('❌ Error tracking share click:', error);
  }
}

/**
 * Mark a share view as converted when user signs up
 * Called after successful signup from a shared link
 */
export async function markShareConversion(
  recipeId: string,
  userId: string
): Promise<void> {
  try {
    // Find the most recent share view for this recipe (within last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const { error } = await supabase
      .from('share_views')
      .update({
        converted_to_signup: true,
        converted_user_id: userId,
      })
      .eq('recipe_id', recipeId)
      .gte('viewed_at', oneDayAgo.toISOString())
      .is('converted_to_signup', false)
      .order('viewed_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ Failed to mark share conversion:', error);
      return;
    }

    console.log('✅ Share conversion tracked:', {
      recipe_id: recipeId,
      user_id: userId,
    });
  } catch (error) {
    console.error('❌ Error marking share conversion:', error);
  }
}

/**
 * Get share statistics for a recipe
 * Returns total views, unique platforms, and conversion rate
 */
export async function getRecipeShareStats(recipeId: string): Promise<{
  total_views: number;
  platforms: Record<string, number>;
  conversions: number;
  conversion_rate: number;
} | null> {
  try {
    const { data: views, error } = await supabase
      .from('share_views')
      .select('platform, converted_to_signup')
      .eq('recipe_id', recipeId);

    if (error) {
      console.error('❌ Failed to get share stats:', error);
      return null;
    }

    if (!views || views.length === 0) {
      return {
        total_views: 0,
        platforms: {},
        conversions: 0,
        conversion_rate: 0,
      };
    }

    // Calculate statistics
    const total_views = views.length;
    const conversions = views.filter((v) => v.converted_to_signup).length;
    const conversion_rate =
      total_views > 0 ? (conversions / total_views) * 100 : 0;

    // Group by platform
    const platforms: Record<string, number> = {};
    views.forEach((view) => {
      const platform = view.platform || 'unknown';
      platforms[platform] = (platforms[platform] || 0) + 1;
    });

    return {
      total_views,
      platforms,
      conversions,
      conversion_rate,
    };
  } catch (error) {
    console.error('❌ Error getting share stats:', error);
    return null;
  }
}
