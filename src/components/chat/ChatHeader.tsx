import { ChefHat, Heart, Home, Bot, Brain, Menu, X, User } from 'lucide-react';
import { RECIPE_BOT_PERSONAS, type PersonaType } from '@/lib/openai';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import type { RecipeFormData } from '@/lib/schemas';

interface ChatHeaderProps {
  selectedPersona: PersonaType;
  generatedRecipe: RecipeFormData | null;
  isLoading: boolean;
  onSaveRecipe: () => void;
  onConvertToRecipe: () => Promise<void>;
  onNewRecipe: () => void;
  onChangeAssistant: () => void;
  onOpenProfile?: () => void;
}

export function ChatHeader({
  selectedPersona,
  onNewRecipe,
  onChangeAssistant,
  onOpenProfile,
}: ChatHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };
  const getPersonaIcon = (persona: PersonaType) => {
    switch (persona) {
      case 'chef':
        return <ChefHat className="h-5 w-5" />;
      case 'nutritionist':
        return <Heart className="h-5 w-5" />;
      case 'homeCook':
        return <Home className="h-5 w-5" />;
      case 'assistantNutritionist':
      case 'jamieBrightwell':
        return <Brain className="h-5 w-5" />;
      default:
        return <Bot className="h-5 w-5" />;
    }
  };

  const getPersonaColor = (persona: PersonaType) => {
    switch (persona) {
      case 'chef':
        return 'bg-warning/20 text-warning';
      case 'nutritionist':
        return 'bg-success/20 text-success';
      case 'homeCook':
        return 'bg-info/20 text-info';
      case 'assistantNutritionist':
      case 'jamieBrightwell':
        return 'bg-accent/20 text-accent';
      default:
        return 'bg-base-200 text-base-content';
    }
  };

  return (
    <div className="relative">
      <div className="bg-base-100 flex items-center justify-between rounded-t-lg border-b p-4">
        <div className="flex items-center space-x-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-white shadow-sm ${getPersonaColor(selectedPersona)}`}
          >
            <div className="flex items-center justify-center">
              {getPersonaIcon(selectedPersona)}
            </div>
          </div>
          <div>
            <h2 className="font-semibold text-base-content">
              {RECIPE_BOT_PERSONAS[selectedPersona].name}
            </h2>
            <p className="text-sm text-base-content/70">
              Let's create something delicious together!
            </p>
          </div>
        </div>

        {/* Desktop Action Buttons */}
        <div className="hidden items-center space-x-2 md:flex">
          {onOpenProfile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenProfile}
              className="p-2"
              title="View Profile"
            >
              <User className="h-5 w-5" />
            </Button>
          )}
          <Button
            variant="outline"
            className="border-success text-success hover:bg-success/10"
            onClick={onNewRecipe}
          >
            New Recipe
          </Button>
          <Button
            variant="outline"
            className="border-warning text-warning hover:bg-warning/10"
            onClick={onChangeAssistant}
          >
            Change Assistant
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center space-x-2 md:hidden">
          {onOpenProfile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenProfile}
              className="p-2"
              title="View Profile"
            >
              <User className="h-5 w-5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="bg-base-100 absolute top-full right-0 left-0 z-50 border-b border-base-300 shadow-lg md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile menu"
        >
          <nav className="flex flex-col space-y-2 p-4">
            <h2 id="mobile-menu-title" className="sr-only">
              Chat Actions Menu
            </h2>
            {onOpenProfile && (
              <Button
                variant="outline"
                onClick={() => {
                  onOpenProfile();
                  closeMobileMenu();
                }}
                className="w-full justify-start border-info text-info hover:bg-info/10"
              >
                <User className="mr-2 h-4 w-4" />
                View Profile
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                onNewRecipe();
                closeMobileMenu();
              }}
              className="w-full justify-start border-success text-success hover:bg-success/10"
            >
              New Recipe
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                onChangeAssistant();
                closeMobileMenu();
              }}
              className="w-full justify-start border-warning text-warning hover:bg-warning/10"
            >
              Change Assistant
            </Button>
          </nav>
        </div>
      )}
    </div>
  );
}
