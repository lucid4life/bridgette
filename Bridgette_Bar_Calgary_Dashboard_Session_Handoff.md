# Bridgette Bar Calgary Dashboard Session Handoff

Prepared for Adrian Beeksma on June 5, 2026.

This is not a verbatim word-for-word transcript of every message. Earlier parts of the session were compacted by Codex, so this file is a detailed session transcript-style summary and project handoff: what was requested, what was researched, what was built, what changed, what passed verification, and what Claude Code should review next.

## Project Location

Working directory:

`C:\Users\abeek\OneDrive\Documents\Bridgette Barr`

Main dashboard file:

`C:\Users\abeek\OneDrive\Documents\Bridgette Barr\Bridgette_Bar_Calgary_Menu_Wine_Pairing_Dashboard.html`

Supporting folders:

- `source_menus`
- `tests`
- `docs\superpowers`
- `.superpowers`
- `verification`

## Original Goal

Adrian wanted to turn earlier Bridgette Bar interview-prep materials into a practical, polished, interactive study guide after getting the job. The new goal was to remove anything interview-related and build a beautiful Calgary-only dashboard focused on:

- Food menu knowledge
- Wine knowledge
- Cocktail knowledge
- Food and wine pairings
- Food and cocktail pairings
- Upselling and recommendation language
- Table-ready phrasing for real service
- Study tools for Adrian and possibly coworkers

Adrian specifically asked that the dashboard use the same look and feel as the Bridgette Bar website, with the Bridgette Bar color palette, and that the Calgary location be the only focus.

## Initial Inputs

Two files were provided as starting references from Downloads:

- `C:\Users\abeek\Downloads\Bridgette_Bar_Study_Guide_Project_Handoff_Adrian_Beeksma.md`
- `C:\Users\abeek\Downloads\Bridgette_Bar_Interactive_Menu_Wine_Study_Guide_V4_Professional_Adrian_Beeksma.html`

The project then shifted toward building a fresh Calgary-only dashboard in the workspace rather than continuing the old interview-oriented file.

## Calgary Menu Sources

Official Bridgette Bar Calgary menu PDFs were downloaded and text-extracted into:

- `source_menus\calgary-food.pdf`
- `source_menus\calgary-food.txt`
- `source_menus\calgary-drink.pdf`
- `source_menus\calgary-drink.txt`
- `source_menus\calgary-dessert-digestifs.pdf`
- `source_menus\calgary-dessert-digestifs.txt`
- `source_menus\calgary-matinee-late-night.pdf`
- `source_menus\calgary-matinee-late-night.txt`

Known official menu URLs used:

- Food: `https://www.bridgettebar.com/s/BB-FoodMenu-86-0507.pdf`
- Drinks: `https://www.bridgettebar.com/s/BB-DrinksMenu-370-0601.pdf`
- Dessert/digestifs: `https://www.bridgettebar.com/s/BB-DessertMenu-091-0504.pdf`
- Matinee/late-night: `https://www.bridgettebar.com/s/BB-Matinee-0424.pdf`

The dashboard source note says the menu reference was checked on June 4, 2026. It also warns the user to verify nightly changes, 86s, BTG availability, and allergy language with the team.

## Brand Direction

The Bridgette Bar site palette was identified and used as the foundation:

- Cream: `#ffeed7`
- Deep blue/ink: `#1e384b`
- Orange: `#f15623`
- Gold: `#fcb539`
- Blue: `#437c93`

Important contrast finding:

- Official orange on cream is not strong enough for small readable text.
- A darker orange companion was introduced for accessible small text and buttons:
  - `--accent-dark: #a83212`
  - `--label-light: #8f2a12`

The dashboard keeps official orange and gold as accents, but uses darker companion colors where legibility requires it.

## Major Product Decision

Adrian considered whether to build a full training app or a simpler dashboard first.

Decision:

Build the reference dashboard first.

