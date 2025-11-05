import { useMemo } from 'react';
import type { Recipe } from '@/lib/types';
import {
  generateRecipeMetaTags,
  buildRecipeUrl,
  truncateDescription,
} from '@/utils/meta-tags';

interface UseMetaTagsOptions {
  recipe: Recipe;
  shared?: boolean;
  ref?: string;
}

/**
 * Hook to generate meta tags for recipe pages
 * Handles Open Graph and Twitter Card tags for social media sharing
 * Returns meta tags object to be used with Helmet component
 */
export function useMetaTags({ recipe, shared, ref }: UseMetaTagsOptions) {
  const metaTags = useMemo(() => {
    const description = recipe.description
      ? truncateDescription(recipe.description, 160)
      : `${recipe.title} - A delicious recipe with ${recipe.ingredients.length} ingredients`;

    return generateRecipeMetaTags({
      title: recipe.title,
      description,
      image: recipe.image_url,
      url: buildRecipeUrl(recipe.id, { shared, ref }),
      siteName: 'Recipe Generator',
      type: 'article',
    });
  }, [recipe, shared, ref]);

  return metaTags;
}
