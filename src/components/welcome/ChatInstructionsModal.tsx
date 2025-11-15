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
  Sparkles,
  MessageSquare,
  Filter,
  User,
  Lightbulb,
} from 'lucide-react';

interface ChatInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  chefName: string;
}

export function ChatInstructionsModal({
  isOpen,
  onClose,
  chefName,
}: ChatInstructionsModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('hideChatInstructionsModal', 'true');
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto !block">
        <DialogTitle className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-warning mb-4">
          <ChefHat className="h-5 w-5 sm:h-6 sm:w-6" />
          How to Work with {chefName}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Instructions for using the AI recipe assistant
        </DialogDescription>

        <div className="space-y-4 sm:space-y-6">
          {/* Introduction */}
          <div className="rounded-lg bg-gradient-to-r from-warning/10 to-info/10 p-4">
            <p className="text-base-content">
              <strong>{chefName}</strong> is ready to help you create amazing
              recipes! Here's how to get the most out of your cooking session:
            </p>
          </div>

          {/* Recipe Preferences Section */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-accent/20">
                <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-accent">
                  1. Recipe Preferences (Optional)
                </h3>
                <p className="text-sm text-white">
                  Use the filters at the top to select categories, cuisines,
                  moods, or ingredients you have on hand. These help guide{' '}
                  {chefName}'s suggestions, but they're completely optional!
                </p>
              </div>
            </div>
          </div>

          {/* Profile Data Section */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-info/20">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-info" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-info">
                  2. Your Profile is Pre-Loaded
                </h3>
                <p className="text-sm text-white">
                  {chefName} already knows your dietary restrictions, allergies,
                  preferences, and skill level from your profile. No need to
                  repeat this information!
                </p>
              </div>
            </div>
          </div>

          {/* Chat Input Section */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-success/20">
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-success">
                  3. Start a Conversation
                </h3>
                <p className="text-sm text-white">
                  Simply type your idea in the chat box. You can be specific or
                  ask for suggestions!
                </p>
              </div>
            </div>
          </div>

          {/* Examples Section */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-warning/20">
                <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-base-content mb-2">
                  Example Prompts
                </h3>
                <div className="space-y-2">
                  <div className="rounded-lg bg-base-200 p-3 text-sm">
                    <Sparkles className="mb-1 inline h-4 w-4 text-warning" />
                    <span className="ml-1 font-medium">
                      Request a specific dish:
                    </span>
                    <p className="mt-1 text-base-content/80">
                      "I'd like to make a traditional tomato basil pasta"
                    </p>
                  </div>

                  <div className="rounded-lg bg-base-200 p-3 text-sm">
                    <Sparkles className="mb-1 inline h-4 w-4 text-info" />
                    <span className="ml-1 font-medium">
                      Ask for ingredient-based ideas:
                    </span>
                    <p className="mt-1 text-base-content/80">
                      "What can I make with chicken, tomatoes, and rice?"
                    </p>
                  </div>

                  <div className="rounded-lg bg-base-200 p-3 text-sm">
                    <Sparkles className="mb-1 inline h-4 w-4 text-accent" />
                    <span className="ml-1 font-medium">
                      Get creative suggestions:
                    </span>
                    <p className="mt-1 text-base-content/80">
                      "Suggest a healthy dinner recipe for a busy weeknight"
                    </p>
                  </div>

                  <div className="rounded-lg bg-base-200 p-3 text-sm">
                    <Sparkles className="mb-1 inline h-4 w-4 text-info" />
                    <span className="ml-1 font-medium">
                      Ask for variations:
                    </span>
                    <p className="mt-1 text-base-content/80">
                      "How can I make lasagna vegetarian?"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Don't Show Again */}
          <div className="flex items-start space-x-2 rounded-lg border border-base-300 bg-base-200 p-3">
            <Checkbox
              id="dont-show-instructions"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked === true)}
              className="mt-0.5"
            />
            <label
              htmlFor="dont-show-instructions"
              className="cursor-pointer text-sm text-base-content"
            >
              Don't show these instructions again
            </label>
          </div>

          {/* Action Button */}
          <Button
            onClick={handleClose}
            className="w-full bg-warning text-warning-content hover:bg-warning/90"
            size="lg"
          >
            Got It! Let's Start Cooking
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
