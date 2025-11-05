import { useState } from 'react';
import { motion } from 'framer-motion';
import { OnboardingNavigation } from '../OnboardingNavigation';

interface TimePerMealStepProps {
  initialValue: number | null;
  onNext: (value: number) => void;
  onBack: () => void;
  onSkip: () => void;
}

export function TimePerMealStep({
  initialValue,
  onNext,
  onBack,
  onSkip,
}: TimePerMealStepProps) {
  const [timePerMeal, setTimePerMeal] = useState<number>(initialValue || 30);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2, ease: [0.4, 0.0, 0.2, 1] }}
      className="h-full flex flex-col px-4"
    >
      <div className="text-center py-6">
        <span className="text-5xl mb-4 block">⏱️</span>
        <h2 className="text-2xl font-bold mb-2">How much time per meal?</h2>
        <p className="text-gray-600 text-sm">
          We'll find recipes that fit your schedule (Optional)
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center pb-4">
        <div className="w-full max-w-md px-4">
          <input
            type="range"
            min="10"
            max="120"
            value={timePerMeal}
            onChange={(e) => setTimePerMeal(Number(e.target.value))}
            className="range range-primary w-full"
            step="5"
          />
          <div className="w-full flex justify-between text-xs px-2 mt-2">
            <span>10 min</span>
            <span>120 min</span>
          </div>
          <p className="text-center mt-4 text-2xl font-bold text-primary">
            {timePerMeal} minutes
          </p>
        </div>
      </div>

      <OnboardingNavigation
        onNext={() => onNext(timePerMeal)}
        onBack={onBack}
        onSkip={onSkip}
        isNextDisabled={false}
        showSkip={true}
      />
    </motion.div>
  );
}