Reason:

The dashboard could become immediately useful for studying food, wine, cocktails, pairings, and table language. A larger training app can come later once the core content and dashboard structure feel strong.

## Main Dashboard Built

File:

`Bridgette_Bar_Calgary_Menu_Wine_Pairing_Dashboard.html`

It is currently a single-file static HTML dashboard with embedded CSS and JavaScript. It can be opened directly in a browser with a `file://` URL.

Current sections:

1. Header
2. Sticky navigation
3. Global search and filters
4. Start section
5. Service Drill
6. Wine Guide
7. Food Guide
8. Pairing Dashboard
9. Cocktails, Beer & Zero-Proof
10. Notes & Print

## Current Dashboard Features

### Start Section

Includes high-yield first recommendations:

- Blue Mountain Brut
- Hiedler Loss Gruner Veltliner
- Darting Durkheimer Fronhof Riesling
- Bindi Sergardi La Boncia Sangiovese
- St. John Claret

Also includes a simple server wine translator:

- High acid
- Tannin
- Mineral
- Medium body
- Fruit-forward

And a table recommendation rhythm:

- Ask
- Match
- Explain
- Confirm

### Service Drill

This was added after the dashboard audit as a lightweight active-recall tool.

Modes:

- Food Pairing
- Wine Talk
- Cocktail Lane
- Safety Check

Behavior:

- Generates a random prompt from the actual dashboard data.
- User answers out loud.
- User clicks `Reveal answer`.
- The answer includes pairing logic, table phrase, and caveat/confirm notes.
- `Use pairing builder` can jump a food prompt into the Pairing Dashboard.

This is intentionally not a full training app. It is a compact drill layer inside the dashboard.

### Wine Guide

The wine guide contains:

- A Common Guest Ask Translator
- By-the-glass wine cards
- Bottle Ladder
- Bottle Map

#### Common Guest Ask Translator

This was the most recent major addition.

Purpose:

Help Adrian answer guests who ask for familiar, common varietals when Bridgette Bar's wine list is more niche.

It covers:

- Chardonnay
- Oaky/buttery Chardonnay
- Sauvignon Blanc
- Pinot Grigio / Pinot Gris
- Riesling
- Moscato / sweet white
- Rose
- Prosecco / Champagne
- Pinot Noir
- Cabernet Sauvignon
- Merlot
- Malbec
- Shiraz / Syrah
- Chianti / Sangiovese
- Zinfandel
- Rioja / Tempranillo
- Chablis
- Bordeaux / red blend
- House white / easy white
- House red / easy red

Each row includes:

- Guest asks for
- Best Bridgette answer
- Second or bottle option
- What feels familiar
- What feels different / phrase

Examples:

- If a guest asks for Cabernet Sauvignon:
  - Recommend `St. John Claret` by the glass.
  - Bottle options include `White Rock Cabernet Sauvignon`, `Chateau Larose Perganson`, or `Aia Vecchia Sor Ugo`.
  - Phrase: "For a Cab drinker, Claret is the safest glass; if you want true Napa Cabernet, White Rock is the bottle."

- If a guest asks for Sauvignon Blanc:
  - Recommend `Hiedler Loss Gruner Veltliner` by the glass.
  - Bottle option: `Denizot Sancerre`.
  - Phrase: "If you like Sauvignon for crispness, I would go Gruner by the glass; if you want the exact grape, Sancerre is our bottle lane."

- If a guest asks for Chablis:
  - Recommend `Hiedler Loss Gruner Veltliner` for a crisp/mineral-feeling glass.
  - Bottle option: `Eleonore Moreau Petit Chablis`.

The translator includes search helper terms such as:

`Cab`, `Cabernet`, `Merlot`, `Malbec`, `Shiraz`, `Syrah`, `Sauvignon Blanc`, `Pinot Grigio`, `Pinot Gris`, `Chardonnay`, `Chablis`, `Prosecco`, `Champagne`, `Riesling`, `Moscato`, `Chianti`, `Rioja`, `Zinfandel`, `house white`, `house red`.

