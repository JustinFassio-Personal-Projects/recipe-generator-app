import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { PlusCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { OptionCard } from '../OptionCard';
import { OnboardingNavigation } from '../OnboardingNavigation';
import { CUISINE_OPTIONS } from '@/lib/cuisines';

interface PreferredCuisinesStepProps {
  initialValue: string[];
  onNext: (value: string[]) => void;
  onBack: () => void;
  onSkip: () => void;
}

export function PreferredCuisinesStep({
  initialValue,
  onNext,
  onBack,
  onSkip,
}: PreferredCuisinesStepProps) {
  const [selected, setSelected] = useState<string[]>(initialValue);
  const [customInput, setCustomInput] = useState('');
  const [showAllCuisines, setShowAllCuisines] = useState(false);

  const toggleSelection = (optionId: string) => {
    setSelected((prev) =>
      prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId]
    );
  };

  const addCustomCuisine = () => {
    const trimmed = customInput.trim();
    if (trimmed && !selected.includes(trimmed)) {
      setSelected((prev) => [...prev, trimmed]);
      setCustomInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomCuisine();
    }
  };

  const cuisinesList = [...CUISINE_OPTIONS]; // Convert readonly to mutable array
  const cuisinesToDisplay = showAllCuisines
    ? cuisinesList
    : cuisinesList.slice(0, 10);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2, ease: [0.4, 0.0, 0.2, 1] }}
      className="h-full flex flex-col px-4"
    >
      <div className="text-center py-6">
        <span className="text-5xl mb-4 block">🌍</span>
        <h2 className="text-2xl font-bold mb-2">What cuisines do you love?</h2>
        <p className="text-gray-600 text-sm">
          Select your favorites to get tailored recommendations.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
          {cuisinesToDisplay.map((cuisine) => (
            <OptionCard
              key={cuisine}
              id={cuisine}
              label={cuisine}
              icon="🍽️"
              selected={selected.includes(cuisine)}
              onToggle={() => toggleSelection(cuisine)}
            />
          ))}
        </div>

        {cuisinesList.length > 10 && (
          <div className="max-w-md mx-auto mt-4 text-center">
            <Button
              variant="ghost"
              onClick={() => setShowAllCuisines(!showAllCuisines)}
              className="text-sm text-primary hover:text-primary/80"
            >
              {showAllCuisines ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  View less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  View more ({cuisinesList.length - 10} more cuisines)
                </>
              )}
            </Button>
          </div>
        )}

        <div className="max-w-md mx-auto mt-4 flex gap-2">
          <input
            type="text"
            className="input input-bordered flex-1"
            placeholder="Add custom cuisine..."
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button
            variant="outline"
            onClick={addCustomCuisine}
            disabled={!customInput.trim()}
          >
            <PlusCircle className="h-4 w-4 mr-2" /> Add
          </Button>
        </div>

        {selected.length > 0 && (
          <div className="max-w-md mx-auto mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Selected Cuisines:
            </p>
            <div className="flex flex-wrap gap-2">
              {selected.map((cuisine) => (
                <span
                  key={cuisine}
                  className="badge badge-info cursor-pointer"
                  onClick={() => toggleSelection(cuisine)}
                >
                  {cuisine} <XCircle className="ml-1 h-3 w-3" />
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
