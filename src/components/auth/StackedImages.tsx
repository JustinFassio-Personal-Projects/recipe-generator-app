import { useState, useEffect } from 'react';
import { recipeApi } from '@/lib/api';
import { Star, ChefHat, Users } from 'lucide-react';
import type { PublicRecipe } from '@/lib/types';
import { getOptimizedAvatarUrl } from '@/lib/avatar-utils';

interface StackedImagesProps {
  maxImages?: number;
  className?: string;
}

// Food emoji icons for visual interest (fallback when no recipes)
const FOOD_EMOJIS = ['🥑', '🥗', '🍝', '🍗', '🍅', '🥙'];
const COLORS = [
  'from-green-400 to-emerald-500',
  'from-lime-400 to-green-500',
  'from-orange-400 to-amber-500',
  'from-red-400 to-rose-500',
  'from-pink-400 to-rose-500',
  'from-purple-400 to-violet-500',
];

const FALLBACK_RECIPE_COUNT = 0;
const FALLBACK_AVERAGE_RATING = 4.5;
const FALLBACK_TOP_CHEFS = ['Alice', 'Bob', 'Cora'];

// Map recipe categories to emojis
const getCategoryEmoji = (recipe: PublicRecipe): string => {
  const categories = recipe.categories?.join(' ').toLowerCase() || '';

  if (categories.includes('breakfast')) return '🥑';
  if (categories.includes('salad')) return '🥗';
  if (categories.includes('pasta')) return '🍝';
  if (categories.includes('chicken') || categories.includes('protein'))
    return '🍗';
  if (categories.includes('italian') || categories.includes('tomato'))
    return '🍅';
  if (categories.includes('mediterranean') || categories.includes('bowl'))
    return '🥙';
  if (categories.includes('asian') || categories.includes('stir')) return '🥘';
  if (categories.includes('dessert') || categories.includes('sweet'))
    return '🍰';

  // Default fallback
  return '🍽️';
};

