import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/shared/feedback/ErrorBoundary';
import { Analytics, type BeforeSendEvent } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { initWebVitals } from './lib/analytics';
import { initializeAnalytics, isOptedOut } from './lib/vercel-analytics';
import './index.css';

// Initialize analytics
initializeAnalytics();

// Sensitive routes that should not be tracked in detail
const SENSITIVE_ROUTES = [
  '/profile',
  '/subscription',
  '/auth/callback',
  '/auth/reset',
];

/**
 * Filter analytics events before sending
 * - Block events if user opted out
 * - Redact sensitive route details
 * - Remove PII from events
 */
function beforeSend(event: BeforeSendEvent): BeforeSendEvent | null {
  // Check user opt-out
  if (isOptedOut()) {
    return null;
  }

  // Filter sensitive routes - only track that they visited, not details
  if (SENSITIVE_ROUTES.some((route) => event.url.includes(route))) {
    // Track the page view but redact query params and specifics
    return {
      ...event,
      url: event.url.split('?')[0], // Remove query params
    };
  }

  return event;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
    <Analytics beforeSend={beforeSend} />
    <SpeedInsights />
  </StrictMode>
);

if (typeof window !== 'undefined') {
  initWebVitals();
}

// Sentry removed
