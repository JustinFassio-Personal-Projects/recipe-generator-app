import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ChatKit, useChatKit } from '@openai/chatkit-react';
import { RecipeForm } from '@/components/recipes/recipe-form';
import { Button } from '@/components/ui/button';
import { PremiumFeatureGuard } from '@/components/subscription/PremiumFeatureGuard';
import { useAuth } from '@/contexts/AuthProvider';
import type { RecipeFormData } from '@/lib/schemas';

export function AiAgenticChefPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [generatedRecipe, setGeneratedRecipe] = useState<RecipeFormData | null>(
    null
  );
  const [showEditor, setShowEditor] = useState(false);

  // ChatKit integration
  const { control } = useChatKit({
    api: {
      async getClientSecret(existing) {
        if (existing) {
          // Refresh existing session
          const res = await fetch('/api/ai/chatkit-session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user?.id,
              existingClientSecret: existing,
            }),
          });
          const { client_secret } = await res.json();
          return client_secret;
        }

        // Create new session
        const res = await fetch('/api/ai/chatkit-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user?.id,
          }),
        });
        const { client_secret } = await res.json();
        return client_secret;
      },
    },
  });

  // Listen for recipe generation from ChatKit
  // Note: You may need to add event listeners or use ChatKit's action system
  // to extract recipes from the conversation
  useEffect(() => {
    // TODO: Implement recipe extraction from ChatKit conversation
    // This might require using ChatKit's action system or parsing messages
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
                  : 'Create exceptional BBQ recipes with our AI Agentic Chef powered by OpenAI Agent Builder workflows'}
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
          {/* ChatKit component - OpenAI's embeddable chat UI */}
          <div
            className={`bg-base-100 rounded-lg shadow-sm ${showEditor ? 'hidden' : ''}`}
          >
            <div className="p-6">
              <ChatKit control={control} className="h-[600px] w-full" />
            </div>
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
