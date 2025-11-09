import { GROCERY_CATEGORIES } from '@/lib/groceries/categories';

/**
 * Chef Isabella's "Kitchen Reality" category keys
 * These are the canonical categories used in the database
 */
export const CHEF_ISABELLA_CATEGORIES = [
  'proteins',
  'fresh_produce',
  'flavor_builders',
  'cooking_essentials',
  'bakery_grains',
  'dairy_cold',
  'pantry_staples',
  'frozen',
] as const;

export type ChefIsabellaCategory = (typeof CHEF_ISABELLA_CATEGORIES)[number];

/**
 * Validates if a category is a valid Chef Isabella category
 */
export function isValidCategory(
  category: string
): category is ChefIsabellaCategory {
  return CHEF_ISABELLA_CATEGORIES.includes(category as ChefIsabellaCategory);
}

/**
 * Gets the UI metadata for a category
 * Falls back to a default if category is not found
 */
export function getCategoryMetadata(category: string) {
  const categoryMeta =
    GROCERY_CATEGORIES[category as keyof typeof GROCERY_CATEGORIES];

  if (categoryMeta) {
    return categoryMeta;
  }

  // Fallback for unknown categories
  return {
    name:
      category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' '),
    subtitle: 'Unknown Category',
    icon: '📦',
    items: [],
  };
}

/**
 * Normalizes a category name to ensure consistency
 * Converts legacy category names to Chef Isabella's system
 */
export function normalizeCategory(category: string): ChefIsabellaCategory {
  const normalized = category.toLowerCase().trim();

  // Legacy category mappings (if any exist)
  const legacyMappings: Record<string, ChefIsabellaCategory> = {
    vegetables: 'fresh_produce',
    fruits: 'fresh_produce',
    spices: 'flavor_builders',
    dairy: 'dairy_cold',
    pantry: 'pantry_staples',
    other: 'pantry_staples',
    meat: 'proteins',
    seafood: 'proteins',
    grains: 'bakery_grains',
    bread: 'bakery_grains',
  };

  // Check if it's a legacy category that needs mapping
  if (legacyMappings[normalized]) {
    return legacyMappings[normalized];
  }

  // Check if it's already a valid Chef Isabella category
  if (isValidCategory(normalized)) {
    return normalized;
  }

  // Default fallback
  console.warn(`Unknown category "${category}", defaulting to pantry_staples`);
  return 'pantry_staples';
}

/**
 * Gets all available categories from global ingredients data
 * Ensures they are all valid Chef Isabella categories
 */
export function getAvailableCategories(
  globalIngredients: Array<{ category: string }>
): ChefIsabellaCategory[] {
  const categories = [
    ...new Set(globalIngredients.map((g) => normalizeCategory(g.category))),
  ];
  return categories.sort();
}

/**
 * Subcategory types for hierarchical ingredient organization
 * Based on professional kitchen practices and grocery store layouts
 */

// Bakery & Grains subcategories
export const BAKERY_GRAINS_SUBCATEGORIES = [
  'pasta_noodles',
  'rice_ancient_grains',
  'bread_baked_goods',
  'flours_meals',
  'oats_hot_cereals',
  'breakfast_cereals',
  'baking_mixes',
] as const;

// Proteins subcategories
export const PROTEINS_SUBCATEGORIES = [
  'fresh_meat',
  'poultry',
  'seafood',
  'plant_proteins',
  'eggs_egg_products',
  'legumes_dried',
  'legumes_canned',
  'nuts_seeds',
] as const;

// Fresh Produce subcategories
export const FRESH_PRODUCE_SUBCATEGORIES = [
  'leafy_greens',
  'cruciferous_vegetables',
  'root_vegetables',
  'alliums',
  'nightshades',
  'squash_gourds',
  'fresh_herbs',
  'citrus_fruits',
  'stone_fruits',
  'berries',
  'tropical_fruits',
  'apples_pears',
  'melons',
  'other_vegetables',
] as const;

// Dairy & Cold subcategories
export const DAIRY_COLD_SUBCATEGORIES = [
  'milk_cream',
  'yogurt_kefir',
  'cheese_hard',
  'cheese_soft',
  'butter_spreads',
  'plant_based_dairy',
  'refrigerated_dough',
] as const;

// Cooking Essentials subcategories
export const COOKING_ESSENTIALS_SUBCATEGORIES = [
  'cooking_oils',
  'vinegars',
  'cooking_wines_spirits',
  'stocks_broths',
  'sauces_asian',
  'sauces_western',
  'tomato_products',
] as const;

