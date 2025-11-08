import { ShoppingCart, Package, X } from 'lucide-react';

interface IngredientRecommendationsPanelProps {
  extractedIngredients: string[];
  onRemoveIngredient: (ingredient: string) => void;
  onAddToShoppingList: (ingredient: string) => Promise<void>;
  onAddToKitchen: (ingredient: string) => Promise<void>;
  loading?: boolean;
}

export function IngredientRecommendationsPanel({
  extractedIngredients,
  onRemoveIngredient,
  onAddToShoppingList,
  onAddToKitchen,
  loading = false,
}: IngredientRecommendationsPanelProps) {
  return (
    <div className="card bg-base-100 shadow-sm sticky top-6">
      <div className="card-body">
        <h3 className="font-semibold flex items-center gap-2">
          <Package className="w-4 h-4" />
          Ingredient Recommendations
        </h3>
        {extractedIngredients.length === 0 ? (
          <p className="text-sm text-base-content/70">
            Ask the AI assistant about ingredients for any cuisine, then export
            them here to add to your kitchen or shopping list.
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-base-content/70">
                {extractedIngredients.length} ingredient
                {extractedIngredients.length !== 1 ? 's' : ''} found
              </span>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {extractedIngredients.map((name) => (
                <div
                  key={name}
                  className="flex items-center justify-between p-2 rounded bg-base-200 gap-2"
                >
                  <span className="text-sm flex-1 min-w-0 truncate">
                    {name}
                  </span>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      className="btn btn-xs btn-outline tooltip"
                      data-tip="Add as unavailable (needs shopping)"
                      onClick={() => onAddToShoppingList(name)}
                      disabled={loading}
                    >
                      <ShoppingCart className="w-3 h-3" />
                    </button>
                    <button
                      className="btn btn-xs btn-primary tooltip"
                      data-tip="Add as available (in kitchen)"
                      onClick={() => onAddToKitchen(name)}
                      disabled={loading}
                    >
                      <Package className="w-3 h-3" />
                    </button>
                    <button
                      className="btn btn-xs btn-ghost"
                      onClick={() => onRemoveIngredient(name)}
                      disabled={loading}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
