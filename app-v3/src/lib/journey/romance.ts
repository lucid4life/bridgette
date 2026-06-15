// Guest-facing dish "romance" lines — the one-sentence recital a server says the
// moment the plate lands: a light opener + the dish NAME flowing straight into a
// few of its most appetizing real components, as ONE seamless sentence that rolls
// off the tongue (no em dash; connectors give each ingredient a job). Said at the
// drop ("sell the sizzle, not the steak"), NOT a recipe and NOT a sales pitch —
// short and sweet (~13–16 words), lead on the hero, land on a strong last word.
//
// Provenance: authored + adversarially verified by an agent team (2026-06-14/15)
// against the official data.foods ingredients/descriptions, grounded ONLY in real
// components (provenance/technique words used only where the official description
// states them) — no invented facts, no banned/oversell words, and never an
// allergen-safe or health claim (allergen safety lives in the separate framing).
// A hero noun already in the dish name is never repeated in the body.
// See docs/handoffs/2026-06-14-v3-dish-photos-and-romance-design.md.
//
// v3-only overlay (mirrors key-components.ts): keyed by foodId, merged at the
// items.ts layer so the shared src/data.js (and v2) stays untouched. items.ts
// re-validates coverage at module init (every path dish must carry one).

/** foodId → the one-sentence guest romance. */
export const ROMANCE: Record<string, string> = {
  // Snacks
  'french-fries': 'Here\'s the french fries, shoestring-thin and crisp, tossed in salt and served with garlic aioli.',
  'hummus-chips': 'Here\'s our hummus chips, fried crisp with Aleppo chili, finished with preserved lemon and green olive.',
  'garlic-bread': 'Here we have the garlic bread, molten cheese curds fried golden, finished with parmesan and chives.',
  cashews: 'This is the cashews, boiled in white vinegar and baked crunchy, then dusted in salt-and-vinegar spice.',
  'eggplant-fries': 'Here\'s the eggplant fries, breaded crisp in panko and nori, fried golden over green harissa yogurt.',
  'roasted-olives': 'Here we have the buttery Castelvetrano olives, wood-roasted with orange peel, Calabrian chili, and thyme.',
  'bread-butter': 'Here\'s our bread and butter, smoked beef tallow whipped silky with charred onion and sourdough.',
  // Small Plates
  'oysters-1-2-dozen': 'Here we have the half-dozen oysters, ice-cold under dill pickle granita with horseradish and lemon.',
  'tuna-crudo': 'Here\'s the tuna crudo, salt-cured ahi over smoked tonnato, lifted by puttanesca with capers and mint.',
  'wagyu-beef-carpaccio': 'This is our Wagyu carpaccio, raw and velvety over pickled mushroom with parmesan frico and horseradish.',
  'lamb-sausage': 'Here\'s the lamb sausage, spiced kefta over garlic labneh with cilantro vinaigrette and runny fried egg.',
  'burrata-cheese': 'This is our burrata, soft and runny over poached rhubarb and strawberry jam with charred sourdough.',
  'grilled-octopus-salad': 'Here\'s the wood-grilled octopus salad, tossed with shaved fennel and sweet orange in a sherry-soy vinaigrette.',
  'mushrooms-on-toast': 'This is the crab toast, Dungeness and Fogo Island shrimp folded into saffron mousse with lemon.',
  // Vegetables
  'spiced-beet-salad': 'Here\'s the spiced beet salad over cool whipped feta with pickled shallots, toasted pistachio, and dill.',
  endive: 'Here we have the endive, crisp leaves in apple vinaigrette with shaved Fontina and toasted pecans.',
  'crispy-smashed-potatoes': 'Here\'s our crispy smashed potatoes, fried golden over charred shallot aioli with Avonlea cheddar and chive.',
  'wood-grilled-asparagus': 'Here\'s the wood-grilled asparagus, charred spears in silky vadouvan cream with sweet crab and brioche croutons.',
  'snap-peas': 'This is the snap peas, tossed in spicy \'nduja with shaved fennel, pecorino, and bacon gremolata.',
  'smashed-cucumbers': 'Here\'s the smashed cucumbers, cured and folded into green tahini with toasted almond and chili.',
  'bibb-lettuce': 'Here\'s our Bibb lettuce, crisp leaves in cool jalapeño cream with puffed grains and alpine cheese.',
  // Pizza
  margherita: 'This is the Margherita, wood-fired dough under tomato sauce, milky fior di latte, and torn basil.',
  'chicken-sausage': 'Here\'s the chicken sausage over garlic béchamel with smoky bacon, pickled jalapeño, and roasted mushrooms.',
  'five-cheese': 'Here we have the Five Cheese, fior di latte and fontina over garlic béchamel with parmesan.',
  'fennel-salami': 'This is our fennel salami, cured over shaved onion with Calabrian chili, basil, and caramelized honey.',
  'italian-sausage': 'Here\'s the Italian sausage over confit garlic with charred kale, roasted pepper, and shaved pecorino.',
  // Pasta
  'italian-pork-sausage': 'This is the Italian pork sausage, sautéed with garlic and Calabrian chili, tossed through spinach conchiglie.',
  'ricotta-dumplings': 'Here\'s the ricotta dumplings, pillowy and poached in a silky vodka tomato sauce, finished with basil.',
  'shrimp-crab': 'Here\'s our shrimp and crab, folded into linguini with brown-butter cream, basil, and chili oil.',
  bigoli: 'This is our bigoli, silky pasta in San Marzano pomodoro, tossed with olive, caper, and parsley.',
  rigatoni: 'This is the truffled mushroom rigatoni, house-made and tossed in a creamy parmesan béchamel.',
  // Mains
  'grilled-farm-chicken': 'Here\'s the honey-brined farm chicken, wood-grilled with house sausage, dill gravy, and golden fries.',
  'maple-bbq-rainbow-trout': 'This is the maple BBQ rainbow trout, glazed over smoked potato purée with creamed kale.',
  'wood-grilled-beef-strip-steak': 'Here\'s the wood-grilled strip steak, Angus under béarnaise with charred shallot and wild mushroom jus.',
  'wood-roasted-halibut': 'Here\'s our Pacific halibut, wood-roasted over braised leeks and snap peas, finished with crab butter.',
  'grilled-lamb-saddle': 'Here\'s the grilled lamb saddle, rolled with merguez over garlic labneh, warm potato salad, and mint.',
  'wood-roasted-half-duck': 'This is the half duck, rosemary-glazed and glossy over black garlic emulsion with turnips two ways.',
  '26oz-wood-grilled-beef-ribeye': 'Here\'s the 26oz prime ribeye over creamy pomme aligot, finished with green peppercorn and bone-marrow jus.',
  // Dessert
  'the-banana-pie': 'Here\'s our banana pie on salted pretzel crust with coffee cream, toasted meringue, and rum caramel.',
  'apple-tatin': 'This is the apple tatin, caramelized under puff pastry with Armagnac cream and cider caramel.',
  'chocolate-pot-de-creme': 'Here\'s the chocolate pot de crème, dark and silky over sour cherry jam with salted caramel.',
  sorbet: 'Here\'s our sorbet, a rotating flavour from Noto Gelato in Bridgeland, so ask the chef what\'s scooped this week.',
};
