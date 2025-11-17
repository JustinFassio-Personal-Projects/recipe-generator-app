import {
  createDaisyUICardClasses,
  createDaisyUICardTitleClasses,
} from '@/lib/card-migration';
import { createDaisyUIBadgeClasses } from '@/lib/badge-migration';
import { createDaisyUISeparatorClasses } from '@/lib/separator-migration';
import {
  ArrowLeft,
  Clock,
  Users,
  Edit,
  Calendar,
  Check,
  ShoppingCart,
  AlertCircle,
  Globe,
  Save,
  Plus,
  Shield,
  Sliders,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMemo, useState, useEffect } from 'react';
import { useGlobalIngredients } from '@/hooks/useGlobalIngredients';
import { useUpdateRecipe } from '@/hooks/use-recipes';
import { SaveToGlobalButton } from '@/components/groceries/save-to-global-button';
import { GroceryCard } from '@/components/groceries/GroceryCard';
import { parseIngredientText } from '@/lib/groceries/ingredient-parser';
import { EnhancedIngredientMatcher } from '@/lib/groceries/enhanced-ingredient-matcher';
import { useGroceries } from '@/hooks/useGroceries';
import { useIngredientMatching } from '@/hooks/useIngredientMatching';
import type { Recipe } from '@/lib/types';
import { CreatorRating, YourComment } from '@/components/ui/rating';
import { CommentSystem } from './comment-system';
import { AddToShoppingListButton } from '@/components/shopping-cart/AddToShoppingListButton';
import { useUserGroceryCart } from '@/hooks/useUserGroceryCart';
import { EditableNotes } from '@/components/shared/patterns/EditableNotes';
import { detectIngredientMentions } from '@/lib/utils/ingredient-mention-detector';
import { InstructionIngredientDropdown } from './InstructionIngredientDropdown';

interface RecipeViewProps {
  recipe: Recipe;
  onEdit?: () => void;
  onSave?: () => void;
  onBack?: () => void;
  userComment?: {
    rating?: number;
    comment?: string;
  } | null;
  onEditComment?: () => void;
  onNotesUpdated?: (updatedRecipe: Recipe) => void;
}

