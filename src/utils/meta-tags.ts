/**
 * Utility functions for generating Open Graph and Twitter Card meta tags
 * for recipe sharing on social media platforms
 */

// Default OG image when recipe doesn't have an image
const DEFAULT_OG_IMAGE = '/recipe-generator-logo.png';

export interface RecipeMetaTags {
  title: string;
  description: string;
  image?: string | null;
  url: string;
  siteName?: string;
  type?: string;
  ingredientsCount?: number;
  cookingTime?: number | string | null;
  difficulty?: string | null;
}

/**
 * Ensure an image URL is absolute for Open Graph meta tags
 * Social media crawlers require absolute URLs (with protocol and domain)
 */
function ensureAbsoluteImageUrl(imageUrl: string): string {
  // If already absolute (starts with http:// or https://), return as-is
  if (/^https?:\/\//i.test(imageUrl)) {
    return imageUrl;
  }

  // Convert relative URL to absolute using current origin
  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://recipegenerator.app';

  // Handle absolute paths (starting with /)
  if (imageUrl.startsWith('/')) {
    return `${baseUrl}${imageUrl}`;
  }

  // Handle relative paths
  return `${baseUrl}/${imageUrl}`;
}

/**
 * Generate Open Graph meta tags for a recipe
 */
export function generateOpenGraphTags(
  recipe: RecipeMetaTags
): Record<string, string> {
  // Enhance description with recipe metadata
  let enhancedDescription =
    recipe.description || 'Delicious recipe from Recipe Generator';

  if (recipe.ingredientsCount || recipe.cookingTime || recipe.difficulty) {
    const metadata = [];
    if (recipe.ingredientsCount) {
      metadata.push(`${recipe.ingredientsCount} ingredients`);
    }
    if (recipe.cookingTime) {
      const formattedCookingTime =
        typeof recipe.cookingTime === 'number'
          ? `${recipe.cookingTime} min`
          : recipe.cookingTime;
      metadata.push(formattedCookingTime);
    }
    if (recipe.difficulty) {
      metadata.push(`${recipe.difficulty} difficulty`);
    }
    enhancedDescription = `${metadata.join(' | ')} - ${enhancedDescription}`;
  }

  const tags: Record<string, string> = {
    'og:title': recipe.title,
    'og:description': enhancedDescription,
    'og:url': recipe.url,
    'og:type': recipe.type || 'article',
    'og:site_name': recipe.siteName || 'Recipe Generator',
    'og:locale': 'en_US',
  };

  // Use recipe image or fallback to default
  const imageUrl = recipe.image || DEFAULT_OG_IMAGE;
  const absoluteImageUrl = ensureAbsoluteImageUrl(imageUrl);

  tags['og:image'] = absoluteImageUrl;
  tags['og:image:secure_url'] = absoluteImageUrl.replace('http://', 'https://');
  tags['og:image:alt'] = recipe.title;
  tags['og:image:width'] = '1200';
  tags['og:image:height'] = '630';
  tags['og:image:type'] = 'image/png';

  return tags;
}

/**
 * Generate Twitter Card meta tags for a recipe
 */
export function generateTwitterCardTags(
  recipe: RecipeMetaTags
): Record<string, string> {
  // Enhance description with recipe metadata
  let enhancedDescription =
    recipe.description || 'Delicious recipe from Recipe Generator';

  if (recipe.ingredientsCount || recipe.cookingTime || recipe.difficulty) {
    const metadata = [];
    if (recipe.ingredientsCount) {
      metadata.push(`${recipe.ingredientsCount} ingredients`);
    }
    if (recipe.cookingTime) {
      const formattedCookingTime =
        typeof recipe.cookingTime === 'number'
          ? `${recipe.cookingTime} min`
          : recipe.cookingTime;
      metadata.push(formattedCookingTime);
    }
    if (recipe.difficulty) {
      metadata.push(`${recipe.difficulty} difficulty`);
    }
    enhancedDescription = `${metadata.join(' | ')} - ${enhancedDescription}`;
  }

  // Use recipe image or fallback to default
  const imageUrl = recipe.image || DEFAULT_OG_IMAGE;
  const absoluteImageUrl = ensureAbsoluteImageUrl(imageUrl);

  const tags: Record<string, string> = {
    'twitter:card': 'summary_large_image',
    'twitter:title': recipe.title,
    'twitter:description': enhancedDescription,
    'twitter:image': absoluteImageUrl,
    'twitter:image:alt': recipe.title,
    'twitter:site': '@RecipeGenerator', // Update with actual Twitter handle if available
  };

  return tags;
}

/**
 * Generate all meta tags for a recipe (Open Graph + Twitter Card)
 */
export function generateRecipeMetaTags(
  recipe: RecipeMetaTags
): Record<string, string> {
  return {
    ...generateOpenGraphTags(recipe),
    ...generateTwitterCardTags(recipe),
  };
}

/**
 * Build the canonical URL for a recipe
 */
export function buildRecipeUrl(
  recipeId: string,
  options?: {
    shared?: boolean;
    ref?: string;
  }
): string {
  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://recipegenerator.app';

  const url = new URL(`/view-recipe/${recipeId}`, baseUrl);

  if (options?.shared) {
    url.searchParams.set('shared', 'true');
  }

  if (options?.ref) {
    url.searchParams.set('ref', options.ref);
  }

  return url.toString();
}

