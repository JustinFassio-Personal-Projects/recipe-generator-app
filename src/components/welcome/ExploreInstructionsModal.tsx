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
  Sparkles,
  Search,
  Eye,
  Heart,
  Star,
  Copy,
  Lightbulb,
} from 'lucide-react';

interface ExploreInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExploreInstructionsModal({
  isOpen,
  onClose,
}: ExploreInstructionsModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('hideExploreInstructionsModal', 'true');
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogTitle className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-teal-600">
          <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
          Explore the Recipe Community
        </DialogTitle>
        <DialogDescription className="sr-only">
          Instructions for using the Explore page
        </DialogDescription>

        <div className="space-y-4 sm:space-y-6">
          {/* Introduction */}
          <div className="rounded-lg bg-gradient-to-r from-teal-50 to-orange-50 p-4">
            <p className="text-gray-700">
              Discover amazing recipes shared by home cooks and food lovers
              around the world! Here's how to make the most of the Explore page:
            </p>
          </div>

          {/* Browse & Search Section */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-purple-100">
                <Search className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-purple-700">
                  1. Browse & Search Recipes
                </h3>
                <p className="text-sm text-white">
                  Use the search bar and filters to find recipes by name,
                  ingredients, cuisine, or category. Sort by trending, highest
                  rated, most viewed, or most recent to discover what you're
                  looking for!
                </p>
              </div>
            </div>
          </div>

          {/* View Recipes Section */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-blue-100">
                <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-700">
                  2. View Recipe Details
                </h3>
                <p className="text-sm text-white">
                  Click on any recipe card to see the full details, including
                  ingredients, instructions, and photos. You can see who created
                  it and how others have rated it!
                </p>
              </div>
            </div>
          </div>

          {/* Save & Personalize Section */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-green-100">
                <Copy className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-700">
                  3. Save & Personalize
                </h3>
                <p className="text-sm text-white">
                  Found a recipe you love? Save it to your collection with one
                  click! Once saved, you can edit and personalize it to make it
                  your own. It will appear in your "My Recipes" page.
                </p>
              </div>
            </div>
          </div>

          {/* Rate & Comment Section */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-orange-100">
                <Star className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-orange-700">
                  4. Rate & Share Feedback
                </h3>
                <p className="text-sm text-white">
                  Tried a recipe and loved it? Leave a rating and comment to
                  help other cooks discover great recipes! Your feedback helps
                  build a supportive cooking community.
                </p>
              </div>
            </div>
          </div>

          {/* Tips Section */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-teal-100">
                <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-teal-700 mb-2">Pro Tips</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-sm">
                    <Heart className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-500" />
                    <p className="text-gray-700">
                      Save recipes you want to try later - they'll be waiting in
                      your collection
                    </p>
                  </div>

                  <div className="flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-sm">
                    <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-500" />
                    <p className="text-gray-700">
                      After saving, you can customize ingredients, adjust
                      servings, or add your own notes
                    </p>
                  </div>

                  <div className="flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-sm">
                    <Star className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-500" />
                    <p className="text-gray-700">
                      Use the sort options to find trending recipes or
                      highly-rated favorites
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Don't Show Again */}
          <div className="flex items-start space-x-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <Checkbox
              id="dont-show-explore-instructions"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked === true)}
              className="mt-0.5"
            />
            <label
              htmlFor="dont-show-explore-instructions"
              className="cursor-pointer text-sm text-gray-700"
            >
              Don't show these instructions again
            </label>
          </div>

          {/* Action Button */}
          <Button
            onClick={handleClose}
            className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:from-teal-600 hover:to-teal-700"
            size="lg"
          >
            Got It! Let's Explore Recipes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
