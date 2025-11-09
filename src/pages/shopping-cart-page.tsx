import { useState, useEffect, useMemo } from 'react';
import { useGroceriesQuery, groceriesKeys } from '@/hooks/useGroceriesQuery';
import { useShoppingCartAI } from '@/hooks/useShoppingCartAI';
import { useUserGroceryCart } from '@/hooks/useUserGroceryCart';
import { useQueryClient } from '@tanstack/react-query';
import { ShoppingCartChat } from '@/components/shopping-cart/ShoppingCartChat';
import { IngredientCard } from '@/components/groceries/IngredientCard';
import { IngredientRecommendationsPanel } from '@/components/shopping-cart/IngredientRecommendationsPanel';
import { SubcategoryFilter } from '@/components/groceries/SubcategoryFilter';
import {
  Check,
  ShoppingCart,
  Brain,
  ShoppingBag,
  Package as PackageIcon,
  ChefHat,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { upsertSystemIngredient } from '@/lib/ingredients/upsertSystemIngredient';
import { extractIngredientsFromTranscript } from '@/lib/ingredients/extractFromTranscript';
import { useNavigate } from 'react-router-dom';
import { updateUserGroceries } from '@/lib/user-preferences';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useGlobalIngredients } from '@/hooks/useGlobalIngredients';
import {
  getCategoryMetadata,
  getAvailableCategories,
  getSubcategoryMetadata,
  type ChefIsabellaCategory,
} from '@/lib/groceries/category-mapping';
import {
  enrichUserIngredients,
  groupEnrichedIngredients,
  type EnrichedUserIngredient,
} from '@/lib/groceries/enrich-user-ingredients';
import { createDaisyUICardClasses } from '@/lib/card-migration';

// Shopping item component - commented out as unused
/*
interface ShoppingItemCardProps {
  item: ShoppingItem;
  onToggleCompleted: (itemId: string) => void;
  onRemove: (itemId: string) => void;
  onUpdate: (itemId: string, updates: Partial<ShoppingItem>) => void;
}
*/

// Unused component - keeping for reference
/*
function ShoppingItemCard({
  item,
  onToggleCompleted,
  onRemove,
  onUpdate,
}: ShoppingItemCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editQuantity, setEditQuantity] = useState(item.quantity || '');
  const [editNotes, setEditNotes] = useState(item.notes || '');

  const handleSaveEdit = () => {
    onUpdate(item.id, {
      quantity: editQuantity || undefined,
      notes: editNotes || undefined,
    });
    setIsEditing(false);
  };

  const getSourceIcon = (source: ShoppingItem['source']) => {
    switch (source) {
      case 'recipe':
        return <Utensils className="w-4 h-4" />;
      case 'ai-chat':
        return <MessageSquare className="w-4 h-4" />;
      case 'groceries-restock':
        return <Package className="w-4 h-4" />;
      default:
        return <Plus className="w-4 h-4" />;
    }
  };

  const getSourceBadgeColor = (source: ShoppingItem['source']) => {
    switch (source) {
      case 'recipe':
        return 'badge-primary';
      case 'ai-chat':
        return 'badge-secondary';
      case 'groceries-restock':
        return 'badge-accent';
      default:
        return 'badge-neutral';
    }
  };

  return (
    <div
      className={`card bg-base-100 shadow-sm border ${item.completed ? 'opacity-60' : ''}`}
    >
      <div className="card-body p-4">
        <div className="flex items-start gap-3">
          <button
            className={`btn btn-circle btn-sm ${item.completed ? 'btn-success' : 'btn-outline'}`}
            onClick={() => onToggleCompleted(item.id)}
            title={item.source === 'groceries-restock' ? 'Mark as purchased - will add back to kitchen' : 'Mark as completed'}
          >
            {item.completed ? (
              <Check className="w-4 h-4" />
            ) : (
              <div className="w-4 h-4" />
            )}
          </button>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3
                className={`font-semibold ${item.completed ? 'line-through' : ''}`}
              >
                {item.name}
              </h3>
              <div
                className={`badge badge-sm ${getSourceBadgeColor(item.source)}`}
              >
                <div className="flex items-center gap-1">
                  {getSourceIcon(item.source)}
                  <span className="capitalize">
                    {item.source.replace('-', ' ')}
                  </span>
                </div>
              </div>
            </div>

            {item.sourceTitle && (
              <p className="text-sm text-base-content/70 mb-2">
                From: {item.sourceTitle}
              </p>
            )}

            {!isEditing ? (
              <div className="space-y-1">
                {item.quantity && (
                  <p className="text-sm">
                    <span className="font-medium">Quantity:</span>{' '}
                    {item.quantity}
                  </p>
                )}
                {item.notes && (
                  <p className="text-sm">
                    <span className="font-medium">Notes:</span> {item.notes}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Quantity (optional)"
                  className="input input-sm input-bordered w-full"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                />
                <textarea
                  placeholder="Notes (optional)"
                  className="textarea textarea-sm textarea-bordered w-full"
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={handleSaveEdit}
                  >
                    Save
                  </button>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
              ⋮
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
            >
              <li>
                <button onClick={() => setIsEditing(true)}>Edit Details</button>
              </li>
              <li>
                <button
                  className="text-error"
                  onClick={() => onRemove(item.id)}
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
*/