/**
 * Truncate description to optimal length for social media
 */
export function truncateDescription(
  description: string,
  maxLength: number = 160
): string {
  if (description.length <= maxLength) {
    return description;
  }

  // Truncate at word boundary, accounting for 3-character ellipsis
  // Search within maxLength - 3 to ensure we never exceed maxLength
  const searchLength = maxLength - 3;
  const truncated = description.substring(0, searchLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > 0) {
    // Found word boundary - truncate there
    return truncated.substring(0, lastSpace) + '...';
  } else {
    // No word boundary found - hard truncate to ensure we never exceed maxLength
    return description.substring(0, maxLength - 3) + '...';
  }
}

/**
 * Generate Recipe Schema.org structured data (JSON-LD) for SEO
 */
export interface RecipeStructuredDataParams {
  name: string;
  description?: string;
  image?: string;
  ingredients: Array<string | { name?: string | null }>;
  instructions: string | string[];
  url: string;
  cookingTime?: number | string | null;
  prepTime?: number | string | null;
  totalTime?: number | string | null;
  recipeYield?: string;
  difficulty?: string | null;
  recipeCategory?: Array<string | null | undefined>;
  recipeCuisine?: string | null;
  authorName?: string | null;
  datePublished?: string | null;
}

export function generateRecipeStructuredData(
  recipe: RecipeStructuredDataParams
): Record<string, unknown> {
  const structuredData: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.name,
    description: recipe.description || `${recipe.name} - A delicious recipe`,
    url: recipe.url,
  };

  // Add image if available
  if (recipe.image) {
    structuredData.image = ensureAbsoluteImageUrl(recipe.image);
  }

  // Add ingredients
  if (recipe.ingredients && recipe.ingredients.length > 0) {
    const ingredientList = recipe.ingredients
      .map((ingredient) => {
        if (typeof ingredient === 'string') {
          return ingredient;
        }

        if (
          ingredient &&
          typeof ingredient === 'object' &&
          'name' in ingredient &&
          typeof ingredient.name === 'string'
        ) {
          return ingredient.name;
        }

        return '';
      })
      .filter(
        (item): item is string =>
          typeof item === 'string' && item.trim().length > 0
      );

    if (ingredientList.length > 0) {
      structuredData.recipeIngredient = ingredientList;
    }
  }

  // Add instructions
  const instructionArray = Array.isArray(recipe.instructions)
    ? recipe.instructions
    : (recipe.instructions
        ?.split(/\r?\n+/)
        .map((instruction) => instruction.trim())
        .filter((instruction) => instruction.length > 0) ?? []);

  if (instructionArray.length > 0) {
    structuredData.recipeInstructions = instructionArray.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      text: step,
    }));
  }

  // Add timing information
  const parseTimeToMinutes = (
    value?: number | string | null
  ): number | undefined => {
    if (value === null || value === undefined) {
      return undefined;
    }

    if (typeof value === 'number') {
      return Number.isFinite(value)
        ? Math.max(0, Math.round(value))
        : undefined;
    }

    if (typeof value === 'string') {
      const match = value.match(/(\d+)/);
      if (match) {
        const minutes = parseInt(match[1], 10);
        if (!Number.isNaN(minutes)) {
          return Math.max(0, minutes);
        }
      }
    }

    return undefined;
  };

  const toISO8601 = (minutes?: number): string | undefined => {
    if (minutes === undefined) {
      return undefined;
    }
    return `PT${minutes}M`;
  };

  const cookingMinutes = parseTimeToMinutes(recipe.cookingTime);
  const prepMinutes = parseTimeToMinutes(recipe.prepTime);
  const computedTotalMinutes =
    cookingMinutes !== undefined || prepMinutes !== undefined
      ? (cookingMinutes ?? 0) + (prepMinutes ?? 0)
      : undefined;

  const totalMinutes =
    parseTimeToMinutes(recipe.totalTime) ?? computedTotalMinutes;

  const cookTimeISO = toISO8601(cookingMinutes);
  const prepTimeISO = toISO8601(prepMinutes);
  const totalTimeISO = toISO8601(totalMinutes);

  if (cookTimeISO) {
    structuredData.cookTime = cookTimeISO;
  }
  if (prepTimeISO) {
    structuredData.prepTime = prepTimeISO;
  }
  if (totalTimeISO) {
    structuredData.totalTime = totalTimeISO;
  }

  // Add yield
  if (recipe.recipeYield) {
    structuredData.recipeYield = recipe.recipeYield;
  }

  // Add categories
  if (recipe.recipeCategory && recipe.recipeCategory.length > 0) {
    const categories = recipe.recipeCategory.filter(
      (category): category is string =>
        typeof category === 'string' && category.trim().length > 0
    );

    if (categories.length > 0) {
      structuredData.recipeCategory = categories;
    }
  }

  // Add cuisine
  if (recipe.recipeCuisine) {
    structuredData.recipeCuisine = recipe.recipeCuisine;
  }

  // Add author
  if (recipe.authorName) {
    structuredData.author = {
      '@type': 'Person',
      name: recipe.authorName,
    };
  }

  // Add publication date
  if (recipe.datePublished) {
    structuredData.datePublished = recipe.datePublished;
  }

  return structuredData;
}
