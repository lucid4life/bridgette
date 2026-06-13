// The fancy-words pronunciation pack (research 2026-06-13): every must-say
// culinary term across the 41 dishes' names/ingredients/descriptions, with the
// naturalized respelling and a clip at /audio/terms/<slug>.mp3 (Sarah — the
// same voice as the wine list; per-term recipes follow tools/audio_manifest
// conventions: real-name multilingual vs respell turbo).
export interface PronTerm {
  term: string;
  respell: string;
  slug: string;
  dishes: string[];
}

export const PRON_TERMS: readonly PronTerm[] = [
  { term: "aioli", respell: "ay-OH-lee", slug: "aioli", dishes: ["french-fries", "crispy-smashed-potatoes", "grilled-farm-chicken", "snap-peas", "tuna-crudo"] },
  { term: "burrata", respell: "buh-RAH-tah", slug: "burrata", dishes: ["burrata-cheese"] },
  { term: "carpaccio", respell: "kar-PAH-choh", slug: "carpaccio", dishes: ["wagyu-beef-carpaccio"] },
  { term: "wagyu", respell: "WAH-gyoo", slug: "wagyu", dishes: ["wagyu-beef-carpaccio"] },
  { term: "crudo", respell: "KROO-doh", slug: "crudo", dishes: ["tuna-crudo"] },
  { term: "tonnato", respell: "toh-NAH-toh", slug: "tonnato", dishes: ["tuna-crudo"] },
  { term: "puttanesca", respell: "poo-tah-NES-kah", slug: "puttanesca", dishes: ["tuna-crudo", "bigoli"] },
  { term: "bigoli", respell: "bee-GOH-lee", slug: "bigoli", dishes: ["bigoli", "shrimp-crab"] },
  { term: "pomodoro", respell: "poh-moh-DOR-oh", slug: "pomodoro", dishes: ["bigoli"] },
  { term: "conchiglie", respell: "kon-KEEL-yeh", slug: "conchiglie", dishes: ["italian-pork-sausage"] },
  { term: "pecorino", respell: "peh-koh-REE-noh", slug: "pecorino", dishes: ["snap-peas", "italian-sausage"] },
  { term: "fior di latte", respell: "FYOR dee LAH-teh", slug: "fior-di-latte", dishes: ["margherita", "five-cheese", "fennel-salami", "italian-sausage"] },
  { term: "fontina", respell: "fon-TEE-nah", slug: "fontina", dishes: ["endive", "five-cheese"] },
  { term: "margherita", respell: "mar-geh-REE-tah", slug: "margherita", dishes: ["margherita"] },
  { term: "granita", respell: "grah-NEE-tah", slug: "granita", dishes: ["oysters-1-2-dozen"] },
  { term: "Castelvetrano", respell: "kas-tel-veh-TRAH-noh", slug: "castelvetrano", dishes: ["roasted-olives", "tuna-crudo"] },
  { term: "Calabrian", respell: "kuh-LAH-bree-un", slug: "calabrian", dishes: ["roasted-olives", "burrata-cheese", "fennel-salami", "italian-pork-sausage", "italian-sausage", "maple-bbq-rainbow-trout", "bigoli"] },
  { term: "'nduja", respell: "en-DOO-yah", slug: "nduja", dishes: ["snap-peas"] },
  { term: "gremolata", respell: "greh-moh-LAH-tah", slug: "gremolata", dishes: ["snap-peas"] },
  { term: "frico", respell: "FREE-koh", slug: "frico", dishes: ["wagyu-beef-carpaccio"] },
  { term: "Marash", respell: "mah-RAHSH", slug: "marash", dishes: ["hummus-chips"] },
  { term: "harissa", respell: "hah-REE-sah", slug: "harissa", dishes: ["eggplant-fries", "grilled-lamb-saddle"] },
  { term: "tahini", respell: "tah-HEE-nee", slug: "tahini", dishes: ["smashed-cucumbers"] },
  { term: "labneh", respell: "LAB-neh", slug: "labneh", dishes: ["lamb-sausage", "grilled-lamb-saddle", "tuna-crudo"] },
  { term: "nori", respell: "NOR-ee", slug: "nori", dishes: ["eggplant-fries"] },
  { term: "vadouvan", respell: "vah-doo-VAHN", slug: "vadouvan", dishes: ["wood-grilled-asparagus"] },
  { term: "béchamel", respell: "bay-shah-MEL", slug: "bechamel", dishes: ["chicken-sausage", "five-cheese", "rigatoni"] },
  { term: "béarnaise", respell: "bair-NEZ", slug: "bearnaise", dishes: ["wood-grilled-beef-strip-steak"] },
  { term: "confit", respell: "kon-FEE", slug: "confit", dishes: ["italian-sausage"] },
  { term: "brioche", respell: "bree-OSH", slug: "brioche", dishes: ["wood-grilled-asparagus", "wood-roasted-halibut"] },
  { term: "chervil", respell: "SHER-vil", slug: "chervil", dishes: ["mushrooms-on-toast", "wood-roasted-halibut"] },
  { term: "endive", respell: "EN-dyve", slug: "endive", dishes: ["endive"] },
  { term: "merguez", respell: "mair-GEZ", slug: "merguez", dishes: ["grilled-lamb-saddle"] },
  { term: "pommes paillasson", respell: "pom pah-yah-SOHN", slug: "pommes-paillasson", dishes: ["wood-grilled-beef-strip-steak"] },
  { term: "pomme aligot", respell: "pom ah-lee-GOH", slug: "pomme-aligot", dishes: ["26oz-wood-grilled-beef-ribeye"] },
  { term: "jus", respell: "ZHOO", slug: "jus", dishes: ["wood-grilled-beef-strip-steak", "26oz-wood-grilled-beef-ribeye", "grilled-lamb-saddle"] },
  { term: "tatin", respell: "tah-TAN", slug: "tatin", dishes: ["apple-tatin"] },
  { term: "Armagnac", respell: "ar-mahn-YAK", slug: "armagnac", dishes: ["apple-tatin"] },
  { term: "pot de crème", respell: "poh duh KREM", slug: "pot-de-creme", dishes: ["chocolate-pot-de-creme"] }
];

const byDish = new Map<string, PronTerm[]>();
for (const t of PRON_TERMS)
  for (const id of t.dishes) {
    const list = byDish.get(id) ?? [];
    list.push(t);
    byDish.set(id, list);
  }

/** The pronounceable terms appearing in a dish (its name/components/description). */
export function termsFor(foodId: string): readonly PronTerm[] {
  return byDish.get(foodId) ?? [];
}
