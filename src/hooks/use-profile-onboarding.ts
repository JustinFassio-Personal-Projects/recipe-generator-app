import { useState, useCallback, useEffect, useRef } from 'react';
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
  // Track if data was just loaded from database to avoid immediately persisting
  const justLoadedFromDatabase = useRef(false);

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

        // Mark that we just loaded from database
        justLoadedFromDatabase.current = true;
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
  // Skip persistence if data was just loaded from database (user hasn't modified it yet)
  useEffect(() => {
    if (!isLoadingProfile) {
      // If data was just loaded from database, skip the first persistence
      // This allows user modifications to persist, but prevents overwriting
      // localStorage with database data that hasn't been modified
      if (justLoadedFromDatabase.current) {
        justLoadedFromDatabase.current = false;
        return;
      }
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

        // Helper function to sanitize optional string fields: convert empty strings to null
        const sanitizeString = (
          value: string | null | undefined
        ): string | null => {
          if (value === null || value === undefined) return null;
          const trimmed = value.trim();
          return trimmed === '' ? null : trimmed;
        };

        // Helper function to ensure arrays are never null
        const sanitizeArray = <T>(value: T[] | null | undefined): T[] => {
          return value && Array.isArray(value) ? value : [];
        };

        // Sanitize optional string fields - convert empty strings to null to satisfy CHECK constraints
        const sanitizedFullName = sanitizeString(dataToSave.full_name);
        const sanitizedCountry = sanitizeString(dataToSave.country);
        const sanitizedStateProvince = sanitizeString(
          dataToSave.state_province
        );
        const sanitizedCity = sanitizeString(dataToSave.city);

        // Ensure arrays are never null
        const sanitizedAllergies = sanitizeArray(dataToSave.allergies);
        const sanitizedDietaryRestrictions = sanitizeArray(
          dataToSave.dietary_restrictions
        );
        const sanitizedMedicalConditions = sanitizeArray(
          dataToSave.medical_conditions
        );
        const sanitizedPreferredCuisines = sanitizeArray(
          dataToSave.preferred_cuisines
        );
        const sanitizedAvailableEquipment = sanitizeArray(
          dataToSave.available_equipment
        );
        const sanitizedDislikedIngredients = sanitizeArray(
          dataToSave.disliked_ingredients
        );

        // Ensure profile exists first - check if profile exists, create if not
        const { data: existingProfile, error: profileCheckError } =
          await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();

        if (profileCheckError && profileCheckError.code !== 'PGRST116') {
          // PGRST116 is "not found" which is fine, we'll create it
          console.error('[Onboarding] Profile check error:', profileCheckError);
          throw profileCheckError;
        }

        // If profile doesn't exist, create it first with minimal required fields
        if (!existingProfile) {
          const { error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              language: 'en',
              units: dataToSave.units || 'imperial',
              skill_level: dataToSave.skill_level || 'beginner',
            })
            .select()
            .single();

          if (createError) {
            console.error('[Onboarding] Profile creation error:', createError);
            // If it's a conflict (profile was created between check and insert), continue
            if (createError.code !== '23505') {
              throw createError;
            }
          }
        }

        // Update profile data
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: sanitizedFullName,
            country: sanitizedCountry,
            state_province: sanitizedStateProvince,
            city: sanitizedCity,
            skill_level: dataToSave.skill_level,
            units: dataToSave.units,
            time_per_meal: dataToSave.time_per_meal,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
          .select();

        if (profileError) {
          console.error('[Onboarding] Profile update error:', {
            code: profileError.code,
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint,
          });
          throw profileError;
        }

        // Save user safety data (allergies, dietary restrictions, and medical conditions)
        // Handle 409 conflicts gracefully - if conflict occurs, try update instead
        const { error: safetyError } = await supabase
          .from('user_safety')
          .upsert(
            {
              user_id: user.id,
              allergies: sanitizedAllergies,
              dietary_restrictions: sanitizedDietaryRestrictions,
              medical_conditions: sanitizedMedicalConditions,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'user_id',
            }
          )
          .select();

        if (safetyError) {
          // Handle 409 conflict - try update instead
          if (safetyError.code === '23505' || safetyError.code === '409') {
            console.warn(
              '[Onboarding] Safety data conflict, attempting update:',
              safetyError
            );
            const { error: updateError } = await supabase
              .from('user_safety')
              .update({
                allergies: sanitizedAllergies,
                dietary_restrictions: sanitizedDietaryRestrictions,
                medical_conditions: sanitizedMedicalConditions,
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', user.id)
              .select();

            if (updateError) {
              console.error('[Onboarding] Safety data update error:', {
                code: updateError.code,
                message: updateError.message,
                details: updateError.details,
              });
              throw updateError;
            }
          } else {
            console.error('[Onboarding] Safety data upsert error:', {
              code: safetyError.code,
              message: safetyError.message,
              details: safetyError.details,
            });
            throw safetyError;
          }
        }

        // Save cooking preferences
        const { error: cookingError } = await supabase
          .from('cooking_preferences')
          .upsert(
            {
              user_id: user.id,
              preferred_cuisines: sanitizedPreferredCuisines,
              available_equipment: sanitizedAvailableEquipment,
              spice_tolerance: dataToSave.spice_tolerance ?? 3,
              disliked_ingredients: sanitizedDislikedIngredients,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'user_id',
            }
          )
          .select();

        if (cookingError) {
          // Handle 409 conflict - try update instead
          if (cookingError.code === '23505' || cookingError.code === '409') {
            console.warn(
              '[Onboarding] Cooking preferences conflict, attempting update:',
              cookingError
            );
            const { error: updateError } = await supabase
              .from('cooking_preferences')
              .update({
                preferred_cuisines: sanitizedPreferredCuisines,
                available_equipment: sanitizedAvailableEquipment,
                spice_tolerance: dataToSave.spice_tolerance ?? 3,
                disliked_ingredients: sanitizedDislikedIngredients,
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', user.id)
              .select();

            if (updateError) {
              console.error('[Onboarding] Cooking preferences update error:', {
                code: updateError.code,
                message: updateError.message,
                details: updateError.details,
              });
              throw updateError;
            }
          } else {
            console.error('[Onboarding] Cooking preferences upsert error:', {
              code: cookingError.code,
              message: cookingError.message,
              details: cookingError.details,
            });
            throw cookingError;
          }
        }

        // Clear local storage
        localStorage.removeItem(STORAGE_KEY);

        // Refresh profile
        await refreshProfile();

        return true;
      } catch (error) {
        console.error('[Onboarding] Failed to save onboarding data:', error);
        // Log detailed error information for debugging
        if (error && typeof error === 'object' && 'code' in error) {
          const errorObj = error as {
            code?: string;
            message?: string;
            details?: string;
            hint?: string;
          };
          console.error('[Onboarding] Error details:', {
            code: errorObj.code,
            message: errorObj.message,
            details: errorObj.details,
            hint: errorObj.hint,
          });
        }
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
