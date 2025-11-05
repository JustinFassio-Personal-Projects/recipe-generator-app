import { useState } from 'react';
import { motion } from 'framer-motion';
import { XCircle } from 'lucide-react';
import { OptionCard } from '../OptionCard';
import { OnboardingNavigation } from '../OnboardingNavigation';

interface DietaryStepProps {
  initialValue: string[];
  onNext: (value: string[]) => void;
  onBack: () => void;
}

const DIETARY_OPTIONS = [
  { id: 'none', label: 'No Restrictions', icon: '🍽️' },
  { id: 'vegetarian', label: 'Vegetarian', icon: '🥗' },
  { id: 'vegan', label: 'Vegan', icon: '🌱' },
  { id: 'pescatarian', label: 'Pescatarian', icon: '🐟' },
  { id: 'keto', label: 'Keto', icon: '🥑' },
  { id: 'paleo', label: 'Paleo', icon: '🥩' },
  { id: 'gluten_free', label: 'Gluten-Free', icon: '🌾' },
  { id: 'dairy_free', label: 'Dairy-Free', icon: '🥛' },
];

export function DietaryStep({
  initialValue,
  onNext,
  onBack,
}: DietaryStepProps) {
  const [selected, setSelected] = useState<string[]>(initialValue);

  const toggleSelection = (label: string) => {
    if (label === 'No Restrictions') {
      setSelected(
        selected.includes('No Restrictions') ? [] : ['No Restrictions']
      );
    } else {
      setSelected((prev) => {
        const filtered = prev.filter((item) => item !== 'No Restrictions');
        return filtered.includes(label)
          ? filtered.filter((item) => item !== label)
          : [...filtered, label];
      });
    }
  };

  const removeRestriction = (restriction: string) => {
    setSelected((prev) => prev.filter((item) => item !== restriction));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2, ease: [0.4, 0.0, 0.2, 1] }}
      className="h-full flex flex-col px-4"
    >
      <div className="text-center py-6">
        <span className="text-5xl mb-4 block">🥗</span>
        <h2 className="text-2xl font-bold mb-2">Dietary Restrictions</h2>
        <p className="text-gray-600 text-sm">
          Select any that apply to you (or none)
        </p>
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
          {DIETARY_OPTIONS.map((option) => (
            <OptionCard
              key={option.id}
              {...option}
              selected={selected.includes(option.label)}
              onToggle={() => toggleSelection(option.label)}
            />
          ))}
        </div>

        {selected.length > 0 && (
          <div className="max-w-md mx-auto mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Selected Restrictions:
            </p>
            <div className="flex flex-wrap gap-2">
              {selected.map((restriction) => (
                <span
                  key={restriction}
                  className="badge badge-info cursor-pointer"
                  onClick={() => removeRestriction(restriction)}
                >
                  {restriction} <XCircle className="ml-1 h-3 w-3" />
                </span>
              ))}
            </div>
          </div>
        )}
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
