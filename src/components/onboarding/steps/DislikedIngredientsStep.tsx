import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { PlusCircle, XCircle } from 'lucide-react';
import { OptionCard } from '../OptionCard';
import { OnboardingNavigation } from '../OnboardingNavigation';

interface DislikedIngredientsStepProps {
  initialValue: string[];
  onNext: (value: string[]) => void;
  onBack: () => void;
  onSkip: () => void;
}

const DISLIKED_INGREDIENTS_OPTIONS = [
  { id: 'Mushrooms', label: 'Mushrooms', icon: '🍄' },
  { id: 'Onions', label: 'Onions', icon: '🧅' },
  { id: 'Garlic', label: 'Garlic', icon: '🧄' },
  { id: 'Cilantro', label: 'Cilantro', icon: '🌿' },
  { id: 'Olives', label: 'Olives', icon: '🫒' },
  { id: 'Tomatoes', label: 'Tomatoes', icon: '🍅' },
  { id: 'Bell Peppers', label: 'Bell Peppers', icon: '🫑' },
  { id: 'Spicy Peppers', label: 'Spicy Peppers', icon: '🌶️' },
  { id: 'Coconut', label: 'Coconut', icon: '🥥' },
  { id: 'Seafood', label: 'Seafood', icon: '🦐' },
  { id: 'Liver', label: 'Liver', icon: '🍖' },
  { id: 'Blue Cheese', label: 'Blue Cheese', icon: '🧀' },
  { id: 'Anchovies', label: 'Anchovies', icon: '🐟' },
  { id: 'Pickles', label: 'Pickles', icon: '🥒' },
  { id: 'Avocado', label: 'Avocado', icon: '🥑' },
  { id: 'Eggplant', label: 'Eggplant', icon: '🍆' },
];

export function DislikedIngredientsStep({
  initialValue,
  onNext,
  onBack,
  onSkip,
}: DislikedIngredientsStepProps) {
  const [disliked, setDisliked] = useState<string[]>(initialValue);
  const [customInput, setCustomInput] = useState('');

  const toggleSelection = (optionId: string) => {
    setDisliked((prev) =>
      prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId]
    );
  };

  const addDislikedIngredient = () => {
    const trimmed = customInput.trim();
    if (trimmed && !disliked.includes(trimmed)) {
      setDisliked((prev) => [...prev, trimmed]);
      setCustomInput('');
    }
  };

  const removeDislikedIngredient = (ingredient: string) => {
    setDisliked((prev) => prev.filter((item) => item !== ingredient));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addDislikedIngredient();
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
        <span className="text-5xl mb-4 block">🤢</span>
        <h2 className="text-2xl font-bold mb-2">
          Any ingredients you dislike?
        </h2>
        <p className="text-gray-600 text-sm">
          We'll try to avoid these in your recipe suggestions.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
          {DISLIKED_INGREDIENTS_OPTIONS.map((option) => (
            <OptionCard
              key={option.id}
              {...option}
              selected={disliked.includes(option.id)}
              onToggle={() => toggleSelection(option.id)}
            />
          ))}
        </div>

        <div className="max-w-md mx-auto mt-4 flex gap-2">
          <input
            type="text"
            className="input input-bordered flex-1"
            placeholder="Add custom ingredient..."
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button
            variant="outline"
            onClick={addDislikedIngredient}
            disabled={!customInput.trim()}
          >
            <PlusCircle className="h-4 w-4 mr-2" /> Add
          </Button>
        </div>

        {disliked.length > 0 && (
          <div className="max-w-md mx-auto mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Selected Dislikes:
            </p>
            <div className="flex flex-wrap gap-2">
              {disliked.map((ingredient) => (
                <span
                  key={ingredient}
                  className="badge badge-error cursor-pointer"
                  onClick={() => removeDislikedIngredient(ingredient)}
                >
                  {ingredient} <XCircle className="ml-1 h-3 w-3" />
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <OnboardingNavigation
        onNext={() => onNext(disliked)}
        onBack={onBack}
        onSkip={onSkip}
        isNextDisabled={false}
        showSkip={true}
      />
    </motion.div>
  );
}
