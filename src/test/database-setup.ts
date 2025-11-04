/**
 * Database Test Setup
 * Provides real Supabase client for database tests
 */

import { vi } from 'vitest';
import {
  createDbClient,
  shouldRunDbTests,
} from '../../tests/database/_utils/dbClient';

/**
 * Setup database tests with real Supabase client
 * This function should be called in database test files
 */
export const setupDatabaseTests = () => {
  if (shouldRunDbTests()) {
    // Clear all mocks to ensure clean state
    vi.clearAllMocks();

    // Restore real fetch for database tests
    // Use Node.js built-in fetch (available in Node 18+)
    // Import undici which provides the real fetch implementation
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { fetch: undiciFetch } = require('undici');
      global.fetch = undiciFetch;
    } catch {
      // Fallback: If undici is not available, try to use global fetch
      // Node 18+ has fetch built-in, but it might be in a different location
      const globalFetch = globalThis.fetch as typeof fetch & {
        mockImplementation?: unknown;
      };
      if (
        typeof globalFetch === 'function' &&
        !globalFetch.mockImplementation
      ) {
        global.fetch = globalFetch;
      } else {
        // Last resort: try to import node-fetch
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const nodeFetch = require('node-fetch');
          global.fetch = nodeFetch as typeof fetch;
        } catch {
          throw new Error(
            'Real fetch is required for database tests. Please install undici or ensure Node.js 18+ is used.'
          );
        }
      }
    }

    // Restore all other mocks
    vi.restoreAllMocks();

    // Unmock Supabase for database tests
    vi.unmock('@/lib/supabase');
    vi.unmock('@supabase/supabase-js');

    // Use real Supabase client with service role for admin operations
    return createDbClient('service');
  } else {
    throw new Error('Database tests require Supabase environment variables');
  }
};

/**
 * Check if database tests should run
 */
export const shouldRunDatabaseTests = () => {
  return shouldRunDbTests();
};
