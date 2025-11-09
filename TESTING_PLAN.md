# Testing Plan for Ingredient Subcategories Feature

## Prerequisites

Before testing, ensure the following migrations have been applied:

1. **Schema Migration**: `20251109000001_add_ingredient_subcategory.sql`
   - Adds `subcategory` column to `global_ingredients` table
   - Creates necessary indexes

2. **Data Migration**: `20251109000002_cleanup_and_assign_subcategories.sql`
   - Removes 7 duplicate/generic ingredients
   - Moves 47 miscategorized ingredients
   - Assigns subcategories to all 523 ingredients

## Apply Migrations

```bash
# Navigate to project directory
cd "/Users/justinfassio/Local Sites/Recipe Generator"

# Apply migrations using Supabase CLI
npx supabase db push

# OR apply manually through Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Run each migration file in order
```

## Testing Checklist

### 1. Database Verification

- [ ] Verify `subcategory` column exists in `global_ingredients` table
- [ ] Confirm indexes created successfully:
  - `idx_global_ingredients_category_subcategory`
  - `idx_global_ingredients_subcategory`
- [ ] Check ingredient count: Should have ~523 items (530 - 7 deleted)
- [ ] Verify no duplicates exist by normalized_name
- [ ] Spot-check subcategory assignments:
  - Garlic should be in `fresh_produce` / `alliums`
  - Canned Tuna should be in `proteins` / `seafood`
  - Spaghetti should be in `bakery_grains` / `pasta_noodles`

### 2. Global Ingredients Page Testing

#### Category Filtering

- [ ] Navigate to `/ingredients` (My Ingredients page)
- [ ] **All Categories View**:
  - [ ] Should display all 8 main categories
  - [ ] Each category should show subcategory sections
  - [ ] Subcategories should be ordered by sortOrder
  - [ ] Counts should be accurate for each subcategory

#### Category Selection

- [ ] Click on **Bakery & Grains** tab
  - [ ] Subcategory filter pills should appear below tabs
  - [ ] Should show: Pasta & Noodles, Rice & Ancient Grains, Bread & Baked Goods, Flours & Meals, Oats & Hot Cereals, Breakfast Cereals, Baking Mixes
  - [ ] Each pill should show ingredient count
  - [ ] "All" button should be active by default

- [ ] Click on **Fresh Produce** tab
  - [ ] Should show 13 subcategories
  - [ ] Verify icons display correctly for each subcategory
  - [ ] Check that Alliums subcategory appears (contains moved garlic items)

- [ ] Click on **Proteins** tab
  - [ ] Should show Seafood subcategory with canned seafood items
  - [ ] Should show Nuts & Seeds with moved nut items
  - [ ] Should show Legumes - Canned with moved bean items

#### Subcategory Filtering

- [ ] Select a category (e.g., Bakery & Grains)
- [ ] Click on **Pasta & Noodles** subcategory pill
  - [ ] Only pasta items should display
  - [ ] Pill should highlight in blue
  - [ ] Count should match displayed items
- [ ] Click on **All** button
  - [ ] All subcategories should display again
  - [ ] "All" button should highlight

- [ ] Test each major category's subcategory filters
- [ ] Verify switching between subcategories works smoothly

#### Search Functionality

- [ ] Enter a search term (e.g., "garlic")
  - [ ] Should filter across all categories/subcategories
  - [ ] Results should still be grouped by category and subcategory
  - [ ] Subcategory filter should still work with search results

- [ ] Clear search
- [ ] Try searching within a specific category
  - [ ] Select "Fresh Produce"
  - [ ] Search for "tomato"
  - [ ] Should only show tomatoes from Fresh Produce

#### Add/Remove to Kitchen

- [ ] Click to add an ingredient to your kitchen
  - [ ] Should see success feedback
  - [ ] Kitchen count in header should increment
  - [ ] Ingredient should show as "added" state

- [ ] Click to remove an ingredient from your kitchen
  - [ ] Should see confirmation/success
  - [ ] Kitchen count should decrement

### 3. My Kitchen Page Testing

- [ ] Navigate to `/kitchen` (My Kitchen page)
- [ ] Verify subcategory organization is maintained
- [ ] Test filtering and searching
- [ ] Verify changes sync between My Ingredients and My Kitchen pages

### 4. Mobile Responsiveness