// Main shopping cart page
export default function ShoppingCartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const groceries = useGroceriesQuery();
  const { loading: cartLoading, removeFromCart } = useUserGroceryCart();
  const { globalIngredients } = useGlobalIngredients();

  // Helper to check if ingredient is available in kitchen (across all categories)
  const isAvailableInKitchen = (ingredientName: string): boolean => {
    if (!groceries.groceries) return false;
    return Object.values(groceries.groceries as Record<string, string[]>).some(
      (items) => items?.includes(ingredientName)
    );
  };

  const {
    getChatResponse,
    getAllMissingStaples,
    getCuisineStaples,
    getRecommendedAdditions,
  } = useShoppingCartAI();

  // Modal state management
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Category and subcategory filtering
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(
    null
  );

  const [activeTab, setActiveTab] = useState<
    'incomplete' | 'completed' | 'all'
  >('incomplete');

  // Session-only completion state (does not persist to backend)
  const [sessionCompleted, setSessionCompleted] = useState<Set<string>>(
    () => new Set()
  );

  // Virtual shopping cart - tracks items that have been "purchased" during this session
  const [virtualCart, setVirtualCart] = useState<Set<string>>(() => new Set());

  // Modal state for checkout confirmation
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null
  );

  // Assistant transcript and extracted ingredients (session only)
  const [assistantTranscript, setAssistantTranscript] = useState('');
  const [extractedIngredients, setExtractedIngredients] = useState<string[]>(
    []
  );

  /**
   * Helper to defer navigation to the next tick.
   * This allows React state updates (modal closing, state clearing) to complete
   * before triggering navigation, preventing potential race conditions.
   */
  const deferNavigation = (path: string) => {
    setTimeout(() => navigate(path), 0);
  };

  // Prevent navigation away from page when virtual cart has items
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (virtualCart.size > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [virtualCart.size]);

  // Kitchen inventory integration functions
  const handleAddToGroceriesAsUnavailable = async (
    category: string,
    name: string
  ) => {
    try {
      await upsertSystemIngredient(name, category);
      // Add to groceries in unavailable state
      groceries.toggleIngredient(category, name);
      toast({
        title: 'Added to Kitchen',
        description: `${name} added to kitchen inventory as unavailable (needs to be purchased)`,
      });
    } catch {
      toast({
        title: 'Error',
        description: `Failed to add ${name} to kitchen inventory`,
        variant: 'destructive',
      });
    }
  };

  const handleRemoveFromGroceries = async (name: string) => {
    try {
      await removeFromCart(name);
      toast({
        title: 'Removed from Kitchen',
        description: `${name} removed from kitchen inventory`,
      });
    } catch {
      toast({
        title: 'Error',
        description: `Failed to remove ${name} from kitchen inventory`,
        variant: 'destructive',
      });
    }
  };

  // Add multiple staples to groceries as unavailable
  const addStaplesToGroceriesAsUnavailable = async (staples: string[]) => {
    try {
      for (const staple of staples) {
        const category = categorizeIngredient(staple);
        await upsertSystemIngredient(staple, category);
        groceries.toggleIngredient(category, staple);
      }

      toast({
        title: 'Added to Kitchen',
        description: `${staples.length} ingredients added to kitchen inventory as unavailable`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to add some ingredients to kitchen inventory',
        variant: 'destructive',
      });
    }
  };

  // Simple ingredient categorization heuristic
  const categorizeIngredient = (ingredient: string): string => {
    const name = ingredient.toLowerCase();

    if (
      name.includes('oregano') ||
      name.includes('cumin') ||
      name.includes('paprika')
    ) {
      return 'flavor_builders';
    }
    if (
      name.includes('onion') ||
      name.includes('tomato') ||
      name.includes('pepper')
    ) {
      return 'fresh_produce';
    }
    if (
      name.includes('cheese') ||
      name.includes('milk') ||
      name.includes('butter')
    ) {
      return 'dairy_cold';
    }
    if (name.includes('oil') || name.includes('vinegar')) {
      return 'cooking_essentials';
    }
    if (
      name.includes('flour') ||
      name.includes('rice') ||
      name.includes('pasta')
    ) {
      return 'pantry_staples';
    }
    if (
      name.includes('chicken') ||
      name.includes('beef') ||
      name.includes('fish')
    ) {
      return 'proteins';
    }

    return 'fresh_produce';
  };

  // Simple format shopping list items with session overlay
  const rawShoppingListItems = Object.entries(groceries.shoppingList);
  const effectiveShoppingListItems = rawShoppingListItems.map(
    ([ingredient, status]) => {
      // Overlay session-only completion state; fall back to backend status when not overridden
      const isCompletedSession = sessionCompleted.has(ingredient);
      const effectiveStatus = isCompletedSession ? 'purchased' : status;
      return [ingredient, effectiveStatus] as const;
    }
  );

  // Enrich shopping list items with global catalog metadata
  const enrichedShoppingListItems = useMemo(() => {
    // Convert shopping list to a format enrichUserIngredients can process
    // Use a temporary key since we don't know categories yet; enrichment will assign actual categories
    const itemsAsRecord: Record<string, string[]> = {
      temporary_category: effectiveShoppingListItems.map(
        ([ingredient]) => ingredient
      ),
    };

    return enrichUserIngredients(itemsAsRecord, globalIngredients);
  }, [effectiveShoppingListItems, globalIngredients]);

  // Create a status map for O(1) lookups instead of O(n) find() calls
  const ingredientStatusMap = useMemo(() => {
    const map = new Map<string, 'pending' | 'purchased'>();
    effectiveShoppingListItems.forEach(([name, status]) => {
      map.set(name, status);
    });
    return map;
  }, [effectiveShoppingListItems]);

  // Group enriched shopping list items by category and subcategory with filtering
  const groupedShoppingList = useMemo(() => {
    // Apply filters
    const filtered = enrichedShoppingListItems.filter((ing) => {
      // Find the status for this ingredient using O(1) Map lookup
      const status = ingredientStatusMap.get(ing.name) ?? 'pending';

      // Filter by completion status tab
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'completed' && status === 'purchased') ||
        (activeTab === 'incomplete' && status !== 'purchased');

      // Filter by search query
      const matchesQuery =
        !searchQuery.trim() ||
        ing.name.toLowerCase().includes(searchQuery.toLowerCase());

      // Filter by category
      const matchesCategory =
        activeCategory === 'all' || ing.category === activeCategory;

      // Filter by subcategory
      const matchesSubcategory = activeSubcategory
        ? ing.subcategory === activeSubcategory
        : true;

      return (
        matchesTab && matchesQuery && matchesCategory && matchesSubcategory
      );
    });

    // Group by category and subcategory
    return groupEnrichedIngredients(filtered);
  }, [
    enrichedShoppingListItems,
    ingredientStatusMap,
    activeTab,
    searchQuery,
    activeCategory,
    activeSubcategory,
  ]);

  // Calculate subcategory counts for the active category
  const subcategoryCounts = useMemo(() => {
    if (activeCategory === 'all') return {};

    const counts: Record<string, number> = {};
    enrichedShoppingListItems
      .filter((ing) => {
        // Find the status for this ingredient using O(1) Map lookup
        const status = ingredientStatusMap.get(ing.name) ?? 'pending';

        // Filter by completion status tab
        const matchesTab =
          activeTab === 'all' ||
          (activeTab === 'completed' && status === 'purchased') ||
          (activeTab === 'incomplete' && status !== 'purchased');

        // Filter by search query
        const matchesQuery =
          !searchQuery.trim() ||
          ing.name.toLowerCase().includes(searchQuery.toLowerCase());

        return ing.category === activeCategory && matchesTab && matchesQuery;
      })
      .forEach((ing) => {
        const subcategory = ing.subcategory || 'uncategorized';
        counts[subcategory] = (counts[subcategory] || 0) + 1;
      });

    return counts;
  }, [
    enrichedShoppingListItems,
    ingredientStatusMap,
    activeCategory,
    activeTab,
    searchQuery,
  ]);

  // Get available categories
  const availableCategories = useMemo(() => {
    return ['all', ...getAvailableCategories(globalIngredients)];
  }, [globalIngredients]);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setActiveSubcategory(null); // Reset subcategory when category changes
  };

  const incompleteItems = effectiveShoppingListItems.filter(
    ([, status]) => status === 'pending'
  );
  const completedItems = effectiveShoppingListItems.filter(
    ([, status]) => status === 'purchased'
  );
  const allItems = effectiveShoppingListItems;

  // Debug logging
  if (import.meta.env.DEV) {
    console.log('ShoppingCartPage data:', {
      shoppingList: groceries.shoppingList,
      rawShoppingListItems,
      effectiveShoppingListItems,
      incompleteItems,
      completedItems,
      allItems,
    });
  }

  const handleClearCompleted = async () => {
    if (completedItems.length === 0) {
      toast({
        title: 'No Completed Items',
        description: 'There are no completed items to clear for this session.',
        variant: 'default',
      });
      return;
    }

    // Clear session-only completed markers
    setSessionCompleted(new Set());
    toast({
      title: 'Cleared Completed',
      description: 'Completed items cleared for this shopping session.',
    });

    if (activeTab === 'completed') {
      setActiveTab('incomplete');
    }
  };

  const handleClearAll = async () => {
    if (
      confirm(
        'Clear all session progress? This will reset your session completion marks.'
      )
    ) {
      // Reset session-only completion state
      setSessionCompleted(new Set());
      toast({
        title: 'Session Reset',
        description: 'All session completion marks have been cleared.',
      });
      setActiveTab('incomplete');
    }
  };

  // Handle adding ingredient to shopping list (as unavailable)
  const handleAddIngredientToShoppingList = async (ingredient: string) => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in to add ingredients',
        variant: 'destructive',
      });
      return;
    }

    try {
      const category = categorizeIngredient(ingredient);

      // First, ensure the ingredient exists in the system
      await upsertSystemIngredient(ingredient, category);

      // Get current shopping list from database
      const { data: currentData, error: fetchError } = await supabase
        .from('user_groceries')
        .select('shopping_list')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      const currentShoppingList =
        (currentData?.shopping_list as Record<string, string>) || {};

      // Check if already in shopping list
      if (currentShoppingList[ingredient]) {
        toast({
          title: 'Already in List',
          description: `${ingredient} is already in your shopping list`,
        });
        setExtractedIngredients((prev) => prev.filter((n) => n !== ingredient));
        return;
      }

      // Add to shopping list
      const updatedShoppingList = {
        ...currentShoppingList,
        [ingredient]: 'pending',
      };

      // Save to database
      const { error: saveError } = await supabase
        .from('user_groceries')
        .upsert({
          user_id: user.id,
          shopping_list: updatedShoppingList,
          updated_at: new Date().toISOString(),
        });

      if (saveError) throw saveError;

      // Invalidate queries to refresh the shopping list
      queryClient.invalidateQueries({
        queryKey: groceriesKeys.user(user.id),
      });

      toast({
        title: 'Added to Shopping List',
        description: `${ingredient} added as unavailable`,
      });

      // Remove from extracted ingredients panel
      setExtractedIngredients((prev) => prev.filter((n) => n !== ingredient));
    } catch (error) {
      console.error('Error adding to shopping list:', error);
      toast({
        title: 'Error',
        description: 'Failed to add ingredient to shopping list',
        variant: 'destructive',
      });
    }
  };

  // Handle adding ingredient to kitchen (as available)
  const handleAddIngredientToKitchen = async (ingredient: string) => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in to add ingredients',
        variant: 'destructive',
      });
      return;
    }

    try {
      const category = categorizeIngredient(ingredient);
      await upsertSystemIngredient(ingredient, category);

      // Check if already in groceries (available)
      const isInGroceries = groceries.hasIngredient(category, ingredient);

      if (!isInGroceries) {
        // Add to groceries directly (available state)
        const newGroceries = {
          ...(groceries.groceries as Record<string, string[]>),
          [category]: [
            ...((groceries.groceries as Record<string, string[]>)[category] ||
              []),
            ingredient,
          ],
        };

        // Remove from shopping list if present
        const currentShoppingList = groceries.shoppingList as Record<
          string,
          string
        >;
        const { [ingredient]: removed, ...newShoppingList } =
          currentShoppingList;
        console.log('Removed from shopping list:', removed);

        await updateUserGroceries(user.id, newGroceries, newShoppingList);

        // Invalidate queries to refresh the data
        queryClient.invalidateQueries({
          queryKey: groceriesKeys.user(user.id),
        });
      }

      toast({
        title: 'Added to Kitchen',
        description: `${ingredient} added as available`,
      });

      // Remove from extracted ingredients
      setExtractedIngredients((prev) => prev.filter((n) => n !== ingredient));
    } catch (error) {
      console.error('Error adding to kitchen:', error);
      toast({
        title: 'Error',
        description: 'Failed to add ingredient to kitchen',
        variant: 'destructive',
      });
    }
  };

  // Handle adding virtual cart items to kitchen
  const handleAddToKitchen = async () => {
    console.log('🎯 handleAddToKitchen called!');
    const cartItems = Array.from(virtualCart);
    console.log('🛒 Virtual cart items:', cartItems);

    if (cartItems.length === 0) {
      console.log('⚠️ Cart is empty, closing modal');
      setShowCheckoutModal(false);
      if (pendingNavigation) {
        deferNavigation(pendingNavigation);
        setPendingNavigation(null);
      }
      return;
    }

    console.log('✅ Proceeding with adding items to kitchen');
    try {
      console.log('🛒 Adding items to kitchen:', cartItems);
      console.log('📋 Current shopping list:', groceries.shoppingList);
      console.log('🏠 Current groceries:', groceries.groceries);

      // First, ensure all ingredients exist in the system
      for (const ingredient of cartItems) {
        const category = categorizeIngredient(ingredient);
        await upsertSystemIngredient(ingredient, category);
      }

      // Now toggle each ingredient sequentially, awaiting each mutation
      for (const ingredient of cartItems) {
        const category = categorizeIngredient(ingredient);
        console.log(`Processing ${ingredient} in category ${category}`);

        // Check current state before toggle
        const isInGroceries = groceries.hasIngredient(category, ingredient);
        const isInShoppingList = (
          groceries.shoppingList as Record<string, string>
        )[ingredient];
        console.log(
          `${ingredient} - In groceries: ${isInGroceries}, In shopping list: ${isInShoppingList}`
        );

        // Toggle ingredient to make it available in kitchen (awaited)
        // Since it's currently in shopping list (unavailable), toggling will make it available
        await groceries.toggleIngredientAsync(category, ingredient);
        console.log(`✅ ${ingredient} toggled successfully`);
      }

      console.log('✅ All mutations complete');

      toast({
        title: 'Added to Kitchen',
        description: `${cartItems.length} item${cartItems.length > 1 ? 's' : ''} added to your kitchen inventory`,
      });

      // Clear virtual cart and session completed AFTER mutations complete
      setVirtualCart(new Set());
      setSessionCompleted(new Set());
      setShowCheckoutModal(false);

      // Proceed with navigation if pending
      if (pendingNavigation) {
        deferNavigation(pendingNavigation);
        setPendingNavigation(null);
      }
    } catch (error) {
      console.error('Error adding items to kitchen:', error);
      toast({
        title: 'Error',
        description: 'Failed to add some items to kitchen inventory',
        variant: 'destructive',
      });
    }
  };

  // Handle discarding virtual cart items (return to shopping list)
  const handleDiscardCart = () => {
    const cartItems = Array.from(virtualCart);

    // Clear virtual cart and session completed state
    setVirtualCart(new Set());
    setSessionCompleted(new Set());
    setShowCheckoutModal(false);

    toast({
      title: 'Items Returned',
      description: `${cartItems.length} item${cartItems.length > 1 ? 's' : ''} returned to shopping list`,
    });

    // Proceed with navigation if pending
    if (pendingNavigation) {
      deferNavigation(pendingNavigation);
      setPendingNavigation(null);
    }
  };

  // Handle manual checkout (when user clicks a button to finish shopping)
  const handleFinishShopping = () => {
    if (virtualCart.size > 0) {
      setShowCheckoutModal(true);
    } else {
      toast({
        title: 'No Items',
        description:
          'Your virtual cart is empty. Mark items as completed to add them to your cart.',
      });
    }
  };

  if (groceries.loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-96">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  if (groceries.error) {
    return (
      <div className="container mx-auto p-6">
        <div className="alert alert-error">
          <span>Error loading shopping list: {groceries.error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        {/* Mobile-optimized header layout */}
        <div className="space-y-3 sm:space-y-0">
          {/* Top row: Title and icon (mobile: stacked, desktop: side by side) */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">
                  Shopping List
                </h1>
                <p className="text-sm sm:text-base text-base-content/70">
                  {allItems.length} items • {incompleteItems.length} remaining
                </p>
              </div>
            </div>

            {/* Virtual Cart Badge */}
            {virtualCart.size > 0 && (
              <div className="badge badge-success badge-lg gap-2 self-start sm:self-auto">
                <ShoppingBag className="w-4 h-4" />
                {virtualCart.size} in cart
              </div>
            )}
          </div>

          {/* Bottom row: Quick actions (mobile: stacked, desktop: inline) */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Primary actions row (mobile: full width side-by-side) */}
            <div className="flex gap-2 flex-1">
              <button
                className="btn btn-primary btn-sm flex-1 sm:flex-none"
                onClick={() => navigate('/kitchen')}
              >
                <ChefHat className="w-4 h-4" />
                <span className="hidden xs:inline">Return to Kitchen</span>
                <span className="xs:hidden">Kitchen</span>
              </button>
              <button
                className="btn btn-success btn-sm flex-1 sm:flex-none"
                onClick={handleFinishShopping}
                disabled={virtualCart.size === 0}
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden xs:inline">
                  Finish ({virtualCart.size})
                </span>
                <span className="xs:hidden">Finish</span>
              </button>
            </div>

            {/* Secondary actions row (mobile: full width side-by-side) */}
            <div className="flex gap-2 flex-1">
              <button
                className="btn btn-outline btn-sm flex-1 sm:flex-none"
                onClick={handleClearCompleted}
                disabled={completedItems.length === 0}
              >
                <span className="hidden xs:inline">Clear Completed</span>
                <span className="xs:hidden">Completed</span>
              </button>
              <button
                className="btn btn-error btn-outline btn-sm flex-1 sm:flex-none"
                onClick={handleClearAll}
                disabled={allItems.length === 0}
              >
                <span className="hidden xs:inline">Clear All</span>
                <span className="xs:hidden">All</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content - Two column layout on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shopping list - Left column (2/3 width) */}
        <div className="lg:col-span-2">
          {/* Category Tabs */}
          <div className={createDaisyUICardClasses('bordered mb-4')}>
            <div className="card-body p-4">
              <div className="tabs tabs-boxed overflow-x-auto">
                {availableCategories.map((categoryKey) => {
                  const category =
                    categoryKey === 'all'
                      ? { name: 'All Categories', icon: '📋' }
                      : getCategoryMetadata(categoryKey);

                  // Count items in this category
                  const categoryCount = enrichedShoppingListItems.filter(
                    (ing) => {
                      // Use O(1) Map lookup instead of find()
                      const status =
                        ingredientStatusMap.get(ing.name) ?? 'pending';
                      const matchesTab =
                        activeTab === 'all' ||
                        (activeTab === 'completed' && status === 'purchased') ||
                        (activeTab === 'incomplete' && status !== 'purchased');
                      return (
                        (categoryKey === 'all' ||
                          ing.category === categoryKey) &&
                        matchesTab
                      );
                    }
                  ).length;

                  return (
                    <button
                      key={categoryKey}
                      className={`tab ${activeCategory === categoryKey ? 'tab-active' : ''}`}
                      onClick={() => handleCategoryChange(categoryKey)}
                    >
                      <span className="flex items-center space-x-2">
                        <span>{category.icon}</span>
                        <span className="hidden sm:inline">
                          {category.name}
                        </span>
                        <span className="sm:hidden">
                          {categoryKey === 'all'
                            ? 'All'
                            : category.name.split(' ')[0]}
                        </span>
                        {categoryCount > 0 && (
                          <span className="badge badge-sm badge-primary">
                            {categoryCount}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Subcategory Filter - Only show when a specific category is selected */}
          {activeCategory !== 'all' && (
            <div className={createDaisyUICardClasses('bordered mb-4')}>
              <div className="card-body p-4">
                <SubcategoryFilter
                  category={activeCategory as ChefIsabellaCategory}
                  activeSubcategory={activeSubcategory}
                  onSubcategoryChange={setActiveSubcategory}
                  ingredientCounts={subcategoryCounts}
                />
              </div>
            </div>
          )}

          {/* Status Tabs (To Buy / Completed / All) */}
          <div className="tabs tabs-boxed mb-4">
            <button
              className={`tab ${activeTab === 'incomplete' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('incomplete')}
            >
              To Buy ({incompleteItems.length})
            </button>
            <button
              className={`tab ${activeTab === 'completed' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('completed')}
            >
              Completed ({completedItems.length})
            </button>
            <button
              className={`tab ${activeTab === 'all' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All Items ({allItems.length})
            </button>
          </div>

          {/* Shopping Items - Hierarchical Display */}
          {Object.keys(groupedShoppingList).length === 0 ? (
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body text-center py-12">
                <ShoppingCart className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {activeTab === 'completed'
                    ? 'No completed items'
                    : 'Your shopping list is empty'}
                </h3>
                <p className="text-base-content/70 mb-4">
                  {activeTab === 'completed'
                    ? 'Complete some items to see them here.'
                    : 'Mark ingredients as unavailable in your kitchen to add them to your shopping list.'}
                </p>
              </div>
            </div>
          ) : (
            Object.entries(groupedShoppingList).map(
              ([category, subcategoryGroups]) => {
                const categoryMeta = getCategoryMetadata(category);
                const totalInCategory = Object.values(subcategoryGroups).reduce(
                  (sum, items) => sum + items.length,
                  0
                );

                return (
                  <div key={category} className="mb-6">
                    {/* Category Header */}
                    <div className={createDaisyUICardClasses('bordered mb-3')}>
                      <div className="card-body p-3">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                          <span>{categoryMeta.icon}</span>
                          <span>{categoryMeta.name}</span>
                          <span className="text-sm font-normal text-gray-500">
                            ({totalInCategory})
                          </span>
                        </h2>
                      </div>
                    </div>

                    {/* Subcategory Sections */}
                    {Object.entries(subcategoryGroups)
                      .sort(([subA], [subB]) => {
                        // Sort by subcategory metadata sortOrder
                        if (
                          subA === 'uncategorized' &&
                          subB === 'uncategorized'
                        )
                          return 0;
                        if (subA === 'uncategorized') return 1;
                        if (subB === 'uncategorized') return -1;
                        const metaA = getSubcategoryMetadata(subA);
                        const metaB = getSubcategoryMetadata(subB);
                        return metaA.sortOrder - metaB.sortOrder;
                      })
                      .map(([subcategory, items]) => {
                        const subcategoryMeta =
                          getSubcategoryMetadata(subcategory);

                        return (
                          <div
                            key={`${category}-${subcategory}`}
                            className="card bg-base-100 shadow-md border border-base-300 mb-4"
                          >
                            <div className="card-body p-4">
                              {/* Subcategory Header */}
                              <h3 className="text-md font-semibold mb-2 flex items-center gap-2 text-gray-700">
                                <span className="text-lg">
                                  {subcategoryMeta.icon}
                                </span>
                                <span>{subcategoryMeta.label}</span>
                                <span className="text-sm font-normal text-gray-500">
                                  ({items.length})
                                </span>
                              </h3>

                              {/* Ingredients List */}
                              <div className="space-y-3">
                                {items.map(
                                  (enrichedIng: EnrichedUserIngredient) => {
                                    // Use O(1) Map lookup for ingredient status
                                    const status =
                                      ingredientStatusMap.get(
                                        enrichedIng.name
                                      ) ?? 'pending';

                                    return (
                                      <div
                                        key={enrichedIng.name}
                                        className="card bg-base-100 shadow-sm border"
                                      >
                                        <div className="card-body p-4">
                                          <div className="flex items-start gap-3">
                                            <button
                                              className={`btn btn-circle btn-sm ${status === 'purchased' ? 'btn-success' : 'btn-outline'}`}
                                              onClick={() => {
                                                // Session-only toggle: mark/unmark as completed in this session
                                                setSessionCompleted((prev) => {
                                                  const next = new Set(prev);
                                                  if (
                                                    next.has(enrichedIng.name)
                                                  ) {
                                                    next.delete(
                                                      enrichedIng.name
                                                    );
                                                  } else {
                                                    next.add(enrichedIng.name);
                                                  }
                                                  return next;
                                                });

                                                // Add/remove from virtual cart
                                                setVirtualCart((prev) => {
                                                  const next = new Set(prev);
                                                  if (
                                                    next.has(enrichedIng.name)
                                                  ) {
                                                    next.delete(
                                                      enrichedIng.name
                                                    );
                                                  } else {
                                                    next.add(enrichedIng.name);
                                                  }
                                                  return next;
                                                });
                                              }}
                                            >
                                              {status === 'purchased' ? (
                                                <Check className="w-4 h-4" />
                                              ) : (
                                                <div className="w-4 h-4" />
                                              )}
                                            </button>
                                            <div className="flex-1">
                                              <h3
                                                className={`font-semibold ${status === 'purchased' ? 'line-through' : ''}`}
                                              >
                                                {enrichedIng.name}
                                              </h3>
                                              <div className="flex items-center gap-2 mt-1">
                                                <div className="badge badge-primary badge-sm">
                                                  <ShoppingCart className="w-3 h-3 mr-1" />
                                                  <span>Kitchen Restock</span>
                                                </div>
                                                {!enrichedIng.isMatched && (
                                                  <span className="badge badge-warning badge-xs">
                                                    Not in catalog
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                );
              }
            )
          )}
        </div>

        {/* Right column placeholder container (reserved for future content) */}
        <div className="lg:col-span-1">
          <IngredientRecommendationsPanel
            extractedIngredients={extractedIngredients}
            onRemoveIngredient={(name) =>
              setExtractedIngredients((prev) => prev.filter((n) => n !== name))
            }
            onAddToShoppingList={handleAddIngredientToShoppingList}
            onAddToKitchen={handleAddIngredientToKitchen}
            loading={groceries.loading || cartLoading}
          />
        </div>
      </div>

      {/* AI Assistant - moved below the shopping list */}
      <div className="mt-6">
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            {/* AI Assistant Header */}
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Your Cooking Assistant</h3>
                <p className="text-sm text-base-content/70">
                  Ask me what ingredients you need for any cuisine!
                </p>
              </div>
            </div>

            {/* Chat Interface */}
            <div className="h-96">
              <ShoppingCartChat
                placeholder="What do I need for authentic Mexican cooking?"
                onChatResponse={getChatResponse}
                onAddAll={async () => {
                  const allMissing = getAllMissingStaples();
                  if (allMissing.length === 0) return;
                  const focus = allMissing[0];
                  const recs = getRecommendedAdditions(
                    focus.cuisine.toLowerCase(),
                    6
                  ).map((s) => s.ingredient);
                  await addStaplesToGroceriesAsUnavailable(recs);
                }}
                onTranscriptChange={(t) => setAssistantTranscript(t)}
                onIngredientsExtracted={(ingredients) => {
                  setExtractedIngredients((prev) => [
                    ...new Set([...prev, ...ingredients]),
                  ]);
                }}
                className="h-full"
              />
            </div>

            {/* Quick suggestion buttons */}
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-base-content/80">
                Quick suggestions:
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  className="btn btn-sm btn-accent"
                  onClick={() => {
                    const list =
                      extractIngredientsFromTranscript(assistantTranscript);
                    setExtractedIngredients(list);
                    toast({
                      title: 'Ingredients listed',
                      description: `${list.length} found`,
                    });
                  }}
                >
                  List Ingredients
                </button>
                <button
                  className="btn btn-sm btn-outline text-left justify-start"
                  onClick={() =>
                    getChatResponse(
                      'What do I need for authentic Mexican cooking?'
                    )
                  }
                >
                  🌮 Mexican essentials
                </button>
                <button
                  className="btn btn-sm btn-outline text-left justify-start"
                  onClick={() =>
                    getChatResponse('What do I need for Italian pasta dishes?')
                  }
                >
                  🍝 Italian basics
                </button>
                <button
                  className="btn btn-sm btn-outline text-left justify-start"
                  onClick={() =>
                    getChatResponse('What Asian ingredients should I stock?')
                  }
                >
                  🥢 Asian staples
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cuisine Staples Display - Bottom Section (Grouped by Region with Accordion) */}
      {(() => {
        const regionForCuisine = (name: string): string => {
          const n = name.toLowerCase();
          // Broad family groups
          if (
            [
              'asian',
              'thai',
              'chinese',
              'japanese',
              'korean',
              'vietnamese',
              'indian',
              'indonesian',
              'malaysian',
              'singaporean',
              'filipino',
              'isaan',
            ].some((k) => n.includes(k))
          )
            return 'Asian';
          if (
            [
              'europe',
              'italian',
              'french',
              'spanish',
              'greek',
              'german',
              'portuguese',
              'russian',
              'polish',
              'hungarian',
              'austrian',
              'swiss',
              'dutch',
              'belgian',
              'swedish',
            ].some((k) => n.includes(k))
          )
            return 'European';
          if (
            [
              'american',
              'cajun',
              'creole',
              'southern',
              'new england',
              'pacific northwest',
              'mid-atlantic',
              'southwest',
              'lowcountry',
              'hawaiian',
              'appalachian',
              'midwestern',
              'tex-mex',
              'texas',
              'kansas city',
              'california',
            ].some((k) => n.includes(k))
          )
            return 'American';
          if (
            [
              'latin',
              'mexican',
              'brazilian',
              'peruvian',
              'argentin',
              'chilean',
              'colombian',
              'venezuelan',
              'uruguayan',
              'paraguayan',
              'bolivian',
              'ecuadorian',
            ].some((k) => n.includes(k))
          )
            return 'Latin American';
          if (
            ['lebanese', 'turkish', 'middle eastern', 'persian'].some((k) =>
              n.includes(k)
            )
          )
            return 'Middle Eastern';
          if (['jamaican', 'caribbean'].some((k) => n.includes(k)))
            return 'Caribbean';
          if (['ethiopian', 'moroccan', 'african'].some((k) => n.includes(k)))
            return 'African';
          if (
            ['scandinavian', 'norwegian', 'danish'].some((k) => n.includes(k))
          )
            return 'Scandinavian';
          if (
            ['fusion', 'modern american', 'international'].some((k) =>
              n.includes(k)
            )
          )
            return 'Fusion & Modern';
          if (
            ['vegetarian', 'health', 'keto', 'vegan', 'paleo'].some((k) =>
              n.includes(k)
            )
          )
            return 'Diet & Health';
          if (
            ['specialty', 'technique', 'cooking method'].some((k) =>
              n.includes(k)
            )
          )
            return 'Specialty Methods';
          return 'Other';
        };

        const allMissingStaples = getAllMissingStaples();
        if (allMissingStaples.length === 0) return null;

        const grouped: Record<string, typeof allMissingStaples> = {};
        for (const item of allMissingStaples) {
          const group = regionForCuisine(item.cuisine);
          if (!grouped[group]) grouped[group] = [];
          grouped[group].push(item);
        }

        const regionOrder = [
          'American',
          'Latin American',
          'Asian',
          'European',
          'Middle Eastern',
          'Caribbean',
          'African',
          'Scandinavian',
          'Fusion & Modern',
          'Diet & Health',
          'Specialty Methods',
          'Other',
        ];

        return (
          <div className="mt-8">
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body">
                <h3 className="card-title text-lg">
                  <span className="text-primary">🌍</span> Cuisine Staples
                </h3>
                <p className="text-sm text-base-content/70 mb-4">
                  Missing essential ingredients for authentic cooking, grouped
                  by region
                </p>

                <div className="join join-vertical w-full">
                  {regionOrder
                    .filter((r) => grouped[r] && grouped[r].length > 0)
                    .map((region) => (
                      <div
                        key={region}
                        className="collapse collapse-arrow join-item border border-base-300 bg-base-200"
                      >
                        <input
                          type="checkbox"
                          defaultChecked={region === 'American'}
                        />
                        <div className="collapse-title text-md font-semibold">
                          {region}{' '}
                          <span className="badge badge-outline ml-2">
                            {grouped[region].length}
                          </span>
                        </div>
                        <div className="collapse-content">
                          <div className="space-y-3">
                            {grouped[region].map((cuisineData, index) => {
                              const allStaples = getCuisineStaples(
                                cuisineData.cuisine.toLowerCase()
                              );
                              const actuallyMissing = allStaples.filter(
                                (staple) =>
                                  !isAvailableInKitchen(staple.ingredient)
                              );
                              const actualCoverage =
                                allStaples.length > 0
                                  ? Math.round(
                                      ((allStaples.length -
                                        actuallyMissing.length) /
                                        allStaples.length) *
                                        100
                                    )
                                  : 0;

                              return (
                                <div
                                  key={`${region}-${index}`}
                                  className="p-3 bg-base-100 rounded-lg border border-base-300"
                                >
                                  {/* Mobile-optimized cuisine card layout */}
                                  <div className="space-y-3 sm:space-y-0">
                                    {/* Top row: Cuisine name and badges */}
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                      <span className="font-semibold text-lg">
                                        {cuisineData.cuisine}
                                      </span>
                                      <div className="flex flex-wrap gap-1 sm:gap-2">
                                        <div className="badge badge-outline badge-sm">
                                          {actualCoverage}% coverage
                                        </div>
                                        <div className="badge badge-warning badge-sm">
                                          {actuallyMissing.length} missing
                                        </div>
                                        <div className="badge badge-info badge-sm">
                                          {allStaples.length} total staples
                                        </div>
                                      </div>
                                    </div>

                                    {/* Middle row: Missing ingredients */}
                                    <div className="text-sm text-base-content/60">
                                      <span className="font-medium">
                                        Missing:
                                      </span>{' '}
                                      <span className="break-words">
                                        {actuallyMissing
                                          .slice(0, 3)
                                          .map((s) => s.ingredient)
                                          .join(', ')}
                                        {actuallyMissing.length > 3 &&
                                          ` +${actuallyMissing.length - 3} more`}
                                      </span>
                                    </div>

                                    {/* Bottom row: Action buttons */}
                                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
                                      <button
                                        className="btn btn-sm btn-outline flex-1 sm:flex-none"
                                        onClick={() => {
                                          setSelectedCuisine(
                                            cuisineData.cuisine
                                          );
                                          setIsModalOpen(true);
                                        }}
                                      >
                                        View All ({allStaples.length})
                                      </button>
                                      <button
                                        className="btn btn-sm btn-primary flex-1 sm:flex-none"
                                        onClick={async () => {
                                          const recommendations =
                                            getRecommendedAdditions(
                                              cuisineData.cuisine.toLowerCase(),
                                              3
                                            );
                                          const ingredients =
                                            recommendations.map(
                                              (s) => s.ingredient
                                            );
                                          await addStaplesToGroceriesAsUnavailable(
                                            ingredients
                                          );
                                        }}
                                      >
                                        Add Essentials
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Checkout Modal */}
      <Dialog open={showCheckoutModal} onOpenChange={setShowCheckoutModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-success" />
              Finish Shopping?
            </DialogTitle>
            <DialogDescription>
              You have {virtualCart.size} item
              {virtualCart.size !== 1 ? 's' : ''} in your virtual cart. What
              would you like to do with {virtualCart.size === 1 ? 'it' : 'them'}
              ?
            </DialogDescription>
          </DialogHeader>

          {/* Cart Items Preview */}
          <div className="my-4">
            <h4 className="text-sm font-semibold mb-2 text-gray-700">
              Items in cart:
            </h4>
            <div className="max-h-48 overflow-y-auto space-y-2 bg-gray-50 p-3 rounded-lg">
              {Array.from(virtualCart).map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-success" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button
              onClick={handleAddToKitchen}
              className="w-full bg-success hover:bg-success/90 text-white"
            >
              <PackageIcon className="w-4 h-4 mr-2" />
              Add to Kitchen
            </Button>
            <Button
              onClick={handleDiscardCart}
              variant="outline"
              className="w-full"
            >
              Return to Shopping List
            </Button>
            <Button
              onClick={() => {
                setShowCheckoutModal(false);
                setPendingNavigation(null);
              }}
              variant="ghost"
              className="w-full"
            >
              Continue Shopping
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cuisine Staples Modal */}
      {isModalOpen && selectedCuisine && (
        <div className="modal modal-open">
          <div className="modal-box max-w-6xl">
            <h3 className="font-bold text-lg mb-4">
              {selectedCuisine} Cuisine Staples
              {(() => {
                const allStaples = getCuisineStaples(
                  selectedCuisine.toLowerCase()
                );
                // Calculate actual missing ingredients by checking each staple against user's kitchen
                const actuallyMissing = allStaples.filter(
                  (staple) => !isAvailableInKitchen(staple.ingredient)
                );
                const actualCoverage =
                  allStaples.length > 0
                    ? Math.round(
                        ((allStaples.length - actuallyMissing.length) /
                          allStaples.length) *
                          100
                      )
                    : 0;
                return (
                  <div className="text-sm font-normal text-base-content/70 mt-1">
                    {actualCoverage}% coverage • {actuallyMissing.length}{' '}
                    missing • {allStaples.length} total staples
                  </div>
                );
              })()}
            </h3>

            {/* Search functionality */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search ingredients..."
                className="input input-bordered w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Grid layout for ingredients */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 max-h-96 overflow-y-auto">
              {getCuisineStaples(selectedCuisine.toLowerCase())
                .filter(
                  (staple) =>
                    !searchQuery.trim() ||
                    staple.ingredient
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase()) ||
                    staple.reason
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase())
                )
                .map((staple) => {
                  // Use the same logic as global ingredients page
                  const isInUserCart = isAvailableInKitchen(staple.ingredient); // Check if available in kitchen
                  const isSystemAvailable = true; // All cuisine staples are system ingredients
                  const isHidden = false; // Cuisine staples are never hidden

                  return (
                    <IngredientCard
                      key={staple.ingredient}
                      ingredient={{
                        id: staple.ingredient,
                        name: staple.ingredient,
                        normalized_name: staple.ingredient.toLowerCase(),
                        category: staple.category,
                        synonyms: [],
                        is_system: true,
                        usage_count: 0,
                        is_verified: true,
                        first_seen_at: new Date().toISOString(),
                        last_seen_at: new Date().toISOString(),
                        created_by: 'system',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                      }}
                      isInUserCart={isInUserCart}
                      isSystemAvailable={isSystemAvailable}
                      isHidden={isHidden}
                      onAddToGroceries={handleAddToGroceriesAsUnavailable}
                      onRemoveFromGroceries={handleRemoveFromGroceries}
                      onToggleHidden={async () => {}}
                      loading={groceries.loading || false}
                      cartLoading={cartLoading || false}
                    />
                  );
                })}
            </div>

            {/* Modal actions */}
            <div className="modal-action">
              <button
                className="btn btn-primary"
                onClick={async () => {
                  const recommendations = getRecommendedAdditions(
                    selectedCuisine.toLowerCase(),
                    5
                  );
                  const ingredients = recommendations.map((s) => s.ingredient);
                  await addStaplesToGroceriesAsUnavailable(ingredients);
                }}
              >
                Add Top 5 Essentials to Kitchen (Unavailable)
              </button>
              <button
                className="btn"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedCuisine(null);
                  setSearchQuery('');
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
