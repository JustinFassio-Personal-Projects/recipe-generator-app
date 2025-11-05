import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OnboardingNavigation } from '../OnboardingNavigation';
import {
  AVAILABLE_COUNTRIES,
  getStatesProvincesByCountry,
  getCitiesByStateProvince,
} from '@/lib/geographic-data/';

interface LocationStepProps {
  initialCountry: string | null;
  initialStateProvince: string | null;
  initialCity: string | null;
  onNext: (data: {
    country: string | null;
    state_province: string | null;
    city: string | null;
  }) => void;
  onBack: () => void;
  onSkip: () => void;
}

export function LocationStep({
  initialCountry,
  initialStateProvince,
  initialCity,
  onNext,
  onBack,
  onSkip,
}: LocationStepProps) {
  const [country, setCountry] = useState<string>(initialCountry || '');
  const [stateProvince, setStateProvince] = useState<string>(
    initialStateProvince || ''
  );
  const [city, setCity] = useState<string>(initialCity || '');

  // Get available states/provinces based on selected country
  const availableStates = country ? getStatesProvincesByCountry(country) : [];

  // Get available cities based on selected state/province
  const availableCities = stateProvince
    ? getCitiesByStateProvince(stateProvince)
    : [];

  // Reset state/province when country changes
  useEffect(() => {
    if (
      country &&
      !availableStates.some((state) => state.value === stateProvince)
    ) {
      setStateProvince('');
      setCity('');
    }
  }, [country, availableStates, stateProvince]);

  // Reset city when state/province changes
  useEffect(() => {
    if (stateProvince && !availableCities.includes(city)) {
      setCity('');
    }
  }, [stateProvince, availableCities, city]);

  const handleCountryChange = (value: string) => {
    setCountry(value);
    setStateProvince('');
    setCity('');
  };

  const handleStateProvinceChange = (value: string) => {
    setStateProvince(value);
    setCity('');
  };

  const handleNext = () => {
    onNext({
      country: country || null,
      state_province: stateProvince || null,
      city: city || null,
    });
  };

  const hasAnyData = country || stateProvince || city;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2, ease: [0.4, 0.0, 0.2, 1] }}
      className="h-full flex flex-col px-4"
    >
      <div className="text-center py-6">
        <span className="text-5xl mb-4 block">📍</span>
        <h2 className="text-2xl font-bold mb-2">Where are you located?</h2>
        <p className="text-gray-600 text-sm">
          Helps us suggest local ingredients and recipes (Optional)
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center pb-4">
        <div className="w-full max-w-md px-4 space-y-4">
          {/* Country Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <Select value={country} onValueChange={handleCountryChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select your country" />
              </SelectTrigger>
              <SelectContent position="popper" side="bottom" align="start">
                {AVAILABLE_COUNTRIES.map((countryOption) => (
                  <SelectItem
                    key={countryOption.value}
                    value={countryOption.value}
                  >
                    {countryOption.flag && (
                      <span className="mr-2">{countryOption.flag}</span>
                    )}
                    {countryOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* State/Province Dropdown - Only show if country is selected */}
          {country && availableStates.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State/Province
              </label>
              <Select
                value={stateProvince}
                onValueChange={handleStateProvinceChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your state/province" />
                </SelectTrigger>
                <SelectContent position="popper" side="bottom" align="start">
                  {availableStates.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* City Dropdown - Only show if state/province is selected */}
          {stateProvince && availableCities.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your city" />
                </SelectTrigger>
                <SelectContent position="popper" side="bottom" align="start">
                  {availableCities.map((cityOption) => (
                    <SelectItem key={cityOption} value={cityOption}>
                      {cityOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {country === 'Other' && (
            <p className="text-xs text-gray-500 italic">
              State/province and city data is currently available for US,
              Canada, and Mexico only.
            </p>
          )}

          {country &&
            !['United States', 'Canada', 'Mexico'].includes(country) &&
            country !== 'Other' && (
              <p className="text-xs text-gray-500 italic">
                State/province and city data is not yet available for {country}.
              </p>
            )}
        </div>
      </div>

      <OnboardingNavigation
        onNext={handleNext}
        onBack={onBack}
        onSkip={onSkip}
        isNextDisabled={!hasAnyData}
        showSkip={true}
      />
    </motion.div>
  );
}
