// Dish-MC authoring data — which official ingredients are worth quizzing.
//
// The dish multiple-choice ("Which of these is IN the <dish>?") used to lift its
// answer from the frozen v2 engine card, which picked the first ingredient that
// shared no word with the dish name. For pizzas that was "Pizza Dough" — a
// GIVEN, useless to test (every pizza has dough). This module is the fix: for
// every path dish, the DISTINCTIVE, tellable components a server would name to
// identify the plate, RANKED best-first. componentsMcFor (items.ts) rotates
// through this list by round so each showing asks a different component, and
// never deals a base/given as the answer.
//
// Provenance: produced by an adversarially-verified agent audit of the official
// data.foods ingredients (2026-06-14), grounded ONLY in the official lists — no
// invented components. items.ts re-validates every token at runtime against the
// dish's real ingredients (normKey match) and re-applies the given/name-leak
// filters, so a data drift can only ever shrink a pool, never quiz a wrong or
// non-existent component.

/** Base/structural "givens" — never the tested answer, never a distractor — for
 * the ALGORITHMIC fallback (a dish not in KEY_COMPONENTS, e.g. an off-path one).
 * Kept minimal and TRULY universal: a category-defining base sauce that's
 * distinctive for a specific dish (e.g. a white pizza's béchamel) is decided
 * per-dish in KEY_COMPONENTS, not here. Matched by normKey (items.ts). */
export const GIVEN_RAW: readonly string[] = [
  'Pizza Dough',
  'Dough',
  'Crust',
  'Pizza Sauce',
  'Tomato Sauce'
];

/** foodId → its distinctive components, ranked most-tellable first. Every entry
 * is a verbatim member of that dish's official `ingredients`. */
export const KEY_COMPONENTS: Record<string, readonly string[]> = {
  // Snacks
  'french-fries': ['Garlic Aioli'],
  'hummus-chips': ['Preserved Lemon', 'Aleppo Chili'],
  'garlic-bread': ['Garlic Butter', 'Cheese Curd'],
  cashews: ['Salt and Vinegar Spice'],
  'eggplant-fries': ['Nori (Dried Seaweed)', 'Green Harissa Yogurt'],
  'roasted-olives': ['Calabrian Chili', 'Orange Peel'],
  'bread-butter': ['Smoked Tallow'],
  // Small Plates
  'oysters-1-2-dozen': [
    'Dill Pickle Granita (shaved ice made from homemade dill pickle brine)',
    'Horseradish'
  ],
  'tuna-crudo': ['Smoked Tonnato', 'Puttanesca Vinaigrette', 'Fried Caper'],
  'wagyu-beef-carpaccio': ['Cured Wagyu Beef', 'Mushroom Vinaigrette', 'Parmesan Frico', 'Sliced Mushrooms'],
  'lamb-sausage': ['Garlic Labneh', 'Cilantro Vinaigrette', 'Potato Crunch'],
  'burrata-cheese': ['Strawberry Jam', 'Poached Rhubarb'],
  'grilled-octopus-salad': ['Sherry-Soy Vinaigrette', 'Orange Segments', 'Fennel Salt'],
  'mushrooms-on-toast': ['Black Truffle', 'Mushroom Parfait'],
  // Vegetables
  'spiced-beet-salad': ['Pistachio', 'Whipped Feta', 'Pickled Shallots'],
  endive: ['Pecan', 'Apple Vinaigrette', 'Fontina'],
  'crispy-smashed-potatoes': ['Avonlea Cheddar', 'Charred Shallot Aioli'],
  'wood-grilled-asparagus': ['Crab', 'Vadouvan Cream'],
  'snap-peas': ["'Nduja Dressing", 'Bacon Gremolata', 'Pecorino'],
  'smashed-cucumbers': ['Green Tahini Dressing', 'Toasted Almond', 'Chili'],
  'bibb-lettuce': ['Jalapeño Cream', 'Puffed Grains', 'Alpine Cheese'],
  // Pizza (the headline fix — never "Pizza Dough")
  margherita: ['Fior di Latte', 'Provolone'],
  'chicken-sausage': ['Garlic Béchamel', 'Pickled Jalapeno', 'Bacon', 'Mushrooms'],
  'five-cheese': ['Oka', 'Fontina', 'Fior di Latte'],
  'fennel-salami': ['Calabrian Chili', 'Caramelized Honey'],
  'italian-sausage': ['Charred Kale', 'Roasted Pepper'],
  // Pasta
  'italian-pork-sausage': ['Calabrian Chili'],
  'ricotta-dumplings': ['Vodka Tomato Sauce'],
  'shrimp-crab': ['Chili'],
  bigoli: ['Caper', 'Crushed Olive'],
  rigatoni: ['Truffle Oil', 'Mushrooms'],
  // Mains
  'grilled-farm-chicken': ['Dill Gravy', 'Chicken Sausage'],
  'maple-bbq-rainbow-trout': ['Smoked Potato Puree', 'Creamed Kale'],
  'wood-grilled-beef-strip-steak': ['Béarnaise', 'Charred Shallot and Mushrooms'],
  'wood-roasted-halibut': ['Crab Butter'],
  'grilled-lamb-saddle': ['Warm Merguez Potato Salad', 'Labneh'],
  'wood-roasted-half-duck': ['Black Garlic Emulsion', 'Turnips'],
  '26oz-wood-grilled-beef-ribeye': ['Smoked Bone Marrow Jus', 'Green Peppercorn'],
  // Dessert
  'the-banana-pie': ['Pretzel Crust', 'Rum Caramel', 'Coffee'],
  'apple-tatin': ['Toasted Hay', 'Cider Caramel', 'Armagnac'],
  'chocolate-pot-de-creme': ['Sour Cherry', 'Salted Chocolate']
};
