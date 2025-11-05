import { useState } from 'react';
import { motion } from 'framer-motion';
import { OnboardingNavigation } from '../OnboardingNavigation';

interface SpiceToleranceStepProps {
  initialValue: number;
  onNext: (value: number) => void;
  onBack: () => void;
  onSkip: () => void;
}

const SPICE_LABELS: { [key: number]: string } = {
  1: 'Very Mild (No Spice)',
  2: 'Mild',
  3: 'Medium',
  4: 'Hot',
  5: 'Very Hot (Bring the Heat!)',
};

export function SpiceToleranceStep({
  initialValue,
  onNext,
  onBack,
  onSkip,
}: SpiceToleranceStepProps) {
  const [tolerance, setTolerance] = useState<number>(initialValue || 3);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2, ease: [0.4, 0.0, 0.2, 1] }}
      className="h-full flex flex-col px-4"
    >
      <div className="text-center py-6">
        <span className="text-5xl mb-4 block">🌶️</span>
        <h2 className="text-2xl font-bold mb-2">
          How much spice can you handle?
        </h2>
        <p className="text-gray-600 text-sm">
          Adjust your preference for spicy recipes.
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center pb-4">
        <div className="w-full max-w-md px-4">
          <input
            type="range"
            min="1"
            max="5"
            value={tolerance}
            onChange={(e) => setTolerance(Number(e.target.value))}
            className="range range-primary w-full"
            step="1"
          />
          <div className="w-full flex justify-between text-xs px-2 mt-2">
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
          </div>
          <p className="text-center mt-4 text-lg font-semibold text-primary">
            {SPICE_LABELS[tolerance]}
          </p>
        </div>
      </div>

      <OnboardingNavigation
        onNext={() => onNext(tolerance)}
        onBack={onBack}
        onSkip={onSkip}
        isNextDisabled={false}
        showSkip={true}
      />
    </motion.div>
  );
}
