import { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { OnboardingNavigation } from '../OnboardingNavigation';

interface FullNameStepProps {
  initialValue: string | null;
  onNext: (value: string) => void;
  onBack: () => void;
  onSkip: () => void;
}

export function FullNameStep({
  initialValue,
  onNext,
  onBack,
  onSkip,
}: FullNameStepProps) {
  const [fullName, setFullName] = useState<string>(initialValue || '');

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2, ease: [0.4, 0.0, 0.2, 1] }}
      className="h-full flex flex-col px-4"
    >
      <div className="text-center py-6">
        <span className="text-5xl mb-4 block">👤</span>
        <h2 className="text-2xl font-bold mb-2">What's your name?</h2>
        <p className="text-gray-600 text-sm">
          We'd love to personalize your experience (Optional)
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center pb-4">
        <div className="w-full max-w-md px-4">
          <Input
            type="text"
            placeholder="Enter your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      <OnboardingNavigation
        onNext={() => onNext(fullName)}
        onBack={onBack}
        onSkip={onSkip}
        isNextDisabled={!fullName.trim()}
        showSkip={true}
      />
    </motion.div>
  );
}
