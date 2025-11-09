-- Migration to cleanup duplicates, fix miscategorizations, and assign subcategories
-- Generated on 2025-11-09T15:22:03.421Z

BEGIN;

-- Delete generic and duplicate items (7 items)
DELETE FROM global_ingredients WHERE name IN (
  'Pasta',
  'Mustard Seed',
  'Berries',
  'Frozen Vegetables',
  'Cereal',
  'Nuts',
  'Soup'
);

-- Move miscategorized items and assign subcategories

-- Move to fresh_produce → fresh_aromatics (2 items)
UPDATE global_ingredients
SET category = 'fresh_produce', subcategory = 'fresh_aromatics'
WHERE name IN (
  'Fresh Ginger',
  'Lemongrass'
);

-- Move to fresh_produce → alliums (10 items)
UPDATE global_ingredients
SET category = 'fresh_produce', subcategory = 'alliums'
WHERE name IN (
  'Garlic',
  'Garlic Cloves',
  'Garlic Powder',
  'Leeks',
  'Minced Garlic',
  'Onion Powder',
  'Red Onions',
  'Shallots',
  'White Onions',
  'Yellow Onions'
);

-- Move to proteins → nuts_seeds (5 items)
UPDATE global_ingredients
SET category = 'proteins', subcategory = 'nuts_seeds'
WHERE name IN (
  'Almonds',
  'Mixed Nuts',
  'Peanuts',
  'Pecans',
  'Walnuts'
);

-- Move to cooking_essentials → sauces_western (2 items)
UPDATE global_ingredients
SET category = 'cooking_essentials', subcategory = 'sauces_western'
WHERE name IN (
  'BBQ Sauce',
  'Hot Sauce'
);

-- Move to cooking_essentials → stocks_broths (3 items)
UPDATE global_ingredients
SET category = 'cooking_essentials', subcategory = 'stocks_broths'
WHERE name IN (
  'Beef Broth',
  'Chicken Broth',
  'Vegetable Broth'
);

-- Move to proteins → legumes_canned (7 items)
UPDATE global_ingredients
SET category = 'proteins', subcategory = 'legumes_canned'
WHERE name IN (
  'Black Beans',
  'Chickpeas',
  'Kidney Beans',
  'Navy Beans',
  'Pinto Beans',
  'Refried Beans',
  'White Beans'
);

-- Move to proteins → seafood (3 items)
UPDATE global_ingredients
SET category = 'proteins', subcategory = 'seafood'
WHERE name IN (
  'Canned Salmon',
  'Canned Sardines',
  'Canned Tuna'
);

-- Move to dairy_cold → plant_based_dairy (1 items)
UPDATE global_ingredients
SET category = 'dairy_cold', subcategory = 'plant_based_dairy'
WHERE name IN (
  'Coconut Milk'
);

-- Move to cooking_essentials → tomato_products (5 items)
UPDATE global_ingredients
SET category = 'cooking_essentials', subcategory = 'tomato_products'
WHERE name IN (
  'Crushed Tomatoes',
  'Diced Tomatoes',
  'Sun-Dried Tomatoes',
  'Tomato Paste',
  'Tomato Sauce'
);

-- Move to bakery_grains → breakfast_cereals (1 items)
UPDATE global_ingredients
SET category = 'bakery_grains', subcategory = 'breakfast_cereals'
WHERE name IN (
  'Granola'
);

-- Move to cooking_essentials → sauces_asian (6 items)
UPDATE global_ingredients
SET category = 'cooking_essentials', subcategory = 'sauces_asian'
WHERE name IN (
  'Hoisin Sauce',
  'Low Sodium Soy Sauce',
  'Oyster Sauce',
  'Soy Sauce',
  'Sriracha',
  'Teriyaki Sauce'
);

-- Move to bakery_grains → oats_hot_cereals (2 items)
UPDATE global_ingredients
SET category = 'bakery_grains', subcategory = 'oats_hot_cereals'
WHERE name IN (
  'Instant Oatmeal',
  'Oatmeal'
);

-- Assign subcategories to existing items

-- bakery_grains → flours_meals (14 items)
UPDATE global_ingredients
SET subcategory = 'flours_meals'
WHERE category = 'bakery_grains' AND name IN (
  'Active Dry Yeast',
  'All-Purpose Flour',
  'Almond Flour',
  'Arrowroot Powder',
  'Baking Powder',
  'Baking Soda',
  'Cake Flour',
  'Coconut Flour',
  'Cornmeal',
  'Cornstarch',
  'Instant Yeast',
  'Self-Rising Flour',
  'Tapioca Starch',
  'Whole Wheat Flour'
);

