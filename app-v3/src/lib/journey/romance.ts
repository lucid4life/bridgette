// Guest-facing dish "romance" lines — the one-sentence recital a server says the
// moment the plate lands: the dish NAME + at least three real key components, in
// warm, sensory, memorizable language. Said at the drop ("sell the sizzle, not
// the steak"), NOT a recipe and NOT a sales pitch.
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
  'french-fries': 'Here\'s the french fries — crisp shoestring fries tossed in salt and served with garlic aioli for dipping.',
  'hummus-chips': 'This is the hummus chips — our hummus puffed and crisped into a chip, dusted with toasted sesame and Aleppo chili, alongside hummus crowned with bright preserved lemon, minced green olive, and a finishing drizzle of olive oil.',
  'garlic-bread': 'Here we have the garlic bread — molten cheese curds wrapped in buttery bread and fried golden, basted in garlic butter and finished with grated parmesan and chives.',
  cashews: 'Here\'s the cashews — cashews boiled in white vinegar and baked crystal-crunchy, dusted in our salt and vinegar spice, a chip\'s snap without the chip.',
  'eggplant-fries': 'This is the eggplant fries — eggplant cut into fries and breaded in crisp panko and nori, fried golden and stacked high over a green harissa yogurt.',
  'roasted-olives': 'Here\'s the roasted olives — buttery Castelvetrano olives wood-roasted with thyme and rosemary, marinated in orange peel and a kick of Calabrian chili.',
  'bread-butter': 'This is the bread and butter — our smoked beef tallow whipped silky into butter, dusted with charred onion, served alongside our sourdough.',
  // Small Plates
  'oysters-1-2-dozen': 'Here\'s the half-dozen oysters — East Coast oysters served ice-cold on a bed of coarse salt, crowned with a shaved dill pickle granita, fresh horseradish and a squeeze of lemon.',
  'tuna-crudo': 'This is the tuna crudo — ahi tuna salt-cured and sliced thin over a smoked tonnato, lifted by a bright puttanesca vinaigrette and finished with fried capers and torn mint.',
  'wagyu-beef-carpaccio': 'Here we have the Wagyu beef carpaccio — Alberta Wagyu sliced raw and velvety under a pickled mushroom salad, dressed in a mushroom vinaigrette and finished with crisp parmesan frico and a hit of horseradish.',
  'lamb-sausage': 'Here\'s the lamb sausage — spiced lamb kefta grilled over the wood fire, set on roasted garlic labneh with a sunny fried egg, cilantro vinaigrette and a crunchy potato finish.',
  'burrata-cheese': 'This is the burrata — soft, runny burrata over gently poached rhubarb and a strawberry jam, served with house sourdough charred on the wood grill.',
  'grilled-octopus-salad': 'Here\'s the grilled octopus salad — Vancouver Island octopus braised tender and grilled over the wood fire, tossed with shaved fennel and sweet orange segments in a sherry-soy vinaigrette.',
  'mushrooms-on-toast': 'Here we have the crab toast — sweet Dungeness crab and Fogo Island shrimp over a silky saffron mousse on toasted pain de mie, finished with chives and a bright squeeze of lemon.',
  // Vegetables
  'spiced-beet-salad': 'This is the spiced beet salad — Ras el Hanout-spiced beets resting on cool whipped feta, finished with pickled shallots, toasted pistachio, and fresh dill.',
  endive: 'Here\'s the endive — crisp leaves tossed in a bright apple vinaigrette, layered with shaved Fontina and toasted pecans.',
  'crispy-smashed-potatoes': 'Here we have the crispy smashed potatoes — baby potatoes fried golden over a charred shallot aioli, finished with shavings of aged Avonlea cheddar and chive.',
  'wood-grilled-asparagus': 'Here\'s the wood-grilled asparagus — charred spears piled with sweet crab and silky vadouvan cream, finished with crunchy brioche croutons.',
  'snap-peas': 'This is the snap peas — crisp snap peas and shaved fennel in a creamy, spicy \'nduja dressing, finished with shaved pecorino and a bacon gremolata.',
  'smashed-cucumbers': 'Here we have the smashed cucumbers — cured, smashed cucumbers tossed in a herby green tahini dressing, finished with toasted almond and a hit of chili.',
  'bibb-lettuce': 'This is the bibb lettuce — crisp bibb leaves dressed in a cool jalapeño cream, finished with crunchy puffed grains and shaved alpine cheese.',
  // Pizza
  margherita: 'Here\'s the Margherita — our five-day wood-fired dough under house-made tomato sauce, milky fior di latte and provolone, finished with just-torn basil.',
  'chicken-sausage': 'This is the Chicken Sausage — house-made chicken sausage on a garlic béchamel base with smoky bacon, pickled jalapeño and roasted mushrooms, finished with shredded parmesan.',
  'five-cheese': 'Here we have the Five Cheese — five melted cheeses over a garlic béchamel base: stretchy fior di latte, nutty fontina and oka, finished with cracked black pepper.',
  'fennel-salami': 'This is the Fennel Salami — spicy fennel salami with thin-shaved onion and a Calabrian-chili kick, finished with basil and amber caramelized honey.',
  'italian-sausage': 'Here\'s the Italian Sausage — chunks of Italian sausage with soft confit garlic and charred kale, finished with roasted pepper and grated pecorino.',
  'italian-pork-sausage': 'Here we have the Italian Pork Sausage — house-made pork sausage sautéed with shallot and garlic, deglazed in white wine and tossed through spinach conchiglie, lifted by Calabrian chili and grated parmesan.',
  // Pasta
  'ricotta-dumplings': 'This is the Ricotta Dumplings — pillowy poached ricotta dumplings in a silky vodka tomato sauce, finished with torn basil.',
  'shrimp-crab': 'Here\'s the shrimp and crab — sweet shrimp and crab folded into silky linguini in a brown-butter cream, lifted with torn basil and a swirl of chili oil.',
  bigoli: 'This is the bigoli — silky semolina pasta in a San Marzano pomodoro, with briny crushed olives and capers and a scatter of fresh parsley.',
  rigatoni: 'Here we have the rigatoni — house-made tubes tossed in a savory parmesan sauce with earthy mushrooms, finished with a whisper of truffle oil.',
  // Mains
  'grilled-farm-chicken': 'Here\'s the grilled farm chicken — honey-brined chicken cooked over the wood fire alongside house-made chicken sausage, pooled in a fresh-dill gravy with golden fries.',
  'maple-bbq-rainbow-trout': 'This is the maple BBQ rainbow trout — steelhead marinated in our maple kabayaki over smoked potato purée, with cream-enriched kale.',
  'wood-grilled-beef-strip-steak': 'Here\'s the wood-grilled strip steak — Alberta Angus cooked over the wood fire under a butterless béarnaise, with pommes paillasson, charred shallot, and a wild mushroom jus.',
  'wood-roasted-halibut': 'This is the wood-roasted halibut — Pacific halibut roasted in the wood oven over braised leeks and sautéed snap peas, finished with a rich crab butter and torn brioche croutons.',
  'grilled-lamb-saddle': 'Here\'s the grilled lamb saddle — Alberta lamb rolled with house-made merguez and grilled, set over garlic labneh with a warm merguez potato salad, and finished with a mint herb salad.',
  'wood-roasted-half-duck': 'This is the wood-roasted half duck — duck glazed glossy with a rosemary gastrique, pooled over a black garlic emulsion, with turnips done two ways.',
  '26oz-wood-grilled-beef-ribeye': 'Here we have the 26oz wood-grilled beef ribeye — bone-in prime ribeye cooked over the wood fire, sliced over creamy pomme aligot, and finished with a smoked bone marrow jus studded with green peppercorn.',
  // Dessert
  'the-banana-pie': 'Here\'s the banana pie — a salted pretzel crust layered with caramelized banana and aerated coffee cream, crowned with toasted Italian meringue and a rum caramel.',
  'apple-tatin': 'This is the apple tatin — apples slow-caramelized with warm spices under crisp puff pastry, served with Armagnac cream, toasted hay gelato, and a side of cider caramel.',
  'chocolate-pot-de-creme': 'Here\'s the chocolate pot de crème — dark chocolate custard baked over sour cherry jam, finished with salted chocolate caramel and cherry gelato.',
  sorbet: 'This is the sorbet — a rotating flavour from Noto Gelato in Bridgeland, scooped cold; ask the chef what the flavour is this week.',
};
