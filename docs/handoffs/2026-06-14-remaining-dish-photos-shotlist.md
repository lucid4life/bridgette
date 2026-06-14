# Remaining dish photos — shot list

**Status (2026-06-14):** **28 of 43** food entries now have a photo on their flashcard — your 22 + the original 4 scraped + **Hummus Chips & Snap Peas** (wired in 2026-06-14 from verified web photos, live on bridgette-v3). This is what's still missing and how to add it.

## How to add any of these (2 minutes each)

1. Take the photo **from directly above the plate**, plate roughly **centered**, in decent light, on a clean table — **no hands, cutlery, or order tickets in frame**. Portrait or landscape both work; the tool crops to a centered square.
2. Save it into the **`/Photos`** folder, named exactly as the dish reads on the menu (e.g. `Margherita.jpg`, `Bigoli.jpg`, `Grilled Lamb Saddle.jpg`). Apostrophes/accents are fine.
3. Run:
   ```
   python tools/photo_scrape/build_dish_photos.py --install
   ```
   It square-crops to 1080×1080, encodes WebP <120 KB, drops it in `app-v3/static/img/`, and adds it to the manifest. Review the contact sheet it prints (`tools/photo_scrape/out_dishes/_result_sheet.png`); if a crop is off, the script has per-dish `VCENTER`/`ZOOM`/`HCENTER` overrides you can nudge.
4. Commit the new `.webp` + `manifest.json` and push — auto-deploys to bridgette-v3.

The filename→id match is automatic. (Reference odd cases handled earlier: "Oysters 12 dozen"→`oysters-1-2-dozen`, "Shimp & Crab Linguini"→`shrimp-crab`, "Truffled Mushroom Rigatoni"→`rigatoni`. None of the ones below need it.)

## Still needs a photo — 13 dishes

### Snacks
- **French Fries** — Garlic Aioli
- **Cashews** — Salt & Vinegar

### Small Plates
- **Mushrooms on Toast** — Mushroom Parfait, Black Truffle, Chervil

### Pizza (all five)
- **Margherita** — Tomato, Mozzarella, Basil
- **Chicken Sausage** — Bacon, Garlic Béchamel, Mushroom, Jalapeño
- **Five Cheese** — Provolone, Fontina, Fior di Latte, Oka, Parmesan
- **Fennel Salami** — Onion, Calabrian Chili, Caramelized Honey
- **Italian Sausage** — Confit Garlic, Charred Kale, Roasted Pepper, Pecorino

### Pasta
- **Bigoli** — Pomodoro, Crushed Olive, Caper, Parsley

### Mains
- **Grilled Farm Chicken** — Chicken Sausage, Dill Gravy, Fries
- **Grilled Lamb Saddle** — Warm Merguez Potato Salad, Tender Greens, Labneh, Mint
- **26oz Wood Grilled Beef Ribeye** — Pomme Aligot, Green Peppercorn, Smoked Bone Marrow Jus

### Dessert
- **Apple Tatin** — Armagnac, Cider Caramel, Toasted Hay

## Deliberately NOT photographed
- **Sorbet** — the off-menu, *rotating* dairy-free option (the Noto Gelato flavour changes), so a fixed photo would show the wrong thing. Skip it.
- **Matinee Snack Menu** — a menu meta-entry, not a single plated dish. Nothing to shoot.

## Already wired from the web (2026-06-14)
- **Hummus Chips** & **Snap Peas** — pulled from verified TripAdvisor customer photos of the Bridgette Bar Calgary dishes (the only two of the 15 that were findable online), square-cropped and committed to `v2-app`. They're a different angle/lighting from your overhead shots, so **reshoot them when convenient** to match the rest — just drop `Hummus Chips.jpg` / `Snap Peas.jpg` in `/Photos` and run the build script; it'll overwrite.
- **Grilled Lamb Saddle** — the only other web candidates (Avenue Calgary) were the *old* "lamb sirloin" dish, so they were rejected. Still needs a fresh shot.

## Web hunt summary
A 15-agent sweep (official site, @thebridgettebar Instagram, Google/Maps, TripAdvisor, Yelp, Avenue Calgary, Calgary food media) found nothing usable for the other 12 — most have never been published, and the restaurant's deeper Instagram is login-gated. Those genuinely need your camera.