-- bakery_grains → pasta_noodles (18 items)
UPDATE global_ingredients
SET subcategory = 'pasta_noodles'
WHERE category = 'bakery_grains' AND name IN (
  'Angel Hair',
  'Egg Noodles',
  'Fettuccine',
  'Fusilli',
  'Lasagna Sheets',
  'Linguine',
  'Macaroni',
  'Orzo',
  'Penne',
  'Ramen Noodles',
  'Ravioli',
  'Rice Noodles',
  'Rigatoni',
  'Soba Noodles',
  'Spaghetti',
  'Tortellini',
  'Udon Noodles',
  'Vermicelli'
);

-- bakery_grains → rice_ancient_grains (13 items)
UPDATE global_ingredients
SET subcategory = 'rice_ancient_grains'
WHERE category = 'bakery_grains' AND name IN (
  'Arborio Rice',
  'Barley',
  'Basmati Rice',
  'Brown Rice',
  'Bulgur',
  'Couscous',
  'Farro',
  'Jasmine Rice',
  'Quinoa',
  'Rice',
  'Semolina',
  'White Rice',
  'Wild Rice'
);

-- bakery_grains → bread_baked_goods (20 items)
UPDATE global_ingredients
SET subcategory = 'bread_baked_goods'
WHERE category = 'bakery_grains' AND name IN (
  'Bagels',
  'Bread',
  'Bread Flour',
  'Brioche',
  'Corn Tortillas',
  'Croissants',
  'Dinner Rolls',
  'English Muffins',
  'Flour Tortillas',
  'Hamburger Buns',
  'Hot Dog Buns',
  'Naan',
  'Pita Bread',
  'Pumpernickel Bread',
  'Rolled Oats',
  'Rye Bread',
  'Sourdough Bread',
  'Tortillas',
  'White Bread',
  'Whole Wheat Bread'
);

-- bakery_grains → oats_hot_cereals (3 items)
UPDATE global_ingredients
SET subcategory = 'oats_hot_cereals'
WHERE category = 'bakery_grains' AND name IN (
  'Instant Oats',
  'Oats',
  'Steel Cut Oats'
);

-- bakery_grains → baking_mixes (3 items)
UPDATE global_ingredients
SET subcategory = 'baking_mixes'
WHERE category = 'bakery_grains' AND name IN (
  'Phyllo Dough',
  'Pie Crust',
  'Pizza Dough'
);

-- cooking_essentials → cooking_oils (25 items)
UPDATE global_ingredients
SET subcategory = 'cooking_oils'
WHERE category = 'cooking_essentials' AND name IN (
  'Almond Extract',
  'Avocado Oil',
  'Black Peppercorns',
  'Butter',
  'Canola Oil',
  'Coconut Oil',
  'Extra Virgin Olive Oil',
  'Ghee',
  'Kosher Salt',
  'Lard',
  'Lemon Juice',
  'Lime Juice',
  'Liquid Smoke',
  'Margarine',
  'Mirin',
  'Olive Oil',
  'Orange Juice',
  'Peanut Oil',
  'Sake',
  'Sea Salt',
  'Sesame Oil',
  'Shortening',
  'Sunflower Oil',
  'Vegetable Oil',
  'Worcestershire Sauce'
);

-- cooking_essentials → vinegars (7 items)
UPDATE global_ingredients
SET subcategory = 'vinegars'
WHERE category = 'cooking_essentials' AND name IN (
  'Apple Cider Vinegar',
  'Balsamic Vinegar',
  'Champagne Vinegar',
  'Red Wine Vinegar',
  'Rice Vinegar',
  'Sherry Vinegar',
  'White Wine Vinegar'
);

-- cooking_essentials → stocks_broths (4 items)
UPDATE global_ingredients
SET subcategory = 'stocks_broths'
WHERE category = 'cooking_essentials' AND name IN (
  'Beef Stock',
  'Bone Broth',
  'Chicken Stock',
  'Vegetable Stock'
);

-- cooking_essentials → cooking_wines_spirits (6 items)
UPDATE global_ingredients
SET subcategory = 'cooking_wines_spirits'
WHERE category = 'cooking_essentials' AND name IN (
  'Cooking Sherry',
  'Cooking Wine',
  'Red Wine',
  'Rice Wine',
  'Sherry',
  'White Wine'
);

