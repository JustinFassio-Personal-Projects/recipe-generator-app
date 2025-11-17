import {
  parseIngredientText,
  type ParsedIngredient,
} from '@/lib/groceries/ingredient-parser';
import { normalizeAccentedCharacters } from './text-normalization';

export type IngredientMention = {
  ingredientText: string; // Original ingredient from recipe list
  parsed: ParsedIngredient; // Parsed amount/unit/name
  mentionInStep: string; // How it appears in the instruction
};

/**
 * Normalizes ingredient name for matching (similar to IngredientMatcher)
 */
function normalizeIngredientName(ingredient: string): string {
  const lowered = ingredient.toLowerCase();

  return normalizeAccentedCharacters(
    lowered
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .replace(
        /\b(fresh|dried|ground|whole|chopped|diced|sliced|minced|melted|softened|room temperature)\b/g,
        ''
      ) // Remove prep words
      .replace(
        /\b(cups?|cup|tbsp|tablespoons?|tsp|teaspoons?|oz|ounces?|lbs?|pounds?|grams?|g|ml|liters?)\b/g,
        ''
      ) // Remove measurements
      .replace(/\b(large|medium|small|extra|about|approximately)\b/g, '') // Remove size descriptors
      .replace(/\b(\d+(?:\.\d+)?)\b/g, '') // Remove numbers (including decimals)
      .replace(/\b(slices?|cloves?|pieces?|strips?|chunks?)\b/g, '') // Remove quantity words
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
  );
}

/**
 * Checks if an ingredient name is mentioned in instruction text
 * Uses word boundary matching to avoid false positives
 */
function isIngredientMentioned(
  normalizedIngredientName: string,
  instructionText: string
): { found: boolean; mention: string } {
  if (!normalizedIngredientName || normalizedIngredientName.length < 2) {
    return { found: false, mention: '' };
  }

  const normalizedInstruction = normalizeAccentedCharacters(
    instructionText.toLowerCase()
  );

  // Try exact match first (word boundary)
  const exactPattern = new RegExp(
    `\\b${normalizedIngredientName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
    'i'
  );
  if (exactPattern.test(normalizedInstruction)) {
    // Extract the actual mention from the instruction
    const match = normalizedInstruction.match(exactPattern);
    if (match) {
      // Find the original text around the match
      const matchIndex = normalizedInstruction.indexOf(match[0]);
      const words = instructionText.split(/\s+/);
      let charIndex = 0;
      for (let i = 0; i < words.length; i++) {
        const wordStart = charIndex;
        const wordEnd = charIndex + words[i].length;
        if (matchIndex >= wordStart && matchIndex < wordEnd) {
          return {
            found: true,
            mention: words[i] || normalizedIngredientName,
          };
        }
        charIndex = wordEnd + 1; // +1 for space
      }
    }
    return { found: true, mention: normalizedIngredientName };
  }

  // Try partial match (ingredient name contains key words from instruction)
  const ingredientWords = normalizedIngredientName
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (ingredientWords.length === 0) {
    return { found: false, mention: '' };
  }

  // Check if all significant words from ingredient are in instruction
  const allWordsMatch = ingredientWords.every((word) =>
    normalizedInstruction.includes(word)
  );

  if (allWordsMatch) {
    // Find the longest matching phrase
    let bestMatch = '';
    for (let i = ingredientWords.length; i > 0; i--) {
      const phrase = ingredientWords.slice(0, i).join(' ');
      if (normalizedInstruction.includes(phrase)) {
        bestMatch = phrase;
        break;
      }
    }
    return { found: true, mention: bestMatch || normalizedIngredientName };
  }

  return { found: false, mention: '' };
}

/**
 * Detects which ingredients from the recipe are mentioned in an instruction step
 * Returns array of matched ingredients with their parsed amounts
 */
export function detectIngredientMentions(
  instructionText: string,
  ingredients: string[]
): IngredientMention[] {
  if (!instructionText || !ingredients || ingredients.length === 0) {
    return [];
  }

  const mentions: IngredientMention[] = [];
  const seenIngredients = new Set<string>(); // Avoid duplicates

  // Pre-parse all ingredients for performance
  const parsedIngredients = ingredients.map((ing) => ({
    original: ing,
    parsed: parseIngredientText(ing),
    normalized: normalizeIngredientName(parseIngredientText(ing).name),
  }));

  // Check each ingredient
  for (const { original, parsed, normalized } of parsedIngredients) {
    // Skip if we've already found this ingredient
    if (seenIngredients.has(normalized)) {
      continue;
    }

    const match = isIngredientMentioned(normalized, instructionText);

    if (match.found) {
      seenIngredients.add(normalized);
      mentions.push({
        ingredientText: original,
        parsed,
        mentionInStep: match.mention,
      });
    }
  }

  return mentions;
}
