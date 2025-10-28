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
      <DialogContent className="max-w-2xl">
        <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-orange-600">
          <ChefHat className="h-6 w-6" />
          How to Work with {chefName}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Instructions for using the AI recipe assistant
        </DialogDescription>

        <div className="space-y-6">
          {/* Introduction */}
          <div className="rounded-lg bg-gradient-to-r from-orange-50 to-teal-50 p-4">
            <p className="text-gray-700">
              <strong>{chefName}</strong> is ready to help you create amazing
              recipes! Here's how to get the most out of your cooking session:
            </p>
          </div>

          {/* Recipe Preferences Section */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                <Filter className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-purple-700">
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
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-700">
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
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <MessageSquare className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-700">
                  3. Start a Conversation
                </h3>
                <p className="text-sm text-white mb-2">
                  Simply type your idea in the chat box. You can be specific or
                  ask for suggestions!
                </p>
              </div>
            </div>
          </div>

          {/* Examples Section */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                <Lightbulb className="h-5 w-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Example Prompts
                </h3>
                <div className="space-y-2">
                  <div className="rounded-lg bg-gray-50 p-3 text-sm">
                    <Sparkles className="mb-1 inline h-4 w-4 text-orange-500" />
                    <span className="ml-1 font-medium">
                      Request a specific dish:
                    </span>
                    <p className="mt-1 text-gray-600">
                      "I'd like to make a traditional tomato basil pasta"
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3 text-sm">
                    <Sparkles className="mb-1 inline h-4 w-4 text-teal-500" />
                    <span className="ml-1 font-medium">
                      Ask for ingredient-based ideas:
                    </span>
                    <p className="mt-1 text-gray-600">
                      "What can I make with chicken, tomatoes, and rice?"
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3 text-sm">
                    <Sparkles className="mb-1 inline h-4 w-4 text-purple-500" />
                    <span className="ml-1 font-medium">
                      Get creative suggestions:
                    </span>
                    <p className="mt-1 text-gray-600">
                      "Suggest a healthy dinner recipe for a busy weeknight"
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3 text-sm">
                    <Sparkles className="mb-1 inline h-4 w-4 text-blue-500" />
                    <span className="ml-1 font-medium">
                      Ask for variations:
                    </span>
                    <p className="mt-1 text-gray-600">
                      "How can I make lasagna vegetarian?"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Don't Show Again */}
          <div className="flex items-start space-x-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <Checkbox
              id="dont-show-instructions"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked === true)}
              className="mt-0.5"
            />
            <label
              htmlFor="dont-show-instructions"
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
            Got It! Let's Start Cooking
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
