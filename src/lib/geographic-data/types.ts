// Type definitions for geographic data

export interface GeographicOption {
  value: string;
  label: string;
  code?: string;
  flag?: string;
}

export interface StateProvince {
  value: string;
  label: string;
  code: string;
  country: string;
}

export interface City {
  value: string;
  label: string;
  stateProvince: string;
  country: string;
}

export type StateProvinceName =
  | 'Alabama'
  | 'Alaska'
  | 'Arizona'
  | 'Arkansas'
  | 'California'
  | 'Colorado'
  | 'Connecticut'
  | 'Delaware'
  | 'District of Columbia'
  | 'Florida'
  | 'Georgia'
  | 'Hawaii'
  | 'Idaho'
  | 'Illinois'
  | 'Indiana'
  | 'Iowa'
  | 'Kansas'
  | 'Kentucky'
  | 'Louisiana'
  | 'Maine'
  | 'Maryland'
  | 'Massachusetts'
  | 'Michigan'
  | 'Minnesota'
  | 'Mississippi'
  | 'Missouri'
  | 'Montana'
  | 'Nebraska'
  | 'Nevada'
  | 'New Hampshire'
  | 'New Jersey'
  | 'New Mexico'
  | 'New York'
  | 'North Carolina'
  | 'North Dakota'
  | 'Ohio'
  | 'Oklahoma'
  | 'Oregon'
  | 'Pennsylvania'
  | 'Rhode Island'
  | 'South Carolina'
  | 'South Dakota'
  | 'Tennessee'
  | 'Texas'
  | 'Utah'
  | 'Vermont'
  | 'Virginia'
  | 'Washington'
  | 'West Virginia'
  | 'Wisconsin'
  | 'Wyoming'
  | 'Alberta'
  | 'British Columbia'
  | 'Manitoba'
  | 'New Brunswick'
  | 'Newfoundland and Labrador'
  | 'Nova Scotia'
  | 'Ontario'
  | 'Prince Edward Island'
  | 'Quebec'
  | 'Saskatchewan'
  | 'Northwest Territories'
  | 'Nunavut'
  | 'Yukon'
  | 'Aguascalientes'
  | 'Baja California'
  | 'Baja California Sur'
  | 'Campeche'
  | 'Chiapas'
  | 'Chihuahua'
  | 'Coahuila'
  | 'Colima'
  | 'Durango'
  | 'Guanajuato'
  | 'Guerrero'
  | 'Hidalgo'
  | 'Jalisco'
  | 'Mexico City'
  | 'Mexico State'
  | 'Michoacán'
  | 'Morelos'
  | 'Nayarit'
  | 'Nuevo Leon'
  | 'Oaxaca'
  | 'Puebla'
  | 'Querétaro'
  | 'Quintana Roo'
  | 'San Luis Potosí'
  | 'Sinaloa'
  | 'Sonora'
  | 'Tabasco'
  | 'Tamaulipas'
  | 'Tlaxcala'
  | 'Veracruz'
  | 'Yucatán'
  | 'Zacatecas'
  | 'Mexico';
