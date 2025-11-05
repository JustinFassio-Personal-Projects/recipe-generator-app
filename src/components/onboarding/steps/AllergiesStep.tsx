import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { PlusCircle, XCircle } from 'lucide-react';
import { OptionCard } from '../OptionCard';
import { OnboardingNavigation } from '../OnboardingNavigation';

interface AllergiesStepProps {
  initialValue: string[];
  onNext: (value: string[]) => void;
  onBack: () => void;
}

const ALLERGY_OPTIONS = [
  { id: 'peanuts', label: 'Peanuts', icon: '🥜' },
  { id: 'tree_nuts', label: 'Tree Nuts', icon: '🌰' },
  { id: 'milk', label: 'Milk', icon: '🥛' },
  { id: 'eggs', label: 'Eggs', icon: '🥚' },
  { id: 'fish', label: 'Fish', icon: '🐟' },
  { id: 'shellfish', label: 'Shellfish', icon: '🦐' },
  { id: 'soy', label: 'Soy', icon: '🫘' },
  { id: 'wheat', label: 'Wheat', icon: '🌾' },
  { id: 'sesame', label: 'Sesame', icon: '🌱' },
  { id: 'sulfites', label: 'Sulfites', icon: '🧪' },
];

export function AllergiesStep({
  initialValue,
  onNext,
  onBack,
}: AllergiesStepProps) {
  const [selected, setSelected] = useState<string[]>(initialValue);
  const [customInput, setCustomInput] = useState('');

  const toggleSelection = (label: string) => {
    setSelected((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const removeAllergy = (allergy: string) => {
    setSelected((prev) => prev.filter((item) => item !== allergy));
  };

  const addCustomAllergy = () => {
    const trimmed = customInput.trim();
    if (trimmed && !selected.includes(trimmed)) {
      setSelected((prev) => [...prev, trimmed]);
      setCustomInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomAllergy();
    }
  };

  const handleNoAllergies = () => {
    setSelected([]);
    setCustomInput('');
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
        <span className="text-5xl mb-4 block">⚠️</span>
        <h2 className="text-2xl font-bold mb-2">Food Allergies</h2>
        <p className="text-gray-600 text-sm">
          Help us keep you safe while cooking
        </p>
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
          {ALLERGY_OPTIONS.map((option) => (
            <OptionCard
              key={option.id}
              {...option}
              selected={selected.includes(option.label)}
              onToggle={() => toggleSelection(option.label)}
            />
          ))}
        </div>

        <div className="max-w-md mx-auto mt-4 flex gap-2">
          <input
            type="text"
            className="input input-bordered flex-1"
            placeholder="Add custom allergy..."
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button
            variant="outline"
            onClick={addCustomAllergy}
            disabled={!customInput.trim()}
          >
            <PlusCircle className="h-4 w-4 mr-2" /> Add
          </Button>
        </div>

        {selected.length > 0 && (
          <div className="max-w-md mx-auto mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Selected Allergies:
            </p>
            <div className="flex flex-wrap gap-2">
              {selected.map((allergy) => (
                <span
                  key={allergy}
                  className="badge badge-error cursor-pointer"
                  onClick={() => removeAllergy(allergy)}
                >
                  {allergy} <XCircle className="ml-1 h-3 w-3" />
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="max-w-md mx-auto mt-4 text-center">
          <Button
            variant="link"
            onClick={handleNoAllergies}
            className="text-gray-500"
          >
            I have no food allergies
          </Button>
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
