/**
 * Agent Recipe Page
 *
 * This page integrates OpenAI's ChatKit for creating recipes using
 * Agent Builder workflows. It provides an AI-powered conversational
 * interface for recipe generation with specialized agents.
 *
 * Key Features:
 * - Agent selection (currently: BBQ Pitmaster)
 * - ChatKit integration with proper CSP configuration
 * - Automatic recipe extraction via client tools (onClientTool) - OPTIONAL
 * - Manual recipe extraction via copy-paste
 * - Comprehensive error handling for all failure modes
 *
 * Recipe Extraction Methods:
 *
 * Method 1 (Automatic - requires Agent Builder setup):
 * 1. Configure agent with "save_recipe" client tool (see AGENT_BUILDER_SETUP.md)
 * 2. Agent calls tool when recipe is ready
 * 3. onClientTool receives structured data
 * 4. Recipe auto-loads in editor
 *
 * Method 2 (Manual - works out of the box):
 * 1. User chats with agent about recipes
 * 2. User clicks "Save Recipe" button
 * 3. User copies recipe text from chat and pastes
 * 4. parseRecipeFromText extracts structured data
 * 5. Recipe loads in editor
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChefHat } from 'lucide-react';
import { ChatKit, useChatKit } from '@openai/chatkit-react';
import { RecipeForm } from '@/components/recipes/recipe-form';
import { Button } from '@/components/ui/button';
import { WelcomeDialog } from '@/components/welcome/WelcomeDialog';
import { ChatInstructionsModal } from '@/components/welcome/ChatInstructionsModal';
import { AgentRecipeWelcome } from '@/components/welcome/AgentRecipeWelcome';
import { PremiumFeatureGuard } from '@/components/subscription/PremiumFeatureGuard';
import { useAuth } from '@/contexts/AuthProvider';
import { toast } from 'sonner';
import type { RecipeFormData } from '@/lib/schemas';
import type { ClientToolCall } from '@/lib/types-agent';
import { recipeFormFromAgent } from '@/lib/recipe-from-agent';

// Map agent IDs to workflow IDs and names
const AGENT_WORKFLOWS: Record<string, { workflowId: string; name: string }> = {
  'bbq-pit-master': {
    workflowId: 'wf_6918be4c124881909eef316b88fc1e46089901a8738709d8',
    name: 'American BBQ Pitmaster',
  },
  // Add more agents here as you create them
};

// Delay to ensure WelcomeDialog fully closes before ChatInstructionsModal opens
const DIALOG_TRANSITION_DELAY = 300;

export function AgentRecipePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [generatedRecipe, setGeneratedRecipe] = useState<RecipeFormData | null>(
    null
  );
  const [showEditor, setShowEditor] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [showAgentDialog, setShowAgentDialog] = useState(false);

  // Calculate agentName early so it can be used in useChatKit
  const agentName = selectedAgent
    ? AGENT_WORKFLOWS[selectedAgent]?.name || 'Your Agent'
    : 'Your Agent';

  const handleAgentSelected = (agentId: string) => {
    console.log('[AgentRecipePage] Agent selected:', agentId);
    setSelectedAgent(agentId);
    const agent = AGENT_WORKFLOWS[agentId];
    if (agent) {
      console.log('[AgentRecipePage] Setting workflow ID:', agent.workflowId);
      setWorkflowId(agent.workflowId);
    } else {
      console.error('[AgentRecipePage] Agent not found:', agentId);
    }
  };

  // Show ChatInstructionsModal after agent is selected (with delay to prevent dialog conflicts)
  useEffect(() => {
    const hasHiddenInstructions =
      localStorage.getItem('hideChatInstructionsModal') === 'true';
    if (!hasHiddenInstructions && selectedAgent) {
      // Add a small delay to ensure WelcomeDialog has fully closed
      // before ChatInstructionsModal attempts to open, preventing conflicts
      const timer = setTimeout(() => {
        setShowInstructions(true);
      }, DIALOG_TRANSITION_DELAY);
      return () => clearTimeout(timer);
    }
  }, [selectedAgent]); // Re-run when selectedAgent changes

  // ChatKit integration with automatic recipe extraction
  const { control } = useChatKit({
    api: {
      async getClientSecret() {
        console.log(
          '[ChatKit] getClientSecret called for workflow:',
          workflowId
        );

        if (!workflowId) {
          throw new Error('No workflow selected');
        }

        const res = await fetch('/api/ai/chatkit-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.id || 'anonymous',
            workflowId,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.client_secret) {
          console.error('[ChatKit] failed to get client_secret', data);
          throw new Error(data.error ?? 'Failed to get client secret');
        }

        console.log('[ChatKit] got client_secret successfully');
        return data.client_secret;
      },
    },
    // Handle client tool calls from the agent
    onClientTool: async (toolCall) => {
      console.log('[ChatKit] Client tool called:', toolCall);

      const { name, params } = toolCall as unknown as ClientToolCall;

      switch (name) {
        case 'save_recipe': {
          try {
            console.log('[ChatKit] Converting agent recipe to form data');
            const formRecipe = recipeFormFromAgent(params);

            // Show the recipe in the editor
            setGeneratedRecipe(formRecipe);
            setShowEditor(true);

            toast.success('Recipe Received!', {
              description: `${formRecipe.title} is ready for review.`,
            });

            // Return success to the agent
            return { saved: true };
          } catch (error) {
            console.error('[ChatKit] Failed to process recipe:', error);
            toast.error('Recipe Processing Error', {
              description: 'Failed to process the recipe. Please try again.',
            });
            throw error;
          }
        }
        default:
          console.warn('[ChatKit] Unhandled client tool:', name, params);
          throw new Error(`Unhandled client tool: ${name}`);
      }
    },
  });

  // State for manual recipe extraction
  const [isExtracting, setIsExtracting] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualRecipeText, setManualRecipeText] = useState('');

  // Extract recipe from manually provided text
  const parseManualRecipe = useCallback(async (recipeText: string) => {
    if (!recipeText.trim()) {
      toast.error('Please provide recipe text to parse');
      return;
    }

    setIsExtracting(true);

    try {
      console.log(
        '[AgentRecipePage] Parsing manual recipe text:',
        recipeText.substring(0, 200)
      );

      // Import and use the recipe parser
      const { parseRecipeFromText } = await import('@/lib/recipe-parser');
      const parsedRecipe = await parseRecipeFromText(recipeText);

      if (!parsedRecipe || !parsedRecipe.title) {
        toast.error(
          'Could not parse recipe from the provided text. Please ensure it contains a complete recipe with ingredients and instructions.'
        );
        return;
      }

      console.log(
        '[AgentRecipePage] Recipe parsed successfully:',
        parsedRecipe.title
      );

      // Convert to RecipeFormData format
      const recipeData: RecipeFormData = {
        title: parsedRecipe.title,
        description: parsedRecipe.description || '',
        ingredients:
          parsedRecipe.ingredients?.map((ing: string | { item: string }) =>
            typeof ing === 'string' ? ing : ing.item
          ) || [],
        instructions: parsedRecipe.instructions || [],
        categories: parsedRecipe.categories || [],
        image_url: '',
        notes: parsedRecipe.notes || '',
        setup: [],
      };

      setGeneratedRecipe(recipeData);
      setShowEditor(true);
      setShowManualInput(false);
      setManualRecipeText('');
      toast.success('Recipe extracted! Review and save it below.');
    } catch (error) {
      console.error('[AgentRecipePage] Recipe parsing error:', error);
      toast.error(
        error instanceof Error
          ? `Failed to parse recipe: ${error.message}`
          : 'Failed to parse recipe from text'
      );
    } finally {
      setIsExtracting(false);
    }
  }, []);

  // Show manual input dialog for recipe extraction
  const extractRecipeFromChat = useCallback(() => {
    setShowManualInput(true);
    toast.info('Copy the recipe from the chat and paste it below', {
      duration: 4000,
    });
  }, []);

  const handleRecipeSaved = () => {
    navigate('/');
  };

  const handleBackToChat = () => {
    setShowEditor(false);
    setGeneratedRecipe(null);
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Recipes
          </Button>

          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <h1 className="mb-2 text-2xl font-bold text-base-content sm:text-3xl">
                {showEditor ? 'Review & Edit Recipe' : 'AI Agentic Chef'}
              </h1>
              <p className="text-sm text-base-content/70 sm:text-base">
                {showEditor
                  ? 'Review and customize your AI-generated recipe before saving'
                  : 'Choose your AI agent and create exceptional recipes powered by OpenAI Agent Builder workflows'}
              </p>
            </div>

            {showEditor && (
              <Button
                variant="outline"
                className="btn-outline"
                onClick={handleBackToChat}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Chat
              </Button>
            )}
          </div>
        </div>

        {/* Premium Feature Guard - wraps AI chat functionality */}
        <PremiumFeatureGuard feature="AI recipe generation">
          {/* Agent Selection Welcome Dialog */}
          <WelcomeDialog
            context="agent-recipe"
            onChefSelected={handleAgentSelected}
          />

          {/* Manual trigger button if no agent selected */}
          {!selectedAgent && (
            <div className="bg-base-100 rounded-lg shadow-sm p-6">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold text-base-content">
                  Select an AI Agent
                </h3>
                <p className="text-sm text-base-content/70">
                  Choose an AI agent to start creating recipes with OpenAI Agent
                  Builder workflows
                </p>
                <Button
                  onClick={() => setShowAgentDialog(true)}
                  className="bg-orange-500 text-white hover:bg-orange-600"
                >
                  Choose Agent
                </Button>
              </div>
            </div>
          )}

          {/* Manual Agent Selection Dialog */}
          {showAgentDialog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="bg-base-100 rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto p-6">
                <AgentRecipeWelcome
                  onClose={() => setShowAgentDialog(false)}
                  onSelectAgent={(agentId) => {
                    handleAgentSelected(agentId);
                    setShowAgentDialog(false);
                  }}
                />
              </div>
            </div>
          )}

          {/* Manual Recipe Input Dialog */}
          {showManualInput && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-base-100 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-base-content">
                      Paste Recipe from Chat
                    </h3>
                    <button
                      onClick={() => {
                        setShowManualInput(false);
                        setManualRecipeText('');
                      }}
                      className="btn btn-sm btn-circle btn-ghost"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                        <strong>How to use:</strong>
                      </p>
                      <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                        <li>
                          Select and copy the recipe text from the chat above
                        </li>
                        <li>Paste it into the textarea below</li>
                        <li>Click "Parse Recipe" to extract the recipe data</li>
                      </ol>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-base-content mb-2">
                        Recipe Text
                      </label>
                      <textarea
                        value={manualRecipeText}
                        onChange={(e) => setManualRecipeText(e.target.value)}
                        placeholder="Paste the recipe from your conversation with the agent..."
                        className="textarea textarea-bordered w-full h-64 font-mono text-sm"
                        disabled={isExtracting}
                      />
                    </div>

                    <div className="flex gap-3 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowManualInput(false);
                          setManualRecipeText('');
                        }}
                        disabled={isExtracting}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => parseManualRecipe(manualRecipeText)}
                        disabled={isExtracting || !manualRecipeText.trim()}
                        className="bg-blue-500 text-white hover:bg-blue-600"
                      >
                        {isExtracting ? (
                          <>
                            <span className="loading loading-spinner loading-sm mr-2"></span>
                            Parsing...
                          </>
                        ) : (
                          'Parse Recipe'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chat Instructions Modal - shows after agent selection */}
          {selectedAgent && (
            <ChatInstructionsModal
              isOpen={showInstructions}
              onClose={() => setShowInstructions(false)}
              chefName={agentName}
            />
          )}

          {/* ChatKit component - only show when agent is selected */}
          {selectedAgent && workflowId && (
            <div
              className={`bg-base-100 rounded-lg shadow-sm ${showEditor ? 'hidden' : ''}`}
            >
              {/* Header with Save Recipe button */}
              <div className="flex items-center justify-between border-b border-base-300 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-orange-600 to-red-600">
                    <ChefHat className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base-content">
                      {agentName}
                    </h3>
                    <p className="text-sm text-base-content/60">
                      AI Recipe Agent
                    </p>
                  </div>
                </div>
                <Button
                  onClick={extractRecipeFromChat}
                  disabled={isExtracting}
                  className="bg-blue-500 text-white hover:bg-blue-600"
                >
                  {isExtracting ? (
                    <>
                      <span className="loading loading-spinner loading-sm mr-2"></span>
                      Extracting...
                    </>
                  ) : (
                    'Save Recipe'
                  )}
                </Button>
              </div>

              <div className="h-[600px] w-full border rounded-xl overflow-hidden">
                <ChatKit key={workflowId} control={control} />
              </div>
            </div>
          )}

          {/* Show RecipeForm when editor is active */}
          {showEditor && generatedRecipe && (
            <div className="bg-base-100 rounded-lg shadow-sm">
              <div className="p-6">
                <RecipeForm
                  initialData={generatedRecipe}
                  onSuccess={handleRecipeSaved}
                />
              </div>
            </div>
          )}
        </PremiumFeatureGuard>
      </div>
    </div>
  );
}