- [ ] Test on mobile viewport (< 640px)
  - [ ] Subcategory pills should scroll horizontally
  - [ ] Icons should be visible even when labels are hidden
  - [ ] Tooltips should work on hover/long-press
  - [ ] "All" button should always be visible

- [ ] Test on tablet viewport (640px - 1024px)
  - [ ] Subcategory labels should show on larger buttons
  - [ ] Grid layout should adjust appropriately

### 5. Performance Testing

- [ ] Load time with all 523 ingredients
  - [ ] Page should load in < 2 seconds
  - [ ] No layout shift during subcategory filter render

- [ ] Filtering performance
  - [ ] Category switch should be instant
  - [ ] Subcategory filter should respond in < 100ms
  - [ ] Search should provide results in < 200ms

- [ ] Check browser console for errors
- [ ] Verify no infinite re-renders

### 6. Data Integrity Tests

- [ ] Verify no ingredients are missing after migration
- [ ] Check that moved items appear in correct new locations:
  - [ ] Garlic, Onions → Fresh Produce / Alliums
  - [ ] Canned seafood → Proteins / Seafood
  - [ ] Nuts → Proteins / Nuts & Seeds
  - [ ] Beans → Proteins / Legumes - Canned
  - [ ] Broths → Cooking Essentials / Stocks & Broths
  - [ ] Soy Sauce, etc. → Cooking Essentials / Sauces - Asian

- [ ] Confirm deleted items are gone:
  - [ ] "Pasta" (generic) - deleted
  - [ ] "Berries" (generic) - deleted
  - [ ] "Nuts" (generic) - deleted
  - [ ] "Frozen Vegetables" (generic) - deleted
  - [ ] "Mustard Seed" (singular, duplicate of "Mustard Seeds") - deleted

### 7. Edge Cases

- [ ] **Empty subcategory**: If a subcategory has no items, it should not appear
- [ ] **Search with no results**: Should show "No ingredients found" message
- [ ] **Category with one subcategory**: Should still show subcategory filter
- [ ] **Long ingredient names**: Should wrap or truncate gracefully
- [ ] **Many subcategories**: Horizontal scroll should work smoothly

### 8. Browser Compatibility

Test on:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

### 9. Accessibility

- [ ] Keyboard navigation works through category tabs
- [ ] Keyboard navigation works through subcategory filters
- [ ] Screen reader announces category/subcategory changes
- [ ] Focus indicators are visible
- [ ] Color contrast meets WCAG standards

## Expected Results Summary

### Before Migration

- **Total Ingredients**: 530
- **Categories**: 8
- **Subcategories**: None
- **Known Issues**: 63 (7 duplicates, 6 generics, 52 miscategorized)

### After Migration

- **Total Ingredients**: 523 (7 removed)
- **Categories**: 8
- **Subcategories**: 56 total across all categories
- **Issues Resolved**: All duplicates removed, all items correctly categorized and subcategorized

### Category Breakdown

- **Fresh Produce**: 80 items → 13 subcategories
- **Bakery & Grains**: 74 items → 7 subcategories
- **Pantry Staples**: 72 items → 9 subcategories
- **Dairy & Cold**: 71 items → 7 subcategories
- **Proteins**: 66 items → 8 subcategories
- **Cooking Essentials**: 59 items → 7 subcategories
- **Flavor Builders**: 51 items → 7 subcategories
- **Frozen**: 50 items → 6 subcategories

## Rollback Plan

If critical issues are found:

```sql
-- Rollback: Remove subcategory column
ALTER TABLE global_ingredients DROP COLUMN subcategory;
DROP INDEX IF EXISTS idx_global_ingredients_category_subcategory;
DROP INDEX IF EXISTS idx_global_ingredients_subcategory;
```

Note: This will not restore deleted items or reverse category moves. Keep a backup before applying migrations!

## Sign-off

- [ ] All database tests passed
- [ ] All UI tests passed
- [ ] All mobile tests passed
- [ ] All performance benchmarks met
- [ ] No critical bugs found
- [ ] Documentation updated
- [ ] Ready for production deployment

---

**Testing Date**: **\*\***\_**\*\***

**Tested By**: **\*\***\_**\*\***

**Issues Found**: **\*\***\_**\*\***

**Status**: ⬜ PASS ⬜ FAIL ⬜ PASS WITH MINOR ISSUES
