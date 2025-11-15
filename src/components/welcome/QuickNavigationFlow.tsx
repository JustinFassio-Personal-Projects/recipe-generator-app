import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecipes } from '@/hooks/use-recipes';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, BookOpen, Globe, ShoppingCart, X, Sparkles } from 'lucide-react';

interface QuickNavigationFlowProps {
  onClose: () => void;
  onDisablePermanently: () => Promise<void>;
}

export function QuickNavigationFlow({
  onClose,
  onDisablePermanently,
}: QuickNavigationFlowProps) {
  const navigate = useNavigate();
  const { data: recipes = [] } = useRecipes({});
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleNavigation = (path: string) => {
    onClose();
    navigate(path);
  };

  const handleClose = async () => {
    if (dontShowAgain) {
      await onDisablePermanently();
    } else {
      onClose();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">Quick Start</h3>
      </div>

      {/* Quick Navigation Buttons */}
      <div className="space-y-2">
        <Button
          onClick={() => handleNavigation('/chat-recipe')}
          className="w-full justify-start gap-3 bg-white text-gray-900 shadow-sm hover:bg-gray-50"
          variant="outline"
        >
          <Sparkles className="h-4 w-4 text-purple-600" />
          <span>AI Recipe Creator</span>
        </Button>

        <Button
          onClick={() => handleNavigation('/add')}
          className="w-full justify-start gap-3 bg-white text-gray-900 shadow-sm hover:bg-gray-50"
          variant="outline"
        >
          <Plus className="h-4 w-4 text-orange-600" />
          <span>New Recipe</span>
        </Button>

        <Button
          onClick={() => handleNavigation('/recipes')}
          className="w-full justify-start gap-3 bg-white text-gray-900 shadow-sm hover:bg-gray-50"
          variant="outline"
        >
          <BookOpen className="h-4 w-4 text-blue-600" />
          <span>My Recipes ({recipes.length})</span>
        </Button>

        <Button
          onClick={() => handleNavigation('/explore')}
          className="w-full justify-start gap-3 bg-white text-gray-900 shadow-sm hover:bg-gray-50"
          variant="outline"
        >
          <Globe className="h-4 w-4 text-teal-600" />
          <span>Explore</span>
        </Button>

        <Button
          onClick={() => handleNavigation('/cart')}
          className="w-full justify-start gap-3 bg-white text-gray-900 shadow-sm hover:bg-gray-50"
          variant="outline"
        >
          <ShoppingCart className="h-4 w-4 text-purple-600" />
          <span>Shopping Cart</span>
        </Button>
      </div>

      {/* Don't Show Again Checkbox */}
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
          Don't show this again
          <p className="mt-0.5 text-xs text-gray-500">
            You can re-enable this in your profile settings
          </p>
        </label>
      </div>

      {/* Close Button */}
      <Button
        onClick={handleClose}
        variant="ghost"
        className="w-full gap-2 text-gray-600 hover:text-gray-900"
      >
        <X className="h-4 w-4" />
        Close
      </Button>
    </div>
  );
}
