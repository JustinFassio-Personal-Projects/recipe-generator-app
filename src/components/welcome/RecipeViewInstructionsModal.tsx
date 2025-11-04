import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ChefHat,
  ShoppingCart,
  Check,
  Plus,
  Edit,
  Star,
  Lightbulb,
  Globe,
} from 'lucide-react';

interface RecipeViewInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RecipeViewInstructionsModal({
  isOpen,
  onClose,
}: RecipeViewInstructionsModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('hideRecipeViewInstructionsModal', 'true');
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogTitle className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-orange-600">
          <ChefHat className="h-5 w-5 sm:h-6 sm:w-6" />
          How to Use Recipe View
        </DialogTitle>
        <DialogDescription className="sr-only">
          Instructions for using the recipe view page
        </DialogDescription>

        <div className="space-y-4 sm:space-y-6">
          {/* Introduction */}
          <div className="rounded-lg bg-gradient-to-r from-orange-50 to-teal-50 p-4">
            <p className="text-gray-700">
              This page shows you everything about your recipe, plus smart
              features to help you cook with what you already have! Here's what
              you can do:
            </p>
          </div>

          {/* Grocery Compatibility Section */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-green-100">
                <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-700">
                  1. Check Your Grocery Compatibility
                </h3>
                <p className="text-sm text-white">
                  See what percentage of ingredients you already have! Green
                  checkmarks show what's in your kitchen. The compatibility bar
                  tells you if you're ready to cook or need to shop.
                </p>
              </div>
            </div>
          </div>

          {/* Add Ingredients Section */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-blue-100">
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-700">
                  2. Add Missing Ingredients
                </h3>
                <p className="text-sm text-white">
                  See an ingredient you don't have? Click the{' '}
                  <strong>+ Add</strong> button next to it to add it to your
                  grocery collection. You can then toggle it as "available" or
                  "needed" for shopping.
                </p>
              </div>
            </div>
          </div>

          {/* Shopping List Section */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-purple-100">
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-purple-700">
                  3. Create Shopping Lists
                </h3>
                <p className="text-sm text-white">
                  The shopping list automatically shows what you need to buy.
                  Use the
                  <strong> Add to Shopping Cart</strong> button to save all
                  missing ingredients at once, or export them as a text file to
                  take shopping.
                </p>
              </div>
            </div>
          </div>

          {/* Notes & Comments Section */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-orange-100">
                <Edit className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-orange-700">
                  4. Add Notes & Rate Recipes
                </h3>
                <p className="text-sm text-white">
                  Add your own notes, tips, or variations to any recipe. For
                  public recipes, you can also leave ratings and comments to
                  help the community!
                </p>
              </div>
            </div>
          </div>

          {/* Pro Tips Section */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-teal-100">
                <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-teal-700 mb-2">Pro Tips</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-sm">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                    <p className="text-gray-700">
                      <strong>Green checkmarks</strong> mean you have the exact
                      ingredient
                    </p>
                  </div>

                  <div className="flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-sm">
                    <Globe className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                    <p className="text-gray-700">
                      <strong>Blue globe icons</strong> show ingredients from
                      the global catalog that you can add to your collection
                    </p>
                  </div>

                  <div className="flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-sm">
                    <Star className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-500" />
                    <p className="text-gray-700">
                      The <strong>compatibility percentage</strong> helps you
                      quickly decide if you can cook this recipe today or need
                      to shop first
                    </p>
                  </div>

                  <div className="flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-sm">
                    <ShoppingCart className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-500" />
                    <p className="text-gray-700">
                      Click ingredients in the{' '}
                      <strong>Shopping List section</strong> to toggle them
                      between "needed" and "available" status
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Don't Show Again */}
          <div className="flex items-start space-x-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <Checkbox
              id="dont-show-recipe-view-instructions"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked === true)}
              className="mt-0.5"
            />
            <label
              htmlFor="dont-show-recipe-view-instructions"
              className="cursor-pointer text-sm text-gray-700"
            >
              Don't show these instructions again
            </label>
          </div>

          {/* Action Button */}
          <Button
            onClick={handleClose}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700"
            size="lg"
          >
            Got It! Let's Cook
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
