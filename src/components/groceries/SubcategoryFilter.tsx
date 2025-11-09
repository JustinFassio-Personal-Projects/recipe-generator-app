/**
 * SubcategoryFilter Component
 * Displays subcategory selection pills/chips for filtering ingredients
 */

import { useMemo } from 'react';
import {
  getSubcategoriesForCategory,
  getSubcategoryMetadata,
  type ChefIsabellaCategory,
} from '@/lib/groceries/category-mapping';

interface SubcategoryFilterProps {
  category: ChefIsabellaCategory;
  activeSubcategory: string | null;
  onSubcategoryChange: (subcategory: string | null) => void;
  ingredientCounts?: Record<string, number>; // Optional counts per subcategory
  className?: string;
}

export function SubcategoryFilter({
  category,
  activeSubcategory,
  onSubcategoryChange,
  ingredientCounts,
  className = '',
}: SubcategoryFilterProps) {
  // Get all valid subcategories for this category
  const subcategories = useMemo(() => {
    return getSubcategoriesForCategory(category);
  }, [category]);

  // Sort subcategories by sortOrder from metadata
  const sortedSubcategories = useMemo(() => {
    return [...subcategories].sort((a, b) => {
      const metaA = getSubcategoryMetadata(a);
      const metaB = getSubcategoryMetadata(b);
      return metaA.sortOrder - metaB.sortOrder;
    });
  }, [subcategories]);

  if (subcategories.length === 0) {
    return null;
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Container with horizontal scroll */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {/* "All" button */}
        <button
          onClick={() => onSubcategoryChange(null)}
          className={`
            flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all
            ${
              activeSubcategory === null
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400 hover:bg-blue-50'
            }
          `}
        >
          <span>All</span>
          {ingredientCounts && (
            <span
              className={`text-xs ${
                activeSubcategory === null ? 'text-blue-100' : 'text-gray-500'
              }`}
            >
              ({Object.values(ingredientCounts).reduce((a, b) => a + b, 0)})
            </span>
          )}
        </button>

        {/* Subcategory buttons */}
        {sortedSubcategories.map((subcategory) => {
          const metadata = getSubcategoryMetadata(subcategory);
          const count = ingredientCounts?.[subcategory] || 0;
          const isActive = activeSubcategory === subcategory;

          // Skip if no ingredients in this subcategory (when counts provided)
          if (ingredientCounts && count === 0) {
            return null;
          }

          return (
            <button
              key={subcategory}
              onClick={() => onSubcategoryChange(subcategory)}
              className={`
                flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all
                ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                }
              `}
              title={metadata.description}
            >
              <span className="text-base">{metadata.icon}</span>
              <span className="hidden sm:inline">{metadata.label}</span>
              {ingredientCounts && (
                <span
                  className={`text-xs ${
                    isActive ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  ({count})
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Compact version for mobile/tight spaces
 * Shows only icons with tooltips
 */
export function SubcategoryFilterCompact({
  category,
  activeSubcategory,
  onSubcategoryChange,
  ingredientCounts,
  className = '',
}: SubcategoryFilterProps) {
  const subcategories = useMemo(() => {
    return getSubcategoriesForCategory(category);
  }, [category]);

  const sortedSubcategories = useMemo(() => {
    return [...subcategories].sort((a, b) => {
      const metaA = getSubcategoryMetadata(a);
      const metaB = getSubcategoryMetadata(b);
      return metaA.sortOrder - metaB.sortOrder;
    });
  }, [subcategories]);

  if (subcategories.length === 0) {
    return null;
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {/* "All" button */}
        <button
          onClick={() => onSubcategoryChange(null)}
          className={`
            flex h-10 w-10 items-center justify-center rounded-full text-lg transition-all
            ${
              activeSubcategory === null
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400 hover:bg-blue-50'
            }
          `}
          title="All subcategories"
        >
          ∗
        </button>

        {/* Subcategory buttons */}
        {sortedSubcategories.map((subcategory) => {
          const metadata = getSubcategoryMetadata(subcategory);
          const count = ingredientCounts?.[subcategory] || 0;
          const isActive = activeSubcategory === subcategory;

          if (ingredientCounts && count === 0) {
            return null;
          }

          return (
            <button
              key={subcategory}
              onClick={() => onSubcategoryChange(subcategory)}
              className={`
                flex h-10 w-10 items-center justify-center rounded-full text-lg transition-all
                ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                }
              `}
              title={`${metadata.label}${count ? ` (${count})` : ''}`}
            >
              {metadata.icon}
            </button>
          );
        })}
      </div>
    </div>
  );
}
