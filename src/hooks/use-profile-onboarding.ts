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

const getDefaultData = (): OnboardingFormData => {
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

const getInitialData = (): OnboardingFormData => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('[Onboarding] Failed to parse stored onboarding data:', e);
    }
  }

  return getDefaultData();
};

export function useProfileOnboarding() {
  const { user, refreshProfile } = useAuth();
  const [formData, setFormData] = useState<OnboardingFormData>(getInitialData);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Load existing profile data from database on mount
  useEffect(() => {
    const loadExistingProfile = async () => {
      if (!user) {
        setIsLoadingProfile(false);
        return;
      }

      try {
        // Check if localStorage has in-progress data
        const hasLocalStorage = !!localStorage.getItem(STORAGE_KEY);

        // If there's in-progress data in localStorage, use that
        if (hasLocalStorage) {
          setIsLoadingProfile(false);
          return;
        }

        // Otherwise, load from database
        // Use Promise.allSettled to handle partial failures gracefully
        // (e.g., if user_safety or cooking_preferences don't exist yet)
        const [profileResult, safetyResult, cookingResult] =
          await Promise.allSettled([
            supabase.from('profiles').select('*').eq('id', user.id).single(),
            supabase
              .from('user_safety')
              .select('*')
              .eq('user_id', user.id)
              .single(),
            supabase
              .from('cooking_preferences')
              .select('*')
              .eq('user_id', user.id)
              .single(),
          ]);

        const defaults = getDefaultData();

        // Extract data from Promise.allSettled results, handling failures gracefully
        const profileData =
          profileResult.status === 'fulfilled' &&
          !profileResult.value.error &&
          profileResult.value.data
            ? profileResult.value.data
            : null;
        const safetyData =
          safetyResult.status === 'fulfilled' &&
          !safetyResult.value.error &&
          safetyResult.value.data
            ? safetyResult.value.data
            : null;
        const cookingData =
          cookingResult.status === 'fulfilled' &&
          !cookingResult.value.error &&
          cookingResult.value.data
            ? cookingResult.value.data
            : null;

        const mergedData: OnboardingFormData = {
          // From profiles table
          full_name: profileData?.full_name ?? defaults.full_name,
          country: profileData?.country ?? defaults.country,
          state_province:
            profileData?.state_province ?? defaults.state_province,
          city: profileData?.city ?? defaults.city,
          skill_level: profileData?.skill_level ?? defaults.skill_level,
          units: profileData?.units ?? defaults.units,
          time_per_meal: profileData?.time_per_meal ?? defaults.time_per_meal,

          // From user_safety table
          dietary_restrictions:
            safetyData?.dietary_restrictions ?? defaults.dietary_restrictions,
          allergies: safetyData?.allergies ?? defaults.allergies,
          medical_conditions:
            safetyData?.medical_conditions ?? defaults.medical_conditions,

          // From cooking_preferences table
          preferred_cuisines:
            cookingData?.preferred_cuisines ?? defaults.preferred_cuisines,
          available_equipment:
            cookingData?.available_equipment ?? defaults.available_equipment,
          spice_tolerance:
            cookingData?.spice_tolerance ?? defaults.spice_tolerance,
          disliked_ingredients:
            cookingData?.disliked_ingredients ?? defaults.disliked_ingredients,
        };

        setFormData(mergedData);
      } catch (error) {
        console.error('[Onboarding] Failed to load existing profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadExistingProfile();
  }, [user]);

  // Persist to localStorage whenever formData changes (but only after initial load)
  useEffect(() => {
    if (!isLoadingProfile) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    }
  }, [formData, isLoadingProfile]);

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
        console.error('[Onboarding] No user found');
        return false;
      }

      setIsSaving(true);

      try {
        const dataToSave = overrideData
          ? { ...formData, ...overrideData }
          : formData;

        // Save profile data
        const { error: profileError } = await supabase
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
          console.error('[Onboarding] Profile update error:', profileError);
          throw profileError;
        }

        // Save user safety data (allergies, dietary restrictions, and medical conditions)
        const { error: safetyError } = await supabase
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
          console.error('[Onboarding] Safety data upsert error:', safetyError);
          throw safetyError;
        }

        // Save cooking preferences
        const { error: cookingError } = await supabase
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
          console.error(
            '[Onboarding] Cooking preferences upsert error:',
            cookingError
          );
          throw cookingError;
        }

        // Clear local storage
        localStorage.removeItem(STORAGE_KEY);

        // Refresh profile
        await refreshProfile();

        return true;
      } catch (error) {
        console.error('[Onboarding] Failed to save onboarding data:', error);
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
    isLoadingProfile,
  };
}