### Wine Data Currently Represented

By-the-glass or featured wine cards include:

- Blue Mountain Brut
- Fattoria Moretto Semprebon
- Hiedler Loss
- Vini be Good Hip Hop Chenin
- Wagner Stempel Weissburgunder
- Darting Durkheimer Fronhof
- Dona Matilde Branco
- Bodega Cerron Remordimiento Blanco
- Ameztoi Rubentis
- Leitz Eins Zwei Dry Rose
- Deinhard Deidesheim
- Ca' del Baio Langhe
- Sindicat la Figuera
- Bindi Sergardi La Boncia
- Bodega Cerron Remordimiento Tinto
- St. John Claret
- Gallina de Piel Neverwine

Bottle-lane content includes examples such as:

- Raventos i Blanc de Nit Rose
- Griesel Blanc de Noirs
- Christophe Mignon Adn de Meunier Brut Nature
- Denizot Sancerre
- Landron Muscadet
- Donnhoff Feinherb
- Eleonore Moreau Petit Chablis
- Mount Eden Wolff Vineyard
- Domaine Buisson-Charles Meursault
- Domaine de Colette
- Alta Mora Etna Rosso
- Pierre Thibert Chorey-les-Beaune
- Brandini Langhe Filari Corti
- Fletcher Barbaresco Recta Pete
- Texier Brezeme
- Algre Valganon
- Gulfi Nerojbleo
- Domaine Gour de Chaule Gigondas
- Chateau Larose Perganson
- Whitehall Lane Merlot
- Aia Vecchia Sor Ugo
- White Rock Cabernet Sauvignon

Note:

The source menu uses accents in several names. The dashboard mostly uses ASCII-safe names, with at least one spelling aligned during the latest work:

- `Algre Valgañon`

Claude Code may want to standardize all accents and spelling against `source_menus\calgary-drink.txt`.

### Food Guide

Food cards include menu item, flavor notes, pairing recommendation, cocktail/drink option, zero-proof/beer option, visible confirm/caveat row, and details.

Examples of food items represented:

- French Fries
- Hummus Chips
- Garlic Bread
- Cashews
- Eggplant Fries
- Bread & Butter
- Oysters
- Tuna Crudo
- Wagyu Beef Carpaccio
- Burrata Cheese
- Grilled Octopus Salad
- Mushrooms on Toast
- Spiced Beet Salad
- Bibb Lettuce
- Brussels Sprouts
- Smashed Cucumbers
- Endive
- Wood Grilled Winter Squash
- Margherita
- Five Cheese
- Fennel Salami
- Chicken Sausage
- Italian Pork Sausage
- Ricotta Dumplings
- Shrimp & Crab
- Bigoli
- Rigatoni
- Maple BBQ Rainbow Trout
- Wood Roasted Cod
- Wood Grilled Beef Strip Steak
- Grilled Farm Chicken
- Grilled Lamb Saddle
- Wood Roasted Half Duck
- 26oz Wood Grilled Beef Ribeye
- Chocolate Pot de Creme
- Apple Tatin
- The Banana Pie
- Matinee Snack Menu

### Pairing Dashboard

Allows the user to select:

- Dish
- Guest style
- Format
- Budget cue

It returns:

- Lead recommendation
- By-the-glass option
- Bottle lane
- Cocktail
- Zero-proof / beer
- Caveat
- Table phrase

### Drinks Section

Includes:

- Cocktail Map
- Beer and zero-proof lanes
- Dessert & Digestifs
- Safety notes

Safety notes include:

