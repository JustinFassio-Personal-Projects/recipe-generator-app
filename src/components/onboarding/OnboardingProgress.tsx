import { motion } from 'framer-motion';

interface OnboardingProgressProps {
  current: number;
  total: number;
}

export function OnboardingProgress({
  current,
  total,
}: OnboardingProgressProps) {
  return (
    <div className="px-4 pt-4 pb-2">
      {/* Visual Progress */}
      <div className="flex gap-1.5 mb-2">
        {Array.from({ length: total }).map((_, index) => (
          <motion.div
            key={index}
            className={`h-1 flex-1 rounded-full transition-colors ${
              index <= current ? 'bg-primary' : 'bg-gray-200'
            }`}
            initial={false}
            animate={{
              backgroundColor:
                index <= current
                  ? 'var(--color-primary)'
                  : 'rgb(229, 231, 235)',
            }}
          />
        ))}
      </div>
      {/* Text Indicator */}
      <p className="text-xs text-gray-500 text-center">
        Step {current + 1} of {total}
      </p>
    </div>
  );
}
