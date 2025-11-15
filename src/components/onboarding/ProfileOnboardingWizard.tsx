import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useProfileOnboarding } from '@/hooks/use-profile-onboarding';
import { useToast } from '@/hooks/use-toast';
import { OnboardingProgress } from './OnboardingProgress';
import { WelcomeStep } from './steps/WelcomeStep';
import { DietaryStep } from './steps/DietaryStep';
import { AllergiesStep } from './steps/AllergiesStep';
import { MedicalConditionsStep } from './steps/MedicalConditionsStep';
import { SkillLevelStep } from './steps/SkillLevelStep';
import { UnitsStep } from './steps/UnitsStep';
import { TimePerMealStep } from './steps/TimePerMealStep';
import { FullNameStep } from './steps/FullNameStep';
import { LocationStep } from './steps/LocationStep';
import { PreferredCuisinesStep } from './steps/PreferredCuisinesStep';
import { AvailableEquipmentStep } from './steps/AvailableEquipmentStep';
import { SpiceToleranceStep } from './steps/SpiceToleranceStep';
import { DislikedIngredientsStep } from './steps/DislikedIngredientsStep';
import { CompletionStep } from './steps/CompletionStep';

interface ProfileOnboardingWizardProps {
  onClose: () => void;
}

const TOTAL_STEPS = 14;
const SAVE_WARNING_TITLE = 'Save Warning';