-- cooking_essentials → sauces_asian (1 items)
UPDATE global_ingredients
SET subcategory = 'sauces_asian'
WHERE category = 'cooking_essentials' AND name IN (
  'Fish Sauce'
);

-- dairy_cold → milk_cream (44 items)
UPDATE global_ingredients
SET subcategory = 'milk_cream'
WHERE category = 'dairy_cold' AND name IN (
  '1% Milk',
  '2% Milk',
  'Almond Milk',
  'Asiago',
  'Blue Cheese',
  'Buttermilk',
  'Camembert',
  'Camembert Cheese',
  'Cashew Milk',
  'Cream Cheese',
  'Crème Fraîche',
  'Egg Whites',
  'Egg Yolks',
  'Extra Large Eggs',
  'Goat Cheese',
  'Gorgonzola',
  'Gruyere',
  'Half and Half',
  'Heavy Cream',
  'Heavy Whipping Cream',
  'Labneh',
  'Large Eggs',
  'Light Cream',
  'Low-Fat Milk',
  'Mascarpone',
  'Milk',
  'Monterey Jack',
  'Monterey Jack Cheese',
  'Oat Milk',
  'Parmigiano-Reggiano',
  'Pepper Jack',
  'Pepper Jack Cheese',
  'Provolone',
  'Provolone Cheese',
  'Rice Milk',
  'Romano',
  'Shredded Cheese',
  'Skim Milk',
  'Sliced Cheese',
  'Sour Cream',
  'Soy Milk',
  'String Cheese',
  'Whipped Cream',
  'Whole Milk'
);

-- dairy_cold → cheese_soft (9 items)
UPDATE global_ingredients
SET subcategory = 'cheese_soft'
WHERE category = 'dairy_cold' AND name IN (
  'Brie',
  'Brie Cheese',
  'Feta',
  'Feta Cheese',
  'Fresh Mozzarella',
  'Mozzarella',
  'Mozzarella Cheese',
  'Ricotta',
  'Ricotta Cheese'
);

-- dairy_cold → cheese_hard (9 items)
UPDATE global_ingredients
SET subcategory = 'cheese_hard'
WHERE category = 'dairy_cold' AND name IN (
  'Cheddar',
  'Cheddar Cheese',
  'Gouda Cheese',
  'Mild Cheddar',
  'Parmesan',
  'Parmesan Cheese',
  'Sharp Cheddar',
  'Swiss',
  'Swiss Cheese'
);

-- dairy_cold → butter_spreads (3 items)
UPDATE global_ingredients
SET subcategory = 'butter_spreads'
WHERE category = 'dairy_cold' AND name IN (
  'European Butter',
  'Salted Butter',
  'Unsalted Butter'
);

-- dairy_cold → yogurt_kefir (5 items)
UPDATE global_ingredients
SET subcategory = 'yogurt_kefir'
WHERE category = 'dairy_cold' AND name IN (
  'Greek Yogurt',
  'Kefir',
  'Plain Yogurt',
  'Regular Yogurt',
  'Vanilla Yogurt'
);

-- flavor_builders → ground_spices (14 items)
UPDATE global_ingredients
SET subcategory = 'ground_spices'
WHERE category = 'flavor_builders' AND name IN (
  'Allspice',
  'Chili Powder',
  'Cinnamon',
  'Coriander',
  'Cumin',
  'Curry Powder',
  'Ginger Powder',
  'Ground Cinnamon',
  'Ground Cumin',
  'Ground Ginger',
  'Nutmeg',
  'Paprika',
  'Smoked Paprika',
  'Turmeric'
);

-- flavor_builders → dried_herbs (11 items)
UPDATE global_ingredients
SET subcategory = 'dried_herbs'
WHERE category = 'flavor_builders' AND name IN (
  'Bay Leaves',
  'Dried Basil',
  'Dried Oregano',
  'Dried Rosemary',
  'Dried Sage',
  'Dried Thyme',
  'Marjoram',
  'Oregano',
  'Rosemary',
  'Tarragon',
  'Thyme'
);

-- flavor_builders → salt_pepper (6 items)
UPDATE global_ingredients
SET subcategory = 'salt_pepper'
WHERE category = 'flavor_builders' AND name IN (
  'Black Pepper',
  'Cayenne Pepper',
  'Red Pepper Flakes',
  'Salt',
  'Smoked Salt',
  'White Pepper'
);

