import { useState } from 'react';
import { motion } from 'framer-motion';
import { OptionCard } from '../OptionCard';
import { OnboardingNavigation } from '../OnboardingNavigation';

interface SkillLevelStepProps {
  initialValue: 'beginner' | 'intermediate' | 'advanced';
  onNext: (value: 'beginner' | 'intermediate' | 'advanced') => void;
  onBack: () => void;
}

const SKILL_OPTIONS = [
  { id: 'beginner' as const, label: 'Beginner', icon: '🌱' },
  { id: 'intermediate' as const, label: 'Intermediate', icon: '👨‍🍳' },
  { id: 'advanced' as const, label: 'Advanced', icon: '⭐' },
];

export function SkillLevelStep({
  initialValue,
  onNext,
  onBack,
}: SkillLevelStepProps) {
  const [selected, setSelected] = useState<
    'beginner' | 'intermediate' | 'advanced'
  >(initialValue);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2, ease: [0.4, 0.0, 0.2, 1] }}
      className="h-full flex flex-col px-4"
    >
      <div className="text-center py-6">
        <span className="text-5xl mb-4 block">👨‍🍳</span>
        <h2 className="text-2xl font-bold mb-2">
          What's your cooking skill level?
        </h2>
        <p className="text-gray-600 text-sm">
          We'll match recipes to your experience
        </p>
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        <div className="grid grid-cols-1 gap-3 max-w-md mx-auto">
          {SKILL_OPTIONS.map((option) => (
            <OptionCard
              key={option.id}
              id={option.id}
              label={option.label}
              icon={option.icon}
              selected={selected === option.id}
              onToggle={() => setSelected(option.id)}
            />
          ))}
        </div>
      </div>

      <OnboardingNavigation
        onNext={() => onNext(selected)}
        onBack={onBack}
        isNextDisabled={false}
        showSkip={false}
      />
    </motion.div>
  );
}