// Flavor Builders subcategories
export const FLAVOR_BUILDERS_SUBCATEGORIES = [
  'dried_herbs',
  'ground_spices',
  'whole_spices',
  'spice_blends',
  'salt_pepper',
  'extracts_flavorings',
  'fresh_aromatics',
] as const;

// Pantry Staples subcategories
export const PANTRY_STAPLES_SUBCATEGORIES = [
  'sweeteners',
  'baking_essentials',
  'canned_vegetables',
  'canned_fruits',
  'condiments',
  'jams_preserves',
  'dried_fruits',
  'snacks',
  'chocolate_baking_chips',
] as const;

// Frozen subcategories
export const FROZEN_SUBCATEGORIES = [
  'frozen_vegetables',
  'frozen_fruits',
  'frozen_proteins',
  'frozen_prepared_foods',
  'ice_cream_desserts',
  'frozen_dough_pastry',
] as const;

// Combined type for all subcategories
export type IngredientSubcategory =
  | (typeof BAKERY_GRAINS_SUBCATEGORIES)[number]
  | (typeof PROTEINS_SUBCATEGORIES)[number]
  | (typeof FRESH_PRODUCE_SUBCATEGORIES)[number]
  | (typeof DAIRY_COLD_SUBCATEGORIES)[number]
  | (typeof COOKING_ESSENTIALS_SUBCATEGORIES)[number]
  | (typeof FLAVOR_BUILDERS_SUBCATEGORIES)[number]
  | (typeof PANTRY_STAPLES_SUBCATEGORIES)[number]
  | (typeof FROZEN_SUBCATEGORIES)[number];

/**
 * Subcategory metadata configuration
 * Provides UI labels, icons, and display order
 */
export interface SubcategoryMetadata {
  label: string;
  icon: string;
  sortOrder: number;
  description?: string;
}

export const SUBCATEGORY_CONFIG: Record<
  IngredientSubcategory,
  SubcategoryMetadata
