/**
 * Types for OpenAI Agent Builder tool responses
 * These match the schema defined in the Agent Builder workflow
 */

export type AgentRecipe = {
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  notes: string;
  image_url: string | null;
  categories: string[];
  setup: string[];
  cooking_time: string | null;
  difficulty: string | null;
};

/**
 * Client tool calls that can be triggered by the agent
 */
export type ClientToolCall = {
  name: 'save_recipe';
  params: AgentRecipe;
};
