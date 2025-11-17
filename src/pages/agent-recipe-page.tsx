import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ChatKit, useChatKit } from '@openai/chatkit-react';
import { RecipeForm } from '@/components/recipes/recipe-form';
import { Button } from '@/components/ui/button';
import { WelcomeDialog } from '@/components/welcome/WelcomeDialog';
import { ChatInstructionsModal } from '@/components/welcome/ChatInstructionsModal';
import { AgentRecipeWelcome } from '@/components/welcome/AgentRecipeWelcome';
import { PremiumFeatureGuard } from '@/components/subscription/PremiumFeatureGuard';
import { useAuth } from '@/contexts/AuthProvider';
import type { RecipeFormData } from '@/lib/schemas';

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
  const [chatKitError, setChatKitError] = useState<string | null>(null);
  const [chatKitLoading, setChatKitLoading] = useState(false);
  const [chatKitInitialized, setChatKitInitialized] = useState(false);

  const handleAgentSelected = (agentId: string) => {
    console.log('[AgentRecipePage] Agent selected:', agentId);
    setSelectedAgent(agentId);
    setChatKitError(null); // Clear any previous errors
    setChatKitLoading(false);
    setChatKitInitialized(false);
    const agent = AGENT_WORKFLOWS[agentId];
    if (agent) {
      console.log('[AgentRecipePage] Setting workflow ID:', agent.workflowId);
      setWorkflowId(agent.workflowId);
    } else {
      console.error('[AgentRecipePage] Agent not found:', agentId);
      setChatKitError(`Agent "${agentId}" not found`);
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

  // ChatKit integration - must be called unconditionally (React hooks rule)
  // The getClientSecret will only be called when ChatKit actually needs it
  const { control } = useChatKit({
    api: {
      async getClientSecret(existing) {
        // Get the current workflowId value (captured in closure)
        const currentWorkflowId = workflowId;

        console.log('[ChatKit] getClientSecret called:', {
          hasExistingSecret: !!existing,
          workflowId: currentWorkflowId,
          userId: user?.id,
        });

        if (!currentWorkflowId) {
          const errorMsg =
            'No workflow selected. Please select an agent first.';
          console.error('[ChatKit] getClientSecret called without workflowId');
          setChatKitError(errorMsg);
          setChatKitLoading(false);
          throw new Error(errorMsg);
        }

        try {
          setChatKitLoading(true);
          setChatKitError(null);

          if (existing) {
            // Refresh existing session
            console.log(
              '[ChatKit] Refreshing existing session for workflow:',
              currentWorkflowId
            );
            const res = await fetch('/api/ai/chatkit-session', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: user?.id,
                existingClientSecret: existing,
                workflowId: currentWorkflowId,
              }),
            });
            if (!res.ok) {
              const error = await res
                .json()
                .catch(() => ({ error: 'Unknown error' }));
              const errorMsg = error.error || 'Failed to refresh session';
              console.error('[ChatKit] Session refresh error:', errorMsg, {
                status: res.status,
                statusText: res.statusText,
              });
              setChatKitError(errorMsg);
              setChatKitLoading(false);
              throw new Error(errorMsg);
            }
            const { client_secret } = await res.json();
            console.log('[ChatKit] Session refreshed successfully');
            setChatKitLoading(false);
            setChatKitInitialized(true);
            return client_secret;
          }

          // Create new session
          console.log(
            '[ChatKit] Creating new session for workflow:',
            currentWorkflowId
          );
          const res = await fetch('/api/ai/chatkit-session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user?.id,
              workflowId: currentWorkflowId,
            }),
          });
          if (!res.ok) {
            const error = await res
              .json()
              .catch(() => ({ error: 'Unknown error' }));
            const errorMsg = error.error || 'Failed to create session';
            console.error('[ChatKit] Session creation error:', errorMsg, {
              status: res.status,
              statusText: res.statusText,
            });
            setChatKitError(errorMsg);
            setChatKitLoading(false);
            throw new Error(errorMsg);
          }
          const { client_secret } = await res.json();
          console.log('[ChatKit] Session created successfully');
          setChatKitLoading(false);
          setChatKitInitialized(true);
          return client_secret;
        } catch (error) {
          console.error('[ChatKit] Session error:', error);
          const errorMsg =
            error instanceof Error ? error.message : 'Unknown error';
          setChatKitError(errorMsg);
          setChatKitLoading(false);
          setChatKitInitialized(false);
          throw error;
        }
      },
    },
  });

  // Track ChatKit initialization
  useEffect(() => {
    if (chatKitInitialized && workflowId) {
      console.log('[AgentRecipePage] ChatKit initialized successfully:', {
        workflowId,
        agent: selectedAgent,
        agentName: AGENT_WORKFLOWS[selectedAgent || '']?.name,
      });
    }
  }, [chatKitInitialized, workflowId, selectedAgent]);

  // Listen for recipe generation from ChatKit
  // Note: You may need to add event listeners or use ChatKit's action system
  // to extract recipes from the conversation
  useEffect(() => {
    // TODO: Implement recipe extraction from ChatKit conversation
    // This might require using ChatKit's action system or parsing messages
    // You can listen to ChatKit events or parse the conversation history
  }, [control]);

  // TODO: Implement recipe extraction from ChatKit conversation
  // This function will be used when recipe extraction is implemented
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleRecipeGenerated = (recipe: RecipeFormData) => {
    setGeneratedRecipe(recipe);
    setShowEditor(true);
  };

  const handleRecipeSaved = () => {
    navigate('/');
  };

  const handleBackToChat = () => {
    setShowEditor(false);
    setGeneratedRecipe(null);
  };

  const agentName = selectedAgent
    ? AGENT_WORKFLOWS[selectedAgent]?.name || 'Your Agent'
    : 'Your Agent';

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
              <div className="p-6">
                {chatKitError ? (
                  <div className="flex h-[600px] items-center justify-center rounded-lg border-2 border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
                    <div className="text-center max-w-md px-4">
                      <p className="text-lg font-semibold text-red-800 dark:text-red-200">
                        ChatKit Error
                      </p>
                      <p className="mt-2 text-sm text-red-600 dark:text-red-300">
                        {chatKitError}
                      </p>
                      <div className="mt-4 flex gap-2 justify-center">
                        <Button
                          onClick={() => {
                            setChatKitError(null);
                            setChatKitLoading(false);
                            setChatKitInitialized(false);
                            // Force remount by clearing and resetting workflow
                            setWorkflowId(null);
                            setTimeout(() => {
                              setWorkflowId(
                                AGENT_WORKFLOWS[selectedAgent]?.workflowId ||
                                  null
                              );
                            }, 100);
                          }}
                          variant="outline"
                        >
                          Retry Connection
                        </Button>
                        <Button
                          onClick={() => {
                            setChatKitError(null);
                            setSelectedAgent(null);
                            setWorkflowId(null);
                            setChatKitLoading(false);
                            setChatKitInitialized(false);
                          }}
                          variant="ghost"
                        >
                          Select Different Agent
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : chatKitLoading ? (
                  <div className="flex h-[600px] items-center justify-center rounded-lg border-2 border-base-300 bg-base-50 dark:bg-base-800">
                    <div className="text-center">
                      <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
                      <p className="text-base-content/70">
                        Initializing ChatKit session...
                      </p>
                      <p className="text-sm text-base-content/50 mt-2">
                        Connecting to{' '}
                        {AGENT_WORKFLOWS[selectedAgent]?.name || 'AI Agent'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <ChatKit
                    key={workflowId} // Force remount when workflow changes
                    control={control}
                    className="h-[600px] w-full"
                  />
                )}
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
