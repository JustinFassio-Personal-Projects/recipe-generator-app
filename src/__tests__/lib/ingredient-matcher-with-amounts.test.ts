import { describe, it, expect } from 'vitest';
import { IngredientMatcher } from '@/lib/groceries/ingredient-matcher';

describe('IngredientMatcher - Matching with Full Ingredient Text (including amounts)', () => {
  const mockGroceries = {
    Produce: ['onion', 'garlic', 'bell pepper', 'tomato'],
    Dairy: ['milk', 'cheese', 'butter'],
    Pantry: ['olive oil', 'flour', 'sugar'],
  };

  const matcher = new IngredientMatcher(mockGroceries);

  it('should match ingredients with amounts and prep instructions', () => {
    // Test with full ingredient text including amounts
    const match1 = matcher.matchIngredient('2 cups chopped onion');
    expect(match1.matchType).not.toBe('none');
    expect(match1.matchedGroceryIngredient).toBe('onion');
    expect(match1.confidence).toBeGreaterThan(0);

    const match2 = matcher.matchIngredient('3 cloves minced garlic');
    expect(match2.matchType).not.toBe('none');
    expect(match2.matchedGroceryIngredient).toBe('garlic');
    expect(match2.confidence).toBeGreaterThan(0);

    const match3 = matcher.matchIngredient('2 tablespoons olive oil');
    expect(match3.matchType).not.toBe('none');
    expect(match3.matchedGroceryIngredient).toBe('olive oil');
    expect(match3.confidence).toBeGreaterThan(0);
  });

  it('should match ingredients with complex amounts and fractions', () => {
    const match1 = matcher.matchIngredient('1/2 cup diced bell pepper');
    expect(match1.matchType).not.toBe('none');
    expect(match1.matchedGroceryIngredient).toBe('bell pepper');

    const match2 = matcher.matchIngredient('2-3 medium tomatoes, diced');
    expect(match2.matchType).not.toBe('none');
    expect(match2.matchedGroceryIngredient).toBe('tomato');
  });

  it('should match ingredients with various prep methods', () => {
    const match1 = matcher.matchIngredient('1 cup shredded cheese');
    expect(match1.matchType).not.toBe('none');
    expect(match1.matchedGroceryIngredient).toBe('cheese');

    const match2 = matcher.matchIngredient('2 tbsp melted butter');
    expect(match2.matchType).not.toBe('none');
    expect(match2.matchedGroceryIngredient).toBe('butter');

    const match3 = matcher.matchIngredient('1/4 cup sifted flour');
    expect(match3.matchType).not.toBe('none');
    expect(match3.matchedGroceryIngredient).toBe('flour');
  });

  it('should handle ingredients without amounts (backward compatibility)', () => {
    const match1 = matcher.matchIngredient('onion');
    expect(match1.matchType).not.toBe('none');
    expect(match1.matchedGroceryIngredient).toBe('onion');

    const match2 = matcher.matchIngredient('garlic');
    expect(match2.matchType).not.toBe('none');
    expect(match2.matchedGroceryIngredient).toBe('garlic');
  });

  it('should not match ingredients that are not in groceries', () => {
    const match1 = matcher.matchIngredient('2 cups quinoa');
    expect(match1.matchType).toBe('none');
    expect(match1.matchedGroceryIngredient).toBeUndefined();

    const match2 = matcher.matchIngredient('1 lb chicken breast');
    expect(match2.matchType).toBe('none');
  });

  it('should use hasIngredient() method with full text', () => {
    expect(matcher.hasIngredient('2 cups chopped onion')).toBe(true);
    expect(matcher.hasIngredient('3 cloves minced garlic')).toBe(true);
    expect(matcher.hasIngredient('2 tablespoons olive oil')).toBe(true);
    expect(matcher.hasIngredient('1 lb quinoa')).toBe(false);
    expect(matcher.hasIngredient('chicken breast')).toBe(false);
  });

  it('should handle structured ingredient format from AI responses', () => {
    // Simulating what happens after normalizeIngredients() concatenates object fields
    const match1 = matcher.matchIngredient('2 cups onion chopped');
    expect(match1.matchType).not.toBe('none');
    expect(match1.matchedGroceryIngredient).toBe('onion');

    const match2 = matcher.matchIngredient('3 cloves garlic minced');
    expect(match2.matchType).not.toBe('none');
    expect(match2.matchedGroceryIngredient).toBe('garlic');

    const match3 = matcher.matchIngredient('1/2 cup butter softened');
    expect(match3.matchType).not.toBe('none');
    expect(match3.matchedGroceryIngredient).toBe('butter');
  });
});