export function ProfileOnboardingWizard({
  onClose,
}: ProfileOnboardingWizardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    formData,
    updateFormData,
    currentStep: localStep,
    nextStep: handleNext,
    prevStep: handleBack,
    saveToDatabase,
    isLoadingProfile,
    isSaving,
  } = useProfileOnboarding();

  const handleReviewProfile = () => {
    onClose();
    navigate('/profile');
  };

  // Step 0: Welcome
  const handleWelcomeNext = () => {
    handleNext();
  };

  // Step 1: Dietary Restrictions (Required)
  const handleDietaryNext = (value: string[]) => {
    updateFormData({ dietary_restrictions: value });
    handleNext();
  };

  // Step 2: Allergies (Required)
  const handleAllergiesNext = (value: string[]) => {
    updateFormData({ allergies: value });
    handleNext();
  };

  // Step 3: Medical Conditions (Required)
  const handleMedicalConditionsNext = (value: string[]) => {
    updateFormData({ medical_conditions: value });
    handleNext();
  };

  // Step 4: Skill Level (Required)
  const handleSkillLevelNext = (
    value: 'beginner' | 'intermediate' | 'advanced'
  ) => {
    updateFormData({ skill_level: value });
    handleNext();
  };

  // Step 5: Units (Required)
  const handleUnitsNext = (value: 'metric' | 'imperial') => {
    updateFormData({ units: value });
    handleNext();
  };

  // Step 6: Time Per Meal (Optional)
  const handleTimePerMealNext = (value: number) => {
    updateFormData({ time_per_meal: value });
    handleNext();
  };

  const handleTimePerMealSkip = () => {
    handleNext();
  };

  // Step 7: Full Name (Optional)
  const handleFullNameNext = (value: string) => {
    updateFormData({ full_name: value });
    handleNext();
  };

  const handleFullNameSkip = () => {
    handleNext();
  };

  // Step 8: Location (Optional)
  const handleLocationNext = async (data: {
    country: string | null;
    state_province: string | null;
    city: string | null;
  }) => {
    updateFormData(data);
    const success = await saveToDatabase(data);
    if (success) {
      handleNext();
    } else {
      // Allow progression even if save fails - location is optional
      toast({
        title: SAVE_WARNING_TITLE,
        description:
          'Your location information could not be saved. You can continue and update it later in your profile settings.',
        variant: 'destructive',
      });
      // Still proceed to next step since location is optional
      handleNext();
    }
  };

  const handleLocationSkip = async () => {
    const success = await saveToDatabase();
    if (success) {
      handleNext();
    } else {
      // Allow progression even if save fails - location is optional
      toast({
        title: SAVE_WARNING_TITLE,
        description:
          'Some information could not be saved. You can continue and update it later in your profile settings.',
        variant: 'destructive',
      });
      // Still proceed to next step since location is optional
      handleNext();
    }
  };

  // Step 9: Preferred Cuisines (Optional)
  const handlePreferredCuisinesNext = (value: string[]) => {
    updateFormData({ preferred_cuisines: value });
    handleNext();
  };

  const handlePreferredCuisinesSkip = () => {
    handleNext();
  };

  // Step 10: Available Equipment (Optional)
  const handleAvailableEquipmentNext = (value: string[]) => {
    updateFormData({ available_equipment: value });
    handleNext();
  };

  const handleAvailableEquipmentSkip = () => {
    handleNext();
  };

  // Step 11: Spice Tolerance (Optional)
  const handleSpiceToleranceNext = (value: number) => {
    updateFormData({ spice_tolerance: value });
    handleNext();
  };

  const handleSpiceToleranceSkip = () => {
    updateFormData({ spice_tolerance: 3 });
    handleNext();
  };

  // Step 12: Disliked Ingredients (Optional)
  const handleDislikedIngredientsNext = async (value: string[]) => {
    updateFormData({ disliked_ingredients: value });
    const success = await saveToDatabase({ disliked_ingredients: value });
    if (success) {
      handleNext();
    } else {
      // Allow progression even if save fails - disliked ingredients is optional
      toast({
        title: SAVE_WARNING_TITLE,
        description:
          'Your preferences could not be saved. You can continue and update them later in your profile settings.',
        variant: 'destructive',
      });
      // Still proceed to next step since disliked ingredients is optional
      handleNext();
    }
  };

  const handleDislikedIngredientsSkip = async () => {
    const success = await saveToDatabase();
    if (success) {
      handleNext();
    } else {
      // Allow progression even if save fails - this is optional data
      toast({
        title: SAVE_WARNING_TITLE,
        description:
          'Some information could not be saved. You can continue and update it later in your profile settings.',
        variant: 'destructive',
      });
      // Still proceed to next step since this is optional
      handleNext();
    }
  };

  const renderStep = () => {
    switch (localStep) {
      case 0:
        return <WelcomeStep onNext={handleWelcomeNext} />;
      case 1:
        return (
          <DietaryStep
            initialValue={formData.dietary_restrictions}
            onNext={handleDietaryNext}
            onBack={handleBack}
          />
        );
      case 2:
        return (
          <AllergiesStep
            initialValue={formData.allergies}
            onNext={handleAllergiesNext}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <MedicalConditionsStep
            initialValue={formData.medical_conditions}
            onNext={handleMedicalConditionsNext}
            onBack={handleBack}
          />
        );
      case 4:
        return (
          <SkillLevelStep
            initialValue={formData.skill_level}
            onNext={handleSkillLevelNext}
            onBack={handleBack}
          />
        );
      case 5:
        return (
          <UnitsStep
            initialValue={formData.units}
            onNext={handleUnitsNext}
            onBack={handleBack}
          />
        );
      case 6:
        return (
          <TimePerMealStep
            initialValue={formData.time_per_meal}
            onNext={handleTimePerMealNext}
            onBack={handleBack}
            onSkip={handleTimePerMealSkip}
          />
        );
      case 7:
        return (
          <FullNameStep
            initialValue={formData.full_name}
            onNext={handleFullNameNext}
            onBack={handleBack}
            onSkip={handleFullNameSkip}
          />
        );
      case 8:
        return (
          <LocationStep
            initialCountry={formData.country}
            initialStateProvince={formData.state_province}
            initialCity={formData.city}
            onNext={handleLocationNext}
            onBack={handleBack}
            onSkip={handleLocationSkip}
          />
        );
      case 9:
        return (
          <PreferredCuisinesStep
            initialValue={formData.preferred_cuisines}
            onNext={handlePreferredCuisinesNext}
            onBack={handleBack}
            onSkip={handlePreferredCuisinesSkip}
          />
        );
      case 10:
        return (
          <AvailableEquipmentStep
            initialValue={formData.available_equipment}
            onNext={handleAvailableEquipmentNext}
            onBack={handleBack}
            onSkip={handleAvailableEquipmentSkip}
          />
        );
      case 11:
        return (
          <SpiceToleranceStep
            initialValue={formData.spice_tolerance}
            onNext={handleSpiceToleranceNext}
            onBack={handleBack}
            onSkip={handleSpiceToleranceSkip}
          />
        );
      case 12:
        return (
          <DislikedIngredientsStep
            initialValue={formData.disliked_ingredients}
            onNext={handleDislikedIngredientsNext}
            onBack={handleBack}
            onSkip={handleDislikedIngredientsSkip}
          />
        );
      case 13:
        return (
          <CompletionStep
            fullName={formData.full_name}
            onClose={onClose}
            onReviewProfile={handleReviewProfile}
          />
        );
      default:
        return <WelcomeStep onNext={handleWelcomeNext} />;
    }
  };

  // Show loading state while fetching existing profile data
  if (isLoadingProfile) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        <p className="mt-4 text-gray-600">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white relative">
      {/* Progress indicator - hide on welcome and completion steps */}
      {localStep > 0 && localStep < 13 && (
        <OnboardingProgress current={localStep - 1} total={TOTAL_STEPS - 2} />
      )}

      {/* Step content */}
      <AnimatePresence mode="wait">
        <div key={localStep} className="flex-1 overflow-auto">
          {renderStep()}
        </div>
      </AnimatePresence>

      {/* Show saving indicator */}
      {isSaving && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <p className="text-sm text-gray-600">Saving your information...</p>
          </div>
        </div>
      )}
    </div>
  );
}
