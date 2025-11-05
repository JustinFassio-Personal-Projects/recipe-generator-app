import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useProfileOnboarding } from '@/hooks/use-profile-onboarding';
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

export function ProfileOnboardingWizard({
  onClose,
}: ProfileOnboardingWizardProps) {
  const navigate = useNavigate();
  const {
    formData,
    updateFormData,
    currentStep: localStep,
    nextStep: handleNext,
    prevStep: handleBack,
    saveToDatabase,
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
    console.log('🎯 Location data to save:', data);
    const success = await saveToDatabase(data);
    if (success) {
      handleNext();
    }
  };

  const handleLocationSkip = async () => {
    const success = await saveToDatabase();
    if (success) {
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
    console.log('🎯 All collected data:', {
      ...formData,
      disliked_ingredients: value,
    });
    const success = await saveToDatabase({ disliked_ingredients: value });
    if (success) {
      handleNext();
    }
  };

  const handleDislikedIngredientsSkip = async () => {
    const success = await saveToDatabase();
    if (success) {
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

  return (
    <div className="h-full flex flex-col bg-white">
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
    </div>
  );
}
