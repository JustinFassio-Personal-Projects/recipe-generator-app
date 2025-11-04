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
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-teal-100">
          <ChefHat className="h-8 w-8 text-orange-600" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-orange-600">
          👨‍🍳 Choose Your Cooking Guide
        </h2>
        <p className="text-teal-600">
          Select a chef personality to guide your recipe creation
        </p>
      </div>

      {/* Chef Selection */}
      <div className="space-y-3">
        <p className="text-center font-medium text-gray-500">
          Who would you like to cook with today?
        </p>

        <div className="space-y-3">
          {CHEF_PERSONALITIES.map((chef) => (
            <button
              key={chef.id}
              onClick={() => setSelectedChef(chef.id)}
              className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                selectedChef === chef.id
                  ? 'border-orange-500 bg-orange-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
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
                    <h3 className="font-semibold text-gray-900">{chef.name}</h3>
                    <span className="text-sm text-gray-500">-</span>
                    <span className="text-sm font-medium text-gray-600">
                      {chef.title}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {chef.description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {chef.specialties.map((specialty) => (
                      <span
                        key={specialty}
                        className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
                {selectedChef === chef.id && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-white">
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
          className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 disabled:opacity-50"
        >
          {selectedChef
            ? `Start Cooking with ${CHEF_PERSONALITIES.find((c) => c.id === selectedChef)?.name}!`
            : 'Select a Chef to Continue'}
        </Button>
      </div>
    </div>
  );
}
