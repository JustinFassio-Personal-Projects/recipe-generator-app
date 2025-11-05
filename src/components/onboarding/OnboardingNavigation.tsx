import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface OnboardingNavigationProps {
  onNext: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  isNextDisabled?: boolean;
  showSkip?: boolean;
  nextLabel?: string;
}

export function OnboardingNavigation({
  onNext,
  onBack,
  onSkip,
  isNextDisabled = false,
  showSkip = false,
  nextLabel = 'Continue',
}: OnboardingNavigationProps) {
  return (
    <div className="py-4 space-y-3 bg-white border-t px-4">
      <Button
        onClick={onNext}
        size="lg"
        className="w-full"
        disabled={isNextDisabled}
      >
        {nextLabel}
        <ChevronRight className="ml-2 h-5 w-5" />
      </Button>

      <div className="flex gap-3">
        {onBack && (
          <Button
            onClick={onBack}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        )}

        {showSkip && onSkip && (
          <button
            onClick={onSkip}
            className="flex-1 text-sm text-gray-500 py-2 hover:text-gray-700"
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
}
