import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { PlusCircle, XCircle } from 'lucide-react';
import { OptionCard } from '../OptionCard';
import { OnboardingNavigation } from '../OnboardingNavigation';

interface MedicalConditionsStepProps {
  initialValue: string[];
  onNext: (value: string[]) => void;
  onBack: () => void;
}

const MEDICAL_CONDITIONS_OPTIONS = [
  { id: 'diabetes', label: 'Diabetes', icon: '🩸' },
  { id: 'high_blood_pressure', label: 'High Blood Pressure', icon: '💓' },
  { id: 'heart_disease', label: 'Heart Disease', icon: '❤️' },
  { id: 'kidney_disease', label: 'Kidney Disease', icon: '🫘' },
  { id: 'liver_disease', label: 'Liver Disease', icon: '🫀' },
  { id: 'celiac_disease', label: 'Celiac Disease', icon: '🌾' },
  { id: 'ibs', label: 'IBS', icon: '🔄' },
  { id: 'gerd', label: 'GERD', icon: '🔥' },
];

export function MedicalConditionsStep({
  initialValue,
  onNext,
  onBack,
}: MedicalConditionsStepProps) {
  const [selected, setSelected] = useState<string[]>(initialValue);
  const [customInput, setCustomInput] = useState('');

  const toggleSelection = (label: string) => {
    setSelected((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const removeCondition = (condition: string) => {
    setSelected((prev) => prev.filter((item) => item !== condition));
  };

  const addCustomCondition = () => {
    const trimmed = customInput.trim();
    if (trimmed && !selected.includes(trimmed)) {
      setSelected((prev) => [...prev, trimmed]);
      setCustomInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomCondition();
    }
  };

  const handleNoConditions = () => {
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
        <span className="text-5xl mb-4 block">🏥</span>
        <h2 className="text-2xl font-bold mb-2">Any medical conditions?</h2>
        <p className="text-gray-600 text-sm">
          We'll consider these for safer recipe suggestions.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
          {MEDICAL_CONDITIONS_OPTIONS.map((option) => (
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
            placeholder="Add custom condition..."
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button
            variant="outline"
            onClick={addCustomCondition}
            disabled={!customInput.trim()}
          >
            <PlusCircle className="h-4 w-4 mr-2" /> Add
          </Button>
        </div>

        {selected.length > 0 && (
          <div className="max-w-md mx-auto mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Selected Conditions:
            </p>
            <div className="flex flex-wrap gap-2">
              {selected.map((condition) => (
                <span
                  key={condition}
                  className="badge badge-info cursor-pointer"
                  onClick={() => removeCondition(condition)}
                >
                  {condition} <XCircle className="ml-1 h-3 w-3" />
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="max-w-md mx-auto mt-4 text-center">
          <Button
            variant="link"
            onClick={handleNoConditions}
            className="text-gray-500"
          >
            I have no medical conditions
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