-- flavor_builders → whole_spices (11 items)
UPDATE global_ingredients
SET subcategory = 'whole_spices'
WHERE category = 'flavor_builders' AND name IN (
  'Caraway Seeds',
  'Cardamom',
  'Celery Seeds',
  'Cloves',
  'Fennel Seeds',
  'jalapeño seeded and finely chopped',
  'Mustard Seeds',
  'Peppercorns',
  'Poppy Seeds',
  'Sesame Seeds',
  'Star Anise'
);

-- flavor_builders → spice_blends (7 items)
UPDATE global_ingredients
SET subcategory = 'spice_blends'
WHERE category = 'flavor_builders' AND name IN (
  'Chinese Five Spice',
  'Everything Bagel Seasoning',
  'Garam Masala',
  'Herbs de Provence',
  'Italian Seasoning',
  'Old Bay Seasoning',
  'Taco Seasoning'
);

-- flavor_builders → extracts_flavorings (2 items)
UPDATE global_ingredients
SET subcategory = 'extracts_flavorings'
WHERE category = 'flavor_builders' AND name IN (
  'Lemon Extract',
  'Tabasco'
);

-- fresh_produce → squash_gourds (4 items)
UPDATE global_ingredients
SET subcategory = 'squash_gourds'
WHERE category = 'fresh_produce' AND name IN (
  'Acorn Squash',
  'Butternut Squash',
  'Yellow Squash',
  'Zucchini'
);

-- fresh_produce → apples_pears (1 items)
UPDATE global_ingredients
SET subcategory = 'apples_pears'
WHERE category = 'fresh_produce' AND name IN (
  'Apples'
);

-- fresh_produce → leafy_greens (5 items)
UPDATE global_ingredients
SET subcategory = 'leafy_greens'
WHERE category = 'fresh_produce' AND name IN (
  'Arugula',
  'Kale',
  'Lettuce',
  'Mixed Greens',
  'Spinach'
);

-- fresh_produce → nightshades (19 items)
UPDATE global_ingredients
SET subcategory = 'nightshades'
WHERE category = 'fresh_produce' AND name IN (
  'Asparagus',
  'Beefsteak Tomatoes',
  'Bell Peppers',
  'Celery',
  'Cherry Tomatoes',
  'Cucumbers',
  'Eggplant',
  'Grape Tomatoes',
  'Green Beans',
  'Green Bell Peppers',
  'Habanero Peppers',
  'Habaneros',
  'Jalapeños',
  'Mushrooms',
  'Poblano Peppers',
  'Red Bell Peppers',
  'Roma Tomatoes',
  'Serrano Peppers',
  'Tomatoes'
);

-- fresh_produce → tropical_fruits (2 items)
UPDATE global_ingredients
SET subcategory = 'tropical_fruits'
WHERE category = 'fresh_produce' AND name IN (
  'Avocados',
  'Bananas'
);

-- fresh_produce → fresh_herbs (13 items)
UPDATE global_ingredients
SET subcategory = 'fresh_herbs'
WHERE category = 'fresh_produce' AND name IN (
  'Basil',
  'Chives',
  'Cilantro',
  'Dill',
  'Fresh Dill',
  'Fresh Mint',
  'Fresh Oregano',
  'Fresh Rosemary',
  'Fresh Sage',
  'Fresh Thyme',
  'Mint',
  'Parsley',
  'Sage'
);

-- fresh_produce → root_vegetables (7 items)
UPDATE global_ingredients
SET subcategory = 'root_vegetables'
WHERE category = 'fresh_produce' AND name IN (
  'Beets',
  'Carrots',
  'Parsnips',
  'Potatoes',
  'Radishes',
  'Sweet Potatoes',
  'Turnips'
);

-- fresh_produce → berries (5 items)
UPDATE global_ingredients
SET subcategory = 'berries'
WHERE category = 'fresh_produce' AND name IN (
  'Blackberries',
  'Blueberries',
  'Grapes',
  'Raspberries',
  'Strawberries'
);

-- fresh_produce → cruciferous_vegetables (4 items)
UPDATE global_ingredients
SET subcategory = 'cruciferous_vegetables'
WHERE category = 'fresh_produce' AND name IN (
  'Broccoli',
  'Brussels Sprouts',
  'Cabbage',
  'Cauliflower'
);

-- fresh_produce → fresh_aromatics (2 items)
UPDATE global_ingredients
SET subcategory = 'fresh_aromatics'
WHERE category = 'fresh_produce' AND name IN (
  'Fresh Ginger Root',
  'Ginger'
);

