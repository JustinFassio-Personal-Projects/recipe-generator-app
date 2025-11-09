import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useGroceriesQuery } from '@/hooks/useGroceriesQuery';
import { Button } from '@/components/ui/button';
import {
  getCategoryMetadata,
  getAvailableCategories,
  getSubcategoryMetadata,
  type ChefIsabellaCategory,
} from '@/lib/groceries/category-mapping';
import { createDaisyUICardClasses } from '@/lib/card-migration';
import { IngredientMatchingTest } from '@/components/groceries/ingredient-matching-test';
import { GroceryCard } from '@/components/groceries/GroceryCard';
import { SubcategoryFilter } from '@/components/groceries/SubcategoryFilter';
import {
  RefreshCw,
  Globe,
  Search,
  ChefHat,
  ShoppingCart,
  Package,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGlobalIngredients } from '@/hooks/useGlobalIngredients';
import { getCategories } from '@/lib/ingredients/repository';
import { resolveCategoryForIngredient } from './utils/resolve-category';
import {
  enrichUserIngredients,
  groupEnrichedIngredients,
  normalizeIngredientName,
  type EnrichedUserIngredient,
} from '@/lib/groceries/enrich-user-ingredients';

export function KitchenInventoryPage() {
  const { user } = useAuth();
  const groceries = useGroceriesQuery();
  const { hiddenNormalizedNames, globalIngredients } = useGlobalIngredients();
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(
    null
  );
  const [normalizedCategories, setNormalizedCategories] = useState<string[]>(
    []
  );
  const [query, setQuery] = useState('');

  const availableCategories = useMemo(() => {
    // Prefer normalized categories if present; fallback to legacy mapping
    const slugs =
      normalizedCategories.length > 0
        ? normalizedCategories
        : getAvailableCategories(globalIngredients);
    return ['all', ...slugs];
  }, [normalizedCategories, globalIngredients]);

  useEffect(() => {
    if (availableCategories.length > 0 && !activeCategory) {
      setActiveCategory('all');
    }
  }, [availableCategories, activeCategory]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const cats = await getCategories();
        if (!mounted) return;
        setNormalizedCategories(cats.map((c) => c.slug));
      } catch {
        // swallow; fallback will be used
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const getCategoryCount = (category: string) => {
    return groceries.getCategoryCount(category);
  };

  const handleRefresh = async () => {
    groceries.refetch();
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setActiveSubcategory(null); // Reset subcategory when category changes
  };

  // Enrich user ingredients with global catalog metadata
  const enrichedIngredients = useMemo(() => {
    return enrichUserIngredients(
      groceries.groceries as Record<string, string[]>,
      globalIngredients
    );
  }, [groceries.groceries, globalIngredients]);

  // Group ingredients by category and subcategory with filtering
  const grouped = useMemo(() => {
    // Filter by query
    const filtered = enrichedIngredients.filter((ing) => {
      const matchesQuery =
        !query.trim() || ing.name.toLowerCase().includes(query.toLowerCase());

      // Filter by hidden using shared normalization function
      const normalized = normalizeIngredientName(ing.name);
      const isNotHidden = !hiddenNormalizedNames.has(normalized);

      // Filter by category
      const matchesCategory =
        activeCategory === 'all' ||
        activeCategory === '' ||
        ing.category === activeCategory;

      // Filter by subcategory
      const matchesSubcategory = activeSubcategory
        ? ing.subcategory === activeSubcategory
        : true;

      return (
        matchesQuery && isNotHidden && matchesCategory && matchesSubcategory
      );
    });

    // Group by category and subcategory
    return groupEnrichedIngredients(filtered);
  }, [
    enrichedIngredients,
    query,
    hiddenNormalizedNames,
    activeCategory,
    activeSubcategory,
  ]);

  // Calculate subcategory counts for the active category
  const subcategoryCounts = useMemo(() => {
    if (activeCategory === 'all' || !activeCategory) return {};

    const counts: Record<string, number> = {};
    enrichedIngredients
      .filter((ing) => ing.category === activeCategory)
      .filter((ing) => {
        const matchesQuery =
          !query.trim() || ing.name.toLowerCase().includes(query.toLowerCase());
        // Use shared normalization function
        const normalized = normalizeIngredientName(ing.name);
        const isNotHidden = !hiddenNormalizedNames.has(normalized);
        return matchesQuery && isNotHidden;
      })
      .forEach((ing) => {
        const subcategory = ing.subcategory || 'uncategorized';
        counts[subcategory] = (counts[subcategory] || 0) + 1;
      });

    return counts;
  }, [enrichedIngredients, activeCategory, query, hiddenNormalizedNames]);

  const ingredientToCategoryMap = useMemo(() => {
    const map = new Map<string, string>();
    Object.entries(groceries.groceries).forEach(([category, ingredients]) => {
      if (Array.isArray(ingredients)) {
        ingredients.forEach((ingredient) => {
          map.set(ingredient, category);
        });
      }
    });
    return map;
  }, [groceries.groceries]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-teal-50">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className={createDaisyUICardClasses('bordered')}>
            <div className="card-body text-center">
              <h2 className="card-title justify-center">
                Authentication Required
              </h2>
              <p>Please sign in to manage your groceries.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-teal-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Enhanced Header Section */}
        <div className="mb-8">
          {/* Title Row */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg">
              <ChefHat className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Kitchen</h1>
              <p className="text-sm text-gray-600">
                Manage your ingredient inventory
              </p>
            </div>
          </div>

          {/* Stats and Actions Row */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Stats Cards */}
            <div className="flex flex-wrap gap-3">
              {/* Available Ingredients Card */}
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                  <Package className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">In Stock</p>
                  <p className="text-lg font-bold text-green-600">
                    {groceries.getTotalCount()}
                  </p>
                </div>
              </div>

              {/* Shopping List Card */}
              <Link
                to="/cart"
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100">
                  <ShoppingCart className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Shopping List</p>
                  <p className="text-lg font-bold text-orange-600">
                    {groceries.getShoppingListCount()}
                  </p>
                </div>
              </Link>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search ingredients..."
                  className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-black"
                />
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/global-ingredients"
                  className="btn btn-outline btn-sm"
                >
                  <Globe className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">My Ingredients</span>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={groceries.loading}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${groceries.loading ? 'animate-spin' : ''}`}
                  />
                </Button>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-medium">💡 Tip:</span> Click ingredients to
              toggle between <span className="font-semibold">In Stock</span>{' '}
              (available) and <span className="font-semibold">Need to Buy</span>{' '}
              (added to shopping list)
            </p>
          </div>
        </div>

        {groceries.error && (
          <div className="alert alert-error mb-6">
            <span>{groceries.error}</span>
          </div>
        )}

        {/* Category Tabs */}
        <div className={createDaisyUICardClasses('bordered mb-4')}>
          <div className="card-body p-4">
            <div className="tabs tabs-boxed overflow-x-auto">
              {availableCategories.map((categoryKey) => {
                const category =
                  categoryKey === 'all'
                    ? { name: 'All Categories', icon: '📋' }
                    : getCategoryMetadata(categoryKey);
                const count = getCategoryCount(categoryKey);
                return (
                  <button
                    key={categoryKey}
                    className={`tab ${activeCategory === categoryKey ? 'tab-active' : ''}`}
                    onClick={() => handleCategoryChange(categoryKey)}
                  >
                    <span className="flex items-center space-x-2">
                      <span>{category.icon}</span>
                      <span className="hidden sm:inline">{category.name}</span>
                      <span className="sm:hidden">
                        {categoryKey === 'all'
                          ? 'All'
                          : category.name.split(' ')[0]}
                      </span>
                      {count > 0 && (
                        <span className="badge badge-sm badge-primary">
                          {count}
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
        {activeCategory !== 'all' && activeCategory !== '' && (
          <div className={createDaisyUICardClasses('bordered mb-6')}>
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

        {/* Ingredients Display - Hierarchical by Category and Subcategory */}
        {groceries.loading ? (
          <div className={createDaisyUICardClasses('bordered')}>
            <div className="card-body">
              <div className="animate-pulse text-gray-500">
                Loading ingredients…
              </div>
            </div>
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className={createDaisyUICardClasses('bordered')}>
            <div className="card-body text-gray-600">No ingredients found.</div>
          </div>
        ) : (
          Object.entries(grouped).map(([category, subcategoryGroups]) => {
            const categoryMeta = getCategoryMetadata(category);
            const totalInCategory = Object.values(subcategoryGroups).reduce(
              (sum, items) => sum + items.length,
              0
            );

            return (
              <div key={category} className="mb-8">
                {/* Category Header */}
                <div className={createDaisyUICardClasses('bordered mb-4')}>
                  <div className="card-body p-4">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
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
                    if (subA === 'uncategorized' && subB === 'uncategorized')
                      return 0;
                    if (subA === 'uncategorized') return 1;
                    if (subB === 'uncategorized') return -1;
                    const metaA = getSubcategoryMetadata(subA);
                    const metaB = getSubcategoryMetadata(subB);
                    return metaA.sortOrder - metaB.sortOrder;
                  })
                  .map(([subcategory, items]) => {
                    const subcategoryMeta = getSubcategoryMetadata(subcategory);

                    return (
                      <div
                        key={`${category}-${subcategory}`}
                        className={createDaisyUICardClasses('bordered mb-4')}
                      >
                        <div className="card-body">
                          {/* Subcategory Header */}
                          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-gray-700">
                            <span className="text-xl">
                              {subcategoryMeta.icon}
                            </span>
                            <span>{subcategoryMeta.label}</span>
                            <span className="text-sm font-normal text-gray-500">
                              ({items.length})
                            </span>
                          </h3>

                          {/* Ingredients Grid */}
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {items.map(
                              (enrichedIng: EnrichedUserIngredient) => {
                                const ingredientCategory =
                                  resolveCategoryForIngredient(
                                    enrichedIng.name,
                                    activeCategory,
                                    groceries.groceries,
                                    ingredientToCategoryMap
                                  );
                                if (!ingredientCategory) return null;

                                const isAvailable = groceries.hasIngredient(
                                  ingredientCategory,
                                  enrichedIng.name
                                );

                                return (
                                  <GroceryCard
                                    key={enrichedIng.name}
                                    ingredient={enrichedIng.name}
                                    category={ingredientCategory}
                                    loading={groceries.loading}
                                    isSelected={isAvailable}
                                    onToggle={groceries.toggleIngredient}
                                  />
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
          })
        )}

        {groceries.error && (
          <div className="alert alert-warning mb-4">
            <span>Groceries Error: {groceries.error}</span>
          </div>
        )}

        {groceries.getTotalCount() > 0 && (
          <div className={createDaisyUICardClasses('bordered mt-6')}>
            <div className="card-body">
              <h3 className="card-title text-lg mb-4">
                🧪 Ingredient Matching Test
              </h3>
              <IngredientMatchingTest />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