export function StackedImages({
  maxImages = 6,
  className = '',
}: StackedImagesProps) {
  const [topRecipes, setTopRecipes] = useState<PublicRecipe[]>([]);
  const [recipeCount, setRecipeCount] = useState<number>(0);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalChefs, setTotalChefs] = useState<number>(0);
  const [topChefs, setTopChefs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Skip fetching during SSR or in test environment
    if (typeof window === 'undefined' || process.env.NODE_ENV === 'test') {
      setLoading(false);
      return;
    }

    const loadStats = async () => {
      try {
        setLoading(true);

        // Fetch recipes and stats in parallel
        const [recipes, stats] = await Promise.all([
          recipeApi.getHighestRatedPublicRecipes(maxImages),
          recipeApi.getPublicRecipeStats(),
        ]);

        // Get top recipes for display
        setTopRecipes(recipes.slice(0, maxImages));

        // Use accurate statistics from API
        setRecipeCount(stats.totalRecipes);
        setAverageRating(stats.averageRating);
        setTotalChefs(stats.totalChefs);

        // Get unique chef names from fetched recipes for display
        const chefNames = [
          ...new Set(
            recipes.map((r) => r.author_name?.split(' ')[0] || 'Chef')
          ),
        ];
        setTopChefs(chefNames.slice(0, 3));
      } catch (err) {
        console.error('Error loading recipe stats:', err);
        // Use fallback data
        setTopRecipes([]);
        setRecipeCount(FALLBACK_RECIPE_COUNT);
        setAverageRating(FALLBACK_AVERAGE_RATING);
        setTotalChefs(0);
        setTopChefs(FALLBACK_TOP_CHEFS);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [maxImages]);

  const handleImageError = (recipeId: string) => {
    setImageErrors((prev) => new Set(prev).add(recipeId));
  };

  if (loading) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-8 ${className}`}
      >
        <div className="flex -space-x-2 mb-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse border-4 border-white shadow-lg"
            />
          ))}
        </div>
        <div className="text-center space-y-2">
          <div className="h-4 bg-gray-200 rounded w-48 mx-auto animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-32 mx-auto animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Use real recipes if available, otherwise fall back to emoji placeholders
  // Only show real recipes if we have enough to fill all circles (maintains visual consistency)
  const displayItems =
    topRecipes.length >= maxImages ? topRecipes.slice(0, maxImages) : null;

  // Helper function to get image URL (prefer avatar, fallback to recipe image)
  const getImageUrl = (recipe: PublicRecipe): string | null => {
    // Prefer user avatar if available
    if (recipe.author_avatar_url) {
      return getOptimizedAvatarUrl(recipe.author_avatar_url, 'small');
    }
    // Fallback to recipe image
    if (recipe.image_url) {
      return recipe.image_url;
    }
    return null;
  };

  return (
    <div
      className={`flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 ${className}`}
    >
      {/* Recipe/User Image Circles */}
      <div className="relative mb-8 pb-2">
        <div className="flex -space-x-2 sm:-space-x-3">
          {displayItems && displayItems.length > 0
            ? // Show real recipe/user images (may be fewer than maxImages)
              displayItems.map((recipe, index) => {
                const baseZIndex = maxImages - index;
                const rating = recipe.creator_rating || 4;
                const imageUrl = getImageUrl(recipe);
                const hasImageError = imageErrors.has(recipe.id);
                const showEmoji = !imageUrl || hasImageError;
                const emoji = showEmoji ? getCategoryEmoji(recipe) : null;

                return (
                  <div
                    key={recipe.id}
                    className={`
                    relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 
                    rounded-full border-3 sm:border-4 border-white shadow-xl
                    ${showEmoji ? `bg-gradient-to-br ${COLORS[index % COLORS.length]}` : 'bg-gray-100'}
                    flex items-center justify-center overflow-hidden
                    transform transition-all duration-300 hover:scale-110 hover:-translate-y-1
                    cursor-pointer
                  `}
                    style={{
                      zIndex: baseZIndex,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.zIndex = '20';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.zIndex = baseZIndex.toString();
                    }}
                    title={recipe.title}
                  >
                    {showEmoji ? (
                      <span className="text-2xl sm:text-3xl md:text-4xl">
                        {emoji}
                      </span>
                    ) : (
                      <img
                        src={imageUrl!}
                        alt={recipe.title}
                        className="w-full h-full object-cover"
                        onError={() => handleImageError(recipe.id)}
                        loading="lazy"
                      />
                    )}

                    {/* Star rating badge - real rating */}
                    <div
                      className="absolute -top-1 -right-1 bg-orange-500 text-white rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center shadow-lg border-2 border-white"
                      style={{ zIndex: baseZIndex + 10 }}
                    >
                      <div className="flex items-center gap-0.5">
                        <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-current" />
                        <span className="text-[10px] sm:text-xs font-bold">
                          {rating}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            : // Fallback to emoji placeholders (only when no recipes available)
              FOOD_EMOJIS.slice(0, maxImages).map((emoji, index) => {
                const baseZIndex = FOOD_EMOJIS.length - index;
                const rating = index % 2 === 0 ? 5 : 4;

                return (
                  <div
                    key={index}
                    className={`
                    relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 
                    rounded-full border-3 sm:border-4 border-white shadow-xl
                    bg-gradient-to-br ${COLORS[index]}
                    flex items-center justify-center
                    transform transition-all duration-300 hover:scale-110 hover:-translate-y-1
                    cursor-pointer
                  `}
                    style={{
                      zIndex: baseZIndex,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.zIndex = '20';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.zIndex = baseZIndex.toString();
                    }}
                  >
                    <span className="text-2xl sm:text-3xl md:text-4xl">
                      {emoji}
                    </span>

                    {/* Star rating badge */}
                    <div
                      className="absolute -top-1 -right-1 bg-orange-500 text-white rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center shadow-lg border-2 border-white"
                      style={{ zIndex: baseZIndex + 10 }}
                    >
                      <div className="flex items-center gap-0.5">
                        <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-current" />
                        <span className="text-[10px] sm:text-xs font-bold">
                          {rating}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>

      {/* Content */}
      <div className="text-center space-y-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Discover Top-Rated Recipes
          </h3>
          <p className="text-sm sm:text-base text-gray-600 px-4">
            Highest-rated recipes from our community of talented home chefs
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto pt-4">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-2">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div className="text-lg font-bold text-gray-900">
              {recipeCount}+
            </div>
            <div className="text-xs text-gray-500">Recipes</div>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center mb-2">
              <Star className="w-6 h-6 text-white fill-current" />
            </div>
            <div className="text-lg font-bold text-gray-900">
              {averageRating > 0
                ? `${averageRating}`
                : `${FALLBACK_AVERAGE_RATING}`}
              +
            </div>
            <div className="text-xs text-gray-500">Avg Rating</div>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center mb-2">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="text-lg font-bold text-gray-900">
              {totalChefs > 0 ? totalChefs : topChefs.length}+
            </div>
            <div className="text-xs text-gray-500">Chefs</div>
          </div>
        </div>

        {/* Featured chef names */}
        {topChefs.length > 0 && (
          <div className="pt-2">
            <p className="text-xs text-gray-500">
              {topChefs.join(', ')} & more
            </p>
          </div>
        )}

        <p className="text-sm text-gray-600 pt-2">
          Join our community and share your favorite recipes!
        </p>
      </div>
    </div>
  );
}
