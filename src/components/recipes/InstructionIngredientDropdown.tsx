import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { IngredientMention } from '@/lib/utils/ingredient-mention-detector';

interface InstructionIngredientDropdownProps {
  ingredients: IngredientMention[];
}

/**
 * Formats an ingredient for display with quantity, unit, and name
 */
function formatIngredient(parsed: IngredientMention['parsed']): string {
  const parts: string[] = [];

  if (parsed.quantity) {
    parts.push(parsed.quantity);
  }

  if (parsed.unit) {
    parts.push(parsed.unit);
  }

  if (parsed.size) {
    parts.push(parsed.size);
  }

  if (parsed.name) {
    parts.push(parsed.name);
  }

  return parts.length > 0 ? parts.join(' ') : parsed.original;
}

export function InstructionIngredientDropdown({
  ingredients,
}: InstructionIngredientDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!ingredients || ingredients.length === 0) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-2">
      <CollapsibleTrigger
        className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-800 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 rounded px-1 py-0.5 -ml-1"
        aria-label={`Show ${ingredients.length} ingredient${ingredients.length !== 1 ? 's' : ''} used in this step`}
      >
        <ChevronDown
          className={`h-3 w-3 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
        <span className="font-medium">
          Show ingredients ({ingredients.length})
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 pl-4 border-l-2 border-base-300 overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
        <ul className="space-y-1.5 py-1">
          {ingredients.map((mention, index) => (
            <li
              key={index}
              className="text-xs text-gray-700 leading-relaxed flex items-start gap-1.5"
            >
              <span className="text-gray-400 mt-0.5">•</span>
              <span>{formatIngredient(mention.parsed)}</span>
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}
