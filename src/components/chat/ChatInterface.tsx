import React, { useRef, useEffect, useState } from 'react';
import { createDaisyUIInputClasses } from '@/lib/input-migration';
import { createDaisyUICardClasses } from '@/lib/card-migration';
import { createDaisyUIScrollAreaClasses } from '@/lib/scroll-area-migration';
import { useNavigate } from 'react-router-dom';

import {
  Send,
  User,
  Loader2,
  ChefHat,
  Heart,
  Home,
  Bot,
  Brain,
  Settings,
} from 'lucide-react';
import { PersonaSelector } from './PersonaSelector';
import { ChatHeader } from './ChatHeader';
import { CuisineCategorySelector } from './cuisine-category-selector';
import { Button } from '@/components/ui/button';
import { useConversation } from '@/hooks/useConversation';
import { RECIPE_BOT_PERSONAS, type PersonaType } from '@/lib/openai';
import type { RecipeFormData } from '@/lib/schemas';
import { useSelections } from '@/contexts/SelectionContext';
import { UserProfileDisplay } from './UserProfileDisplay';
import { SmartCreateRecipeButton } from './SmartCreateRecipeButton';
import { useAuth } from '@/contexts/AuthProvider';
import {
  hasRecipeContent,
  parseInstructionsFromText,
  formatInstructionsForDisplay,
} from '@/utils/chat-recipe-parser';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

interface ChatInterfaceProps {
  onRecipeGenerated: (recipe: RecipeFormData) => void;
  defaultPersona?: PersonaType;
}

// Maximum height for textarea input (matches Tailwind max-h-32 = 128px on desktop, max-h-24 = 96px on mobile)
const MAX_TEXTAREA_HEIGHT_DESKTOP = 128;
const MAX_TEXTAREA_HEIGHT_MOBILE = 96;

// Mobile layout constants for fixed positioning
const MOBILE_INPUT_AREA_HEIGHT = 120; // Approximate height of input area (textarea + padding + helper text)
const MOBILE_BUTTON_AND_INPUT_HEIGHT = 200; // Height of button + input area combined
const MOBILE_STANDARD_PADDING = 128; // pb-32 = 128px, standard padding for input only