export function RecipeView({
  recipe,
  onEdit,
  onSave,
  onBack,
  userComment,
  onEditComment,
  onNotesUpdated,
}: RecipeViewProps) {
  const groceries = useGroceries();
  const {
    /* saveIngredientToGlobal, */ refreshGlobalIngredients,
    globalIngredients,
    getGlobalIngredient,
  } = useGlobalIngredients();

  // Use basic ingredient matching for grocery compatibility (user's actual groceries only)
  const basicIngredientMatching = useIngredientMatching();

  // Use user grocery cart to check if ingredients are in user's collection
  const { isInCart, addToCart, loading: cartLoading } = useUserGroceryCart();

  const updateRecipe = useUpdateRecipe();

  // Handle notes save
  const handleNotesSave = async (notes: string) => {
    console.log('🔄 Saving notes:', {
      recipeId: recipe.id,
      notes,
      currentNotes: recipe.notes,
    });

    const result = await updateRecipe.mutateAsync({
      id: recipe.id,
      updates: { notes },
    });

    console.log('✅ Notes save result:', result);

    // Notify parent component of the update
    onNotesUpdated?.(result);
  };

  // Simple state to track clicked ingredients (immediate UI feedback)
  const [clickedIngredients, setClickedIngredients] = useState<Set<string>>(
    new Set()
  );

  // State to track checked instruction steps (persisted in localStorage)
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());

  // Load checked steps from localStorage on mount
  useEffect(() => {
    const storageKey = `recipe-instructions-checked-${recipe.id}`;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as number[];
        setCheckedSteps(new Set(parsed));
      }
    } catch (error) {
      console.warn('Failed to load checked steps from localStorage:', error);
    }
  }, [recipe.id]);

  // Save checked steps to localStorage whenever they change
  useEffect(() => {
    const storageKey = `recipe-instructions-checked-${recipe.id}`;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(Array.from(checkedSteps))
      );
    } catch (error) {
      console.warn('Failed to save checked steps to localStorage:', error);
    }
  }, [checkedSteps, recipe.id]);

  // Handle step checkbox toggle
  const handleStepToggle = (stepIndex: number) => {
    setCheckedSteps((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(stepIndex)) {
        newSet.delete(stepIndex);
      } else {
        newSet.add(stepIndex);
      }
      return newSet;
    });
  };

  // Parse instructions into steps array (extracted for useMemo)
  const instructionSteps = useMemo(() => {
    let steps: string[] = [];
    let instructionsToProcess: unknown = recipe.instructions;

    // Check if instructions is a JSON string that needs parsing
    // Handle case where instructions might be stored as a string instead of array
    if (
      typeof instructionsToProcess === 'string' &&
      instructionsToProcess.trim().startsWith('[')
    ) {
      try {
        instructionsToProcess = JSON.parse(instructionsToProcess);
      } catch (e) {
        console.warn('Failed to parse instructions as JSON:', e);
      }
    }

    if (Array.isArray(instructionsToProcess)) {
      steps = instructionsToProcess
        .map((step) => {
          if (typeof step === 'string' && step.includes('\n')) {
            return step
              .split('\n')
              .map((s) => s.trim())
              .filter((s) => s.length > 0);
          }
          return step;
        })
        .flat()
        .filter((step) => {
          const trimmed =
            typeof step === 'string' ? step.trim() : String(step).trim();
          return (
            trimmed.length > 0 &&
            !(trimmed.startsWith('**') && trimmed.endsWith('**'))
          );
        })
        .map((step) => {
          const stepStr = typeof step === 'string' ? step : String(step);
          return stepStr.replace(/^\d+\.\s*/, '').trim();
        });
    } else if (typeof instructionsToProcess === 'string') {
      const lines = instructionsToProcess.split('\n');
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
          continue;
        }
        const cleanedStep = trimmedLine.replace(/^\d+\.\s*/, '').trim();
        if (cleanedStep.length > 0) {
          steps.push(cleanedStep);
        }
      }
    }

    return steps;
  }, [recipe.instructions]);

  // Pre-compute ingredient mentions for all steps (performance optimization)
  const ingredientMentionsByStep = useMemo(() => {
    return instructionSteps.map((step) =>
      detectIngredientMentions(step, recipe.ingredients)
    );
  }, [instructionSteps, recipe.ingredients]);

  // Create enhanced matcher that includes global ingredients (for individual ingredient workflow)
  const [enhancedMatcher, setEnhancedMatcher] =
    useState<EnhancedIngredientMatcher | null>(null);

  // Initialize enhanced matcher when groceries or global ingredients change
  useEffect(() => {
    const initializeMatcher = async () => {
      // Always initialize matcher, even with empty groceries for new users
      // This allows global ingredients to load and shopping functionality to work
      const matcher = new EnhancedIngredientMatcher(groceries.groceries);
      await matcher.initialize();
      setEnhancedMatcher(matcher);
    };

    initializeMatcher();
  }, [groceries.groceries, globalIngredients]);

  // Calculate ACTUAL grocery compatibility using basic matcher (user's groceries only)
  const groceryCompatibility = useMemo(() => {
    return basicIngredientMatching.calculateCompatibility(recipe);
  }, [basicIngredientMatching, recipe]);

  // Use grocery compatibility for the compatibility section (user's actual groceries)
  const availabilityPercentage = groceryCompatibility.compatibilityScore;

  // Use grocery compatibility for shopping list (what user actually needs to buy)
  // Filter out ingredients that are marked as "available" in groceries
  const missingIngredients = useMemo(() => {
    return groceryCompatibility.missingIngredients.filter((match) => {
      const parsedIngredient = parseIngredientText(match.recipeIngredient);

      // Check all categories to see if ingredient is marked as available
      for (const ingredients of Object.values(groceries.groceries)) {
        if (ingredients.includes(parsedIngredient.name)) {
          return false; // Ingredient is available, exclude from shopping list
        }
      }

      return true; // Ingredient not available, include in shopping list
    });
  }, [groceryCompatibility.missingIngredients, groceries.groceries]);

  // Handle adding global ingredients to user's grocery collection
  const handleAddToGroceries = async (category: string, name: string) => {
    // IMMEDIATELY mark as clicked (hide button right away)
    setClickedIngredients((prev) => new Set([...prev, name]));

    // Then do the actual add (in background)
    try {
      const success = await addToCart(category, name);

      if (success) {
        // IMPORTANT: Mark ingredient as "available" by default when added from recipe
        // This ensures it appears as selected (blue) in groceries and is excluded from shopping list
        groceries.toggleIngredient(category, name);

        // Refresh groceries state to sync with database
        await groceries.loadGroceries();
      }

      return success;
    } catch (error) {
      console.error('Failed to add ingredient to cart:', error);
      // On error, remove from clicked state so button reappears
      setClickedIngredients((prev) => {
        const newSet = new Set(prev);
        newSet.delete(name);
        return newSet;
      });
      return false;
    }
  };

  const getIngredientStatusIcon = (match: { matchType: string }) => {
    switch (match.matchType) {
      case 'exact':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'partial':
      case 'fuzzy':
        return <Check className="h-4 w-4 text-yellow-600" />;
      case 'global':
        return <Globe className="h-4 w-4 text-blue-600" />;
      default:
        return <ShoppingCart className="h-4 w-4 text-gray-400" />;
    }
  };

  const getIngredientBadge = (match: { matchType: string }) => {
    if (match.matchType === 'none') {
      return (
        <Badge variant="outline" className="text-red-600 bg-red-50">
          Not Available
        </Badge>
      );
    }

    if (match.matchType === 'global') {
      return (
        <Badge variant="outline" className="text-blue-600 bg-blue-50">
          My Ingredient
        </Badge>
      );
    }

    const variant = match.matchType === 'exact' ? 'default' : 'outline';
    const text = match.matchType === 'exact' ? 'You have this' : 'Similar item';

    return (
      <Badge
        variant={variant}
        className={`ml-2 text-xs ${
          match.matchType === 'exact'
            ? 'bg-green-100 text-green-800 border-green-300'
            : 'bg-amber-50 text-amber-700 border-amber-300'
        }`}
      >
        {text}
      </Badge>
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {onBack && (
            <Button
              variant="ghost"
              onClick={onBack}
              className="w-full sm:w-auto text-sm"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Recipes
            </Button>
          )}
          {onEdit && (
            <Button onClick={onEdit} className="w-full sm:w-auto text-sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit Recipe
            </Button>
          )}
          {onSave && (
            <Button onClick={onSave} className="w-full sm:w-auto text-sm">
              <Save className="mr-2 h-4 w-4" />
              Save Recipe
            </Button>
          )}
        </div>
        <AddToShoppingListButton
          ingredients={recipe.ingredients}
          recipeId={recipe.id}
          recipeTitle={recipe.title}
          variant="outline"
          size="default"
          showCount={false}
          className="w-full sm:w-auto"
        />
      </div>

      {/* Recipe Header */}
      <div className={createDaisyUICardClasses('bordered')}>
        <div className="card-body pb-4">
          <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-start">
            <div className="flex-1">
              {/* Recipe Description - Moved to top */}
              {recipe.description && (
                <div className="mb-4">
                  <p className="text-base sm:text-lg text-gray-700 leading-relaxed break-words">
                    {recipe.description}
                  </p>
                </div>
              )}

              <h3
                className={`${createDaisyUICardTitleClasses()} mb-4 text-lg font-bold sm:text-xl lg:text-2xl xl:text-3xl break-words`}
              >
                {recipe.title}
              </h3>
              <div className="flex flex-col gap-2 text-sm text-gray-600 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                <div className="flex items-center">
                  <Users className="mr-1 h-4 w-4" />
                  <span className={createDaisyUIBadgeClasses('secondary')}>
                    {recipe.ingredients.length} ingredients
                  </span>
                </div>
                <div className="flex items-center">
                  <Calendar className="mr-1 h-4 w-4" />
                  <span>
                    Added {new Date(recipe.created_at).toLocaleDateString()}
                  </span>
                </div>
                {recipe.updated_at !== recipe.created_at && (
                  <div className="flex items-center">
                    <Clock className="mr-1 h-4 w-4" />
                    <span>
                      Updated {new Date(recipe.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Setup */}
              {recipe.setup && recipe.setup.length > 0 && (
                <div className="mt-4 border border-base-300 rounded-lg p-4 bg-base-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    Setup
                  </h4>
                  <div className="flex flex-col gap-2">
                    {recipe.setup.map((step, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 border border-base-300 rounded-md p-2 bg-base-100"
                      >
                        <Sliders className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-800 leading-relaxed">
                          {index + 1}. {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="mt-4 border border-base-300 rounded-lg p-4 bg-base-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Instructions
                </h4>
                <div className="flex flex-col gap-2">
                  {instructionSteps.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">
                      No instructions available for this recipe.
                    </p>
                  ) : (
                    instructionSteps.map((step, index) => {
                      const isChecked = checkedSteps.has(index);
                      const ingredientMentions =
                        ingredientMentionsByStep[index];
                      return (
                        <div
                          key={index}
                          className={`flex flex-col gap-2 border border-base-300 rounded-md p-2 bg-base-100 ${
                            isChecked ? 'opacity-60' : ''
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleStepToggle(index)}
                              className="mt-0.5 h-4 w-4 flex-shrink-0 cursor-pointer rounded border-gray-300 text-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-0"
                              aria-label={`Mark step ${index + 1} as complete`}
                            />
                            <Badge
                              variant="outline"
                              className="h-5 min-w-[1.5rem] flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5"
                            >
                              {index + 1}
                            </Badge>
                            <p
                              className={`text-sm text-gray-800 leading-relaxed flex-1 ${
                                isChecked ? 'line-through' : ''
                              }`}
                            >
                              {step}
                            </p>
                          </div>
                          {ingredientMentions.length > 0 && (
                            <InstructionIngredientDropdown
                              ingredients={ingredientMentions}
                            />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Notes */}
              <EditableNotes
                notes={recipe.notes}
                onSave={handleNotesSave}
                placeholder="Additional notes, tips, or variations..."
                rows={3}
              />

              {/* Creator Rating */}
              {recipe.creator_rating && (
                <div className="mt-4">
                  <CreatorRating
                    rating={recipe.creator_rating}
                    disabled={true}
                    className="max-w-xs"
                  />
                </div>
              )}

              {/* Your Comment */}
              {userComment && (userComment.rating || userComment.comment) && (
                <div className="mt-4">
                  <YourComment
                    userRating={userComment.rating}
                    userComment={userComment.comment}
                    onEdit={onEditComment}
                    className="max-w-xs"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grocery Compatibility Section */}
      {enhancedMatcher && Object.keys(groceries.groceries).length > 0 && (
        <div
          className={createDaisyUICardClasses(
            'bordered bg-gradient-to-r from-green-50 to-blue-50'
          )}
        >
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h3 className="card-title text-green-800">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Grocery Compatibility
              </h3>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-600">
                  {availabilityPercentage}%
                </div>
                <div className="text-sm text-green-700">
                  {groceryCompatibility.availableIngredients.length} of{' '}
                  {groceryCompatibility.totalIngredients} ingredients
                </div>
              </div>
            </div>

            {/* Compatibility Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  availabilityPercentage >= 80
                    ? 'bg-green-500'
                    : availabilityPercentage >= 60
                      ? 'bg-yellow-500'
                      : availabilityPercentage >= 40
                        ? 'bg-orange-500'
                        : 'bg-red-500'
                }`}
                style={{ width: `${availabilityPercentage}%` }}
              />
            </div>

            {/* Compatibility Messages */}
            {availabilityPercentage >= 80 && (
              <div className="alert alert-success">
                <Check className="h-4 w-4" />
                <span>Excellent match! You have most ingredients needed.</span>
              </div>
            )}

            {availabilityPercentage >= 50 && availabilityPercentage < 80 && (
              <div className="alert alert-info">
                <AlertCircle className="h-4 w-4" />
                <span>
                  Good match! You have many of the ingredients needed.
                </span>
              </div>
            )}

            {availabilityPercentage < 50 && (
              <div className="alert alert-warning">
                <AlertCircle className="h-4 w-4" />
                <span>
                  You'll need to shop for several ingredients for this recipe.
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ingredients */}
      <div className={createDaisyUICardClasses('bordered')}>
        <div className="card-body">
          <h3 className="card-title text-xl font-semibold mb-4">
            Ingredients
            {enhancedMatcher && (
              <span className="text-sm font-normal text-gray-600">
                ({groceryCompatibility.availableIngredients.length} available)
              </span>
            )}
          </h3>

          <div className="space-y-3">
            {recipe.ingredients.map((ingredient, index) => {
              // First check user groceries, then fall back to enhanced matcher (global ingredients)
              const userGroceryMatch =
                basicIngredientMatching.matchIngredient(ingredient);
              const match =
                userGroceryMatch.matchType !== 'none'
                  ? userGroceryMatch
                  : enhancedMatcher
                    ? enhancedMatcher.matchIngredient(ingredient)
                    : {
                        recipeIngredient: ingredient,
                        confidence: 0,
                        matchType: 'none' as const,
                      };
              const isAvailable =
                match.matchType !== 'none' && match.confidence >= 50;

              return (
                <div key={index} className="flex items-start">
                  {ingredient.startsWith('---') &&
                  ingredient.endsWith('---') ? (
                    // Category header (existing code)
                    <div className="w-full">
                      <div
                        className={createDaisyUISeparatorClasses(
                          'horizontal',
                          'mb-2'
                        )}
                      />
                      <h4 className="mb-2 text-lg font-semibold text-gray-800">
                        {ingredient
                          .replace(/^---\s*/, '')
                          .replace(/\s*---$/, '')}
                      </h4>
                    </div>
                  ) : (
                    // Enhanced ingredient with availability indicator
                    <>
                      <div className="flex items-center w-full">
                        <div className="mt-0.5 mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center">
                          {enhancedMatcher ? (
                            getIngredientStatusIcon(match)
                          ) : (
                            <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                          )}
                        </div>
                        <div className="flex-1 flex items-center justify-between min-w-0">
                          <p
                            className={`leading-relaxed break-words ${
                              isAvailable
                                ? 'text-gray-900 font-medium'
                                : 'text-gray-700'
                            }`}
                          >
                            {ingredient}
                          </p>
                          {enhancedMatcher && (
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2 ml-2">
                              {getIngredientBadge(match)}
                              {match.matchedGroceryIngredient && (
                                <span className="text-xs text-gray-500 break-words">
                                  (matches: {match.matchedGroceryIngredient})
                                </span>
                              )}
                              {match.matchType === 'none' && (
                                <SaveToGlobalButton
                                  ingredient={
                                    parseIngredientText(ingredient).name
                                  }
                                  recipeContext={{
                                    recipeId: recipe.id,
                                    recipeCategories: recipe.categories || [],
                                  }}
                                  onSaved={refreshGlobalIngredients}
                                />
                              )}
                              {match.matchType === 'global' && (
                                <>
                                  {(() => {
                                    // Find the actual global ingredient data using the normalized name
                                    const parsedIngredient =
                                      parseIngredientText(ingredient);
                                    const normalizedName =
                                      enhancedMatcher?.normalizeName(
                                        parsedIngredient.name
                                      ) || parsedIngredient.name.toLowerCase();
                                    const globalIngredient =
                                      getGlobalIngredient(normalizedName);

                                    // Create a GlobalIngredient object from the match data if lookup fails
                                    const globalIngredientData =
                                      globalIngredient || {
                                        id: `global-${match.matchedGroceryIngredient}`,
                                        name:
                                          match.matchedGroceryIngredient ||
                                          parsedIngredient.name,
                                        normalized_name:
                                          enhancedMatcher.normalizeName(
                                            match.matchedGroceryIngredient ||
                                              parsedIngredient.name
                                          ),
                                        category:
                                          match.matchedCategory || 'pantry',
                                        synonyms: [],
                                        usage_count: 1,
                                        first_seen_at: new Date().toISOString(),
                                        last_seen_at: new Date().toISOString(),
                                        created_by: null,
                                        is_verified: false,
                                        is_system: true,
                                        created_at: new Date().toISOString(),
                                        updated_at: new Date().toISOString(),
                                      };

                                    // Check if ingredient should show Add button or Shopping List button
                                    const wasClicked = clickedIngredients.has(
                                      globalIngredientData.name
                                    );
                                    const isAlreadyInCart = isInCart(
                                      globalIngredientData.name
                                    );
                                    const shouldShowButton =
                                      !wasClicked && !isAlreadyInCart;

                                    return shouldShowButton ? (
                                      <div className="inline-flex items-center rounded border p-1 bg-white text-xs max-w-full sm:max-w-xs">
                                        <div className="min-w-0 mr-2 flex-1">
                                          <div className="font-medium truncate">
                                            {globalIngredientData.name}
                                          </div>
                                          {globalIngredientData.is_system && (
                                            <span className="inline-flex items-center text-[9px] px-1 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                                              <Shield className="h-2 w-2 mr-0.5" />{' '}
                                              System
                                            </span>
                                          )}
                                        </div>
                                        <Button
                                          size="sm"
                                          onClick={() =>
                                            handleAddToGroceries(
                                              globalIngredientData.category,
                                              globalIngredientData.name
                                            )
                                          }
                                          disabled={cartLoading}
                                          className="h-6 px-2 text-xs flex-shrink-0"
                                        >
                                          <Plus className="h-2 w-2 mr-1" /> Add
                                        </Button>
                                      </div>
                                    ) : (
                                      // Show GroceryCard for ingredients already in cart (to toggle availability)
                                      <GroceryCard
                                        ingredient={globalIngredientData.name}
                                        category={globalIngredientData.category}
                                        loading={cartLoading}
                                        className="text-xs h-6 px-2"
                                        isSelected={groceries.hasIngredient(
                                          globalIngredientData.category,
                                          globalIngredientData.name
                                        )}
                                        onToggle={groceries.toggleIngredient}
                                      />
                                    );
                                  })()}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Shopping List for Missing Ingredients */}
          {enhancedMatcher && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-3 flex items-center">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Shopping List ({missingIngredients.length} items)
              </h4>
              {missingIngredients.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {missingIngredients.map((match, index) => (
                    <div
                      key={index}
                      className="flex items-center text-sm text-blue-700"
                    >
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-2" />
                      {match.recipeIngredient}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Check className="h-8 w-8 mx-auto text-green-600 mb-2" />
                  <p className="text-green-700 font-medium">
                    You have all ingredients!
                  </p>
                  <p className="text-green-600 text-sm">
                    No shopping needed for this recipe.
                  </p>
                </div>
              )}
              {missingIngredients.length > 0 && (
                <div className="flex gap-2 mt-3">
                  <AddToShoppingListButton
                    ingredients={missingIngredients.map(
                      (match) => match.recipeIngredient
                    )}
                    recipeId={recipe.id}
                    recipeTitle={recipe.title}
                    variant="outline"
                    size="sm"
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                    onClick={() => {
                      // Export shopping list as a text file
                      const text = missingIngredients
                        .map((match) => match.recipeIngredient)
                        .join('\n');
                      const blob = new Blob([text], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${recipe.title}-shopping-list.txt`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                  >
                    📋 Export as File
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Comments Section for Public Recipes */}
      {recipe.is_public && (
        <div className={createDaisyUICardClasses('bordered')}>
          <div className="card-body">
            <CommentSystem
              recipeId={recipe.id}
              versionNumber={1}
              className="mt-6"
            />
          </div>
        </div>
      )}
    </div>
  );
}
