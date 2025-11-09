import type { GlobalIngredient } from './enhanced-ingredient-matcher';

/**
 * Enriched user ingredient with metadata from global catalog
 */
export interface EnrichedUserIngredient {
  name: string; // Original user ingredient name
  category: string; // Category (from user data or matched global ingredient)
  subcategory: string | null; // Subcategory from global ingredient (or 'uncategorized')
  globalIngredient?: GlobalIngredient; // Full global ingredient data if matched
  isMatched: boolean; // Whether ingredient was found in global catalog
}

/**
 * Maximum allowed character length difference between user ingredient name and
 * global ingredient name for partial matching. Set to 10 to allow reasonable
 * variations (e.g., "tomatoes" vs "cherry tomatoes") while avoiding false
 * positives from completely different ingredients.
 */
const MAX_LENGTH_DIFF_FOR_PARTIAL_MATCH = 10;

/**
 * Normalizes an ingredient name for matching
 * Same logic as EnhancedIngredientMatcher
 * Exported for reuse across the application
 */
export function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Finds a global ingredient by matching the user ingredient name
 * Uses normalized name matching with synonyms support
 */
function findMatchingGlobalIngredient(
  userIngredientName: string,
  globalIngredients: GlobalIngredient[]
): GlobalIngredient | null {
  const normalizedUserName = normalizeIngredientName(userIngredientName);

  // First try exact normalized match
  for (const globalIng of globalIngredients) {
    if (globalIng.normalized_name === normalizedUserName) {
      return globalIng;
    }
  }

  // Then try synonym matching
  for (const globalIng of globalIngredients) {
    const normalizedSynonyms = globalIng.synonyms.map((s) =>
      normalizeIngredientName(s)
    );
    if (normalizedSynonyms.includes(normalizedUserName)) {
      return globalIng;
    }
  }

  // Try partial matching (user name contains global ingredient name or vice versa)
  for (const globalIng of globalIngredients) {
    const globalNorm = globalIng.normalized_name;
    if (
      normalizedUserName.includes(globalNorm) ||
      globalNorm.includes(normalizedUserName)
    ) {
      // Only match if the length difference isn't too great (avoid false positives)
      const lengthDiff = Math.abs(
        normalizedUserName.length - globalNorm.length
      );
      if (lengthDiff <= MAX_LENGTH_DIFF_FOR_PARTIAL_MATCH) {
        return globalIng;
      }
    }
  }

  return null;
}

/**
 * Enriches user ingredient names with metadata from global ingredients catalog
 *
 * @param userIngredientsByCategory - User's ingredients grouped by category: { category: [name1, name2] }
 * @param globalIngredients - Array of all global ingredients from catalog
 * @returns Array of enriched ingredients with subcategory information
 */
export function enrichUserIngredients(
  userIngredientsByCategory: Record<string, string[]>,
  globalIngredients: GlobalIngredient[]
): EnrichedUserIngredient[] {
  const enriched: EnrichedUserIngredient[] = [];

  // Process each category
  for (const [category, ingredientNames] of Object.entries(
    userIngredientsByCategory
  )) {
    // Skip if not an array
    if (!Array.isArray(ingredientNames)) continue;

    // Process each ingredient in the category
    for (const name of ingredientNames) {
      // Try to find matching global ingredient
      const matchedGlobal = findMatchingGlobalIngredient(
        name,
        globalIngredients
      );

      if (matchedGlobal) {
        // Matched - use global ingredient metadata
        enriched.push({
          name,
          category: matchedGlobal.category, // Use category from global ingredient
          subcategory: matchedGlobal.subcategory || 'uncategorized',
          globalIngredient: matchedGlobal,
          isMatched: true,
        });
      } else {
        // Not matched - use user's category, mark as uncategorized subcategory
        enriched.push({
          name,
          category, // Use user's original category
          subcategory: 'uncategorized',
          isMatched: false,
        });
      }
    }
  }

  return enriched;
}

/**
 * Groups enriched ingredients by category and subcategory
 * Structure: { category: { subcategory: [ingredient1, ingredient2, ...] } }
 */
export function groupEnrichedIngredients(
  enrichedIngredients: EnrichedUserIngredient[]
): Record<string, Record<string, EnrichedUserIngredient[]>> {
  const grouped: Record<string, Record<string, EnrichedUserIngredient[]>> = {};

  for (const ingredient of enrichedIngredients) {
    const { category, subcategory } = ingredient;
    const subcat = subcategory || 'uncategorized';

    if (!grouped[category]) {
      grouped[category] = {};
    }

    if (!grouped[category][subcat]) {
      grouped[category][subcat] = [];
    }

    grouped[category][subcat].push(ingredient);
  }

  return grouped;
}
