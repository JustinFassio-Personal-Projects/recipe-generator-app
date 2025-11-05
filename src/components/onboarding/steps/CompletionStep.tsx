import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle, ChefHat, User } from 'lucide-react';

interface CompletionStepProps {
  fullName: string | null;
  onClose: () => void;
  onReviewProfile: () => void;
}

export function CompletionStep({
  fullName,
  onClose,
  onReviewProfile,
}: CompletionStepProps) {
  const displayName = fullName || 'Chef';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }}
      className="h-full flex flex-col justify-center px-4 py-8"
    >
      <div className="max-w-md mx-auto text-center space-y-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-teal-100"
        >
          <CheckCircle className="h-10 w-10 text-green-600" />
        </motion.div>

        <div>
          <h2 className="text-3xl font-bold mb-2">
            You're All Set, {displayName}!
          </h2>
          <p className="text-gray-600">
            Your personalized cooking profile is ready
          </p>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-teal-50 rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <p className="text-sm text-left">
              Recipes tailored to your dietary needs and preferences
            </p>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <p className="text-sm text-left">
              Personalized cooking recommendations
            </p>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <p className="text-sm text-left">
              Safe recipes that respect your allergies and conditions
            </p>
          </div>
        </div>

        <div className="space-y-3 w-full">
          <Button onClick={onClose} size="lg" className="w-full">
            <ChefHat className="mr-2 h-5 w-5" />
            Start Cooking
          </Button>

          <Button
            onClick={onReviewProfile}
            variant="outline"
            size="lg"
            className="w-full"
          >
            <User className="mr-2 h-5 w-5" />
            Review Profile
          </Button>
        </div>

        <p className="text-xs text-gray-500">
          You can update your preferences anytime in your profile settings
        </p>
      </div>
    </motion.div>
  );
}
