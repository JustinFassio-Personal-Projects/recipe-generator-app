/**
 * Analysis script to identify duplicates and miscategorizations
 * in global ingredients data
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface IngredientData {
  name: string;
  normalizedName: string;
  category: string;
  lineNumber: number;
}

interface AnalysisReport {
  duplicates: Array<{
    name1: string;
    name2: string;
    category: string;
    reason: string;
  }>;
  generics: Array<{
    name: string;
    category: string;
    reason: string;
  }>;
  miscategorized: Array<{
    name: string;
    currentCategory: string;
    suggestedCategory: string;
    suggestedSubcategory: string;
    reason: string;
  }>;
}

// Parse SQL seed file to extract ingredients
function parseSeedFile(filePath: string): IngredientData[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const ingredients: IngredientData[] = [];

  // Pattern to match ingredient lines: ('Name', 'normalized_name', 'category', ...)
  const ingredientPattern = /^\('([^']+)',\s*'([^']+)',\s*'([^']+)',/;

  lines.forEach((line, index) => {
    const match = line.match(ingredientPattern);
    if (match) {
      ingredients.push({
        name: match[1],
        normalizedName: match[2],
        category: match[3],
        lineNumber: index + 1,
      });
    }
  });

  return ingredients;
}

// Identify duplicate ingredients
function findDuplicates(
  ingredients: IngredientData[]
): AnalysisReport['duplicates'] {
  const duplicates: AnalysisReport['duplicates'] = [];
  const seen = new Map<string, IngredientData>();

  for (const ing of ingredients) {
    // Check for exact normalized name duplicates
    if (seen.has(ing.normalizedName)) {
      const existing = seen.get(ing.normalizedName)!;
      duplicates.push({
        name1: existing.name,
        name2: ing.name,
        category: ing.category,
        reason: 'Identical normalized names',
      });
    } else {
      seen.set(ing.normalizedName, ing);
    }

    // Check for similar names (singular/plural variations)
    for (const [existingNorm, existing] of seen.entries()) {
      if (existingNorm === ing.normalizedName) continue;

      // Check if one is singular and other is plural
      if (
        existingNorm === ing.normalizedName + 's' ||
        existingNorm + 's' === ing.normalizedName
      ) {
        duplicates.push({
          name1: existing.name,
          name2: ing.name,
          category: ing.category,
          reason: 'Singular/plural variation',
        });
      }

      // Check for very similar names (Levenshtein distance < 3)
      if (
        existing.category === ing.category &&
        getSimilarity(existingNorm, ing.normalizedName) > 0.85
      ) {
        duplicates.push({
          name1: existing.name,
          name2: ing.name,
          category: ing.category,
          reason: 'Very similar names in same category',
        });
      }
    }
  }

  return duplicates;
}

// Calculate string similarity (0-1)
function getSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

// Calculate Levenshtein distance
function getEditDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

// Identify overly generic ingredients that should be removed
function findGenerics(
  ingredients: IngredientData[]
): AnalysisReport['generics'] {
  const genericPatterns = [
    'berries',
    'nuts',
    'frozen vegetables',
    'cereal',
    'soup',
    'pasta',
  ];

  const generics: AnalysisReport['generics'] = [];

  for (const ing of ingredients) {
    const nameLower = ing.name.toLowerCase();

    if (genericPatterns.includes(nameLower)) {
      generics.push({
        name: ing.name,
        category: ing.category,
        reason: 'Overly generic - specific varieties exist',
      });
    }
  }

  return generics;
}

// Identify miscategorized ingredients based on new subcategory structure
function findMiscategorized(
  ingredients: IngredientData[]
): AnalysisReport['miscategorized'] {
  const miscategorized: AnalysisReport['miscategorized'] = [];

  for (const ing of ingredients) {
    const nameLower = ing.name.toLowerCase();

    // Alliums misplaced in flavor_builders
    if (
      ing.category === 'flavor_builders' &&
      (nameLower.includes('garlic') ||
        nameLower.includes('onion') ||
        nameLower === 'leeks' ||
        nameLower === 'shallots')
    ) {
      miscategorized.push({
        name: ing.name,
        currentCategory: ing.category,
        suggestedCategory: 'fresh_produce',
        suggestedSubcategory: 'alliums',
        reason: 'Alliums should be in fresh_produce/alliums',
      });
    }

    // Fresh aromatics misplaced in flavor_builders
    if (
      ing.category === 'flavor_builders' &&
      (nameLower.includes('ginger root') ||
        nameLower === 'fresh ginger' ||
        nameLower === 'lemongrass')
    ) {
      miscategorized.push({
        name: ing.name,
        currentCategory: ing.category,
        suggestedCategory: 'fresh_produce',
        suggestedSubcategory: 'fresh_aromatics',
        reason: 'Fresh aromatics should be in fresh_produce',
      });
    }

    // Canned seafood misplaced in pantry_staples
    if (
      ing.category === 'pantry_staples' &&
      (nameLower.includes('canned salmon') ||
        nameLower.includes('canned sardines') ||
        nameLower.includes('canned tuna'))
    ) {
      miscategorized.push({
        name: ing.name,
        currentCategory: ing.category,
        suggestedCategory: 'proteins',
        suggestedSubcategory: 'seafood',
        reason: 'Canned seafood should be in proteins/seafood',
      });
    }

    // Coconut milk misplaced in pantry_staples
    if (ing.category === 'pantry_staples' && nameLower === 'coconut milk') {
      miscategorized.push({
        name: ing.name,
        currentCategory: ing.category,
        suggestedCategory: 'dairy_cold',
        suggestedSubcategory: 'plant_based_dairy',
        reason: 'Coconut milk should be in dairy_cold/plant_based_dairy',
      });
    }

    // Oats/oatmeal misplaced in pantry_staples
    if (
      ing.category === 'pantry_staples' &&
      (nameLower === 'oatmeal' || nameLower === 'instant oatmeal')
    ) {
      miscategorized.push({
        name: ing.name,
        currentCategory: ing.category,
        suggestedCategory: 'bakery_grains',
        suggestedSubcategory: 'oats_hot_cereals',
        reason: 'Oats should be in bakery_grains/oats_hot_cereals',
      });
    }

    // Cereals and granola misplaced in pantry_staples
    if (
      ing.category === 'pantry_staples' &&
      (nameLower === 'cereal' || nameLower === 'granola')
    ) {
      miscategorized.push({
        name: ing.name,
        currentCategory: ing.category,
        suggestedCategory: 'bakery_grains',
        suggestedSubcategory: 'breakfast_cereals',
        reason: 'Cereals should be in bakery_grains/breakfast_cereals',
      });
    }

    // Nuts in pantry_staples should move to proteins
    if (
      ing.category === 'pantry_staples' &&
      (nameLower === 'almonds' ||
        nameLower === 'walnuts' ||
        nameLower === 'pecans' ||
        nameLower === 'peanuts' ||
        nameLower === 'mixed nuts')
    ) {
      miscategorized.push({
        name: ing.name,
        currentCategory: ing.category,
        suggestedCategory: 'proteins',
        suggestedSubcategory: 'nuts_seeds',
        reason: 'Nuts should be in proteins/nuts_seeds',
      });
    }

    // Broths/stocks misplaced in pantry_staples
    if (
      ing.category === 'pantry_staples' &&
      (nameLower.includes('broth') || nameLower.includes('stock'))
    ) {
      miscategorized.push({
        name: ing.name,
        currentCategory: ing.category,
        suggestedCategory: 'cooking_essentials',
        suggestedSubcategory: 'stocks_broths',
        reason: 'Broths/stocks should be in cooking_essentials/stocks_broths',
      });
    }

    // Sauces misplaced in pantry_staples
    if (
      ing.category === 'pantry_staples' &&
      (nameLower.includes('soy sauce') ||
        nameLower.includes('hoisin') ||
        nameLower.includes('oyster sauce') ||
        nameLower.includes('sriracha') ||
        nameLower.includes('teriyaki'))
    ) {
      miscategorized.push({
        name: ing.name,
        currentCategory: ing.category,
        suggestedCategory: 'cooking_essentials',
        suggestedSubcategory: 'sauces_asian',
        reason: 'Asian sauces should be in cooking_essentials/sauces_asian',
      });
    }

    // BBQ sauce, hot sauce, etc. misplaced in pantry_staples
    if (
      ing.category === 'pantry_staples' &&
      (nameLower.includes('bbq sauce') || nameLower.includes('hot sauce'))
    ) {
      miscategorized.push({
        name: ing.name,
        currentCategory: ing.category,
        suggestedCategory: 'cooking_essentials',
        suggestedSubcategory: 'sauces_western',
        reason: 'Western sauces should be in cooking_essentials/sauces_western',
      });
    }

    // Canned tomatoes in pantry_staples
    if (
      ing.category === 'pantry_staples' &&
      (nameLower.includes('crushed tomatoes') ||
        nameLower.includes('diced tomatoes') ||
        nameLower.includes('tomato paste') ||
        nameLower.includes('tomato sauce'))
    ) {
      miscategorized.push({
        name: ing.name,
        currentCategory: ing.category,
        suggestedCategory: 'cooking_essentials',
        suggestedSubcategory: 'tomato_products',
        reason:
          'Tomato products should be in cooking_essentials/tomato_products',
      });
    }

    // Baking essentials misplaced in pantry_staples
    if (
      ing.category === 'pantry_staples' &&
      (nameLower === 'cocoa powder' ||
        nameLower === 'chocolate chips' ||
        nameLower === 'dark chocolate' ||
        nameLower === 'milk chocolate' ||
        nameLower === 'white chocolate')
    ) {
      miscategorized.push({
        name: ing.name,
        currentCategory: ing.category,
        suggestedCategory: 'pantry_staples',
        suggestedSubcategory: 'chocolate_baking_chips',
        reason:
          'Should remain in pantry_staples but subcategorize as chocolate_baking_chips',
      });
    }

    // Legumes in pantry_staples that should be split
    if (
      ing.category === 'pantry_staples' &&
      (nameLower === 'black beans' ||
        nameLower === 'chickpeas' ||
        nameLower === 'kidney beans' ||
        nameLower === 'pinto beans' ||
        nameLower === 'white beans' ||
        nameLower === 'navy beans' ||
        nameLower === 'refried beans')
    ) {
      miscategorized.push({
        name: ing.name,
        currentCategory: ing.category,
        suggestedCategory: 'proteins',
        suggestedSubcategory: 'legumes_canned',
        reason: 'Canned beans should be in proteins/legumes_canned',
      });
    }
  }

  return miscategorized;
}

// Generate and display report
function generateReport(report: AnalysisReport): void {
  console.log('\n========================================');
  console.log('GLOBAL INGREDIENTS ANALYSIS REPORT');
  console.log('========================================\n');

  console.log(`📊 SUMMARY`);
  console.log(`  • Duplicates found: ${report.duplicates.length}`);
  console.log(`  • Generic items: ${report.generics.length}`);
  console.log(`  • Miscategorized items: ${report.miscategorized.length}`);
  console.log(
    `  • Total issues: ${report.duplicates.length + report.generics.length + report.miscategorized.length}\n`
  );

  if (report.duplicates.length > 0) {
    console.log('🔄 DUPLICATES TO CONSOLIDATE');
    console.log('━'.repeat(50));
    report.duplicates.forEach((dup, idx) => {
      console.log(`${idx + 1}. "${dup.name1}" ↔️  "${dup.name2}"`);
      console.log(`   Category: ${dup.category}`);
      console.log(`   Reason: ${dup.reason}\n`);
    });
  }

  if (report.generics.length > 0) {
    console.log('🗑️  GENERIC ITEMS TO REMOVE');
    console.log('━'.repeat(50));
    report.generics.forEach((gen, idx) => {
      console.log(`${idx + 1}. "${gen.name}" (${gen.category})`);
      console.log(`   Reason: ${gen.reason}\n`);
    });
  }

  if (report.miscategorized.length > 0) {
    console.log('🔀 MISCATEGORIZED ITEMS TO MOVE');
    console.log('━'.repeat(50));
    report.miscategorized.forEach((misc, idx) => {
      console.log(`${idx + 1}. "${misc.name}"`);
      console.log(`   Current: ${misc.currentCategory}`);
      console.log(
        `   Suggested: ${misc.suggestedCategory} → ${misc.suggestedSubcategory}`
      );
      console.log(`   Reason: ${misc.reason}\n`);
    });
  }

  console.log('========================================');
  console.log('END OF REPORT');
  console.log('========================================\n');
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

  const report: AnalysisReport = {
    duplicates: findDuplicates(ingredients),
    generics: findGenerics(ingredients),
    miscategorized: findMiscategorized(ingredients),
  };

  generateReport(report);

  // Save report to JSON
  const reportPath = path.join(__dirname, '../ingredient-analysis-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`💾 Detailed report saved to: ${reportPath}\n`);
}

main();
