// Main geographic data exports
// Central entry point for all geographic data and helper functions

// Export types
export type {
  GeographicOption,
  StateProvince,
  City,
  StateProvinceName,
} from './types';

// Export country data
export { AVAILABLE_COUNTRIES, NORTH_AMERICAN_COUNTRIES } from './countries';

// Export state/province data
export { US_STATES } from './us-states';
export { CANADIAN_PROVINCES } from './canadian-provinces';
export { MEXICAN_STATES } from './mexican-states';

// Export US city data (comprehensive by state)
export { US_CITIES_BY_STATE } from './us-cities';

// Export legacy MAJOR_CITIES for backward compatibility
export { MAJOR_CITIES } from './cities';

// Re-imports for helper functions
import { US_STATES } from './us-states';
import { CANADIAN_PROVINCES } from './canadian-provinces';
import { MEXICAN_STATES } from './mexican-states';
import { MAJOR_CITIES } from './cities';
import { US_CITIES_BY_STATE } from './us-cities';
import type { StateProvince, StateProvinceName } from './types';

// Combined states and provinces for all North American countries
export const ALL_STATES_PROVINCES: StateProvince[] = [
  ...US_STATES,
  ...CANADIAN_PROVINCES,
  ...MEXICAN_STATES,
];

// Helper function to get states/provinces by country
export const getStatesProvincesByCountry = (
  country: string
): StateProvince[] => {
  switch (country) {
    case 'United States':
      return US_STATES;
    case 'Canada':
      return CANADIAN_PROVINCES;
    case 'Mexico':
      return MEXICAN_STATES;
    default:
      return [];
  }
};

// Helper function to get state/province by code
export const getStateProvinceByCode = (
  code: string,
  country: string
): StateProvince | undefined => {
  const statesProvinces = getStatesProvincesByCountry(country);
  return statesProvinces.find((sp) => sp.code === code);
};

// Helper function to get state/province by value
export const getStateProvinceByValue = (
  value: string,
  country: string
): StateProvince | undefined => {
  const statesProvinces = getStatesProvincesByCountry(country);
  return statesProvinces.find((sp) => sp.value === value);
};

// Helper function to get cities by state/province
// For US states, uses comprehensive city list; for Canada/Mexico, uses major cities
export const getCitiesByStateProvince = (stateProvince: string): string[] => {
  // Try US comprehensive list first
  const usCities = US_CITIES_BY_STATE[stateProvince as StateProvinceName];
  if (usCities && usCities.length > 0) {
    return usCities;
  }

  // Fall back to major cities (for Canada and Mexico)
  return MAJOR_CITIES[stateProvince as StateProvinceName] || [];
};

// Helper function to get all cities by country
export const getCitiesByCountry = (country: string): string[] => {
  const statesProvinces = getStatesProvincesByCountry(country);
  const allCities: string[] = [];

  statesProvinces.forEach((state) => {
    const cities = getCitiesByStateProvince(state.value);
    allCities.push(...cities);
  });

  return allCities;
};