-- fresh_produce → alliums (3 items)
UPDATE global_ingredients
SET subcategory = 'alliums'
WHERE category = 'fresh_produce' AND name IN (
  'Green Onions',
  'Onions',
  'Scallions'
);

-- fresh_produce → citrus_fruits (3 items)
UPDATE global_ingredients
SET subcategory = 'citrus_fruits'
WHERE category = 'fresh_produce' AND name IN (
  'Lemons',
  'Limes',
  'Oranges'
);

-- frozen → ice_cream_desserts (11 items)
UPDATE global_ingredients
SET subcategory = 'ice_cream_desserts'
WHERE category = 'frozen' AND name IN (
  'Chocolate Ice Cream',
  'Frozen Fruit Bars',
  'Frozen Whipped Topping',
  'Frozen Yogurt',
  'Ice Cream',
  'Ice Cream Bars',
  'Ice Cubes',
  'Popsicles',
  'Sherbet',
  'Sorbet',
  'Vanilla Ice Cream'
);

-- frozen → frozen_fruits (8 items)
UPDATE global_ingredients
SET subcategory = 'frozen_fruits'
WHERE category = 'frozen' AND name IN (
  'Frozen Berries',
  'Frozen Blueberries',
  'Frozen Cherries',
  'Frozen Mango',
  'Frozen Peaches',
  'Frozen Pineapple',
  'Frozen Raspberries',
  'Frozen Strawberries'
);

-- frozen → frozen_vegetables (10 items)
UPDATE global_ingredients
SET subcategory = 'frozen_vegetables'
WHERE category = 'frozen' AND name IN (
  'Frozen Broccoli',
  'Frozen Brussels Sprouts',
  'Frozen Carrots',
  'Frozen Cauliflower',
  'Frozen Corn',
  'Frozen Edamame',
  'Frozen Green Beans',
  'Frozen Mixed Vegetables',
  'Frozen Peas',
  'Frozen Spinach'
);

-- frozen → frozen_prepared_foods (16 items)
UPDATE global_ingredients
SET subcategory = 'frozen_prepared_foods'
WHERE category = 'frozen' AND name IN (
  'Frozen Burritos',
  'Frozen Dumplings',
  'Frozen French Fries',
  'Frozen French Toast',
  'Frozen Fries',
  'Frozen Hash Browns',
  'Frozen Lasagna',
  'Frozen Meatballs',
  'Frozen Onion Rings',
  'Frozen Pancakes',
  'Frozen Pierogies',
  'Frozen Pizza',
  'Frozen Pot Stickers',
  'Frozen Ravioli',
  'Frozen Stir Fry',
  'Frozen Waffles'
);

-- frozen → frozen_proteins (5 items)
UPDATE global_ingredients
SET subcategory = 'frozen_proteins'
WHERE category = 'frozen' AND name IN (
  'Frozen Chicken',
  'Frozen Chicken Nuggets',
  'Frozen Fish',
  'Frozen Fish Sticks',
  'Frozen Shrimp'
);

-- pantry_staples → sweeteners (7 items)
UPDATE global_ingredients
SET subcategory = 'sweeteners'
WHERE category = 'pantry_staples' AND name IN (
  'Agave Nectar',
  'Brown Sugar',
  'Honey',
  'Maple Syrup',
  'Powdered Sugar',
  'Sugar',
  'White Sugar'
);

-- pantry_staples → condiments (28 items)
UPDATE global_ingredients
SET subcategory = 'condiments'
WHERE category = 'pantry_staples' AND name IN (
  'aji amarillo paste',
  'Alfredo Sauce',
  'Capers',
  'Coconut Extract',
  'Condensed Milk',
  'Dijon Mustard',
  'Evaporated Milk',
  'Green Olives',
  'Guacamole',
  'Kalamata Olives',
  'Ketchup',
  'Marinara Sauce',
  'Mayonnaise',
  'Mustard',
  'Nutella',
  'Olives',
  'Pasta Sauce',
  'Pesto',
  'Pickles',
  'Pizza Sauce',
  'Salsa',
  'Saltines',
  'Tahini',
  'Tamari',
  'Vanilla Extract',
  'water',
  'Whole Grain Mustard',
  'Whole Tomatoes'
);

