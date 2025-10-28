import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { useRecipes } from '@/hooks/use-recipes';
import { Button } from '@/components/ui/button';
import { ChefHat, BookOpen, Sparkles, ShoppingCart, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface WelcomeBackFlowProps {
  onClose: () => void;
}

export function WelcomeBackFlow({ onClose }: WelcomeBackFlowProps) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: recipes = [] } = useRecipes({});

  // Get recent recipes (last 2-3, sorted by updated_at)
  const recentRecipes = recipes
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
    .slice(0, 3);

  const userName = profile?.full_name || profile?.username || 'there';

  const handleNavigation = (path: string) => {
    onClose();
    navigate(path);
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

      {/* Close Button */}
      <Button
        onClick={onClose}
        variant="ghost"
        className="w-full gap-2 text-gray-600 hover:text-gray-900"
      >
        <X className="h-4 w-4" />
        Close - Just browsing
      </Button>
    </div>
  );
}
