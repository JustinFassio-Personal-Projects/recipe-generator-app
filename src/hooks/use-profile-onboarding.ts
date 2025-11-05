import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/lib/supabase';

export interface OnboardingFormData {
  // Required fields
  dietary_restrictions: string[];
  allergies: string[];
  medical_conditions: string[];
  skill_level: 'beginner' | 'intermediate' | 'advanced';
  units: 'metric' | 'imperial';

  // Optional fields
  time_per_meal: number | null;
  full_name: string | null;
  country: string | null;
  state_province: string | null;
  city: string | null;

  // Cooking preferences (optional)
  preferred_cuisines: string[];
  available_equipment: string[];
  spice_tolerance: number;
  disliked_ingredients: string[];
}

const STORAGE_KEY = 'onboarding_progress';

const getInitialData = (): OnboardingFormData => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse stored onboarding data:', e);
    }
  }

  return {
    dietary_restrictions: [],
    allergies: [],
    medical_conditions: [],
    skill_level: 'beginner',
    units: 'imperial',
    time_per_meal: null,
    full_name: null,
    country: null,
    state_province: null,
    city: null,
    preferred_cuisines: [],
    available_equipment: [],
    spice_tolerance: 3,
    disliked_ingredients: [],
  };
};

export function useProfileOnboarding() {
  const { user, refreshProfile } = useAuth();
  const [formData, setFormData] = useState<OnboardingFormData>(getInitialData);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Persist to localStorage whenever formData changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const updateFormData = useCallback((updates: Partial<OnboardingFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => prev + 1);
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const saveToDatabase = useCallback(
    async (overrideData?: Partial<OnboardingFormData>): Promise<boolean> => {
      if (!user) {
        console.error('❌ No user found');
        return false;
      }

      setIsSaving(true);

      try {
        const dataToSave = overrideData
          ? { ...formData, ...overrideData }
          : formData;
        console.log('💾 Saving onboarding data to database...');
        console.log('User ID:', user.id);
        console.log('Data to save:', dataToSave);

        // Save profile data
        console.log('👤 Upserting profile data...');
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: dataToSave.full_name,
            country: dataToSave.country,
            state_province: dataToSave.state_province,
            city: dataToSave.city,
            skill_level: dataToSave.skill_level,
            units: dataToSave.units,
            time_per_meal: dataToSave.time_per_meal,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
          .select();

        if (profileError) {
          console.error('❌ Profile update error:', profileError);
          throw profileError;
        }
        console.log('✅ Profile data saved successfully:', profileData);

        // Save user safety data (allergies, dietary restrictions, and medical conditions)
        console.log('🛡️ Upserting user_safety data...');
        const { data: safetyData, error: safetyError } = await supabase
          .from('user_safety')
          .upsert(
            {
              user_id: user.id,
              allergies: dataToSave.allergies,
              dietary_restrictions: dataToSave.dietary_restrictions,
              medical_conditions: dataToSave.medical_conditions,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'user_id',
            }
          )
          .select();

        if (safetyError) {
          console.error('❌ Safety data upsert error:', safetyError);
          throw safetyError;
        }
        console.log('✅ Safety data saved successfully:', safetyData);

        // Save cooking preferences
        console.log('👨‍🍳 Upserting cooking preferences...');
        const { data: cookingData, error: cookingError } = await supabase
          .from('cooking_preferences')
          .upsert(
            {
              user_id: user.id,
              preferred_cuisines: dataToSave.preferred_cuisines,
              available_equipment: dataToSave.available_equipment,
              spice_tolerance: dataToSave.spice_tolerance,
              disliked_ingredients: dataToSave.disliked_ingredients,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'user_id',
            }
          )
          .select();

        if (cookingError) {
          console.error('❌ Cooking preferences upsert error:', cookingError);
          throw cookingError;
        }
        console.log('✅ Cooking preferences saved successfully:', cookingData);

        // Clear local storage
        localStorage.removeItem(STORAGE_KEY);

        // Refresh profile
        console.log('🔄 Refreshing profile...');
        await refreshProfile();
        console.log('✅ Profile refreshed successfully');

        return true;
      } catch (error) {
        console.error('❌ Failed to save onboarding data:', error);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [user, formData, refreshProfile]
  );

  return {
    formData,
    updateFormData,
    currentStep,
    nextStep,
    prevStep,
    saveToDatabase,
    isSaving,
  };
}
