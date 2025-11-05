// Country definitions

import type { GeographicOption } from './types';

export const AVAILABLE_COUNTRIES: GeographicOption[] = [
  // North America
  { value: 'United States', label: 'United States', code: 'US', flag: '🇺🇸' },
  { value: 'Canada', label: 'Canada', code: 'CA', flag: '🇨🇦' },
  { value: 'Mexico', label: 'Mexico', code: 'MX', flag: '🇲🇽' },

  // Europe
  { value: 'United Kingdom', label: 'United Kingdom', code: 'GB', flag: '🇬🇧' },
  { value: 'Germany', label: 'Germany', code: 'DE', flag: '🇩🇪' },
  { value: 'France', label: 'France', code: 'FR', flag: '🇫🇷' },
  { value: 'Italy', label: 'Italy', code: 'IT', flag: '🇮🇹' },
  { value: 'Spain', label: 'Spain', code: 'ES', flag: '🇪🇸' },
  { value: 'Netherlands', label: 'Netherlands', code: 'NL', flag: '🇳🇱' },
  { value: 'Belgium', label: 'Belgium', code: 'BE', flag: '🇧🇪' },
  { value: 'Switzerland', label: 'Switzerland', code: 'CH', flag: '🇨🇭' },
  { value: 'Sweden', label: 'Sweden', code: 'SE', flag: '🇸🇪' },
  { value: 'Norway', label: 'Norway', code: 'NO', flag: '🇳🇴' },
  { value: 'Denmark', label: 'Denmark', code: 'DK', flag: '🇩🇰' },
  { value: 'Finland', label: 'Finland', code: 'FI', flag: '🇫🇮' },
  { value: 'Poland', label: 'Poland', code: 'PL', flag: '🇵🇱' },
  { value: 'Austria', label: 'Austria', code: 'AT', flag: '🇦🇹' },
  { value: 'Ireland', label: 'Ireland', code: 'IE', flag: '🇮🇪' },
  { value: 'Portugal', label: 'Portugal', code: 'PT', flag: '🇵🇹' },
  { value: 'Greece', label: 'Greece', code: 'GR', flag: '🇬🇷' },
  { value: 'Czech Republic', label: 'Czech Republic', code: 'CZ', flag: '🇨🇿' },

  // South America
  { value: 'Brazil', label: 'Brazil', code: 'BR', flag: '🇧🇷' },
  { value: 'Argentina', label: 'Argentina', code: 'AR', flag: '🇦🇷' },
  { value: 'Chile', label: 'Chile', code: 'CL', flag: '🇨🇱' },
  { value: 'Colombia', label: 'Colombia', code: 'CO', flag: '🇨🇴' },
  { value: 'Peru', label: 'Peru', code: 'PE', flag: '🇵🇪' },

  // Other
  { value: 'Other', label: 'Other Country', code: 'OTHER', flag: '🌍' },
];

// Legacy export for backward compatibility
export const NORTH_AMERICAN_COUNTRIES = AVAILABLE_COUNTRIES;
