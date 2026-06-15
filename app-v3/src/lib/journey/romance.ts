// Guest-facing dish "romance" lines — the one-sentence recital a server says the
// moment the plate lands: a light opener + the dish NAME + three or four of the
// most appetizing real components, in warm, sensory, memorizable language. Said
// at the drop ("sell the sizzle, not the steak"), NOT a recipe and NOT a sales
// pitch — short and sweet (~12–16 words), easy to say and easy to remember.
//
// Provenance: authored + adversarially verified by an agent team (2026-06-14)
// against the official data.foods ingredients/descriptions, grounded ONLY in real
// components (provenance/technique words used only where the official description
// states them) — no invented facts, no banned/oversell words, and never an
// allergen-safe or health claim (allergen safety lives in the separate framing).
// See docs/handoffs/2026-06-14-v3-dish-photos-and-romance-design.md.
//
// v3-only overlay (mirrors key-components.ts): keyed by foodId, merged at the
// items.ts layer so the shared src/data.js (and v2) stays untouched. items.ts
// re-validates coverage at module init (every path dish must carry one).

/** foodId → the one-sentence guest romance. */
export const ROMANCE: Record<string, string> = {
  // Snacks
  'french-fries': 'Here\'s the french fries — crisp shoestring fries tossed in salt with garlic aioli for dipping.',
  'hummus-chips': 'This is the hummus chips — fried crisp with sesame, Aleppo chili, preserved lemon, and green olive.',
  'garlic-bread': 'Here we have the garlic bread — molten cheese curds in buttery bread with parmesan and chives.',
  cashews: 'Here\'s the cashews — boiled in white vinegar, baked crunchy, dusted in salt-and-vinegar spice.',
  'eggplant-fries': 'This is the eggplant fries — crisp panko and nori, fried golden over a green harissa yogurt.',
  'roasted-olives': 'Here we have the roasted olives — buttery Castelvetrano olives with thyme, orange peel, and Calabrian chili.',
  'bread-butter': 'Here\'s the bread and butter — smoked beef tallow whipped silky with charred onion, served with sourdough.',
  // Small Plates
  'oysters-1-2-dozen': 'This is the half-dozen oysters — ice-cold on salt with dill pickle granita, horseradish, and lemon.',
  'tuna-crudo': 'Here\'s the tuna crudo — salt-cured ahi over smoked tonnato with puttanesca vinaigrette, fried capers, and mint.',
  'wagyu-beef-carpaccio': 'This is the Wagyu carpaccio — sliced raw and velvety with pickled mushroom, parmesan frico, and horseradish.',
  'lamb-sausage': 'Here\'s the lamb sausage — spiced kefta over garlic labneh with sunny fried egg and cilantro vinaigrette.',
  'burrata-cheese': 'Here we have the burrata — soft and runny over poached rhubarb, strawberry jam, and charred sourdough.',
  'grilled-octopus-salad': 'Here\'s the grilled octopus salad — wood-grilled octopus with shaved fennel, sweet orange, and a sherry-soy vinaigrette.',
  'mushrooms-on-toast': 'This is the crab toast — sweet crab and shrimp with silky saffron mousse, finished with lemon.',
  // Vegetables
  'spiced-beet-salad': 'Here\'s the spiced beet salad — over cool whipped feta with pickled shallots, toasted pistachio, and dill.',
  endive: 'Here we have the endive — crisp leaves in apple vinaigrette with shaved Fontina and toasted pecans.',
  'crispy-smashed-potatoes': 'This is the crispy smashed potatoes — fried golden over charred shallot aioli, Avonlea cheddar, and chive.',
  'wood-grilled-asparagus': 'Here\'s the wood-grilled asparagus — charred spears piled with sweet crab, silky vadouvan cream, and brioche croutons.',
  'snap-peas': 'This is the snap peas — crisp with shaved fennel, spicy \'nduja dressing, pecorino, and bacon gremolata.',
  'smashed-cucumbers': 'Here\'s the smashed cucumbers — cured and tossed in green tahini dressing with toasted almond and chili.',
  'bibb-lettuce': 'This is the bibb lettuce — crisp leaves in cool jalapeño cream, puffed grains, and alpine cheese.',
  // Pizza
  margherita: 'Here\'s the Margherita — wood-fired dough, house tomato sauce, milky fior di latte, and torn basil.',
  'chicken-sausage': 'This is the chicken sausage — house-made over garlic béchamel with bacon, pickled jalapeño, and roasted mushrooms.',
  'five-cheese': 'Here we have the Five Cheese — fior di latte, fontina, and parmesan over garlic béchamel base.',
  'fennel-salami': 'Here\'s the Fennel Salami — spicy and cured, with shaved onion, Calabrian-chili kick, caramelized honey, and basil.',
  'italian-sausage': 'This is the Italian sausage — with confit garlic, charred kale, roasted pepper, and pecorino.',
  // Pasta
  'italian-pork-sausage': 'Here\'s the Italian pork sausage — house sausage with garlic, Calabrian chili, and spinach conchiglie.',
  'ricotta-dumplings': 'This is the ricotta dumplings — pillowy ricotta in a silky vodka tomato sauce with torn basil.',
  'shrimp-crab': 'Here\'s the shrimp and crab — sweet and folded into linguini with brown butter, basil, and chili.',
  bigoli: 'Here we have the bigoli — silky semolina pasta in pomodoro with crushed olive, caper, and parsley.',
  rigatoni: 'This is the rigatoni — tubes tossed in a parmesan sauce with earthy mushrooms and truffle oil.',
  // Mains
  'grilled-farm-chicken': 'Here\'s the grilled farm chicken — honey-brined and wood-grilled with house sausage, dill gravy, and golden fries.',
  'maple-bbq-rainbow-trout': 'This is the maple BBQ rainbow trout — steelhead over smoked potato purée with creamed kale.',
  'wood-grilled-beef-strip-steak': 'Here\'s the wood-grilled strip steak — Angus under béarnaise with charred shallot and wild mushroom jus.',
  'wood-roasted-halibut': 'This is the Pacific halibut — wood-roasted over braised leeks and snap peas with crab butter.',
  'grilled-lamb-saddle': 'Here\'s the grilled lamb saddle — rolled with merguez over garlic labneh, warm potato salad, and mint.',
  'wood-roasted-half-duck': 'This is the half duck — glossy rosemary-glazed duck with black garlic emulsion and turnips two ways.',
  '26oz-wood-grilled-beef-ribeye': 'Here\'s the 26oz ribeye — wood-fired prime beef over creamy pomme aligot and a green-peppercorn bone-marrow jus.',
  // Dessert
  'the-banana-pie': 'Here\'s the banana pie — salted pretzel crust under caramelized banana, coffee cream, and toasted Italian meringue.',
  'apple-tatin': 'This is the apple tatin — apples caramelized under puff pastry with Armagnac cream and cider caramel.',
  'chocolate-pot-de-creme': 'Here\'s the chocolate pot de crème — dark custard over sour cherry jam with cool cherry gelato.',
  sorbet: 'This is the sorbet — a rotating flavour from Noto Gelato in Bridgeland, scooped cold, so ask the chef what\'s on this week.',
};
