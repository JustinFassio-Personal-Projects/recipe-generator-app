/**
 * Script to assign subcategories to all global ingredients
 * and generate cleanup migration
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface IngredientAssignment {
  name: string;
  normalizedName: string;
  category: string;
  subcategory: string;
  action: 'keep' | 'delete' | 'move';
}

// Parse SQL seed file to extract ingredients
function parseSeedFile(filePath: string): Array<{
  name: string;
  normalizedName: string;
  category: string;
}> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const ingredients: Array<{
    name: string;
    normalizedName: string;
    category: string;
  }> = [];

  const ingredientPattern = /^\('([^']+)',\s*'([^']+)',\s*'([^']+)',/;

  lines.forEach((line) => {
    const match = line.match(ingredientPattern);
    if (match) {
      ingredients.push({
        name: match[1],
        normalizedName: match[2],
        category: match[3],
      });
    }
  });

  return ingredients;
}

// Assign subcategory based on ingredient name and category
function assignSubcategory(
  name: string,
  category: string
): {
  category: string;
  subcategory: string;
  action: 'keep' | 'delete' | 'move';
} {
  const nameLower = name.toLowerCase();

  // Items to delete (generic)
  if (
    [
      'berries',
      'nuts',
      'frozen vegetables',
      'cereal',
      'soup',
      'pasta',
    ].includes(nameLower)
  ) {
    return { category, subcategory: '', action: 'delete' };
  }

  // Items to delete (duplicates - keep the plural/more specific version)
  if (nameLower === 'mustard seed') {
    return { category, subcategory: '', action: 'delete' };
  }

  // BAKERY_GRAINS subcategories
  if (category === 'bakery_grains') {
    // Pasta & Noodles
    if (
      nameLower.includes('pasta') ||
      nameLower.includes('noodle') ||
      nameLower.includes('spaghetti') ||
      nameLower.includes('penne') ||
      nameLower.includes('fettuccine') ||
      nameLower.includes('linguine') ||
      nameLower.includes('rigatoni') ||
      nameLower.includes('macaroni') ||
      nameLower.includes('fusilli') ||
      nameLower.includes('orzo') ||
      nameLower.includes('ravioli') ||
      nameLower.includes('tortellini') ||
      nameLower.includes('lasagna sheets') ||
      nameLower.includes('vermicelli') ||
      nameLower.includes('angel hair') ||
      nameLower.includes('egg noodles') ||
      nameLower.includes('rice noodles') ||
      nameLower.includes('ramen') ||
      nameLower.includes('soba') ||
      nameLower.includes('udon')
    ) {
      return { category, subcategory: 'pasta_noodles', action: 'keep' };
    }

    // Rice & Ancient Grains
    if (
      nameLower.includes('rice') ||
      nameLower.includes('quinoa') ||
      nameLower.includes('farro') ||
      nameLower.includes('bulgur') ||
      nameLower.includes('barley') ||
      nameLower.includes('couscous') ||
      nameLower === 'semolina'
    ) {
      return { category, subcategory: 'rice_ancient_grains', action: 'keep' };
    }

    // Bread & Baked Goods
    if (
      nameLower.includes('bread') ||
      nameLower.includes('bagel') ||
      nameLower.includes('tortilla') ||
      nameLower.includes('pita') ||
      nameLower.includes('naan') ||
      nameLower.includes('muffin') ||
      nameLower.includes('croissant') ||
      nameLower.includes('roll') ||
      nameLower.includes('bun') ||
      nameLower === 'brioche'
    ) {
      return { category, subcategory: 'bread_baked_goods', action: 'keep' };
    }

    // Flours & Meals
    if (
      nameLower.includes('flour') ||
      nameLower.includes('meal') ||
      nameLower.includes('starch') ||
      (nameLower.includes('powder') &&
        (nameLower.includes('baking') || nameLower.includes('arrowroot')))
    ) {
      return { category, subcategory: 'flours_meals', action: 'keep' };
    }

    // Oats & Hot Cereals
    if (nameLower.includes('oat')) {
      return { category, subcategory: 'oats_hot_cereals', action: 'keep' };
    }

    // Baking Mixes - dough and crusts
    if (
      nameLower.includes('dough') ||
      nameLower.includes('crust') ||
      nameLower.includes('phyllo')
    ) {
      return { category, subcategory: 'baking_mixes', action: 'keep' };
    }

    // Baking essentials (yeast, etc.)
    if (
      nameLower.includes('yeast') ||
      nameLower === 'baking powder' ||
      nameLower === 'baking soda'
    ) {
      return { category, subcategory: 'flours_meals', action: 'keep' };
    }

    // Default for bakery_grains
    return { category, subcategory: 'bread_baked_goods', action: 'keep' };
  }

  // PROTEINS subcategories
  if (category === 'proteins') {
    // Fresh Meat
    if (
      nameLower.includes('beef') ||
      nameLower.includes('pork') ||
      nameLower.includes('lamb') ||
      nameLower.includes('bison') ||
      nameLower.includes('venison') ||
      (nameLower.includes('ribs') && !nameLower.includes('chicken'))
    ) {
      return { category, subcategory: 'fresh_meat', action: 'keep' };
    }

    // Poultry
    if (
      nameLower.includes('chicken') ||
      nameLower.includes('turkey') ||
      nameLower.includes('duck')
    ) {
      return { category, subcategory: 'poultry', action: 'keep' };
    }

    // Seafood
    if (
      nameLower.includes('fish') ||
      nameLower.includes('salmon') ||
      nameLower.includes('tuna') ||
      nameLower.includes('cod') ||
      nameLower.includes('shrimp') ||
      nameLower.includes('crab') ||
      nameLower.includes('lobster') ||
      nameLower.includes('scallop') ||
      nameLower.includes('mussel') ||
      nameLower.includes('anchov') ||
      nameLower.includes('sardine')
    ) {
      return { category, subcategory: 'seafood', action: 'keep' };
    }

    // Plant Proteins
    if (
      nameLower.includes('tofu') ||
      nameLower.includes('tempeh') ||
      nameLower.includes('seitan')
    ) {
      return { category, subcategory: 'plant_proteins', action: 'keep' };
    }

    // Eggs & Egg Products
    if (nameLower.includes('egg')) {
      return { category, subcategory: 'eggs_egg_products', action: 'keep' };
    }

    // Legumes - Dried
    if (
      nameLower.includes('lentil') ||
      nameLower.includes('split pea') ||
      nameLower === 'edamame'
    ) {
      return { category, subcategory: 'legumes_dried', action: 'keep' };
    }

    // Nuts & Seeds
    if (
      nameLower.includes('nut') ||
      nameLower.includes('seed') ||
      nameLower === 'cashews' ||
      nameLower === 'almonds' ||
      nameLower === 'walnuts' ||
      nameLower === 'pecans' ||
      nameLower === 'peanuts'
    ) {
      return { category, subcategory: 'nuts_seeds', action: 'keep' };
    }

    // Special cases
    if (
      nameLower === 'bacon' ||
      nameLower === 'ham' ||
      nameLower === 'sausage'
    ) {
      return { category, subcategory: 'fresh_meat', action: 'keep' };
    }

    if (
      nameLower === 'cottage cheese' ||
      nameLower === 'nutritional yeast' ||
      nameLower === 'protein powder'
    ) {
      return { category, subcategory: 'plant_proteins', action: 'keep' };
    }

    // Default
    return { category, subcategory: 'fresh_meat', action: 'keep' };
  }

  // FRESH_PRODUCE subcategories
  if (category === 'fresh_produce') {
    // Leafy Greens
    if (
      nameLower.includes('lettuce') ||
      nameLower.includes('spinach') ||
      nameLower.includes('kale') ||
      nameLower.includes('arugula') ||
      nameLower.includes('greens')
    ) {
      return { category, subcategory: 'leafy_greens', action: 'keep' };
    }

    // Cruciferous Vegetables
    if (
      nameLower.includes('broccoli') ||
      nameLower.includes('cauliflower') ||
      nameLower.includes('brussels sprout') ||
      nameLower.includes('cabbage')
    ) {
      return {
        category,
        subcategory: 'cruciferous_vegetables',
        action: 'keep',
      };
    }

    // Root Vegetables
    if (
      nameLower.includes('carrot') ||
      nameLower.includes('potato') ||
      nameLower.includes('beet') ||
      nameLower.includes('turnip') ||
      nameLower.includes('parsnip') ||
      nameLower.includes('radish')
    ) {
      return { category, subcategory: 'root_vegetables', action: 'keep' };
    }

    // Alliums
    if (
      nameLower.includes('onion') ||
      nameLower.includes('garlic') ||
      nameLower.includes('shallot') ||
      nameLower.includes('leek') ||
      nameLower.includes('scallion')
    ) {
      return { category, subcategory: 'alliums', action: 'keep' };
    }

    // Nightshades
    if (
      nameLower.includes('tomato') ||
      nameLower.includes('pepper') ||
      nameLower.includes('eggplant') ||
      nameLower.includes('jalape') ||
      nameLower.includes('habanero') ||
      nameLower.includes('poblano') ||
      nameLower.includes('serrano')
    ) {
      return { category, subcategory: 'nightshades', action: 'keep' };
    }

    // Squash & Gourds
    if (
      nameLower.includes('squash') ||
      nameLower.includes('zucchini') ||
      nameLower.includes('pumpkin')
    ) {
      return { category, subcategory: 'squash_gourds', action: 'keep' };
    }

    // Fresh Herbs
    if (
      nameLower.includes('basil') ||
      nameLower.includes('cilantro') ||
      nameLower.includes('parsley') ||
      nameLower.includes('mint') ||
      nameLower.includes('dill') ||
      nameLower.includes('chive') ||
      nameLower.includes('sage') ||
      nameLower.includes('rosemary') ||
      nameLower.includes('thyme') ||
      (nameLower.includes('oregano') && nameLower.includes('fresh'))
    ) {
      return { category, subcategory: 'fresh_herbs', action: 'keep' };
    }

    // Citrus Fruits
    if (
      nameLower.includes('lemon') ||
      nameLower.includes('lime') ||
      nameLower.includes('orange') ||
      nameLower.includes('grapefruit')
    ) {
      return { category, subcategory: 'citrus_fruits', action: 'keep' };
    }

    // Berries
    if (nameLower.includes('berr') || nameLower.includes('strawberr')) {
      return { category, subcategory: 'berries', action: 'keep' };
    }

    // Tropical Fruits
    if (
      nameLower.includes('banana') ||
      nameLower.includes('avocado') ||
      nameLower.includes('mango') ||
      nameLower.includes('pineapple')
    ) {
      return { category, subcategory: 'tropical_fruits', action: 'keep' };
    }

    // Apples & Pears
    if (nameLower.includes('apple') || nameLower.includes('pear')) {
      return { category, subcategory: 'apples_pears', action: 'keep' };
    }

    // Fresh Aromatics
    if (nameLower.includes('ginger') || nameLower.includes('lemongrass')) {
      return { category, subcategory: 'fresh_aromatics', action: 'keep' };
    }

    // Other produce
    if (
      nameLower.includes('celery') ||
      nameLower.includes('cucumber') ||
      nameLower.includes('mushroom') ||
      nameLower.includes('asparagus') ||
      nameLower.includes('green bean')
    ) {
      return { category, subcategory: 'nightshades', action: 'keep' }; // Default bucket
    }

    if (nameLower.includes('grape')) {
      return { category, subcategory: 'berries', action: 'keep' };
    }

    // Default
    return { category, subcategory: 'nightshades', action: 'keep' };
  }

  // DAIRY_COLD subcategories
  if (category === 'dairy_cold') {
    // Milk & Cream
    if (
      nameLower.includes('milk') ||
      nameLower.includes('cream') ||
      nameLower === 'half and half'
    ) {
      return { category, subcategory: 'milk_cream', action: 'keep' };
    }

    // Yogurt & Kefir
    if (nameLower.includes('yogurt') || nameLower.includes('kefir')) {
      return { category, subcategory: 'yogurt_kefir', action: 'keep' };
    }

    // Cheese - Hard
    if (
      nameLower.includes('cheddar') ||
      nameLower.includes('parmesan') ||
      nameLower.includes('swiss') ||
      nameLower.includes('gouda') ||
      nameLower.includes('aged')
    ) {
      return { category, subcategory: 'cheese_hard', action: 'keep' };
    }

    // Cheese - Soft
    if (
      nameLower.includes('mozzarella') ||
      nameLower.includes('ricotta') ||
      nameLower.includes('cream cheese') ||
      nameLower.includes('brie') ||
      nameLower.includes('feta') ||
      nameLower === 'cheese'
    ) {
      return { category, subcategory: 'cheese_soft', action: 'keep' };
    }

    // Butter & Spreads
    if (nameLower.includes('butter')) {
      return { category, subcategory: 'butter_spreads', action: 'keep' };
    }

    // Default
    return { category, subcategory: 'milk_cream', action: 'keep' };
  }

  // COOKING_ESSENTIALS subcategories
  if (category === 'cooking_essentials') {
    // Cooking Oils
    if (nameLower.includes('oil') || nameLower === 'ghee') {
      return { category, subcategory: 'cooking_oils', action: 'keep' };
    }

    // Vinegars
    if (nameLower.includes('vinegar')) {
      return { category, subcategory: 'vinegars', action: 'keep' };
    }

    // Cooking Wines & Spirits
    if (
      nameLower.includes('wine') ||
      nameLower.includes('sherry') ||
      nameLower.includes('cooking')
    ) {
      return { category, subcategory: 'cooking_wines_spirits', action: 'keep' };
    }

    // Stocks & Broths
    if (nameLower.includes('stock') || nameLower.includes('broth')) {
      return { category, subcategory: 'stocks_broths', action: 'keep' };
    }

    // Sauces - Asian
    if (
      nameLower.includes('soy') ||
      nameLower.includes('fish sauce') ||
      nameLower.includes('hoisin') ||
      nameLower.includes('oyster')
    ) {
      return { category, subcategory: 'sauces_asian', action: 'keep' };
    }

    // Tomato Products - if not already assigned
    if (nameLower.includes('tomato') && !nameLower.includes('soup')) {
      return { category, subcategory: 'tomato_products', action: 'keep' };
    }

    // Default
    if (nameLower.includes('pepper')) {
      return { category, subcategory: 'cooking_oils', action: 'keep' };
    }

    return { category, subcategory: 'cooking_oils', action: 'keep' };
  }

  // FLAVOR_BUILDERS subcategories
  if (category === 'flavor_builders') {
    // Items that need to move to fresh_produce
    if (
      nameLower.includes('onion') ||
      nameLower.includes('garlic') ||
      nameLower === 'leeks' ||
      nameLower === 'shallots'
    ) {
      return {
        category: 'fresh_produce',
        subcategory: 'alliums',
        action: 'move',
      };
    }

    if (
      (nameLower.includes('ginger') && nameLower.includes('fresh')) ||
      nameLower === 'lemongrass'
    ) {
      return {
        category: 'fresh_produce',
        subcategory: 'fresh_aromatics',
        action: 'move',
      };
    }

    // Dried Herbs
    if (
      nameLower.includes('dried') ||
      nameLower.includes('oregano') ||
      nameLower.includes('thyme') ||
      nameLower.includes('rosemary') ||
      nameLower.includes('basil') ||
      nameLower.includes('sage') ||
      nameLower.includes('marjoram') ||
      nameLower.includes('tarragon') ||
      nameLower === 'bay leaves'
    ) {
      return { category, subcategory: 'dried_herbs', action: 'keep' };
    }

    // Ground Spices
    if (
      nameLower.includes('ground') ||
      nameLower.includes('powder') ||
      nameLower === 'cumin' ||
      nameLower === 'paprika' ||
      nameLower === 'cinnamon' ||
      nameLower === 'turmeric' ||
      nameLower === 'cayenne' ||
      nameLower === 'allspice'
    ) {
      return { category, subcategory: 'ground_spices', action: 'keep' };
    }

    // Whole Spices
    if (
      nameLower.includes('seed') ||
      nameLower.includes('peppercorn') ||
      nameLower === 'cardamom' ||
      nameLower === 'cloves' ||
      nameLower === 'star anise'
    ) {
      return { category, subcategory: 'whole_spices', action: 'keep' };
    }

    // Spice Blends
    if (
      nameLower.includes('seasoning') ||
      nameLower.includes('curry') ||
      nameLower.includes('garam masala') ||
      nameLower.includes('herbs de provence') ||
      nameLower.includes('chinese five spice') ||
      nameLower.includes('old bay')
    ) {
      return { category, subcategory: 'spice_blends', action: 'keep' };
    }

    // Salt & Pepper
    if (
      nameLower.includes('salt') ||
      (nameLower.includes('pepper') && !nameLower.includes('powder'))
    ) {
      return { category, subcategory: 'salt_pepper', action: 'keep' };
    }

    // Extracts & Flavorings
    if (nameLower.includes('extract') || nameLower.includes('tabasco')) {
      return { category, subcategory: 'extracts_flavorings', action: 'keep' };
    }

    // Default
    return { category, subcategory: 'ground_spices', action: 'keep' };
  }

  // PANTRY_STAPLES subcategories
  if (category === 'pantry_staples') {
    // Items that need to move to other categories
    if (
      nameLower.includes('canned salmon') ||
      nameLower.includes('canned sardines') ||
      nameLower.includes('canned tuna')
    ) {
      return { category: 'proteins', subcategory: 'seafood', action: 'move' };
    }

    if (nameLower === 'coconut milk') {
      return {
        category: 'dairy_cold',
        subcategory: 'plant_based_dairy',
        action: 'move',
      };
    }

    if (nameLower === 'oatmeal' || nameLower === 'instant oatmeal') {
      return {
        category: 'bakery_grains',
        subcategory: 'oats_hot_cereals',
        action: 'move',
      };
    }

    if (nameLower === 'granola') {
      return {
        category: 'bakery_grains',
        subcategory: 'breakfast_cereals',
        action: 'move',
      };
    }

    if (
      nameLower === 'almonds' ||
      nameLower === 'walnuts' ||
      nameLower === 'pecans' ||
      nameLower === 'peanuts' ||
      nameLower === 'mixed nuts'
    ) {
      return {
        category: 'proteins',
        subcategory: 'nuts_seeds',
        action: 'move',
      };
    }

    if (nameLower.includes('broth') || nameLower.includes('stock')) {
      return {
        category: 'cooking_essentials',
        subcategory: 'stocks_broths',
        action: 'move',
      };
    }

    if (
      nameLower.includes('soy sauce') ||
      nameLower.includes('hoisin') ||
      nameLower.includes('oyster sauce') ||
      nameLower.includes('sriracha') ||
      nameLower.includes('teriyaki')
    ) {
      return {
        category: 'cooking_essentials',
        subcategory: 'sauces_asian',
        action: 'move',
      };
    }

    if (nameLower.includes('bbq sauce') || nameLower.includes('hot sauce')) {
      return {
        category: 'cooking_essentials',
        subcategory: 'sauces_western',
        action: 'move',
      };
    }

    if (
      nameLower.includes('crushed tomatoes') ||
      nameLower.includes('diced tomatoes') ||
      nameLower.includes('tomato paste') ||
      nameLower.includes('tomato sauce') ||
      nameLower.includes('sun-dried')
    ) {
      return {
        category: 'cooking_essentials',
        subcategory: 'tomato_products',
        action: 'move',
      };
    }

    if (
      nameLower.includes('black beans') ||
      nameLower.includes('chickpeas') ||
      nameLower.includes('kidney beans') ||
      nameLower.includes('pinto beans') ||
      nameLower.includes('white beans') ||
      nameLower.includes('navy beans') ||
      nameLower.includes('refried beans')
    ) {
      return {
        category: 'proteins',
        subcategory: 'legumes_canned',
        action: 'move',
      };
    }

    // Sweeteners
    if (
      nameLower.includes('sugar') ||
      nameLower.includes('honey') ||
      nameLower.includes('syrup') ||
      nameLower.includes('agave') ||
      nameLower.includes('molasses')
    ) {
      return { category, subcategory: 'sweeteners', action: 'keep' };
    }

    // Baking Essentials
    if (
      nameLower.includes('baking powder') ||
      nameLower.includes('baking soda') ||
      nameLower.includes('cornstarch') ||
      nameLower.includes('yeast')
    ) {
      return { category, subcategory: 'baking_essentials', action: 'keep' };
    }

    // Canned Vegetables
    if (
      nameLower.includes('canned') &&
      !nameLower.includes('fruit') &&
      !nameLower.includes('salmon') &&
      !nameLower.includes('tuna') &&
      !nameLower.includes('sardines')
    ) {
      return { category, subcategory: 'canned_vegetables', action: 'keep' };
    }

    // Canned Fruits
    if (
      (nameLower.includes('canned') && nameLower.includes('peach')) ||
      nameLower.includes('pear') ||
      nameLower.includes('pineapple')
    ) {
      return { category, subcategory: 'canned_fruits', action: 'keep' };
    }

    // Condiments
    if (
      nameLower.includes('mustard') ||
      nameLower.includes('mayo') ||
      nameLower.includes('ketchup') ||
      nameLower.includes('pickle') ||
      nameLower.includes('relish') ||
      nameLower.includes('capers') ||
      nameLower.includes('olive')
    ) {
      return { category, subcategory: 'condiments', action: 'keep' };
    }

    // Jams & Preserves
    if (
      nameLower.includes('jam') ||
      nameLower.includes('jelly') ||
      nameLower.includes('marmalade') ||
      nameLower.includes('preserve') ||
      (nameLower.includes('butter') &&
        (nameLower.includes('peanut') ||
          nameLower.includes('almond') ||
          nameLower.includes('sunflower')))
    ) {
      return { category, subcategory: 'jams_preserves', action: 'keep' };
    }

    // Dried Fruits
    if (
      nameLower.includes('dried') ||
      nameLower.includes('raisin') ||
      (nameLower.includes('cranberr') && nameLower.includes('dried')) ||
      nameLower === 'dates'
    ) {
      return { category, subcategory: 'dried_fruits', action: 'keep' };
    }

    // Snacks
    if (
      nameLower.includes('cracker') ||
      nameLower.includes('chip') ||
      nameLower.includes('popcorn') ||
      nameLower.includes('pretzel')
    ) {
      return { category, subcategory: 'snacks', action: 'keep' };
    }

    // Chocolate & Baking Chips
    if (nameLower.includes('chocolate') || nameLower.includes('cocoa')) {
      return {
        category,
        subcategory: 'chocolate_baking_chips',
        action: 'keep',
      };
    }

    // Sauces and pasta sauces
    if (
      nameLower.includes('sauce') ||
      nameLower.includes('salsa') ||
      nameLower.includes('pesto') ||
      nameLower.includes('guacamole') ||
      nameLower.includes('tahini')
    ) {
      return { category, subcategory: 'condiments', action: 'keep' };
    }

    // Soups
    if (nameLower.includes('soup')) {
      return { category, subcategory: 'canned_vegetables', action: 'keep' };
    }

    // Breadcrumbs and panko
    if (nameLower.includes('breadcrumb') || nameLower === 'panko') {
      return { category, subcategory: 'baking_essentials', action: 'keep' };
    }

    // Default
    return { category, subcategory: 'condiments', action: 'keep' };
  }

  // FROZEN subcategories
  if (category === 'frozen') {
    // Frozen Vegetables
    if (
      nameLower.includes('vegetable') ||
      nameLower.includes('broccoli') ||
      nameLower.includes('carrots') ||
      nameLower.includes('cauliflower') ||
      nameLower.includes('corn') ||
      nameLower.includes('peas') ||
      nameLower.includes('green beans') ||
      nameLower.includes('brussels sprouts') ||
      nameLower.includes('spinach') ||
      nameLower.includes('edamame') ||
      nameLower.includes('mixed vegetables')
    ) {
      return { category, subcategory: 'frozen_vegetables', action: 'keep' };
    }

    // Frozen Fruits
    if (
      nameLower.includes('berr') ||
      nameLower.includes('strawberr') ||
      nameLower.includes('blueberr') ||
      nameLower.includes('raspberr') ||
      nameLower.includes('mango') ||
      nameLower.includes('peach') ||
      nameLower.includes('pineapple') ||
      nameLower.includes('cherr')
    ) {
      return { category, subcategory: 'frozen_fruits', action: 'keep' };
    }

    // Frozen Proteins
    if (
      nameLower.includes('chicken') ||
      nameLower.includes('fish') ||
      nameLower.includes('shrimp')
    ) {
      return { category, subcategory: 'frozen_proteins', action: 'keep' };
    }

    // Frozen Prepared Foods
    if (
      nameLower.includes('pizza') ||
      nameLower.includes('lasagna') ||
      nameLower.includes('burrito') ||
      nameLower.includes('dumpling') ||
      nameLower.includes('pot sticker') ||
      nameLower.includes('ravioli') ||
      nameLower.includes('pierogi') ||
      nameLower.includes('nugget') ||
      nameLower.includes('stick') ||
      nameLower.includes('meatball') ||
      nameLower.includes('fries') ||
      nameLower.includes('french fries') ||
      nameLower.includes('hash brown') ||
      nameLower.includes('onion ring') ||
      nameLower.includes('pancake') ||
      nameLower.includes('waffle') ||
      nameLower.includes('french toast') ||
      nameLower.includes('stir fry')
    ) {
      return { category, subcategory: 'frozen_prepared_foods', action: 'keep' };
    }

    // Ice Cream & Desserts
    if (
      nameLower.includes('ice cream') ||
      nameLower.includes('popsicle') ||
      nameLower.includes('frozen yogurt') ||
      nameLower.includes('sorbet') ||
      nameLower.includes('sherbet') ||
      nameLower.includes('whipped topping') ||
      nameLower.includes('fruit bars') ||
      nameLower === 'ice cubes'
    ) {
      return { category, subcategory: 'ice_cream_desserts', action: 'keep' };
    }

    // Default
    return { category, subcategory: 'frozen_prepared_foods', action: 'keep' };
  }

  // Default fallback
  return { category, subcategory: 'condiments', action: 'keep' };
}

// Generate SQL migration
function generateMigration(assignments: IngredientAssignment[]): string {
  let sql = `-- Migration to cleanup duplicates, fix miscategorizations, and assign subcategories
-- Generated on ${new Date().toISOString()}

BEGIN;

`;

  // Group operations
  const toDelete = assignments.filter((a) => a.action === 'delete');
  const toMove = assignments.filter((a) => a.action === 'move');
  const toUpdate = assignments.filter((a) => a.action === 'keep');

  // Delete generic/duplicate items
  if (toDelete.length > 0) {
    sql += `-- Delete generic and duplicate items (${toDelete.length} items)\n`;
    sql += `DELETE FROM global_ingredients WHERE name IN (\n`;
    sql += toDelete.map((a) => `  '${a.name.replace(/'/g, "''")}'`).join(',\n');
    sql += `\n);\n\n`;
  }

  // Move miscategorized items (update category and add subcategory)
  if (toMove.length > 0) {
    // Group by target category and subcategory
    const moveGroups = new Map<string, IngredientAssignment[]>();
    toMove.forEach((a) => {
      const key = `${a.category}::${a.subcategory}`;
      if (!moveGroups.has(key)) {
        moveGroups.set(key, []);
      }
      moveGroups.get(key)!.push(a);
    });

    sql += `-- Move miscategorized items and assign subcategories\n`;
    for (const [key, items] of moveGroups.entries()) {
      const [category, subcategory] = key.split('::');
      sql += `\n-- Move to ${category} → ${subcategory} (${items.length} items)\n`;
      sql += `UPDATE global_ingredients\nSET category = '${category}', subcategory = '${subcategory}'\nWHERE name IN (\n`;
      sql += items.map((a) => `  '${a.name.replace(/'/g, "''")}'`).join(',\n');
      sql += `\n);\n`;
    }
    sql += '\n';
  }

  // Update all remaining items with subcategories (group by category and subcategory)
  const updateGroups = new Map<string, IngredientAssignment[]>();
  toUpdate.forEach((a) => {
    const key = `${a.category}::${a.subcategory}`;
    if (!updateGroups.has(key)) {
      updateGroups.set(key, []);
    }
    updateGroups.get(key)!.push(a);
  });

  sql += `-- Assign subcategories to existing items\n`;
  for (const [key, items] of updateGroups.entries()) {
    const [category, subcategory] = key.split('::');
    sql += `\n-- ${category} → ${subcategory} (${items.length} items)\n`;
    sql += `UPDATE global_ingredients\nSET subcategory = '${subcategory}'\nWHERE category = '${category}' AND name IN (\n`;
    sql += items.map((a) => `  '${a.name.replace(/'/g, "''")}'`).join(',\n');
    sql += `\n);\n`;
  }

  sql += `\nCOMMIT;\n`;

  return sql;
}

// Main execution
function main() {
  const seedFilePath = path.join(
    __dirname,
    '../supabase/seed_complete_global_ingredients.sql'
  );

  console.log(`📖 Reading seed file: ${seedFilePath}`);

  if (!fs.existsSync(seedFilePath)) {
    console.error(`❌ Seed file not found: ${seedFilePath}`);
    process.exit(1);
  }

  const ingredients = parseSeedFile(seedFilePath);
  console.log(`✅ Parsed ${ingredients.length} ingredients\n`);

  // Assign subcategories
  const assignments: IngredientAssignment[] = [];
  for (const ing of ingredients) {
    const result = assignSubcategory(ing.name, ing.category);
    assignments.push({
      name: ing.name,
      normalizedName: ing.normalizedName,
      category: result.category,
      subcategory: result.subcategory,
      action: result.action,
    });
  }

  // Generate statistics
  const stats = {
    total: assignments.length,
    toKeep: assignments.filter((a) => a.action === 'keep').length,
    toMove: assignments.filter((a) => a.action === 'move').length,
    toDelete: assignments.filter((a) => a.action === 'delete').length,
  };

  console.log('📊 Assignment Statistics:');
  console.log(`  • Total ingredients: ${stats.total}`);
  console.log(`  • Keep in place (with subcategory): ${stats.toKeep}`);
  console.log(`  • Move to new category: ${stats.toMove}`);
  console.log(`  • Delete (duplicates/generics): ${stats.toDelete}`);
  console.log(`  • Final count: ${stats.toKeep + stats.toMove}\n`);

  // Generate migration
  const migration = generateMigration(assignments);

  // Save migration
  const migrationPath = path.join(
    __dirname,
    '../supabase/migrations/20251109000002_cleanup_and_assign_subcategories.sql'
  );
  fs.writeFileSync(migrationPath, migration);
  console.log(`✅ Migration saved to: ${migrationPath}\n`);

  // Save assignment data for reference
  const dataPath = path.join(__dirname, '../ingredient-assignments.json');
  fs.writeFileSync(dataPath, JSON.stringify(assignments, null, 2));
  console.log(`💾 Assignment data saved to: ${dataPath}\n`);
}

main();
