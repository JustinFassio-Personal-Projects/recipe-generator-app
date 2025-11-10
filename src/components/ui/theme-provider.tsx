/**
 * ThemeProvider Component
 *
 * This component serves as a wrapper for potential future theme-related features.
 * Theme initialization is now handled by TenantProvider, which applies tenant-specific
 * themes based on the subdomain and database configuration.
 *
 * @see TenantContext.tsx - Handles all theme initialization and branding
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Theme initialization removed - now handled by TenantProvider
  // This ensures tenant-specific themes (like 'silk' for Sanctuary Health)
  // are applied correctly without race conditions
  return <>{children}</>;
}
