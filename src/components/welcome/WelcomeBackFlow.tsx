import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { useRecipes } from '@/hooks/use-recipes';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ChefHat, BookOpen, Sparkles, ShoppingCart, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface WelcomeBackFlowProps {
  onClose: () => void;
  onDisablePermanently?: () => Promise<void>;
}

export function WelcomeBackFlow({
  onClose,
  onDisablePermanently,
}: WelcomeBackFlowProps) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: recipes = [] } = useRecipes({});
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Get recent recipes (last 2-3, sorted by updated_at)
  const recentRecipes = recipes
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
    .slice(0, 3);

  const userName = profile?.full_name || profile?.username || 'there';

  const handleNavigation = async (path: string) => {
    if (dontShowAgain && onDisablePermanently) {
      await onDisablePermanently();
    }
    onClose();
    navigate(path);
  };

  const handleClose = async () => {
    if (dontShowAgain && onDisablePermanently) {
      await onDisablePermanently();
    }
    onClose();
  };

  return (
    <div className="space-y-6">
      {/* Welcome Back Header */}
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">
          Welcome back, {userName}! 🎉
        </h2>
        <p className="text-gray-600">What would you like to do today?</p>
      </div>

      {/* Quick Navigation Buttons */}
      <div className="space-y-2">
        <Button
          onClick={() => handleNavigation('/add')}
          className="w-full justify-start gap-3 bg-white text-gray-900 shadow-sm hover:bg-gray-50"
          variant="outline"
          size="lg"
        >
          <ChefHat className="h-5 w-5 text-orange-600" />
          <span className="font-medium">Create New Recipe</span>
        </Button>

        <Button
          onClick={() => handleNavigation('/recipes')}
          className="w-full justify-start gap-3 bg-white text-gray-900 shadow-sm hover:bg-gray-50"
          variant="outline"
          size="lg"
        >
          <BookOpen className="h-5 w-5 text-blue-600" />
          <span className="font-medium">
            My Recipe Collection ({recipes.length})
          </span>
        </Button>

        <Button
          onClick={() => handleNavigation('/explore')}
          className="w-full justify-start gap-3 bg-white text-gray-900 shadow-sm hover:bg-gray-50"
          variant="outline"
          size="lg"
        >
          <Sparkles className="h-5 w-5 text-teal-600" />
          <span className="font-medium">Explore Page</span>
        </Button>

        <Button
          onClick={() => handleNavigation('/cart')}
          className="w-full justify-start gap-3 bg-white text-gray-900 shadow-sm hover:bg-gray-50"
          variant="outline"
          size="lg"
        >
          <ShoppingCart className="h-5 w-5 text-purple-600" />
          <span className="font-medium">Shopping Cart</span>
        </Button>
      </div>

      {/* Recent Activity */}
      {recentRecipes.length > 0 && (
        <div className="space-y-3">
          <div className="h-px bg-gray-200" />
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-700">
              Recent Activity
            </h3>
            <div className="space-y-2">
              {recentRecipes.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => handleNavigation(`/recipe/${recipe.id}`)}
                  className="w-full rounded-lg bg-gray-50 px-4 py-2 text-left transition-colors hover:bg-gray-100"
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 text-gray-400">•</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {recipe.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        Updated{' '}
                        {formatDistanceToNow(new Date(recipe.updated_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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

      {/* Close Button */}
      <Button
        onClick={handleClose}
        variant="ghost"
        className="w-full gap-2 text-gray-600 hover:text-gray-900"
      >
        <X className="h-4 w-4" />
        Close - Just browsing
      </Button>
    </div>
  );
}