export function ChatInterface({
  onRecipeGenerated,
  defaultPersona,
}: ChatInterfaceProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    persona,
    messages,
    generatedRecipe,
    isLoading,
    showPersonaSelector,
    selectPersona,
    sendMessage,
    startNewRecipe,
    changePersona,
    generateEvaluationReport,
    saveEvaluationReport,
  } = useConversation(defaultPersona);

  const { selections, updateSelections } = useSelections();

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [inputValue, setInputValue] = React.useState('');
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size for sheet positioning
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Automatically call onRecipeGenerated when a recipe is successfully parsed
    if (generatedRecipe) {
      onRecipeGenerated(generatedRecipe);
    }
  }, [generatedRecipe, onRecipeGenerated]);

  // Auto-resize textarea when input value changes
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      // Use mobile max height on small screens, desktop max height on larger screens
      const maxHeight = isMobile
        ? MAX_TEXTAREA_HEIGHT_MOBILE
        : MAX_TEXTAREA_HEIGHT_DESKTOP;
      const newHeight = Math.min(inputRef.current.scrollHeight, maxHeight);
      inputRef.current.style.height = `${newHeight}px`;
    }
  }, [inputValue, isMobile]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const messageContent = inputValue.trim();
    setInputValue('');

    // Reset textarea height after sending
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    await sendMessage(messageContent, selections);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
    // Shift+Enter will naturally create a new line in textarea
  };

  const handleSaveRecipe = () => {
    if (generatedRecipe) {
      onRecipeGenerated(generatedRecipe);
    }
  };

  const handleCuisineCategoryChange = (selection: {
    categories: string[];
    cuisines: string[];
    moods: string[];
    availableIngredients?: string[];
  }) => {
    updateSelections(selection);
  };

  // Helper function to render message content with formatted instructions
  const renderMessageContent = (content: string, isAssistant: boolean) => {
    // Only process assistant messages for recipe content
    if (!isAssistant || !hasRecipeContent(content)) {
      return (
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {content}
        </div>
      );
    }

    // Parse instructions from the message
    const { hasInstructions, instructionLines } =
      parseInstructionsFromText(content);

    // If no instructions found, render normally
    if (!hasInstructions || instructionLines.length === 0) {
      return (
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {content}
        </div>
      );
    }

    // Find where instructions start and end in the original content
    const lines = content.split('\n');
    const trimmedLines = lines.map((line) => line.trim());

    // Find the first instruction line index by matching against parsed instruction lines
    let instructionStartIndex = -1;

    // First, try to find exact match or partial match with first instruction line
    if (instructionLines.length > 0) {
      const firstInstruction = instructionLines[0].trim();
      for (let i = 0; i < trimmedLines.length; i++) {
        const trimmedLine = trimmedLines[i];
        // Exact match
        if (trimmedLine === firstInstruction) {
          instructionStartIndex = i;
          break;
        }
        // Partial match (instruction might have number prefix in original)
        const cleanedTrimmed = trimmedLine.replace(/^\d+\.\s*/, '').trim();
        if (cleanedTrimmed === firstInstruction) {
          instructionStartIndex = i;
          break;
        }
      }
    }

    // If we found where instructions start, render content before instructions normally,
    // then render instructions formatted, then render content after instructions normally
    if (instructionStartIndex >= 0) {
      const beforeInstructions = lines
        .slice(0, instructionStartIndex)
        .join('\n');
      const afterInstructionsStart =
        instructionStartIndex + instructionLines.length;
      const afterInstructions = lines.slice(afterInstructionsStart).join('\n');

      return (
        <>
          {beforeInstructions.trim() && (
            <div className="text-sm leading-relaxed whitespace-pre-wrap mb-4">
              {beforeInstructions}
            </div>
          )}
          <div className="space-y-2">
            {formatInstructionsForDisplay(instructionLines)}
          </div>
          {afterInstructions.trim() && (
            <div className="text-sm leading-relaxed whitespace-pre-wrap mt-4">
              {afterInstructions}
            </div>
          )}
        </>
      );
    }

    // Fallback: if we can't find the exact position, just render formatted instructions
    // This handles edge cases where the parsing doesn't perfectly match the original
    return (
      <>
        <div className="space-y-2">
          {formatInstructionsForDisplay(instructionLines)}
        </div>
      </>
    );
  };

  const getPersonaIcon = (personaType: PersonaType) => {
    switch (personaType) {
      case 'chef':
        return <ChefHat className="h-4 w-4" />;
      case 'nutritionist':
        return <Heart className="h-4 w-4" />;
      case 'homeCook':
        return <Home className="h-4 w-4" />;
      case 'assistantNutritionist':
      case 'jamieBrightwell':
      case 'drLunaClearwater':
        return <Brain className="h-4 w-4" />;
      default:
        return <Bot className="h-4 w-4" />;
    }
  };

  const getPersonaColor = (personaType: PersonaType) => {
    switch (personaType) {
      case 'chef':
        return 'bg-warning/20 text-warning';
      case 'nutritionist':
        return 'bg-success/20 text-success';
      case 'homeCook':
        return 'bg-info/20 text-info';
      case 'assistantNutritionist':
      case 'jamieBrightwell':
      case 'drLunaClearwater':
        return 'bg-accent/20 text-accent';
      default:
        return 'bg-base-200 text-base-content';
    }
  };

  const getPersonaIntroduction = (personaType: PersonaType) => {
    switch (personaType) {
      case 'chef':
        return {
          title: "Welcome! I'm Chef Marco",
          description:
            'Master Italian chef with 20+ years of Mediterranean culinary expertise, specializing in traditional techniques and fresh ingredients',
          guidance:
            "Start by telling me what kind of recipe you'd like to create, or use the preferences above to guide me.",
        };
      case 'nutritionist':
        return {
          title: "Welcome! I'm Dr. Sarah",
          description:
            'Registered dietitian and nutrition expert focused on creating healthy, balanced meals that are both nutritious and delicious',
          guidance:
            "Start by telling me what kind of recipe you'd like to create, or use the preferences above to guide me.",
        };
      case 'homeCook':
        return {
          title: "Welcome! I'm Aunt Jenny",
          description:
            'Beloved home cook with decades of experience creating comforting, family-friendly recipes that bring joy to every meal',
          guidance:
            "Start by telling me what kind of recipe you'd like to create, or use the preferences above to guide me.",
        };
      case 'assistantNutritionist':
        return {
          title: "Welcome! I'm Dr. Sage Vitalis",
          description:
            '🌟 PREMIUM: Master of Integrative Culinary Medicine with 30+ years merging ancient healing wisdom with cutting-edge nutritional science. Expert in TCM, Ayurveda, functional medicine, and microbiome optimization.',
          guidance:
            "Transform your kitchen into a healing pharmacy! Tell me about your health goals, dietary needs, or what you'd like to heal through food.",
        };
      case 'jamieBrightwell':
        return {
          title: "Welcome! I'm Dr. Jamie Brightwell",
          description:
            "🌟 PREMIUM: Revolutionary Pediatric Culinary Wellness Expert with dual Stanford medicine + Le Cordon Bleu training. Transform 'picky eaters' into food explorers with 25+ years of evidence-based, play-based nutrition.",
          guidance:
            "Hi! I'm Dr. Jamie Brightwell, your Pediatric Culinary Wellness Expert! I'll help you create delicious, nutritionally-optimized meals that your children will actually want to eat. Tell me about your child's age, any picky eating challenges, dietary restrictions, or what you'd like to achieve. I can help with sensory-friendly foods, hidden nutrition techniques, and making healthy eating an adventure!",
        };
      case 'drLunaClearwater':
        return {
          title: "Welcome! I'm Dr. Luna Clearwater",
          description:
            '🌟 PREMIUM: Revolutionary Personalized Health Assessment & Habit Formation Expert with dual Stanford Medicine + Harvard Public Health training. Transform health uncertainty into confident, personalized action plans.',
          guidance:
            "Hi! I'm Dr. Luna Clearwater, your Personalized Health Assessment & Habit Formation Expert! I'll guide you through a comprehensive health evaluation to create a personalized action plan. Tell me about your health goals, current habits, dietary preferences, or any health concerns. I'll assess your needs and provide a detailed, structured report with actionable recommendations for sustainable lifestyle transformation!",
        };
      default:
        return {
          title: `Welcome! I'm ${RECIPE_BOT_PERSONAS[personaType].name}`,
          description: RECIPE_BOT_PERSONAS[personaType].description,
          guidance:
            "Start by telling me what kind of recipe you'd like to create, or use the preferences above to guide me.",
        };
    }
  };

  // Show persona selector if no conversation has started
  if (showPersonaSelector) {
    return <PersonaSelector onPersonaSelect={selectPersona} />;
  }

  // Ensure we have a persona before rendering chat
  if (!persona) {
    return <PersonaSelector onPersonaSelect={selectPersona} />;
  }

  return (
    <div
      className="mx-auto flex max-w-4xl flex-col sm:pb-0"
      style={{ paddingBottom: `${MOBILE_STANDARD_PADDING}px` }}
    >
      {/* Chat Header */}
      <ChatHeader
        selectedPersona={persona}
        generatedRecipe={generatedRecipe}
        isLoading={isLoading}
        onSaveRecipe={handleSaveRecipe}
        onConvertToRecipe={async () => {
          // Clear live filter selections when user explicitly chooses to create a recipe
          // (Back to Chat should preserve selections; only this action resets.)
          updateSelections({
            categories: [],
            cuisines: [],
            moods: [],
            availableIngredients: [],
          });
          handleSaveRecipe();
        }}
        onNewRecipe={startNewRecipe}
        onChangeAssistant={changePersona}
        onOpenProfile={user?.id ? () => setIsProfileSheetOpen(true) : undefined}
      />

      {/* Cuisine & Category Selector */}
      <div className="bg-base-100 border-t border-b p-4">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-sm font-medium text-base-content mb-3">
            🎯 Recipe Preferences (Optional)
          </h3>
          <p className="text-xs text-base-content/70 mb-3">
            Select categories, cuisines, and moods to help guide your AI
            assistant in creating the perfect recipe
          </p>
          <CuisineCategorySelector
            onSelectionChange={handleCuisineCategoryChange}
            className=""
          />
        </div>
      </div>

      {/* Chat Messages - Responsive height */}
      <div
        ref={scrollAreaRef}
        className={`${createDaisyUIScrollAreaClasses(
          'default',
          'bg-base-200 p-4'
        )} ${
          messages.length === 0
            ? 'min-h-[300px] max-h-[500px] sm:min-h-[400px] sm:max-h-[600px]' // Compact when empty - doubled
            : `min-h-[500px] sm:min-h-[600px] sm:max-h-[calc(100dvh-${MOBILE_BUTTON_AND_INPUT_HEIGHT}px)] sm:pb-0` // Expand based on content, doubled height - add bottom padding on mobile for fixed elements
        } overflow-y-auto`}
        style={
          messages.length > 0
            ? {
                maxHeight: `calc(100dvh - ${MOBILE_BUTTON_AND_INPUT_HEIGHT}px)`,
                paddingBottom:
                  persona && messages.length > 2
                    ? `${MOBILE_BUTTON_AND_INPUT_HEIGHT}px`
                    : `${MOBILE_STANDARD_PADDING}px`,
              }
            : undefined
        }
      >
        {/* Welcome Message - Always visible when no conversation */}
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-full border-2 border-white shadow-sm ${getPersonaColor(persona)}`}
                >
                  {getPersonaIcon(persona)}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-base-content">
                  {getPersonaIntroduction(persona).title}
                </h3>
                <p className="text-sm text-base-content/80 max-w-md">
                  {getPersonaIntroduction(persona).description}
                </p>
              </div>
              <p className="text-xs text-base-content/70">
                {getPersonaIntroduction(persona).guidance}
              </p>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start space-x-3 ${
                message.role === 'user'
                  ? 'flex-row-reverse space-x-reverse'
                  : ''
              }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow-sm ${
                  message.role === 'user'
                    ? 'bg-success/20'
                    : getPersonaColor(persona)
                }`}
              >
                <div
                  className={`flex items-center justify-center ${
                    message.role === 'user' ? 'text-success' : ''
                  }`}
                >
                  {message.role === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    getPersonaIcon(persona)
                  )}
                </div>
              </div>

              <div
                className={`${createDaisyUICardClasses('bordered')} max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-success text-success-content'
                    : 'bg-base-100'
                }`}
              >
                <div className="card-body p-3">
                  {renderMessageContent(
                    message.content,
                    message.role === 'assistant'
                  )}
                  <div
                    className={`mt-2 text-xs ${
                      message.role === 'user'
                        ? 'text-success-content/80'
                        : 'text-base-content/70'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start space-x-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow-sm ${getPersonaColor(persona)}`}
              >
                <div className="flex items-center justify-center">
                  {getPersonaIcon(persona)}
                </div>
              </div>
              <div
                className={`${createDaisyUICardClasses('bordered')} bg-base-100`}
              >
                <div className="card-body p-3">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-warning" />
                    <span className="text-sm text-base-content/80">
                      {RECIPE_BOT_PERSONAS[persona].name} is thinking...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Smart Save Recipe Button - Shows when there's conversation content */}
      {persona && messages.length > 2 && (
        <div
          className="fixed left-0 right-0 sm:relative sm:bottom-auto sm:left-auto sm:right-auto z-40"
          style={{
            bottom: `calc(${MOBILE_INPUT_AREA_HEIGHT}px + env(safe-area-inset-bottom))`,
          }}
        >
          <div className="mx-auto max-w-4xl">
            <SmartCreateRecipeButton
              conversationContent={messages
                .map((m) => `${m.role}: ${m.content}`)
                .join('\n\n')}
              onRecipeParsed={onRecipeGenerated}
              className="bg-gradient-to-r from-success/10 to-info/10 border-t"
              persona={persona}
              onGenerateReport={generateEvaluationReport}
              onSaveReport={saveEvaluationReport}
            />
          </div>
        </div>
      )}

      {/* Chat Input - Always visible and accessible */}
      <div className="bg-base-100/95 backdrop-blur-sm rounded-b-lg border-t p-4 fixed bottom-0 left-0 right-0 sm:sticky sm:relative sm:left-auto sm:right-auto z-50 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-lg">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-end space-x-2">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setInputValue(e.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder="Type your message here..."
              disabled={isLoading}
              rows={1}
              className={`${createDaisyUIInputClasses('bordered')} 
              flex-1 min-h-[44px] max-h-24 sm:max-h-32 
              resize-none overflow-y-auto overflow-x-hidden 
              whitespace-pre-wrap break-words`}
              style={{
                resize: 'none',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
              }}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              size="sm"
              className="bg-warning text-warning-content hover:bg-warning/90 min-h-[44px] px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 text-xs text-base-content/70">
            Press Enter to send, or Shift+Enter for a new line
          </p>
        </div>
      </div>

      {/* Profile Sheet - Mobile bottom, Desktop right */}
      {user?.id && persona && (
        <Sheet open={isProfileSheetOpen} onOpenChange={setIsProfileSheetOpen}>
          <SheetContent
            side={isMobile ? 'bottom' : 'right'}
            className={`z-[60] ${isMobile ? 'h-[85vh]' : 'h-full max-w-md'}`}
          >
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Your Profile
              </SheetTitle>
              <SheetDescription>
                View your profile information that AI assistants use to provide
                personalized recommendations
              </SheetDescription>
            </SheetHeader>
            <div
              className="mt-6 overflow-y-auto pr-2"
              style={{
                maxHeight: isMobile
                  ? `calc(85vh - ${MOBILE_INPUT_AREA_HEIGHT}px)`
                  : `calc(100vh - ${MOBILE_INPUT_AREA_HEIGHT}px)`,
              }}
            >
              <UserProfileDisplay
                userId={user.id}
                liveSelections={selections}
                className="bg-transparent border-0 p-0"
              />
            </div>
            <div className="mt-6 pt-4 border-t">
              <Button
                onClick={() => {
                  setIsProfileSheetOpen(false);
                  navigate('/profile');
                }}
                className="w-full bg-warning text-warning-content hover:bg-warning/90"
                size="lg"
              >
                <Settings className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
