export function generateRecipeDescription(
  title: string,
  ingredients: string[]
): string {
  const normalizedTitle =
    title && title.trim().length > 0 ? title.trim() : 'Recipe';

  const cleanIngredients = ingredients
    .map((item) => item?.toString().trim())
    .filter((item): item is string => Boolean(item && item.length > 0));

  if (cleanIngredients.length > 0) {
    const mainIngredients = cleanIngredients.slice(0, 3).join(', ');
    if (mainIngredients.length > 0) {
      return `A delicious ${normalizedTitle.toLowerCase()} featuring ${mainIngredients}.`;
    }
  }

  return `A flavorful ${normalizedTitle.toLowerCase()} recipe.`;
}
