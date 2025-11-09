/**
 * Validation script to verify ingredient data integrity after cleanup
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalIngredients: number;
    byCategory: Record<string, number>;
    bySubcategory: Record<string, number>;
    withoutSubcategory: number;
    duplicateNormalizedNames: number;
  };
}

interface IngredientAssignment {
  name: string;
  normalizedName: string;
  category: string;
  subcategory: string;
  action: 'keep' | 'delete' | 'move';
}

// Read assignment data from the generated JSON
function loadAssignments(): IngredientAssignment[] {
  const dataPath = path.join(__dirname, '../ingredient-assignments.json');

  if (!fs.existsSync(dataPath)) {
    console.error(
      '❌ Assignment data not found. Run assign-subcategories.ts first.'
    );
    process.exit(1);
  }

  const content = fs.readFileSync(dataPath, 'utf-8');
  return JSON.parse(content) as IngredientAssignment[];
}

// Validate the assignments
function validate(assignments: IngredientAssignment[]): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    stats: {
      totalIngredients: 0,
      byCategory: {},
      bySubcategory: {},
      withoutSubcategory: 0,
      duplicateNormalizedNames: 0,
    },
  };

  // Filter out items marked for deletion
  const activeIngredients = assignments.filter((a) => a.action !== 'delete');
  result.stats.totalIngredients = activeIngredients.length;

  // Track normalized names for duplicates
  const normalizedNames = new Map<string, string[]>();

  // Valid categories and subcategories
  const validCategories = [
    'proteins',
    'fresh_produce',
    'flavor_builders',
    'cooking_essentials',
    'bakery_grains',
    'dairy_cold',
    'pantry_staples',
    'frozen',
  ];

  const validSubcategories: Record<string, string[]> = {
    bakery_grains: [
      'pasta_noodles',
      'rice_ancient_grains',
      'bread_baked_goods',
      'flours_meals',
      'oats_hot_cereals',
      'breakfast_cereals',
      'baking_mixes',
    ],
    proteins: [
      'fresh_meat',
      'poultry',
      'seafood',
      'plant_proteins',
      'eggs_egg_products',
      'legumes_dried',
      'legumes_canned',
      'nuts_seeds',
    ],
    fresh_produce: [
      'leafy_greens',
      'cruciferous_vegetables',
      'root_vegetables',
      'alliums',
      'nightshades',
      'squash_gourds',
      'fresh_herbs',
      'fresh_aromatics',
      'citrus_fruits',
      'stone_fruits',
      'berries',
      'tropical_fruits',
      'apples_pears',
      'melons',
    ],
    dairy_cold: [
      'milk_cream',
      'yogurt_kefir',
      'cheese_hard',
      'cheese_soft',
      'butter_spreads',
      'plant_based_dairy',
      'refrigerated_dough',
    ],
    cooking_essentials: [
      'cooking_oils',
      'vinegars',
      'cooking_wines_spirits',
      'stocks_broths',
      'sauces_asian',
      'sauces_western',
      'tomato_products',
    ],
    flavor_builders: [
      'dried_herbs',
      'ground_spices',
      'whole_spices',
      'spice_blends',
      'salt_pepper',
      'extracts_flavorings',
      'fresh_aromatics',
    ],
    pantry_staples: [
      'sweeteners',
      'baking_essentials',
      'canned_vegetables',
      'canned_fruits',
      'condiments',
      'jams_preserves',
      'dried_fruits',
      'snacks',
      'chocolate_baking_chips',
    ],
    frozen: [
      'frozen_vegetables',
      'frozen_fruits',
      'frozen_proteins',
      'frozen_prepared_foods',
      'ice_cream_desserts',
      'frozen_dough_pastry',
    ],
  };

  // Validate each ingredient
  for (const ing of activeIngredients) {
    // Track normalized names
    if (!normalizedNames.has(ing.normalizedName)) {
      normalizedNames.set(ing.normalizedName, []);
    }
    normalizedNames.get(ing.normalizedName)!.push(ing.name);

    // Check category validity
    if (!validCategories.includes(ing.category)) {
      result.errors.push(
        `Invalid category "${ing.category}" for ingredient "${ing.name}"`
      );
      result.isValid = false;
    }

    // Count by category
    result.stats.byCategory[ing.category] =
      (result.stats.byCategory[ing.category] || 0) + 1;

    // Check subcategory
    if (!ing.subcategory) {
      result.stats.withoutSubcategory++;
      result.warnings.push(
        `Ingredient "${ing.name}" has no subcategory assigned`
      );
    } else {
      // Count by subcategory
      const key = `${ing.category}::${ing.subcategory}`;
      result.stats.bySubcategory[key] =
        (result.stats.bySubcategory[key] || 0) + 1;

      // Validate subcategory is valid for category
      const validSubs = validSubcategories[ing.category] || [];
      if (!validSubs.includes(ing.subcategory)) {
        result.errors.push(
          `Invalid subcategory "${ing.subcategory}" for category "${ing.category}" on ingredient "${ing.name}"`
        );
        result.isValid = false;
      }
    }
  }

  // Check for duplicates
  for (const [normalizedName, names] of normalizedNames.entries()) {
    if (names.length > 1) {
      result.stats.duplicateNormalizedNames++;
      result.errors.push(
        `Duplicate normalized name "${normalizedName}": ${names.join(', ')}`
      );
      result.isValid = false;
    }
  }

  return result;
}

// Generate report
function generateReport(result: ValidationResult): void {
  console.log('\n========================================');
  console.log('INGREDIENT DATA VALIDATION REPORT');
  console.log('========================================\n');

  // Summary
  console.log('📊 SUMMARY');
  console.log(`  • Total ingredients: ${result.stats.totalIngredients}`);
  console.log(
    `  • Validation status: ${result.isValid ? '✅ PASSED' : '❌ FAILED'}`
  );
  console.log(`  • Errors: ${result.errors.length}`);
  console.log(`  • Warnings: ${result.warnings.length}\n`);

  // Stats by category
  console.log('📈 BY CATEGORY');
  console.log('━'.repeat(50));
  Object.entries(result.stats.byCategory)
    .sort(([, a], [, b]) => b - a)
    .forEach(([category, count]) => {
      console.log(
        `  ${category.padEnd(25)} ${count.toString().padStart(4)} items`
      );
    });
  console.log();

  // Stats by subcategory
  console.log('📈 BY SUBCATEGORY');
  console.log('━'.repeat(50));
  Object.entries(result.stats.bySubcategory)
    .sort(([, a], [, b]) => b - a)
    .forEach(([key, count]) => {
      const [category, subcategory] = key.split('::');
      console.log(
        `  ${category}::${subcategory}`.padEnd(50) +
          count.toString().padStart(4)
      );
    });
  console.log();

  // Issues without subcategory
  if (result.stats.withoutSubcategory > 0) {
    console.log('⚠️  ITEMS WITHOUT SUBCATEGORY');
    console.log('━'.repeat(50));
    console.log(
      `  ${result.stats.withoutSubcategory} items need subcategory assignment\n`
    );
  }

  // Duplicate issues
  if (result.stats.duplicateNormalizedNames > 0) {
    console.log('🔄 DUPLICATE NORMALIZED NAMES');
    console.log('━'.repeat(50));
    console.log(
      `  ${result.stats.duplicateNormalizedNames} duplicates found\n`
    );
  }

  // Errors
  if (result.errors.length > 0) {
    console.log('❌ ERRORS');
    console.log('━'.repeat(50));
    result.errors.forEach((error, idx) => {
      console.log(`${idx + 1}. ${error}`);
    });
    console.log();
  }

  // Warnings
  if (result.warnings.length > 0 && result.warnings.length <= 10) {
    console.log('⚠️  WARNINGS');
    console.log('━'.repeat(50));
    result.warnings.slice(0, 10).forEach((warning, idx) => {
      console.log(`${idx + 1}. ${warning}`);
    });
    if (result.warnings.length > 10) {
      console.log(`... and ${result.warnings.length - 10} more warnings\n`);
    } else {
      console.log();
    }
  }

  console.log('========================================');
  console.log('END OF VALIDATION REPORT');
  console.log('========================================\n');

  if (result.isValid) {
    console.log('✅ All validation checks passed!\n');
  } else {
    console.log('❌ Validation failed. Please fix the errors above.\n');
    process.exit(1);
  }
}

// Main execution
function main() {
  console.log('📋 Loading ingredient assignments...');
  const assignments = loadAssignments();
  console.log(`✅ Loaded ${assignments.length} ingredient assignments\n`);

  console.log('🔍 Running validation checks...');
  const result = validate(assignments);

  generateReport(result);

  // Save validation result to JSON
  const reportPath = path.join(__dirname, '../validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
  console.log(`💾 Validation report saved to: ${reportPath}\n`);
}

main();
