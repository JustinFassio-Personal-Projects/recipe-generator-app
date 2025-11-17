/**
 * Adapter to convert AgentRecipe (from Agent Builder tool)
 * to RecipeFormData (our internal recipe format)
 */

import type { AgentRecipe } from './types-agent';
import type { RecipeFormData } from './schemas';

export function recipeFormFromAgent(agent: AgentRecipe): RecipeFormData {
  return {
    title: agent.title,
    description: agent.description ?? '',
    ingredients: agent.ingredients ?? [],
    instructions: agent.instructions ?? [],
    notes: agent.notes ?? '',
    image_url: agent.image_url ?? null,
    categories: agent.categories ?? [],
    setup: agent.setup ?? [],
  };
}
