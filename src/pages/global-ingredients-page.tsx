import { useMemo, useState } from 'react';
import { useGlobalIngredients } from '@/hooks/useGlobalIngredients';
// no matcher needed here; use a simple UI normalizer aligned with matcher semantics
import { useGroceriesQuery } from '@/hooks/useGroceriesQuery';
import { useUserGroceryCart } from '@/hooks/useUserGroceryCart';
import { createDaisyUICardClasses } from '@/lib/card-migration';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw, Globe, Database, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  getCategoryMetadata,
  getAvailableCategories,
  getSubcategoryMetadata,
  type ChefIsabellaCategory,
} from '@/lib/groceries/category-mapping';
import type { GlobalIngredient } from '@/lib/groceries/enhanced-ingredient-matcher';
import { IngredientCard } from '@/components/groceries/IngredientCard';
import { upsertSystemIngredient } from '@/lib/ingredients/upsertSystemIngredient';
import { SubcategoryFilter } from '@/components/groceries/SubcategoryFilter';

export default function GlobalIngredientsPage() {
  const {
    globalIngredients,
    hiddenNormalizedNames,
    loading,
    error,
    refreshGlobalIngredients,
    hideIngredient,
    unhideIngredient,
  } = useGlobalIngredients();
  const groceries = useGroceriesQuery();
  const {
    loading: cartLoading,
    error: cartError,
    addToCart,
    removeFromCart,
    isInCart,
  } = useUserGroceryCart();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(
    null
  );

  // Group ingredients by category and optionally by subcategory
  const grouped = useMemo(() => {
    const items = globalIngredients
      .filter(
        (g) =>
          !query.trim() || g.name.toLowerCase().includes(query.toLowerCase())
      )
      .filter((g) =>
        activeCategory === 'all' ? true : g.category === activeCategory
      )
      .filter((g) =>
        activeSubcategory ? g.subcategory === activeSubcategory : true
      );

    // Group by category, then by subcategory
    const map: Record<string, Record<string, GlobalIngredient[]>> = {};

    items.forEach((g) => {
      if (!map[g.category]) map[g.category] = {};
      const subcategory = g.subcategory || 'uncategorized';
      if (!map[g.category][subcategory]) map[g.category][subcategory] = [];
      map[g.category][subcategory].push(g);
    });

    return map;
  }, [globalIngredients, query, activeCategory, activeSubcategory]);

  // Get available categories from global ingredients data using consistent mapping
  const availableCategories = useMemo(() => {
    return getAvailableCategories(globalIngredients);
  }, [globalIngredients]);

  // Note: Normalization logic removed - now using multi-category-aware isInCart() function

  const handleAddToGroceries = async (category: string, name: string) => {
    await upsertSystemIngredient(name, category);
    await addToCart(category, name);
  };

  const handleRemoveFromGroceries = async (name: string) => {
    await removeFromCart(name);
  };

  const handleToggleHidden = async (name: string, normalized: string) => {
    if (hiddenNormalizedNames.has(normalized)) {
      await unhideIngredient(name);
    } else {
      await hideIngredient(name);
    }
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setActiveSubcategory(null); // Reset subcategory when category changes
  };

  // Calculate subcategory counts for the active category
  const subcategoryCounts = useMemo(() => {
    if (activeCategory === 'all') return {};

    const counts: Record<string, number> = {};
    globalIngredients
      .filter((g) => g.category === activeCategory)
      .filter(
        (g) =>
          !query.trim() || g.name.toLowerCase().includes(query.toLowerCase())
      )
      .forEach((g) => {
        const subcategory = g.subcategory || 'uncategorized';
        counts[subcategory] = (counts[subcategory] || 0) + 1;
      });

    return counts;
  }, [globalIngredients, activeCategory, query]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-teal-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Enhanced Header Section */}
        <div className="mb-8">
          {/* Title Row */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
              <Database className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                My Ingredients
              </h1>
              <p className="text-sm text-gray-600">
                Browse and manage your ingredient library
              </p>
            </div>
          </div>

          {/* Stats and Actions Row */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Stats Cards */}
            <div className="flex flex-wrap gap-3">
              {/* Total Ingredients Card */}
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                  <Database className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Ingredients</p>
                  <p className="text-lg font-bold text-blue-600">
                    {globalIngredients.length}
                  </p>
                </div>
              </div>

              {/* Added to Kitchen Card */}
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                  <Package className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Added to Kitchen</p>
                  <p className="text-lg font-bold text-green-600">
                    {groceries.getTotalCount()}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search ingredients..."
                  className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-black"
                />
              </div>
              <div className="flex items-center gap-2">
                <Link to="/kitchen" className="btn btn-outline btn-sm">
                  <Globe className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">My Kitchen</span>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshGlobalIngredients}
                  disabled={loading}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                  />
                </Button>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-medium">💡 Tip:</span> Click ingredients to
              add them to your kitchen inventory
            </p>
          </div>
        </div>

        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}

        {cartError && (
          <div className="alert alert-warning mb-4">
            <span>Cart Error: {cartError}</span>
          </div>
        )}

        {/* Category Tabs */}
        <div className={createDaisyUICardClasses('bordered mb-4')}>
          <div className="card-body p-4">
            <div className="tabs tabs-boxed overflow-x-auto">
              <button
                className={`tab ${activeCategory === 'all' ? 'tab-active' : ''}`}
                onClick={() => handleCategoryChange('all')}
              >
                All
              </button>
              {availableCategories.map((category) => {
                const categoryMeta = getCategoryMetadata(category);
                return (
                  <button
                    key={category}
                    className={`tab ${activeCategory === category ? 'tab-active' : ''}`}
                    onClick={() => handleCategoryChange(category)}
                  >
                    <span className="flex items-center space-x-2">
                      <span>{categoryMeta.icon}</span>
                      <span className="hidden sm:inline">
                        {categoryMeta.name}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Subcategory Filter - Only show when a specific category is selected */}
        {activeCategory !== 'all' && (
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

        {loading || cartLoading ? (
          <div className={createDaisyUICardClasses('bordered')}>
            <div className="card-body">
              <div className="animate-pulse text-gray-500">
                Loading my ingredients…
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
                            {items.map((ing) => {
                              // Use the new multi-category-aware cart checking
                              const isInUserCart = isInCart(ing.name);
                              const isSystemAvailable = Boolean(
                                ing.is_system &&
                                  !hiddenNormalizedNames.has(
                                    ing.normalized_name
                                  )
                              );
                              const isHidden = hiddenNormalizedNames.has(
                                ing.normalized_name
                              );

                              return (
                                <IngredientCard
                                  key={ing.id}
                                  ingredient={ing}
                                  isInUserCart={isInUserCart}
                                  isSystemAvailable={isSystemAvailable}
                                  isHidden={isHidden}
                                  onAddToGroceries={handleAddToGroceries}
                                  onRemoveFromGroceries={
                                    handleRemoveFromGroceries
                                  }
                                  onToggleHidden={handleToggleHidden}
                                  loading={groceries.loading || false}
                                  cartLoading={cartLoading || false}
                                />
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