> = {
  // Bakery & Grains
  pasta_noodles: {
    label: 'Pasta & Noodles',
    icon: '🍝',
    sortOrder: 1,
    description: 'Dried pasta shapes, Asian noodles, specialty pasta',
  },
  rice_ancient_grains: {
    label: 'Rice & Ancient Grains',
    icon: '🌾',
    sortOrder: 2,
    description: 'White rice, brown rice, quinoa, farro, bulgur',
  },
  bread_baked_goods: {
    label: 'Bread & Baked Goods',
    icon: '🥖',
    sortOrder: 3,
    description: 'Sandwich bread, artisan loaves, pita, tortillas',
  },
  flours_meals: {
    label: 'Flours & Meals',
    icon: '🌾',
    sortOrder: 4,
    description: 'All-purpose, whole wheat, almond flour, cornmeal',
  },
  oats_hot_cereals: {
    label: 'Oats & Hot Cereals',
    icon: '🥣',
    sortOrder: 5,
    description: 'Rolled oats, steel-cut, instant oatmeal',
  },
  breakfast_cereals: {
    label: 'Breakfast Cereals',
    icon: '🥣',
    sortOrder: 6,
    description: 'Cold cereals, granola, muesli',
  },
  baking_mixes: {
    label: 'Baking Mixes',
    icon: '🧁',
    sortOrder: 7,
    description: 'Pancake mix, biscuit mix, cake mix',
  },

  // Proteins
  fresh_meat: {
    label: 'Fresh Meat',
    icon: '🥩',
    sortOrder: 1,
    description: 'Beef, pork, lamb cuts',
  },
  poultry: {
    label: 'Poultry',
    icon: '🍗',
    sortOrder: 2,
    description: 'Chicken, turkey, duck',
  },
  seafood: {
    label: 'Seafood',
    icon: '🐟',
    sortOrder: 3,
    description: 'Fish, shellfish, canned seafood',
  },
  plant_proteins: {
    label: 'Plant Proteins',
    icon: '🌱',
    sortOrder: 4,
    description: 'Tofu, tempeh, seitan',
  },
  eggs_egg_products: {
    label: 'Eggs & Egg Products',
    icon: '🥚',
    sortOrder: 5,
    description: 'Fresh eggs, liquid egg whites',
  },
  legumes_dried: {
    label: 'Legumes - Dried',
    icon: '🫘',
    sortOrder: 6,
    description: 'Dried beans, lentils, chickpeas',
  },
  legumes_canned: {
    label: 'Legumes - Canned',
    icon: '🥫',
    sortOrder: 7,
    description: 'Pre-cooked canned beans and legumes',
  },
  nuts_seeds: {
    label: 'Nuts & Seeds',
    icon: '🥜',
    sortOrder: 8,
    description: 'Almonds, walnuts, chia seeds, sunflower seeds',
  },

  // Fresh Produce
  leafy_greens: {
    label: 'Leafy Greens',
    icon: '🥬',
    sortOrder: 1,
    description: 'Lettuce, spinach, kale, arugula',
  },
  cruciferous_vegetables: {
    label: 'Cruciferous Vegetables',
    icon: '🥦',
    sortOrder: 2,
    description: 'Broccoli, cauliflower, Brussels sprouts, cabbage',
  },
  root_vegetables: {
    label: 'Root Vegetables',
    icon: '🥕',
    sortOrder: 3,
    description: 'Carrots, potatoes, beets, turnips, parsnips',
  },
  alliums: {
    label: 'Alliums',
    icon: '🧅',
    sortOrder: 4,
    description: 'Onions, garlic, shallots, leeks, scallions',
  },
  nightshades: {
    label: 'Nightshades',
    icon: '🍅',
    sortOrder: 5,
    description: 'Tomatoes, peppers, eggplant',
  },
  squash_gourds: {
    label: 'Squash & Gourds',
    icon: '🎃',
    sortOrder: 6,
    description: 'Zucchini, butternut squash, pumpkin',
  },
  fresh_herbs: {
    label: 'Fresh Herbs',
    icon: '🌿',
    sortOrder: 7,
    description: 'Basil, cilantro, parsley, mint, dill',
  },
  citrus_fruits: {
    label: 'Citrus Fruits',
    icon: '🍋',
    sortOrder: 8,
    description: 'Lemons, limes, oranges, grapefruit',
  },
  stone_fruits: {
    label: 'Stone Fruits',
    icon: '🍑',
    sortOrder: 9,
    description: 'Peaches, plums, cherries, apricots',
  },
  berries: {
    label: 'Berries',
    icon: '🫐',
    sortOrder: 10,
    description: 'Strawberries, blueberries, raspberries, blackberries',
  },
  tropical_fruits: {
    label: 'Tropical Fruits',
    icon: '🍌',
    sortOrder: 11,
    description: 'Bananas, pineapple, mango, papaya',
  },
  apples_pears: {
    label: 'Apples & Pears',
    icon: '🍎',
    sortOrder: 12,
    description: 'Various apple and pear cultivars',
  },
  melons: {
    label: 'Melons',
    icon: '🍉',
    sortOrder: 13,
    description: 'Watermelon, cantaloupe, honeydew',
  },
  other_vegetables: {
    label: 'Other Vegetables',
    icon: '🥬',
    sortOrder: 14,
    description:
      'Asparagus, celery, green beans, mushrooms, and other vegetables',
  },

  // Dairy & Cold
  milk_cream: {
    label: 'Milk & Cream',
    icon: '🥛',
    sortOrder: 1,
    description: 'Whole milk, skim milk, heavy cream, half-and-half',
  },
  yogurt_kefir: {
    label: 'Yogurt & Kefir',
    icon: '🥄',
    sortOrder: 2,
    description: 'Greek yogurt, regular yogurt, kefir',
  },
  cheese_hard: {
    label: 'Cheese - Hard',
    icon: '🧀',
    sortOrder: 3,
    description: 'Cheddar, parmesan, Swiss, gouda',
  },
  cheese_soft: {
    label: 'Cheese - Soft',
    icon: '🧀',
    sortOrder: 4,
    description: 'Mozzarella, ricotta, cream cheese, brie',
  },
  butter_spreads: {
    label: 'Butter & Spreads',
    icon: '🧈',
    sortOrder: 5,
    description: 'Salted butter, unsalted butter, margarine',
  },
  plant_based_dairy: {
    label: 'Plant-Based Dairy',
    icon: '🌱',
    sortOrder: 6,
    description: 'Almond milk, oat milk, vegan cheese',
  },
  refrigerated_dough: {
    label: 'Refrigerated Dough',
    icon: '🥐',
    sortOrder: 7,
    description: 'Pizza dough, biscuits, pie crust',
  },

  // Cooking Essentials
  cooking_oils: {
    label: 'Cooking Oils',
    icon: '🫒',
    sortOrder: 1,
    description: 'Olive oil, vegetable oil, coconut oil, sesame oil',
  },
  vinegars: {
    label: 'Vinegars',
    icon: '🍶',
    sortOrder: 2,
    description: 'Balsamic, red wine, apple cider, rice vinegar',
  },
  cooking_wines_spirits: {
    label: 'Cooking Wines & Spirits',
    icon: '🍷',
    sortOrder: 3,
    description: 'White wine, red wine, mirin, sherry',
  },
  stocks_broths: {
    label: 'Stocks & Broths',
    icon: '🥣',
    sortOrder: 4,
    description: 'Chicken stock, beef stock, vegetable broth',
  },
  sauces_asian: {
    label: 'Sauces - Asian',
    icon: '🥢',
    sortOrder: 5,
    description: 'Soy sauce, fish sauce, hoisin, oyster sauce',
  },
  sauces_western: {
    label: 'Sauces - Western',
    icon: '🍶',
    sortOrder: 6,
    description: 'Worcestershire, hot sauce, BBQ sauce',
  },
  tomato_products: {
    label: 'Tomato Products',
    icon: '🍅',
    sortOrder: 7,
    description: 'Crushed tomatoes, paste, sauce, diced',
  },

  // Flavor Builders
  dried_herbs: {
    label: 'Dried Herbs',
    icon: '🌿',
    sortOrder: 1,
    description: 'Oregano, thyme, rosemary, basil',
  },
  ground_spices: {
    label: 'Ground Spices',
    icon: '🌶️',
    sortOrder: 2,
    description: 'Cumin, paprika, cinnamon, turmeric',
  },
  whole_spices: {
    label: 'Whole Spices',
    icon: '⚫',
    sortOrder: 3,
    description: 'Peppercorns, coriander seeds, cardamom pods',
  },
  spice_blends: {
    label: 'Spice Blends',
    icon: '🎨',
    sortOrder: 4,
    description: 'Curry powder, Italian seasoning, taco seasoning',
  },
  salt_pepper: {
    label: 'Salt & Pepper',
    icon: '🧂',
    sortOrder: 5,
    description: 'Kosher salt, sea salt, various peppers',
  },
  extracts_flavorings: {
    label: 'Extracts & Flavorings',
    icon: '💧',
    sortOrder: 6,
    description: 'Vanilla extract, almond extract, citrus extracts',
  },
  fresh_aromatics: {
    label: 'Fresh Aromatics',
    icon: '🫚',
    sortOrder: 7,
    description: 'Ginger root, lemongrass, galangal',
  },

  // Pantry Staples
  sweeteners: {
    label: 'Sweeteners',
    icon: '🍯',
    sortOrder: 1,
    description: 'Sugar, honey, maple syrup, agave',
  },
  baking_essentials: {
    label: 'Baking Essentials',
    icon: '🧁',
    sortOrder: 2,
    description: 'Baking powder, baking soda, yeast, cornstarch',
  },
  canned_vegetables: {
    label: 'Canned Vegetables',
    icon: '🥫',
    sortOrder: 3,
    description: 'Corn, green beans, peas, tomatoes',
  },
  canned_fruits: {
    label: 'Canned Fruits',
    icon: '🥫',
    sortOrder: 4,
    description: 'Peaches, pears, pineapple',
  },
  condiments: {
    label: 'Condiments',
    icon: '🍯',
    sortOrder: 5,
    description: 'Mustard, mayo, ketchup, pickles, relish',
  },
  jams_preserves: {
    label: 'Jams & Preserves',
    icon: '🍓',
    sortOrder: 6,
    description: 'Fruit spreads, nut butters',
  },
  dried_fruits: {
    label: 'Dried Fruits',
    icon: '🍇',
    sortOrder: 7,
    description: 'Raisins, cranberries, apricots, dates',
  },
  snacks: {
    label: 'Snacks',
    icon: '🍿',
    sortOrder: 8,
    description: 'Crackers, chips, popcorn',
  },
  chocolate_baking_chips: {
    label: 'Chocolate & Baking Chips',
    icon: '🍫',
    sortOrder: 9,
    description: 'Chocolate bars, cocoa powder, chocolate chips',
  },

  // Frozen
  frozen_vegetables: {
    label: 'Frozen Vegetables',
    icon: '🥦',
    sortOrder: 1,
    description: 'Plain vegetables, mixed vegetables, riced varieties',
  },
  frozen_fruits: {
    label: 'Frozen Fruits',
    icon: '🍓',
    sortOrder: 2,
    description: 'Berries, mango, tropical blends',
  },
  frozen_proteins: {
    label: 'Frozen Proteins',
    icon: '🍤',
    sortOrder: 3,
    description: 'Chicken, fish, shrimp, plant-based proteins',
  },
  frozen_prepared_foods: {
    label: 'Frozen Prepared Foods',
    icon: '🍕',
    sortOrder: 4,
    description: 'Pizza, meals, appetizers, dumplings',
  },
  ice_cream_desserts: {
    label: 'Ice Cream & Desserts',
    icon: '🍦',
    sortOrder: 5,
    description: 'Ice cream, popsicles, frozen yogurt, sorbet',
  },
  frozen_dough_pastry: {
    label: 'Frozen Dough & Pastry',
    icon: '🥐',
    sortOrder: 6,
    description: 'Puff pastry, phyllo dough, pie shells',
  },
};

