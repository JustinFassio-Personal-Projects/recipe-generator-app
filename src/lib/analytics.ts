import { onCLS, onINP, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals';
import { trackEvent, getUserContext } from './vercel-analytics';

type VitalRating = 'good' | 'needs-improvement' | 'poor';
type WebVitalMetric = Metric & { rating: VitalRating };

function sendToAnalytics(metric: WebVitalMetric): void {
  // Get user context for enhanced tracking
  const userContext = getUserContext();

  // Track web vital with Vercel Analytics using the track() API
  trackEvent('web_vital', {
    metric: metric.name,
    value: metric.value,
    rating: metric.rating,
    ...userContext,
  });

  // Log in development
  if (import.meta.env.DEV) {
    console.log(`[Web Vital] ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating,
      ...userContext,
    });
  }
}

export function initWebVitals(): void {
  onCLS(sendToAnalytics);
  onINP(sendToAnalytics);
  onFCP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}
