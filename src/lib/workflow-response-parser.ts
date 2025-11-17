/**
 * Workflow Response Parser
 *
 * Utilities for extracting messages and structured data from OpenAI
 * Agent Builder workflow responses.
 *
 * Note: The exact structure may need to be adjusted after inspecting
 * the first real workflow response.
 */

/**
 * Extracts the assistant message text from a workflow response
 *
 * @param response - The full workflow response from OpenAI
 * @returns The assistant message text, or a fallback string
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractAssistantMessageFromWorkflow(response: any): string {
  try {
    // Try multiple possible response structures

    // Structure 1: response.output[].content[].text
    if (response?.output && Array.isArray(response.output)) {
      for (const outputItem of response.output) {
        if (outputItem?.content && Array.isArray(outputItem.content)) {
          for (const contentItem of outputItem.content) {
            if (contentItem?.type === 'output_text' && contentItem?.text) {
              return contentItem.text;
            }
            if (contentItem?.type === 'text' && contentItem?.text) {
              return contentItem.text;
            }
            if (typeof contentItem === 'string') {
              return contentItem;
            }
          }
        }
        if (typeof outputItem === 'string') {
          return outputItem;
        }
        if (outputItem?.message) {
          return outputItem.message;
        }
        if (outputItem?.text) {
          return outputItem.text;
        }
      }
    }

    // Structure 2: response.message or response.text
    if (response?.message) {
      return String(response.message);
    }
    if (response?.text) {
      return String(response.text);
    }

    // Structure 3: response.data or response.result
    if (response?.data?.message) {
      return String(response.data.message);
    }
    if (response?.result?.message) {
      return String(response.result.message);
    }

    // Structure 4: Nested structure with messages array
    if (response?.messages && Array.isArray(response.messages)) {
      const assistantMessage = response.messages.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (msg: any) => msg.role === 'assistant' || msg.role === 'assistant'
      );
      if (assistantMessage?.content) {
        return String(assistantMessage.content);
      }
    }

    // Fallback: Log the structure and return JSON string
    console.warn('[Workflow Parser] Unknown response structure:', response);
    return JSON.stringify(response);
  } catch (error) {
    console.error('[Workflow Parser] Error extracting message:', error);
    return 'Error processing workflow response';
  }
}

/**
 * Extracts structured recipe JSON from a workflow response
 *
 * @param response - The full workflow response from OpenAI
 * @returns The recipe JSON object, or null if not found
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractRecipeJsonFromWorkflow(response: any): any | null {
  try {
    // Try multiple possible response structures

    // Structure 1: response.output[].content[] with type === 'output_json'
    if (response?.output && Array.isArray(response.output)) {
      for (const outputItem of response.output) {
        if (outputItem?.content && Array.isArray(outputItem.content)) {
          for (const contentItem of outputItem.content) {
            if (contentItem?.type === 'output_json' && contentItem?.parsed) {
              return contentItem.parsed;
            }
            if (contentItem?.type === 'json' && contentItem?.data) {
              return contentItem.data;
            }
          }
        }
        if (outputItem?.recipe) {
          return outputItem.recipe;
        }
        if (outputItem?.parsed && typeof outputItem.parsed === 'object') {
          return outputItem.parsed;
        }
      }
    }

    // Structure 2: Top-level recipe or parsed fields
    if (response?.recipe) {
      return response.recipe;
    }
    if (response?.parsed && typeof response.parsed === 'object') {
      return response.parsed;
    }
    if (response?.structured_recipe) {
      return response.structured_recipe;
    }

    // Structure 3: Nested in data or result
    if (response?.data?.recipe) {
      return response.data.recipe;
    }
    if (response?.result?.recipe) {
      return response.result.recipe;
    }

    // Structure 4: Try to parse JSON from text content
    const messageText = extractAssistantMessageFromWorkflow(response);
    if (messageText) {
      // Try to find JSON in markdown code blocks
      const jsonMatch = messageText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1]);
        } catch {
          // Continue to try other methods
        }
      }

      // Try to find JSON object directly
      const jsonObjectMatch = messageText.match(/\{[\s\S]*\}/);
      if (jsonObjectMatch) {
        try {
          return JSON.parse(jsonObjectMatch[0]);
        } catch {
          // Continue
        }
      }
    }

    // Not found
    return null;
  } catch (error) {
    console.error('[Workflow Parser] Error extracting recipe JSON:', error);
    return null;
  }
}

/**
 * Checks if a workflow response contains a structured recipe
 *
 * @param response - The full workflow response from OpenAI
 * @returns true if a structured recipe was found
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function hasStructuredRecipe(response: any): boolean {
  return extractRecipeJsonFromWorkflow(response) !== null;
}
