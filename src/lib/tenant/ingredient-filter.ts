import { useTenant } from '@/contexts/TenantContext';

export function useTenantIngredientFilter() {
  const { tenant } = useTenant();

  const restrictedIngredients = tenant?.settings?.restricted_ingredients || [];

  const isIngredientAllowed = (ingredient: string): boolean => {
    if (restrictedIngredients.length === 0) return true;

    const normalizedIngredient = ingredient.toLowerCase().trim();

    return !restrictedIngredients.some((restricted) =>
      normalizedIngredient.includes(restricted.toLowerCase())
    );
  };

  const filterIngredients = (ingredients: string[]): string[] => {
    return ingredients.filter(isIngredientAllowed);
  };

  const getRestrictedMessage = (): string | null => {
    if (restrictedIngredients.length === 0) return null;

    return `Note: The following ingredients are restricted: ${restrictedIngredients.join(', ')}`;
  };

  return {
    restrictedIngredients,
    isIngredientAllowed,
    filterIngredients,
    getRestrictedMessage,
  };
}