- Spaghetti Western contains nuts.
- Short Film has a sesame allergy note.
- Heartbreak Mountain and Lovers Mountain are milk washed.
- Cloud 9 lists egg whites; confirm egg-white allergy and vegan language.
- Oysters and Tuna Crudo are raw seafood.
- Wood Roasted Cod includes shellfish broth.
- Shrimp & Crab contains shellfish.
- Nut flags include Cashews, pine nuts, pistachio, pecan, almond, and peanut pesto items.

### Notes & Print

Includes:

- Saved cards
- Print modes
- Personal notes saved to browser localStorage

Print modes:

- Quick cheat sheet
- Wine BTG
- Food matrix
- Drinks map
- Full dashboard

## Design / UX Audit Changes Already Made

A hypercritical audit was requested after the first dashboard version. Several issues were found and fixed:

- Some brand colors were off or diluted.
- Orange and gold needed better contrast handling.
- Global focus outline was too low-contrast on light surfaces.
- Safety caveats were too buried.
- Filter state was visual-only.
- Matrix/table accessibility needed improvement.
- Mobile nav needed better wrapping/discoverability.
- Print mode hid useful caveats.
- Card hierarchy was too shouty and uppercase-heavy in smaller labels.

Implemented fixes:

- Brand palette tightened.
- Darker orange used only where needed for contrast.
- Contextual focus styles.
- Visible `Confirm` row on every generated card.
- `aria-pressed` added for filter and drill controls.
- Matrix captions and `scope="col"` headers added.
- Mobile nav wraps under narrow widths.
- Reduced-motion hover behavior improved.
- Stale source wording changed to service-facing wording.
- Inline layout styles removed.

## Verification Files

Two test/guardrail scripts exist:

- `tests\check_dashboard.py`
- `tests\check_dashboard_contrast.py`

`check_dashboard.py` protects:

- Required dashboard content
- Required IDs
- No stale interview-era phrases
- Semantic `main` and `nav`
- `aria-live`
- `localStorage`
- Print stylesheet
- Service Drill content
- Common Guest Ask Translator content

`check_dashboard_contrast.py` protects:

- Key color contrast pairs
- No direct use of official orange for small readable text
- Focus-ring contrast via `accent-dark` on paper

## Latest Verification Status

The most recent checks passed:

- Static dashboard checks passed.
- Contrast checks passed.
- JavaScript syntax check passed.
- Stale-language scan passed.

Typical commands used:

```powershell
& "C:\Users\abeek\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" tests\check_dashboard.py
& "C:\Users\abeek\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" tests\check_dashboard_contrast.py
```

JavaScript syntax was checked by extracting the embedded script and running Node with `--check` using the Codex bundled Node runtime.

## Known Limitation

Automated in-app browser visual verification repeatedly failed because the local browser-control runtime crashed with a Windows sandbox message:

`windows sandbox failed: spawn setup refresh`

Because of that, browser screenshot QA was not honestly completed from Codex. The dashboard should be manually refreshed and visually reviewed in the in-app browser or another browser.

Current browser URL:

`file:///C:/Users/abeek/OneDrive/Documents/Bridgette%20Barr/Bridgette_Bar_Calgary_Menu_Wine_Pairing_Dashboard.html`

## Important Warnings / Caveats in Content

The dashboard is a personal study guide, not official Bridgette Bar training material.

Items to confirm with the Bridgette team:

- Nightly menu changes
- 86s
- Current BTG availability
- Allergy language
- Exact sweetness/dryness of some wines
- Oak/butter level of Chardonnay options
- Milk-wash allergy phrasing
- Egg-white/vegan caveats
- Raw seafood/shellfish details
- Organic/biodynamic/vegan markers

## Subagents Used

Several subagents helped during the broader project:

- Wine research and pairing brief
- Cocktail/beer/zero-proof/dessert brief
- UX audit
- Later static UX/accessibility/content audit
- Latest wine varietal translator audit

The latest wine translator subagent confirmed the general mapping and recommended adding a dedicated "Guest Ask Translator" inside the Wine Guide, rendered from structured data if future cleanup is desired.

