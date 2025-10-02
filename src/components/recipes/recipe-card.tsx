import {
  createDaisyUICardClasses,
  createDaisyUICardTitleClasses,
} from '@/lib/card-migration';
import { createDaisyUIBadgeClasses } from '@/lib/badge-migration';
import {
  Trash2,
  Edit,
  Eye,
  Share,
  Check,
  Loader2,
  ShoppingCart,
  Sparkles,
} from 'lucide-react';
import CategoryChip from '@/components/ui/CategoryChip';
import { Badge } from '@/components/ui/badge';
import { useIngredientMatching } from '@/hooks/useIngredientMatching';
import type { Recipe, PublicRecipe } from '@/lib/types';
import { getOptimizedImageUrl } from '@/lib/image-cache-utils';
import { useDeleteRecipe } from '@/hooks/use-recipes';
import { useState } from 'react';
import { recipeApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthProvider';
import { useImageGenerationContext } from '@/contexts/ImageGenerationContext';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Constants
const RECIPE_TITLE_MAX_LENGTH = 45;

interface RecipeCardProps {
  recipe: Recipe | PublicRecipe;
  onEdit?: (recipe: Recipe) => void;
  onView?: (recipe: Recipe | PublicRecipe) => void;
  showShareButton?: boolean;
  onShareToggle?:
    | ((recipeId: string, isPublic: boolean) => void)
    | (() => void);
  showEditDelete?: boolean; // New prop to control Edit/Delete visibility
}

export function RecipeCard({
  recipe,
  onEdit,
  onView,
  showShareButton,
  onShareToggle,
  showEditDelete = true, // Default to true for backward compatibility
}: RecipeCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isPublic, setIsPublic] = useState(recipe.is_public);
  const deleteRecipe = useDeleteRecipe();
  const { user } = useAuth();
  const ingredientMatching = useIngredientMatching();
  const imageGenerationContext = useImageGenerationContext();

  // Calculate compatibility
  const compatibility = ingredientMatching.calculateCompatibility(recipe);
  const availabilityPercentage = compatibility.compatibilityScore;
  const hasGroceries = ingredientMatching.groceriesCount > 0;

  // Only show share button if explicitly requested and user owns the recipe
  const canShare = showShareButton && user?.id === recipe.user_id;

  // Check if this recipe is currently having its image generated
  const isGeneratingImage =
    imageGenerationContext.generationState.isGenerating &&
    imageGenerationContext.generationState.recipeId === recipe.id;
  const generationProgress = imageGenerationContext.generationState.progress;

  // Debug logging
  if (imageGenerationContext.generationState.isGenerating) {
    console.log('Image generation state:', {
      isGenerating: imageGenerationContext.generationState.isGenerating,
      recipeId: imageGenerationContext.generationState.recipeId,
      currentRecipeId: recipe.id,
      matches: imageGenerationContext.generationState.recipeId === recipe.id,
      progress: generationProgress,
    });
  }

  // No longer using drawer - removed for simplicity

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    if (score >= 40) return 'text-orange-600 bg-orange-100 border-orange-200';
    return 'text-red-600 bg-red-100 border-red-200';
  };

  const getCompatibilityIcon = (score: number) => {
    if (score >= 70) return <Check className="h-3 w-3" />;
    return <ShoppingCart className="h-3 w-3" />;
  };

  const handleDelete = () => {
    deleteRecipe.mutate(recipe.id);
    setShowDeleteDialog(false);
  };

  const handleShareToggle = async () => {
    setIsSharing(true);
    try {
      await recipeApi.toggleRecipePublic(recipe.id, !isPublic);
      setIsPublic(!isPublic);
      // Call the callback if it exists, handling both signature types
      if (onShareToggle) {
        if (onShareToggle.length === 2) {
          // Callback expects (recipeId, isPublic) parameters
          (onShareToggle as (recipeId: string, isPublic: boolean) => void)(
            recipe.id,
            !isPublic
          );
        } else {
          // Callback expects no parameters
          (onShareToggle as () => void)();
        }
      }
    } catch (error) {
      console.error('Error toggling recipe sharing:', error);
      // No need to revert state - it was never changed if API call failed
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <>
      {/* Simple Card Layout - No Drawer */}
      <div
        className={`${createDaisyUICardClasses('bordered')} group relative overflow-hidden border border-gray-200 transition-all duration-200 hover:border-gray-300 hover:shadow-lg`}
      >
        {recipe.image_url && (
          <div className="aspect-video overflow-hidden">
            <img
              src={getOptimizedImageUrl(
                recipe.image_url,
                recipe.updated_at,
                recipe.created_at
              )}
              alt={recipe.title}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          </div>
        )}

        {/* Image Generation Progress Overlay */}
        {isGeneratingImage && (
          <div className="aspect-video overflow-hidden bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
            <div className="text-center p-6">
              <div className="mb-4">
                <div className="w-12 h-12 mx-auto mb-2 bg-purple-600 rounded-full flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-white animate-pulse" />
                </div>
                <h4 className="text-lg font-semibold text-purple-900">
                  Generating Image
                </h4>
                <p className="text-sm text-purple-700">
                  Creating your AI-generated recipe image...
                </p>
              </div>
              <div className="w-full max-w-xs mx-auto">
                <div className="flex items-center justify-between text-sm text-purple-800 mb-2">
                  <span>Progress</span>
                  <span>{Math.round(generationProgress)}%</span>
                </div>
                <Progress value={generationProgress} className="h-2" />
              </div>
            </div>
          </div>
        )}

        {/* Recipe Title - Above Image */}
        <div className="px-4 pt-4 pb-2">
          <h3
            className={`${createDaisyUICardTitleClasses()} text-lg font-semibold leading-tight text-gray-800`}
            title={recipe.title}
          >
            {recipe.title.length > RECIPE_TITLE_MAX_LENGTH
              ? `${recipe.title.substring(0, RECIPE_TITLE_MAX_LENGTH).trim()}...`
              : recipe.title}
          </h3>

          {/* Recipe Description */}
          {recipe.description && (
            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
              {recipe.description}
            </p>
          )}
        </div>

        {/* Action Buttons - Top Right */}
        <div className="absolute top-2 right-2 z-20 flex space-x-1">
          <button
            onClick={() => onView?.(recipe)}
            className="btn btn-circle btn-ghost btn-sm bg-white/95 hover:bg-white border border-gray-200 hover:border-gray-300 shadow-lg"
            aria-label="View recipe"
          >
            <Eye className="h-4 w-4" />
          </button>
          {showEditDelete && (
            <button
              onClick={() => onEdit?.(recipe)}
              className="btn btn-circle btn-ghost btn-sm bg-white/95 hover:bg-white border border-gray-200 hover:border-gray-300 shadow-lg"
              aria-label="Edit recipe"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
          {canShare && (
            <button
              onClick={handleShareToggle}
              disabled={isSharing}
              className="btn btn-circle btn-ghost btn-sm bg-white/95 hover:bg-white border border-gray-200 hover:border-gray-300 shadow-lg disabled:opacity-50"
              aria-label={isPublic ? 'Unshare recipe' : 'Share recipe'}
            >
              {isSharing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isPublic ? (
                <Check className="h-4 w-4" />
              ) : (
                <Share className="h-4 w-4" />
              )}
            </button>
          )}
          {showEditDelete && (
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="btn btn-circle btn-ghost btn-sm bg-white/95 hover:bg-white border border-red-200 hover:border-red-300 shadow-lg text-red-600 hover:text-red-700"
              aria-label="Delete recipe"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="card-body pb-3 pt-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <span
                  className={createDaisyUIBadgeClasses('secondary', 'text-xs')}
                >
                  {recipe.ingredients.length} ingredients
                </span>

                {/* Grocery Compatibility Badge */}
                {hasGroceries && ingredientMatching.isReady && (
                  <Badge
                    variant="outline"
                    className={`text-xs border ${getCompatibilityColor(availabilityPercentage)}`}
                  >
                    <div className="flex items-center space-x-1">
                      {getCompatibilityIcon(availabilityPercentage)}
                      <span>{availabilityPercentage}% match</span>
                    </div>
                  </Badge>
                )}
              </div>

              <span className="text-xs">
                {new Date(recipe.created_at).toLocaleDateString('en-US')}
              </span>
            </div>

            {/* Available ingredients preview */}
            {hasGroceries &&
              ingredientMatching.isReady &&
              compatibility.availableIngredients.length > 0 && (
                <div className="text-xs text-green-600">
                  <div className="flex items-center space-x-1">
                    <Check className="h-3 w-3" />
                    <span>
                      You have:{' '}
                      {compatibility.availableIngredients
                        .slice(0, 3)
                        .map(
                          (match) =>
                            match.matchedGroceryIngredient ||
                            match.recipeIngredient
                        )
                        .join(', ')}
                      {compatibility.availableIngredients.length > 3 &&
                        ` +${compatibility.availableIngredients.length - 3} more`}
                    </span>
                  </div>
                </div>
              )}

            {/* Creator Rating */}
            {recipe.creator_rating && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`text-sm ${
                        i < recipe.creator_rating!
                          ? 'text-orange-400'
                          : 'text-gray-300'
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-xs text-gray-600">
                  {recipe.creator_rating}/5
                </span>
              </div>
            )}

            {recipe.categories && recipe.categories.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {recipe.categories.map((category, index) => (
                  <CategoryChip
                    key={`${category}-${index}`}
                    category={category}
                    variant="readonly"
                    size="sm"
                  />
                ))}
              </div>
            )}

            {recipe.notes && (
              <div className="border-t pt-2">
                <p className="line-clamp-2 text-xs text-gray-500 italic">
                  {recipe.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recipe</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{recipe.title}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