-- pantry_staples → jams_preserves (9 items)
UPDATE global_ingredients
SET subcategory = 'jams_preserves'
WHERE category = 'pantry_staples' AND name IN (
  'Almond Butter',
  'Grape Jelly',
  'Jam',
  'Jelly',
  'Orange Marmalade',
  'Peanut Butter',
  'Preserves',
  'Strawberry Jam',
  'Sunflower Seed Butter'
);

-- pantry_staples → baking_essentials (2 items)
UPDATE global_ingredients
SET subcategory = 'baking_essentials'
WHERE category = 'pantry_staples' AND name IN (
  'Breadcrumbs',
  'Panko'
);

-- pantry_staples → canned_vegetables (14 items)
UPDATE global_ingredients
SET subcategory = 'canned_vegetables'
WHERE category = 'pantry_staples' AND name IN (
  'Canned Beans',
  'Canned Carrots',
  'Canned Chicken',
  'Canned Corn',
  'Canned Green Beans',
  'Canned Peaches',
  'Canned Pears',
  'Canned Peas',
  'Canned Pumpkin',
  'Canned Sweet Potato',
  'Canned Tomatoes',
  'Chicken Noodle Soup',
  'Tomato Soup',
  'Vegetable Soup'
);

-- pantry_staples → snacks (4 items)
UPDATE global_ingredients
SET subcategory = 'snacks'
WHERE category = 'pantry_staples' AND name IN (
  'Chocolate Chips',
  'Crackers',
  'Graham Crackers',
  'Popcorn'
);

-- pantry_staples → chocolate_baking_chips (4 items)
UPDATE global_ingredients
SET subcategory = 'chocolate_baking_chips'
WHERE category = 'pantry_staples' AND name IN (
  'Cocoa Powder',
  'Dark Chocolate',
  'Milk Chocolate',
  'White Chocolate'
);

-- pantry_staples → dried_fruits (4 items)
UPDATE global_ingredients
SET subcategory = 'dried_fruits'
WHERE category = 'pantry_staples' AND name IN (
  'Dates',
  'Dried Cranberries',
  'Dried Fruit',
  'Raisins'
);

-- proteins → seafood (11 items)
UPDATE global_ingredients
SET subcategory = 'seafood'
WHERE category = 'proteins' AND name IN (
  'Anchovies',
  'Cod Fillets',
  'Crab',
  'Lobster',
  'Mussels',
  'Salmon Fillets',
  'Sardines',
  'Scallops',
  'Shrimp',
  'Smoked Salmon',
  'Tuna Steaks'
);

-- proteins → fresh_meat (17 items)
UPDATE global_ingredients
SET subcategory = 'fresh_meat'
WHERE category = 'proteins' AND name IN (
  'Bacon',
  'Beef Chuck',
  'Beef Short Ribs',
  'Beef Steak',
  'Beef Stew Meat',
  'Bison',
  'Ground Beef',
  'Ground Lamb',
  'Ground Pork',
  'Ham',
  'Lamb Chops',
  'Lamb Shanks',
  'Pork Chops',
  'Pork Ribs',
  'Pork Shoulder',
  'Sausage',
  'Venison'
);

-- proteins → nuts_seeds (5 items)
UPDATE global_ingredients
SET subcategory = 'nuts_seeds'
WHERE category = 'proteins' AND name IN (
  'Cashews',
  'Chia Seeds',
  'Hemp Seeds',
  'Nutritional Yeast',
  'Sunflower Seeds'
);

-- proteins → poultry (7 items)
UPDATE global_ingredients
SET subcategory = 'poultry'
WHERE category = 'proteins' AND name IN (
  'Chicken Breast',
  'Chicken Thighs',
  'Chicken Wings',
  'Duck',
  'Ground Turkey',
  'Turkey Breast',
  'Whole Chicken'
);

-- proteins → plant_proteins (5 items)
UPDATE global_ingredients
SET subcategory = 'plant_proteins'
WHERE category = 'proteins' AND name IN (
  'Cottage Cheese',
  'Protein Powder',
  'Seitan',
  'Tempeh',
  'Tofu'
);

-- proteins → legumes_dried (5 items)
UPDATE global_ingredients
SET subcategory = 'legumes_dried'
WHERE category = 'proteins' AND name IN (
  'Edamame',
  'Green Lentils',
  'Lentils',
  'Red Lentils',
  'Split Peas'
);

-- proteins → eggs_egg_products (1 items)
UPDATE global_ingredients
SET subcategory = 'eggs_egg_products'
WHERE category = 'proteins' AND name IN (
  'Eggs'
);

COMMIT;