/**
 * Maps categories to their valid subcategories
 */
export const CATEGORY_SUBCATEGORY_MAP: Record<
  ChefIsabellaCategory,
  readonly IngredientSubcategory[]
> = {
  bakery_grains: BAKERY_GRAINS_SUBCATEGORIES,
  proteins: PROTEINS_SUBCATEGORIES,
  fresh_produce: FRESH_PRODUCE_SUBCATEGORIES,
  dairy_cold: DAIRY_COLD_SUBCATEGORIES,
  cooking_essentials: COOKING_ESSENTIALS_SUBCATEGORIES,
  flavor_builders: FLAVOR_BUILDERS_SUBCATEGORIES,
  pantry_staples: PANTRY_STAPLES_SUBCATEGORIES,
  frozen: FROZEN_SUBCATEGORIES,
};

/**
 * Gets subcategory metadata for UI display
 */
export function getSubcategoryMetadata(
  subcategory: string
): SubcategoryMetadata {
  const metadata = SUBCATEGORY_CONFIG[subcategory as IngredientSubcategory];

  if (metadata) {
    return metadata;
  }

  // Fallback for unknown subcategories
  return {
    label:
      subcategory.charAt(0).toUpperCase() +
      subcategory.slice(1).replace(/_/g, ' '),
    icon: '📦',
    sortOrder: 999,
  };
}

