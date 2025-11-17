import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChefHat, Flame } from 'lucide-react';

interface AgentPersonality {
  id: string;
  name: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  specialties: string[];
  color: string;
}

const AGENT_PERSONALITIES: AgentPersonality[] = [
  {
    id: 'bbq-pit-master',
    name: 'American BBQ Pitmaster',
    title: 'Smoking & Grilling Expert',
    description:
      'Master of low-and-slow smoking techniques and regional American BBQ styles',
    icon: <Flame className="h-6 w-6" />,
    specialties: ['American BBQ', 'Smoking', 'Grilling', 'Regional Styles'],
    color: 'from-orange-600 to-red-600',
  },
  // Add more agents here as you create them
];

interface AgentRecipeWelcomeProps {
  onClose: () => void;
  onSelectAgent: (agentId: string) => void;
}

export function AgentRecipeWelcome({
  onClose,
  onSelectAgent,
}: AgentRecipeWelcomeProps) {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const handleContinue = () => {
    if (selectedAgent) {
      onSelectAgent(selectedAgent);
      onClose();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20">
          <ChefHat className="h-8 w-8 text-orange-600" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-orange-600">
          🔥 Choose Your AI Agent
        </h2>
        <p className="text-base-content/70">
          Select an AI agent powered by OpenAI Agent Builder workflows
        </p>
      </div>

      {/* Agent Selection */}
      <div className="space-y-3">
        <p className="text-center font-medium text-base-content/70">
          Which agent would you like to work with?
        </p>

        <div className="space-y-3">
          {AGENT_PERSONALITIES.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent.id)}
              className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                selectedAgent === agent.id
                  ? 'border-orange-500 bg-orange-500/10 shadow-md'
                  : 'border-base-300 bg-base-100 hover:border-base-content/20 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r ${agent.color} text-white`}
                >
                  {agent.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-base-content">
                      {agent.name}
                    </h3>
                    <span className="text-sm text-base-content/70">-</span>
                    <span className="text-sm font-medium text-base-content/80">
                      {agent.title}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-base-content/80">
                    {agent.description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {agent.specialties.map((specialty) => (
                      <span
                        key={specialty}
                        className="rounded-full bg-base-200 px-2 py-1 text-xs text-base-content/80"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
                {selectedAgent === agent.id && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-white">
                    <Flame className="h-4 w-4 fill-current" />
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
          disabled={!selectedAgent}
          className="flex-1 bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 py-6"
        >
          {selectedAgent
            ? `Start with ${AGENT_PERSONALITIES.find((a) => a.id === selectedAgent)?.name}!`
            : 'Select an Agent to Continue'}
        </Button>
      </div>
    </div>
  );
}
