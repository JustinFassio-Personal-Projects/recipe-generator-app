# Agent Builder Setup for AI Agentic Chef

This document describes how to **optionally** configure the OpenAI Agent Builder workflow with a `save_recipe` client tool for automatic recipe extraction.

## Overview

**Two methods for recipe extraction:**

### Method 1: Manual (Works out of the box)

- User clicks "Save Recipe" button
- User copies recipe from chat and pastes into dialog
- `parseRecipeFromText` extracts structured data
- ✅ **No Agent Builder configuration needed**

### Method 2: Automatic (Optional, requires setup)

- Recipe Agent calls a **client tool** (`save_recipe`) with structured data
- ChatKit delivers it to the browser via `onClientTool`
- Recipe is automatically loaded into the editor
- ⚙️ **Requires Agent Builder configuration** (instructions below)

## Step 1: Add Client Tool in Agent Builder

1. **Open the BBQ Pit Master workflow** in OpenAI Agent Builder
   - Workflow ID: `wf_6918be4c124881909eef316b88fc1e46089901a8738709d8`

2. **Navigate to the Recipe Agent** within the workflow

3. **Add a new Tool**:
   - **Type**: Client tool (not HTTP, not MCP)
   - **Name**: `save_recipe` (exact string - used in React code)
   - **Description**: "Saves a complete recipe with all details including title, description, ingredients, instructions, and metadata."

4. **Define the tool's parameters schema**:

```json
{
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "description": "The recipe title"
    },
    "description": {
      "type": "string",
      "description": "A rich, appetizing description of the dish"
    },
    "ingredients": {
      "type": "array",
      "items": { "type": "string" },
      "description": "List of ingredients with quantities"
    },
    "instructions": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Step-by-step cooking instructions"
    },
    "notes": {
      "type": "string",
      "description": "Additional cooking tips, substitutions, or notes"
    },
    "image_url": {
      "type": ["string", "null"],
      "description": "Optional image URL for the recipe"
    },
    "categories": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Recipe categories (e.g., 'Main Course', 'BBQ', 'American')"
    },
    "setup": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Setup information (prep time, cook time, equipment, etc.)"
    },
    "cooking_time": {
      "type": ["string", "null"],
      "description": "Total cooking time in readable format (e.g., '2 hours')"
    },
    "difficulty": {
      "type": ["string", "null"],
      "description": "Difficulty level (e.g., 'Easy', 'Medium', 'Hard')"
    }
  },
  "required": [
    "title",
    "description",
    "ingredients",
    "instructions",
    "notes",
    "image_url",
    "categories",
    "setup",
    "cooking_time",
    "difficulty"
  ],
  "additionalProperties": false
}
```

## Step 2: Update Agent Instructions

Update the **Recipe Agent's instructions** to tell it when and how to call the tool:

```
When the user asks to save a recipe, or when you finish creating a complete recipe and they confirm they're ready, call the `save_recipe` client tool with a JSON object containing the full recipe details using the exact schema provided.

Include:
- title: A clear, descriptive recipe name
- description: An appetizing description highlighting flavors and textures
- ingredients: Complete list with quantities (e.g., "2 lbs pork shoulder")
- instructions: Step-by-step numbered instructions
- notes: BBQ tips, wood recommendations, timing notes
- categories: Appropriate categories (e.g., ["Main Course", "BBQ", "American"])
- setup: ["Prep time: X minutes", "Cook time: X hours", "Temperature: X°F", "Wood type: X"]
- cooking_time: Total time in readable format (e.g., "6 hours")
- difficulty: "Easy", "Medium", or "Hard"

After calling the tool, tell the user: "Perfect! I've sent this recipe to your Recipe Box for review. You can now save it to your collection."
```

## Step 3: Publish the Workflow

After adding the tool and updating instructions:

1. **Test the tool** in Agent Builder's test interface
2. **Publish the updated workflow**
3. **Note the workflow ID** (should remain the same)

## Frontend Integration

The frontend is already configured to handle the `save_recipe` client tool:

### Type Definitions (`src/lib/types-agent.ts`)

```typescript
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

export type ClientToolCall = {
  name: 'save_recipe';
  params: AgentRecipe;
};
```

### Adapter (`src/lib/recipe-from-agent.ts`)

Converts `AgentRecipe` → `RecipeFormData` for our recipe editor.

### ChatKit Integration (`src/pages/agent-recipe-page.tsx`)

The `onClientTool` handler:

1. Receives the tool call from the agent
2. Converts to `RecipeFormData`
3. Shows the recipe in the editor
4. Displays success toast
5. Returns `{ saved: true }` to the agent

## Testing the Integration

1. **Navigate to** `/agent-recipe`
2. **Select** "American BBQ Pitmaster"
3. **Chat with the agent** about a recipe
4. **Say** "save this recipe" or "I'm ready to save"
5. **Verify**:
   - Agent calls `save_recipe` tool
   - Console logs: `[ChatKit] Client tool called: { name: 'save_recipe', params: {...} }`
   - Recipe editor opens automatically
   - All fields are populated
   - Success toast appears

## Troubleshooting

### Agent doesn't call the tool

- Check Agent Builder instructions include tool usage
- Verify tool is published in the workflow
- Try explicit phrases: "save this recipe"

### `onClientTool` not firing

- Check browser console for errors
- Verify workflow ID matches in code
- Ensure ChatKit session is active

### Type mismatches

- Check tool schema matches `AgentRecipe` type
- Verify all required fields are present
- Log `toolCall` to inspect actual shape

## Adding More Agents

To add another agent (e.g., "Italian Chef"):

1. **Create workflow** in Agent Builder with `save_recipe` tool
2. **Note the workflow ID**
3. **Add to `AGENT_WORKFLOWS`** in `agent-recipe-page.tsx`:

```typescript
const AGENT_WORKFLOWS = {
  'bbq-pit-master': {
    workflowId: 'wf_...',
    name: 'American BBQ Pitmaster',
  },
  'italian-chef': {
    workflowId: 'wf_new_workflow_id',
    name: 'Italian Master Chef',
  },
};
```

The same `onClientTool` handler will work for all agents using the `save_recipe` tool.
