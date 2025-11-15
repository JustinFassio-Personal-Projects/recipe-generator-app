import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChefHat, Heart, Stethoscope, Home } from 'lucide-react';

interface ChefPersonality {
  id: string;
  name: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  specialties: string[];
  color: string;
}

const CHEF_PERSONALITIES: ChefPersonality[] = [
  {
    id: 'chef-marco',
    name: 'Chef Marco',
    title: 'Traditional Techniques',
    description: 'Master of classic cooking methods and authentic flavors',
    icon: <ChefHat className="h-6 w-6" />,
    specialties: ['French Cuisine', 'Italian Classics', 'Fine Dining'],
    color: 'from-orange-500 to-red-500',
  },
  {
    id: 'dr-sarah',
    name: 'Dr. Sarah',
    title: 'Dietitian & Nutrition Expert',
    description: 'Healthy, balanced meals with nutritional science',
    icon: <Stethoscope className="h-6 w-6" />,
    specialties: ['Healthy Eating', 'Dietary Restrictions', 'Nutrition'],
    color: 'from-green-500 to-teal-500',
  },
  {
    id: 'aunt-jenny',
    name: 'Aunt Jenny',
    title: 'Home Cook - Comfort Foods',
    description: 'Warm, hearty meals that bring families together',
    icon: <Home className="h-6 w-6" />,
    specialties: ['Comfort Food', 'Family Recipes', 'Weeknight Meals'],
    color: 'from-purple-500 to-pink-500',
  },
];

interface ChatRecipeWelcomeProps {
  onClose: () => void;
  onSelectChef: (chefId: string) => void;
}

export function ChatRecipeWelcome({
  onClose,
  onSelectChef,
}: ChatRecipeWelcomeProps) {
  const [selectedChef, setSelectedChef] = useState<string | null>(null);

  const handleContinue = () => {
    if (selectedChef) {
      onSelectChef(selectedChef);
      onClose();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-warning/20 to-info/20">
          <ChefHat className="h-8 w-8 text-warning" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-warning">
          👨‍🍳 Choose Your Cooking Guide
        </h2>
        <p className="text-info">
          Select a chef personality to guide your recipe creation
        </p>
      </div>

      {/* Chef Selection */}
      <div className="space-y-3">
        <p className="text-center font-medium text-base-content/70">
          Who would you like to cook with today?
        </p>

        <div className="space-y-3">
          {CHEF_PERSONALITIES.map((chef) => (
            <button
              key={chef.id}
              onClick={() => setSelectedChef(chef.id)}
              className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                selectedChef === chef.id
                  ? 'border-warning bg-warning/10 shadow-md'
                  : 'border-base-300 bg-base-100 hover:border-base-content/20 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r ${chef.color} text-white`}
                >
                  {chef.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-base-content">
                      {chef.name}
                    </h3>
                    <span className="text-sm text-base-content/70">-</span>
                    <span className="text-sm font-medium text-base-content/80">
                      {chef.title}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-base-content/80">
                    {chef.description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {chef.specialties.map((specialty) => (
                      <span
                        key={specialty}
                        className="rounded-full bg-base-200 px-2 py-1 text-xs text-base-content/80"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
                {selectedChef === chef.id && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-warning text-warning-content">
                    <Heart className="h-4 w-4 fill-current" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button onClick={onClose} variant="outline" className="flex-1">
          Skip Selection
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!selectedChef}
          className="flex-1 bg-warning text-warning-content hover:bg-warning/90 disabled:opacity-50 py-6"
        >
          {selectedChef
            ? `Start Cooking with ${CHEF_PERSONALITIES.find((c) => c.id === selectedChef)?.name}!`
            : 'Select a Chef to Continue'}
        </Button>
      </div>
    </div>
  );
}