/**
 * Gets all valid subcategories for a given category
 */
export function getSubcategoriesForCategory(
  category: ChefIsabellaCategory
): readonly IngredientSubcategory[] {
  return CATEGORY_SUBCATEGORY_MAP[category] || [];
}

/**
 * Validates if a subcategory is valid for a given category
 */
export function isValidSubcategoryForCategory(
  category: ChefIsabellaCategory,
  subcategory: string
): boolean {
  const validSubcategories = CATEGORY_SUBCATEGORY_MAP[category];
  return validSubcategories.includes(subcategory as IngredientSubcategory);
}

/**
 * Validates category and subcategory combination
 */
export function validateCategorySubcategory(
  category: string,
  subcategory: string | null
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!isValidCategory(category)) {
    errors.push(`Invalid category: ${category}`);
  }

  if (subcategory) {
    if (!isValidCategory(category)) {
      errors.push('Cannot validate subcategory without valid category');
    } else if (!isValidSubcategoryForCategory(category, subcategory)) {
      errors.push(
        `Invalid subcategory "${subcategory}" for category "${category}"`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates and normalizes category data consistency
 * Used for debugging and data validation
 */
export function validateCategoryConsistency(
  globalIngredients: Array<{ id: string; name: string; category: string }>,
  userGroceryCart: Record<string, string[]>
) {
  const issues: string[] = [];

  // Check global ingredients categories
  const invalidGlobalCategories = globalIngredients
    .filter((ing) => !isValidCategory(ing.category))
    .map((ing) => ({ id: ing.id, name: ing.name, category: ing.category }));

  if (invalidGlobalCategories.length > 0) {
    issues.push(
      `Invalid categories in global ingredients: ${invalidGlobalCategories.map((i) => `${i.name} (${i.category})`).join(', ')}`
    );
  }

  // Check user grocery cart categories
  const invalidCartCategories = Object.keys(userGroceryCart).filter(
    (category) => !isValidCategory(category)
  );

  if (invalidCartCategories.length > 0) {
    issues.push(
      `Invalid categories in user grocery cart: ${invalidCartCategories.join(', ')}`
    );
  }

  return {
    isValid: issues.length === 0,
    issues,
    invalidGlobalCategories,
    invalidCartCategories,
  };
}
