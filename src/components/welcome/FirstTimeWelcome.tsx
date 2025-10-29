import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ChefHat, Sparkles, Zap } from 'lucide-react';

interface FirstTimeWelcomeProps {
  onClose: () => void;
  onDisablePermanently?: () => Promise<void>;
}

export function FirstTimeWelcome({
  onClose,
  onDisablePermanently,
}: FirstTimeWelcomeProps) {
  const navigate = useNavigate();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleCreateRecipe = async () => {
    if (dontShowAgain && onDisablePermanently) {
      await onDisablePermanently();
    }
    onClose();
    navigate('/chat-recipe');
  };

  const handleExplore = async () => {
    if (dontShowAgain && onDisablePermanently) {
      await onDisablePermanently();
    }
    onClose();
    navigate('/explore');
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-teal-100">
          <ChefHat className="h-8 w-8 text-orange-600" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-orange-600">
          👋 Welcome to Recipe Generator!
        </h2>
        <p className="text-teal-600">
          Let's get you started with something delicious.
        </p>
      </div>

      {/* Call to Action */}
      <div className="space-y-3">
        <p className="text-center font-medium text-gray-500">
          What brings you here today?
        </p>

        {/* Primary Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleCreateRecipe}
            className="w-full justify-start gap-3 bg-gradient-to-r from-orange-500 to-orange-600 py-6 text-left hover:from-orange-600 hover:to-orange-700"
            size="lg"
          >
            <ChefHat className="h-5 w-5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-semibold">Create My First Recipe</div>
              <div className="text-xs opacity-90">
                Use AI to generate a recipe
              </div>
            </div>
          </Button>

          <Button
            onClick={handleExplore}
            className="w-full justify-start gap-3 bg-gradient-to-r from-teal-500 to-teal-600 py-6 text-left hover:from-teal-600 hover:to-teal-700"
            size="lg"
          >
            <Sparkles className="h-5 w-5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-semibold">Explore Other Creations</div>
              <div className="text-xs opacity-90">
                Discover recipes from the community
              </div>
            </div>
          </Button>
        </div>
      </div>

      {/* Time Estimate */}
      <div className="flex items-center justify-center gap-2 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
        <Zap className="h-4 w-4 text-orange-500" />
        <span>Takes just 2 minutes to get started</span>
      </div>

      {/* Don't Show Again Checkbox */}
      {onDisablePermanently && (
        <div className="flex items-start space-x-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <Checkbox
            id="dont-show-again"
            checked={dontShowAgain}
            onCheckedChange={(checked) => setDontShowAgain(checked === true)}
            className="mt-0.5"
          />
          <label
            htmlFor="dont-show-again"
            className="cursor-pointer text-sm text-gray-700"
          >
            Don't show these instructions again
            <p className="mt-0.5 text-xs text-gray-500">
              You can re-enable this in your profile settings
            </p>
          </label>
        </div>
      )}
    </div>
  );
}
