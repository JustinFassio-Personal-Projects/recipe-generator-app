import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { PlusCircle, XCircle } from 'lucide-react';
import { OptionCard } from '../OptionCard';
import { OnboardingNavigation } from '../OnboardingNavigation';

interface AvailableEquipmentStepProps {
  initialValue: string[];
  onNext: (value: string[]) => void;
  onBack: () => void;
  onSkip: () => void;
}

const EQUIPMENT_OPTIONS = [
  { id: 'oven', label: 'Oven', icon: '🔥' },
  { id: 'stovetop', label: 'Stovetop', icon: '🍳' },
  { id: 'microwave', label: 'Microwave', icon: '⚡' },
  { id: 'air_fryer', label: 'Air Fryer', icon: '🌬️' },
  { id: 'slow_cooker', label: 'Slow Cooker', icon: '🍲' },
  { id: 'pressure_cooker', label: 'Pressure Cooker', icon: '⏱️' },
  { id: 'blender', label: 'Blender', icon: '🥤' },
  { id: 'food_processor', label: 'Food Processor', icon: '🔪' },
  { id: 'stand_mixer', label: 'Stand Mixer', icon: '🍰' },
  { id: 'grill', label: 'Grill', icon: '♨️' },
];

export function AvailableEquipmentStep({
  initialValue,
  onNext,
  onBack,
  onSkip,
}: AvailableEquipmentStepProps) {
  const [selected, setSelected] = useState<string[]>(initialValue);
  const [customInput, setCustomInput] = useState('');

  const toggleSelection = (label: string) => {
    setSelected((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const removeEquipment = (equipment: string) => {
    setSelected((prev) => prev.filter((item) => item !== equipment));
  };

  const addCustomEquipment = () => {
    const trimmed = customInput.trim();
    if (trimmed && !selected.includes(trimmed)) {
      setSelected((prev) => [...prev, trimmed]);
      setCustomInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomEquipment();
    }
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
        <span className="text-5xl mb-4 block">🛠️</span>
        <h2 className="text-2xl font-bold mb-2">What equipment do you have?</h2>
        <p className="text-gray-600 text-sm">
          We'll suggest recipes you can actually make.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
          {EQUIPMENT_OPTIONS.map((option) => (
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
            placeholder="Add custom equipment..."
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button
            variant="outline"
            onClick={addCustomEquipment}
            disabled={!customInput.trim()}
          >
            <PlusCircle className="h-4 w-4 mr-2" /> Add
          </Button>
        </div>

        {selected.length > 0 && (
          <div className="max-w-md mx-auto mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Selected Equipment:
            </p>
            <div className="flex flex-wrap gap-2">
              {selected.map((equipment) => (
                <span
                  key={equipment}
                  className="badge badge-info cursor-pointer"
                  onClick={() => removeEquipment(equipment)}
                >
                  {equipment} <XCircle className="ml-1 h-3 w-3" />
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <OnboardingNavigation
        onNext={() => onNext(selected)}
        onBack={onBack}
        onSkip={onSkip}
        isNextDisabled={false}
        showSkip={true}
      />
    </motion.div>
  );
}
