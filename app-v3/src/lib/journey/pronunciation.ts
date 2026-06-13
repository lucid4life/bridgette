// The fancy-words pronunciation pack (research 2026-06-13): every stumble-worthy
// culinary term across the 41 dishes' names/ingredients/descriptions, with the
// naturalized respelling and a clip at /audio/terms/<slug>.mp3 (Sarah — the
// same voice as the wine list; per-term recipes follow tools/audio_manifest
// conventions). priority 'must' = a dish name or romance-target ingredient;
// 'nice' = description-only words a guest might still ask about.
export type PronPriority = 'must' | 'nice';
export interface PronTerm {
  term: string;
  respell: string;
  slug: string;
  priority: PronPriority;
  dishes: string[];
}

export const PRON_TERMS: readonly PronTerm[] = [
  { term: "aioli", respell: "ay-OH-lee", slug: "aioli", priority: "must", dishes: ["french-fries", "crispy-smashed-potatoes", "grilled-farm-chicken", "snap-peas", "tuna-crudo"] },
  { term: "Armagnac", respell: "ar-mahn-YAK", slug: "armagnac", priority: "must", dishes: ["apple-tatin"] },
  { term: "béarnaise", respell: "bair-NEZ", slug: "bearnaise", priority: "must", dishes: ["wood-grilled-beef-strip-steak"] },
  { term: "béchamel", respell: "bay-shah-MEL", slug: "bechamel", priority: "must", dishes: ["chicken-sausage", "five-cheese", "rigatoni"] },
  { term: "bigoli", respell: "bee-GOH-lee", slug: "bigoli", priority: "must", dishes: ["bigoli", "shrimp-crab"] },
  { term: "brioche", respell: "bree-OSH", slug: "brioche", priority: "must", dishes: ["wood-grilled-asparagus", "wood-roasted-halibut"] },
  { term: "burrata", respell: "buh-RAH-tah", slug: "burrata", priority: "must", dishes: ["burrata-cheese"] },
  { term: "Calabrian", respell: "kuh-LAH-bree-un", slug: "calabrian", priority: "must", dishes: ["roasted-olives", "burrata-cheese", "fennel-salami", "italian-pork-sausage", "italian-sausage", "maple-bbq-rainbow-trout", "bigoli"] },
  { term: "carpaccio", respell: "kar-PAH-choh", slug: "carpaccio", priority: "must", dishes: ["wagyu-beef-carpaccio"] },
  { term: "Castelvetrano", respell: "kas-tel-veh-TRAH-noh", slug: "castelvetrano", priority: "must", dishes: ["roasted-olives", "tuna-crudo"] },
  { term: "chervil", respell: "SHER-vil", slug: "chervil", priority: "must", dishes: ["mushrooms-on-toast", "wood-roasted-halibut"] },
  { term: "conchiglie", respell: "kon-KEEL-yeh", slug: "conchiglie", priority: "must", dishes: ["italian-pork-sausage"] },
  { term: "confit", respell: "kon-FEE", slug: "confit", priority: "must", dishes: ["italian-sausage"] },
  { term: "crudo", respell: "KROO-doh", slug: "crudo", priority: "must", dishes: ["tuna-crudo"] },
  { term: "endive", respell: "EN-dyve", slug: "endive", priority: "must", dishes: ["endive"] },
  { term: "fior di latte", respell: "FYOR dee LAH-teh", slug: "fior-di-latte", priority: "must", dishes: ["margherita", "five-cheese", "fennel-salami", "italian-sausage"] },
  { term: "fontina", respell: "fon-TEE-nah", slug: "fontina", priority: "must", dishes: ["endive", "five-cheese"] },
  { term: "frico", respell: "FREE-koh", slug: "frico", priority: "must", dishes: ["wagyu-beef-carpaccio"] },
  { term: "granita", respell: "grah-NEE-tah", slug: "granita", priority: "must", dishes: ["oysters-1-2-dozen"] },
  { term: "gremolata", respell: "greh-moh-LAH-tah", slug: "gremolata", priority: "must", dishes: ["snap-peas"] },
  { term: "harissa", respell: "hah-REE-sah", slug: "harissa", priority: "must", dishes: ["eggplant-fries", "grilled-lamb-saddle"] },
  { term: "jus", respell: "ZHOO", slug: "jus", priority: "must", dishes: ["wood-grilled-beef-strip-steak", "26oz-wood-grilled-beef-ribeye", "grilled-lamb-saddle"] },
  { term: "labneh", respell: "LAB-neh", slug: "labneh", priority: "must", dishes: ["lamb-sausage", "grilled-lamb-saddle", "tuna-crudo"] },
  { term: "Marash", respell: "mah-RAHSH", slug: "marash", priority: "must", dishes: ["hummus-chips"] },
  { term: "margherita", respell: "mar-geh-REE-tah", slug: "margherita", priority: "must", dishes: ["margherita"] },
  { term: "merguez", respell: "mair-GEZ", slug: "merguez", priority: "must", dishes: ["grilled-lamb-saddle"] },
  { term: "'nduja", respell: "en-DOO-yah", slug: "nduja", priority: "must", dishes: ["snap-peas"] },
  { term: "nori", respell: "NOR-ee", slug: "nori", priority: "must", dishes: ["eggplant-fries"] },
  { term: "pecorino", respell: "peh-koh-REE-noh", slug: "pecorino", priority: "must", dishes: ["snap-peas", "italian-sausage"] },
  { term: "pomme aligot", respell: "pom ah-lee-GOH", slug: "pomme-aligot", priority: "must", dishes: ["26oz-wood-grilled-beef-ribeye"] },
  { term: "pommes paillasson", respell: "pom pah-yah-SOHN", slug: "pommes-paillasson", priority: "must", dishes: ["wood-grilled-beef-strip-steak"] },
  { term: "pomodoro", respell: "poh-moh-DOR-oh", slug: "pomodoro", priority: "must", dishes: ["bigoli"] },
  { term: "pot de crème", respell: "poh duh KREM", slug: "pot-de-creme", priority: "must", dishes: ["chocolate-pot-de-creme"] },
  { term: "puttanesca", respell: "poo-tah-NES-kah", slug: "puttanesca", priority: "must", dishes: ["tuna-crudo", "bigoli"] },
  { term: "tahini", respell: "tah-HEE-nee", slug: "tahini", priority: "must", dishes: ["smashed-cucumbers"] },
  { term: "tatin", respell: "tah-TAN", slug: "tatin", priority: "must", dishes: ["apple-tatin"] },
  { term: "tonnato", respell: "toh-NAH-toh", slug: "tonnato", priority: "must", dishes: ["tuna-crudo"] },
  { term: "vadouvan", respell: "vah-doo-VAHN", slug: "vadouvan", priority: "must", dishes: ["wood-grilled-asparagus"] },
  { term: "wagyu", respell: "WAH-gyoo", slug: "wagyu", priority: "must", dishes: ["wagyu-beef-carpaccio"] },
  { term: "Aleppo", respell: "uh-LEP-oh", slug: "aleppo", priority: "nice", dishes: ["hummus-chips", "shrimp-crab", "wood-roasted-half-duck"] },
  { term: "Avonlea", respell: "AV-un-lee", slug: "avonlea", priority: "nice", dishes: ["crispy-smashed-potatoes"] },
  { term: "banoffee", respell: "buh-NOF-ee", slug: "banoffee", priority: "nice", dishes: ["the-banana-pie"] },
  { term: "barigoule", respell: "bah-ree-GOOL", slug: "barigoule", priority: "nice", dishes: ["wood-roasted-half-duck"] },
  { term: "chiffonade", respell: "shif-oh-NAHD", slug: "chiffonade", priority: "nice", dishes: ["snap-peas"] },
  { term: "dukkah", respell: "DOO-kah", slug: "dukkah", priority: "nice", dishes: ["grilled-lamb-saddle"] },
  { term: "gastrique", respell: "gas-TREEK", slug: "gastrique", priority: "nice", dishes: ["wood-roasted-half-duck"] },
  { term: "gochugaru", respell: "goh-choo-GAH-roo", slug: "gochugaru", priority: "nice", dishes: ["smashed-cucumbers"] },
  { term: "Grana Padano", respell: "GRAH-nah pah-DAH-noh", slug: "grana-padano", priority: "nice", dishes: ["bigoli"] },
  { term: "kabayaki", respell: "kah-bah-YAH-kee", slug: "kabayaki", priority: "nice", dishes: ["maple-bbq-rainbow-trout"] },
  { term: "kefta", respell: "KEF-tah", slug: "kefta", priority: "nice", dishes: ["lamb-sausage"] },
  { term: "Madeira", respell: "muh-DAIR-uh", slug: "madeira", priority: "nice", dishes: ["mushrooms-on-toast"] },
  { term: "Maldon", respell: "MAWL-dun", slug: "maldon", priority: "nice", dishes: ["burrata-cheese", "italian-sausage"] },
  { term: "mascarpone", respell: "mas-kar-POH-neh", slug: "mascarpone", priority: "nice", dishes: ["maple-bbq-rainbow-trout"] },
  { term: "meringue", respell: "muh-RANG", slug: "meringue", priority: "nice", dishes: ["the-banana-pie"] },
  { term: "Nostrala", respell: "noh-STRAH-lah", slug: "nostrala", priority: "nice", dishes: ["bibb-lettuce"] },
  { term: "Oka", respell: "OH-kah", slug: "oka", priority: "nice", dishes: ["five-cheese"] },
  { term: "pain de mie", respell: "pan duh MEE", slug: "pain-de-mie", priority: "nice", dishes: ["mushrooms-on-toast"] },
  { term: "panko", respell: "PAHN-koh", slug: "panko", priority: "nice", dishes: ["eggplant-fries"] },
  { term: "parfait", respell: "par-FAY", slug: "parfait", priority: "nice", dishes: ["mushrooms-on-toast"] },
  { term: "porcini", respell: "por-CHEE-nee", slug: "porcini", priority: "nice", dishes: ["mushrooms-on-toast"] },
  { term: "provolone", respell: "proh-voh-LOH-neh", slug: "provolone", priority: "nice", dishes: ["margherita", "chicken-sausage", "five-cheese", "italian-sausage"] },
  { term: "quinoa", respell: "KEEN-wah", slug: "quinoa", priority: "nice", dishes: ["bibb-lettuce"] },
  { term: "ras el hanout", respell: "RAHS el hah-NOOT", slug: "ras-el-hanout", priority: "nice", dishes: ["spiced-beet-salad", "grilled-lamb-saddle"] },
  { term: "rayu", respell: "RAH-yoo", slug: "rayu", priority: "nice", dishes: ["smashed-cucumbers"] },
  { term: "ricotta", respell: "rih-KOH-tah", slug: "ricotta", priority: "nice", dishes: ["ricotta-dumplings"] },
  { term: "San Marzano", respell: "san mar-ZAH-noh", slug: "san-marzano", priority: "nice", dishes: ["bigoli"] },
  { term: "semolina", respell: "sem-oh-LEE-nah", slug: "semolina", priority: "nice", dishes: ["bigoli"] },
  { term: "sofrito", respell: "soh-FREE-toh", slug: "sofrito", priority: "nice", dishes: ["italian-sausage", "bigoli"] },
  { term: "tamari", respell: "tuh-MAR-ee", slug: "tamari", priority: "nice", dishes: ["mushrooms-on-toast"] },
  { term: "tuile", respell: "TWEEL", slug: "tuile", priority: "nice", dishes: ["apple-tatin"] },
  { term: "verjus", respell: "vair-ZHOO", slug: "verjus", priority: "nice", dishes: ["endive"] },
  { term: "vinaigrette", respell: "vin-uh-GRET", slug: "vinaigrette", priority: "nice", dishes: ["tuna-crudo", "wagyu-beef-carpaccio", "lamb-sausage", "grilled-octopus-salad", "endive", "spiced-beet-salad"] },
  { term: "yuzu", respell: "YOO-zoo", slug: "yuzu", priority: "nice", dishes: ["tuna-crudo"] }
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