## Recommended Next Steps for Claude Code

### Highest Value Review

1. Open the dashboard manually and visually inspect desktop and mobile widths.
2. Confirm the new Common Guest Ask Translator table feels readable and not too wide.
3. Consider converting the translator table to mobile cards at small widths.
4. Standardize wine accents/spellings against `source_menus\calgary-drink.txt`.
5. Check whether the translator should be generated from a structured JavaScript array instead of static HTML table rows.

### Wine Improvements

Add richer training layers for:

- How to describe each wine in under 10 seconds
- What to ask before recommending a bottle
- Exact "if they ask for X, say Y" flashcards
- Short pronunciation notes
- Dryness/body/acidity/tannin icons or labels
- Bottle upgrade flow by price comfort
- Better distinction between by-the-glass and bottle-only options

Potential additions:

- "Guest says: I like buttery Chardonnay"
- "Guest says: I hate sweet wine"
- "Guest says: I want the cheapest red"
- "Guest says: I want something like Meiomi"
- "Guest says: I want something bold but not too tannic"
- "Guest says: I want a white with steak"

### Food / Pairing Improvements

Add:

- Allergy matrix
- Most common guest questions
- Dish-by-dish upsell options
- "Safe first answer" and "more adventurous answer" per dish
- Pairing confidence scores
- Pairing mistakes to avoid

### Cocktail Improvements

Add:

- Cocktail guest ask translator
- "If they want spicy margarita, recommend..."
- "If they want espresso martini, recommend..."
- "If they want zero-proof but complex, recommend..."
- Milk-wash / egg-white / sesame / nut caveat surfacing

### UX Improvements

Potential improvements:

- Add a compact mode / expanded mode toggle.
- Add mobile card layout for wide tables.
- Add a visible "Last checked" badge.
- Add QR-friendly sharing or printable PDF output.
- Add keyboard shortcut hints only if needed.
- Add an index of all wines by grape/style.
- Add stronger search result highlighting.
- Add "recently studied" or "saved for shift" group.

### Code Structure Improvements

The HTML is now large. Claude Code may want to:

- Split data into structured arrays.
- Render the wine translator from data.
- Split CSS/JS into separate files if the project stops needing to be one-file portable.
- Preserve single-file mode if the dashboard is meant to be shared easily.
- Add a simple local build/test script.

## Suggested Prompt for Claude Code

Use this if handing the project to Claude Code:

```text
You are reviewing a static single-file HTML dashboard for Bridgette Bar Calgary menu, wine, cocktail, and pairing study. The main file is:

C:\Users\abeek\OneDrive\Documents\Bridgette Barr\Bridgette_Bar_Calgary_Menu_Wine_Pairing_Dashboard.html

Please audit it deeply for UX, accessibility, mobile layout, wine accuracy, study usefulness, and service-readiness. Pay special attention to the Wine Guide and Common Guest Ask Translator. The dashboard should remain Calgary-only and should not include interview-prep content. Use the source menu text files in:

C:\Users\abeek\OneDrive\Documents\Bridgette Barr\source_menus

Run or update the tests in:

C:\Users\abeek\OneDrive\Documents\Bridgette Barr\tests

Make focused improvements, then verify:
- static dashboard checks pass
- contrast checks pass
- embedded JavaScript parses
- no stale interview/job-prep language remains

If possible, visually inspect the page at desktop and mobile widths.
```

## Current State Summary

The project is in a strong dashboard-first state. It is no longer interview-focused. It is a Calgary-only personal study guide with:

- Official Calgary menu source files
- Food pairing cards
- Wine cards
- Common varietal substitute table
- Cocktail/beer/zero-proof guide
- Service drill prompts
- Pairing builder
- Notes and print modes
- Accessibility and contrast guardrails

The biggest remaining opportunity is visual QA in a real browser and deeper wine-service training polish based on actual tastings and team confirmation.
