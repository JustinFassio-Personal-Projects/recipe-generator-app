import { describe, it, expect } from 'vitest';
import { parseRecipeUnified } from '@/lib/recipe-parser-unified';

describe('Recipe Parser - Ingredient Amounts Preservation', () => {
  it('should preserve amounts and prep when parsing structured ingredient objects', async () => {
    const testRecipe = `\`\`\`json
{
  "title": "Test Recipe with Structured Ingredients",
  "description": "Testing ingredient amount preservation",
  "ingredients": [
    {
      "item": "onion",
      "amount": "2 cups",
      "prep": "chopped"
    },
    {
      "item": "garlic",
      "amount": "3 cloves",
      "prep": "minced"
    },
    {
      "item": "olive oil",
      "amount": "2 tablespoons"
    }
  ],
  "instructions": "1. Heat oil\\n2. Add onion and garlic\\n3. Cook until softened",
  "setup": ["Prep time: 10 minutes"],
  "categories": ["Test"],
  "notes": "Test notes"
}
\`\`\``;

    const result = await parseRecipeUnified(testRecipe);

    expect(result.success).toBe(true);
    expect(result.recipe).toBeDefined();

    if (result.recipe) {
      const ingredients = result.recipe.ingredients;

      // Verify all ingredients are present
      expect(ingredients).toHaveLength(3);

      // Verify first ingredient has amount AND prep
      expect(ingredients[0]).toContain('2 cups');
      expect(ingredients[0]).toContain('onion');
      expect(ingredients[0]).toContain('chopped');

      // Verify second ingredient has amount AND prep
      expect(ingredients[1]).toContain('3 cloves');
      expect(ingredients[1]).toContain('garlic');
      expect(ingredients[1]).toContain('minced');

      // Verify third ingredient has amount (no prep)
      expect(ingredients[2]).toContain('2 tablespoons');
      expect(ingredients[2]).toContain('olive oil');

      // Full string check to ensure proper concatenation
      expect(ingredients[0]).toBe('2 cups onion chopped');
      expect(ingredients[1]).toBe('3 cloves garlic minced');
      expect(ingredients[2]).toBe('2 tablespoons olive oil');
    }
  });

  it('should preserve amounts in plain text ingredients', async () => {
    const testRecipe = `\`\`\`json
{
  "title": "Test Recipe with String Ingredients",
  "description": "Testing string ingredient preservation",
  "ingredients": [
    "2 cups chopped onion",
    "3 cloves minced garlic",
    "2 tablespoons olive oil"
  ],
  "instructions": "Cook everything",
  "setup": [],
  "categories": [],
  "notes": ""
}
\`\`\``;

    const result = await parseRecipeUnified(testRecipe);

    expect(result.success).toBe(true);
    expect(result.recipe).toBeDefined();

    if (result.recipe) {
      const ingredients = result.recipe.ingredients;

      // Verify ingredients preserve full text
      expect(ingredients[0]).toBe('2 cups chopped onion');
      expect(ingredients[1]).toBe('3 cloves minced garlic');
      expect(ingredients[2]).toBe('2 tablespoons olive oil');
    }
  });

  it('should handle mixed ingredient formats', async () => {
    const testRecipe = `\`\`\`json
{
  "title": "Mixed Format Test",
  "description": "Testing mixed ingredient formats",
  "ingredients": [
    {
      "item": "flour",
      "amount": "2 cups"
    },
    "1 egg",
    {
      "item": "butter",
      "amount": "1/2 cup",
      "prep": "softened"
    }
  ],
  "instructions": "Mix and bake",
  "setup": [],
  "categories": [],
  "notes": ""
}
\`\`\``;

    const result = await parseRecipeUnified(testRecipe);

    expect(result.success).toBe(true);
    expect(result.recipe).toBeDefined();

    if (result.recipe) {
      const ingredients = result.recipe.ingredients;

      expect(ingredients[0]).toBe('2 cups flour');
      expect(ingredients[1]).toBe('1 egg');
      expect(ingredients[2]).toBe('1/2 cup butter softened');
    }
  });
});
