import { useState, useRef, useEffect } from 'react';
import { Send, Brain, User, Loader2, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ShoppingCartChatProps {
  onChatResponse: (message: string) => Promise<string>;
  onAddAll?: () => Promise<void>;
  placeholder?: string;
  className?: string;
  onTranscriptChange?: (text: string) => void;
  onIngredientsExtracted?: (ingredients: string[]) => void;
}

export function ShoppingCartChat({
  onChatResponse,
  onAddAll,
  placeholder = 'Ask me about ingredients...',
  className = '',
  onTranscriptChange,
  onIngredientsExtracted,
}: ShoppingCartChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll strategy:
  // - When the latest message is from the user, scroll to bottom (to see typing/response area)
  // - When the latest message is from the assistant, align the start of that message to the top
  useEffect(() => {
    const container = scrollAreaRef.current;
    if (!container || messages.length === 0) return;

    const last = messages[messages.length - 1];
    if (last.role === 'user') {
      // Keep previous behavior for user messages
      container.scrollTop = container.scrollHeight;
      return;
    }

    // For assistant messages, scroll so the start of the message is visible at the top
    const lastEl = messageRefs.current[last.id];
    if (lastEl && container) {
      // Align the top of the assistant message with the top of the scroll container
      container.scrollTop = lastEl.offsetTop - container.offsetTop;
    }
  }, [messages]);

  // Emit transcript when messages change
  useEffect(() => {
    if (!onTranscriptChange) return;
    const transcript = messages.map((m) => m.content).join('\n\n');
    onTranscriptChange(transcript);
  }, [messages, onTranscriptChange]);

  // Helper to detect if message contains ingredient suggestions
  const containsIngredientSuggestions = (content: string): boolean => {
    const keywords = [
      'ingredient',
      'add',
      'staple',
      'need',
      'essential',
      'recommend',
      'suggest',
    ];
    const lowerContent = content.toLowerCase();
    return keywords.some((keyword) => lowerContent.includes(keyword));
  };

  // Handle extracting ingredients from assistant message
  const handleExtractIngredients = async (messageContent: string) => {
    if (!onIngredientsExtracted) return;

    setIsLoading(true);
    try {
      // First, try to extract ingredients using pattern matching from the message
      const extractedFromMessage =
        extractIngredientsFromMessage(messageContent);

      if (extractedFromMessage.length > 0) {
        // If we found ingredients via pattern matching, use those
        onIngredientsExtracted(extractedFromMessage);
        toast({
          title: 'Ingredients Extracted',
          description: `${extractedFromMessage.length} ingredient${extractedFromMessage.length !== 1 ? 's' : ''} ready to add`,
        });
      } else {
        // Fallback to AI extraction if pattern matching fails
        const extractionPrompt = `Extract ONLY the ingredient names from this specific message (ignore any other messages in the conversation):

"${messageContent}"

Return ONLY a JSON array of ingredient names with no other text. Format: ["ingredient1", "ingredient2", ...]

IMPORTANT: Only extract ingredients that are explicitly listed or mentioned in the message above. Do not include ingredients from previous messages in the conversation.`;

        const response = await onChatResponse(extractionPrompt);

        // Parse JSON
        const jsonMatch = response.match(/\[.*\]/s);
        if (jsonMatch) {
          const ingredients = JSON.parse(jsonMatch[0]) as string[];
          onIngredientsExtracted(ingredients);
          toast({
            title: 'Ingredients Extracted',
            description: `${ingredients.length} ingredient${ingredients.length !== 1 ? 's' : ''} ready to add`,
          });
        } else {
          throw new Error('No JSON array found in response');
        }
      }
    } catch (error) {
      console.error('Extraction error:', error);
      toast({
        title: 'Extraction Failed',
        description: 'Could not parse ingredients from response',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to extract ingredients from message using pattern matching
  const extractIngredientsFromMessage = (message: string): string[] => {
    const ingredients: string[] = [];
    const lines = message.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // Match numbered lists: "1. Chicken" or "1. **Chicken** - description"
      const numberedMatch = trimmed.match(/^\d+\.\s+\*?\*?([^-–—(]+)/);
      if (numberedMatch) {
        let ingredient = numberedMatch[1].trim();
        // Remove trailing asterisks from bold markdown
        ingredient = ingredient.replace(/\*+$/, '').trim();
        if (ingredient.length > 1 && ingredient.length < 50) {
          ingredients.push(ingredient);
        }
        continue;
      }

      // Match bullet points: "- Chicken" or "* Chicken" or "• Chicken - description"
      const bulletMatch = trimmed.match(/^[-*•]\s+\*?\*?([^-–—(]+)/);
      if (bulletMatch) {
        let ingredient = bulletMatch[1].trim();
        // Remove trailing asterisks from bold markdown
        ingredient = ingredient.replace(/\*+$/, '').trim();
        if (ingredient.length > 1 && ingredient.length < 50) {
          ingredients.push(ingredient);
        }
        continue;
      }
    }

    return ingredients;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Quick intent: add all / yes
    if (
      /^(add\s*all|yes\b|please\s*add\s*all)/i.test(userMessage.content) &&
      onAddAll
    ) {
      setInputValue('');
      setIsLoading(true);
      try {
        await onAddAll();
        const assistantAck: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content:
            'Added the recommended ingredients to your kitchen as unavailable. They will appear in your shopping list.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantAck]);
      } catch (error) {
        console.error('Add all error:', error);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setInputValue('');
    setIsLoading(true);

    try {
      const reply = await onChatResponse(userMessage.content);
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Messages area */}
      <div
        ref={scrollAreaRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-base-50 rounded-t-lg border border-base-300"
        style={{ minHeight: '300px', maxHeight: '400px' }}
      >
        {messages.length === 0 ? (
          <div className="text-center text-base-content/60 py-8">
            <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Ask me about ingredients for any cuisine!</p>
            <p className="text-sm mt-1">
              I'll help you build the perfect shopping list.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              ref={(el) => {
                messageRefs.current[message.id] = el;
              }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-content'
                    : 'bg-base-100 text-base-content border border-base-300'
                }`}
              >
                <div className="flex items-start gap-2">
                  {message.role === 'assistant' && (
                    <Brain className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  )}
                  {message.role === 'user' && (
                    <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {message.role === 'assistant' &&
                      containsIngredientSuggestions(message.content) &&
                      onIngredientsExtracted && (
                        <button
                          onClick={() =>
                            handleExtractIngredients(message.content)
                          }
                          disabled={isLoading}
                          className="btn btn-xs btn-primary mt-2 gap-1"
                        >
                          <Download className="w-3 h-3" />
                          Export Ingredients
                        </button>
                      )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-base-100 text-base-content border border-base-300 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input form */}
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 p-3 bg-base-100 rounded-b-lg border-x border-b border-base-300"
      >
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          className="flex-1 input input-sm input-bordered"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="btn btn-sm btn-primary"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
