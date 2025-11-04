/**
 * Page View Tracking Hook
 *
 * Automatically tracks page views when navigating in a Single Page Application.
 * Uses React Router's useLocation hook to detect route changes.
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/lib/vercel-analytics';

/**
 * Hook to track page views on route changes
 */
export function usePageTracking(): void {
  const location = useLocation();
  const prevPathRef = useRef<string>('');

  useEffect(() => {
    const currentPath = location.pathname + location.search;

    // Only track if path has changed (not on initial mount duplicate)
    if (prevPathRef.current !== currentPath) {
      prevPathRef.current = currentPath;

      // Get page title
      const pageTitle = getPageTitle(location.pathname);

      // Track the page view
      trackPageView(currentPath, pageTitle);
    }
  }, [location]);
}

/**
 * Get user-friendly page title from path
 */
function getPageTitle(pathname: string): string {
  const titleMap: Record<string, string> = {
    '/': 'Home',
    '/recipes': 'My Recipes',
    '/explore': 'Explore Recipes',
    '/add': 'Add Recipe',
    '/chat-recipe': 'AI Recipe Chat',
    '/coach-chat': 'Health Coach Chat',
    '/profile': 'Profile',
    '/cart': 'Shopping Cart',
    '/global-ingredients': 'Global Ingredients',
    '/subscription': 'Subscription',
    '/subscription/success': 'Subscription Success',
    '/kitchen': 'Kitchen Inventory',
    '/health-coaches': 'Health Coaches',
    '/evaluation-report': 'Health Evaluation',
    '/phase4-demo': 'Phase 4 Demo',
    '/auth/signin': 'Sign In',
    '/auth/signup': 'Sign Up',
    '/auth/callback': 'Auth Callback',
  };

  // Check for exact match
  if (titleMap[pathname]) {
    return titleMap[pathname];
  }

  // Check for dynamic routes
  if (pathname.startsWith('/recipe/') || pathname.startsWith('/view-recipe/')) {
    return 'View Recipe';
  }

  // Default to pathname
  return pathname;
}
