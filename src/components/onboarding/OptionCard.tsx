import { CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface OptionCardProps {
  id: string;
  label: string;
  icon: string;
  selected: boolean;
  onToggle: () => void;
}

export function OptionCard({
  label,
  icon,
  selected,
  onToggle,
}: OptionCardProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'min-h-[120px] p-4 rounded-2xl',
        'border-2 transition-all duration-200',
        'flex flex-col items-center justify-center gap-3',
        'active:scale-95 relative',
        selected
          ? 'border-primary bg-primary/5 shadow-lg'
          : 'border-gray-200 bg-white',
        'hover:border-gray-300'
      )}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <span className="text-4xl">{icon}</span>
      <span className="text-sm font-medium text-center leading-tight">
        {label}
      </span>
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2"
        >
          <CheckCircle className="h-5 w-5 text-primary" />
        </motion.div>
      )}
    </button>
  );
}
