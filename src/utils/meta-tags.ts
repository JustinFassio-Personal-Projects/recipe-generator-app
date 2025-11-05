/**
 * Utility functions for generating Open Graph and Twitter Card meta tags
 * for recipe sharing on social media platforms
 */

export interface RecipeMetaTags {
  title: string;
  description: string;
  image?: string | null;
  url: string;
  siteName?: string;
  type?: string;
}

/**
 * Generate Open Graph meta tags for a recipe
 */
export function generateOpenGraphTags(
  recipe: RecipeMetaTags
): Record<string, string> {
  const tags: Record<string, string> = {
    'og:title': recipe.title,
    'og:description':
      recipe.description || 'Delicious recipe from Recipe Generator',
    'og:url': recipe.url,
    'og:type': recipe.type || 'article',
    'og:site_name': recipe.siteName || 'Recipe Generator',
  };

  // Add image if available
  if (recipe.image) {
    tags['og:image'] = recipe.image;
    tags['og:image:alt'] = recipe.title;
    tags['og:image:width'] = '1200';
    tags['og:image:height'] = '630';
  }

  return tags;
}

/**
 * Generate Twitter Card meta tags for a recipe
 */
export function generateTwitterCardTags(
  recipe: RecipeMetaTags
): Record<string, string> {
  const tags: Record<string, string> = {
    'twitter:card': recipe.image ? 'summary_large_image' : 'summary',
    'twitter:title': recipe.title,
    'twitter:description':
      recipe.description || 'Delicious recipe from Recipe Generator',
  };

  // Add image if available
  if (recipe.image) {
    tags['twitter:image'] = recipe.image;
    tags['twitter:image:alt'] = recipe.title;
  }

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
