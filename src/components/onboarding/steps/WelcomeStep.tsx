import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChefHat, ChevronRight } from 'lucide-react';

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2, ease: [0.4, 0.0, 0.2, 1] }}
      className="h-full flex flex-col justify-center px-4 py-8"
    >
      <div className="max-w-md mx-auto text-center space-y-6">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-teal-100">
          <ChefHat className="h-8 w-8 text-orange-600" />
        </div>

        <div>
          <h2 className="text-3xl font-bold mb-2">Welcome!</h2>
          <p className="text-gray-600">
            Let's personalize your cooking experience
          </p>
        </div>

        <div className="space-y-4 text-left">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">
              1
            </div>
            <p className="text-sm text-gray-700">
              <strong>Safety first:</strong> Dietary needs, allergies, and
              medical conditions
            </p>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-500 text-white flex items-center justify-center text-sm font-bold">
              2
            </div>
            <p className="text-sm text-gray-700">
              <strong>Your cooking style:</strong> Skill level and preferences
            </p>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-bold">
              3
            </div>
            <p className="text-sm text-gray-700">
              <strong>Personalization:</strong> Equipment, cuisines, and tastes
            </p>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
          ⏱️ Takes about 2-3 minutes • You can skip optional steps
        </div>

        <Button onClick={onNext} size="lg" className="w-full">
          Let's Get Started
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </motion.div>
  );
}
