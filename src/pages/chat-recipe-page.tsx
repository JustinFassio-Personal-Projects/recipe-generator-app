import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { RecipeForm } from '@/components/recipes/recipe-form';
import { Button } from '@/components/ui/button';
import { WelcomeDialog } from '@/components/welcome/WelcomeDialog';
import { ChatInstructionsModal } from '@/components/welcome/ChatInstructionsModal';
import { PremiumFeatureGuard } from '@/components/subscription/PremiumFeatureGuard';
import type { RecipeFormData } from '@/lib/schemas';
import type { PersonaType } from '@/lib/openai';

// Map chef IDs to PersonaType
const CHEF_TO_PERSONA_MAP: Record<string, PersonaType> = {
  'chef-marco': 'chef',
  'dr-sarah': 'nutritionist',
  'aunt-jenny': 'homeCook',
};

// Map chef IDs to chef names
const CHEF_NAMES: Record<string, string> = {
  'chef-marco': 'Chef Marco',
  'dr-sarah': 'Dr. Sarah',
  'aunt-jenny': 'Aunt Jenny',
};

// Delay to ensure WelcomeDialog fully closes before ChatInstructionsModal opens
const DIALOG_TRANSITION_DELAY = 300;

export function ChatRecipePage() {
  const navigate = useNavigate();
  const [generatedRecipe, setGeneratedRecipe] = useState<RecipeFormData | null>(
    null
  );
  const [showEditor, setShowEditor] = useState(false);
  const [selectedChef, setSelectedChef] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  const handleChefSelected = (chefId: string) => {
    setSelectedChef(chefId);
  };

  // Show ChatInstructionsModal after chef is selected (with delay to prevent dialog conflicts)
  useEffect(() => {
    const hasHiddenInstructions =
      localStorage.getItem('hideChatInstructionsModal') === 'true';
    if (!hasHiddenInstructions && selectedChef) {
      // Add a small delay to ensure WelcomeDialog has fully closed
      // before ChatInstructionsModal attempts to open, preventing conflicts
      const timer = setTimeout(() => {
        setShowInstructions(true);
      }, DIALOG_TRANSITION_DELAY);
      return () => clearTimeout(timer);
    }
  }, [selectedChef]); // Re-run when selectedChef changes

  // Get the persona based on selected chef
  const selectedPersona: PersonaType | undefined = selectedChef
    ? CHEF_TO_PERSONA_MAP[selectedChef]
    : undefined;

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
                {showEditor ? 'Review & Edit Recipe' : 'AI Recipe Creator'}
              </h1>
              <p className="text-sm text-base-content/70 sm:text-base">
                {showEditor
                  ? 'Review and customize your AI-generated recipe before saving'
                  : 'Choose your recipe assistant and create personalized recipes step by step'}
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
          {/* Chef Selection Welcome Dialog */}
          <WelcomeDialog
            context="chat-recipe"
            onChefSelected={handleChefSelected}
          />

          {/* Chat Instructions Modal - shows after chef selection */}
          {selectedChef && (
            <ChatInstructionsModal
              isOpen={showInstructions}
              onClose={() => setShowInstructions(false)}
              chefName={CHEF_NAMES[selectedChef] || 'Your Chef'}
            />
          )}

          {/* Always render ChatInterface to preserve conversation state */}
          <div
            className={`bg-base-100 rounded-lg shadow-sm ${showEditor ? 'hidden' : ''}`}
          >
            <ChatInterface
              onRecipeGenerated={handleRecipeGenerated}
              defaultPersona={selectedPersona}
            />
          </div>

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
