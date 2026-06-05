# Bridgette Calgary Reference Dashboard Design

## Goal

Create a single-file HTML study dashboard for Bridgette Bar Calgary that helps a server learn the current public food menu, by-the-glass wine list, cocktail list, beer/zero-proof options, dessert/digestifs, and practical food-and-drink pairings.

The dashboard is intentionally option A from the visual brainstorming: a detailed reference dashboard, not a full training app. It should be easy to read, beautiful enough to show coworkers, and useful before or after a shift.

## Scope

Build one polished HTML file in the workspace:

`Bridgette_Bar_Calgary_Menu_Wine_Pairing_Dashboard.html`

The file will work offline once opened locally. It will not require a server, build pipeline, external JavaScript framework, login, database, or network access. It may load Google Fonts if online, but the layout must remain usable offline with fallback fonts.

## Source Of Truth

Use Calgary only.

Official downloaded menu PDFs and extracted text:

- `source_menus/calgary-food.pdf`
- `source_menus/calgary-drink.pdf`
- `source_menus/calgary-dessert-digestifs.pdf`
- `source_menus/calgary-matinee-late-night.pdf`
- `source_menus/calgary-food.txt`
- `source_menus/calgary-drink.txt`
- `source_menus/calgary-dessert-digestifs.txt`
- `source_menus/calgary-matinee-late-night.txt`

Public reference links used for brand and education:

- Bridgette Bar Calgary official page: `https://www.bridgettebar.com/calgary`
- WSET food and wine pairing essentials: `https://www.wsetglobal.com/knowledge-centre/blog/2023/july/13/four-rules-to-masterful-food-and-wine-pairing/`
- WSET spice pairing guidance: `https://www.wsetglobal.com/knowledge-centre/blog/2026/how-to-pair-drinks-with-spice/`
- WSET Level 2 and Level 3 specifications for pairing factors and service concepts
- Official/regional or producer pages for key styles, including German Riesling/Pinot Noir, Lambrusco Grasparossa, Ameztoi Rubentis Txakoli rose, Bordeaux Merlot/Cabernet Sauvignon, Chianti/Sangiovese, and Austrian Gruner Veltliner material

## Brand Direction

Use Bridgette's public palette and visual tone:

- Deep blue-black: `#1e384b`
- Cream: `#ffeed7`
- Orange: `#f15623`
- Gold: `#fcb539`
- Cool blue: `#437c93`
- Paper cream: `#fff8ec`

The feel should be closer to a premium internal menu workbook than a marketing landing page. Use bold condensed headings, strong contrast, menu-paper panels, clean dividers, square or lightly rounded controls, and compact cards. Avoid generic gradient-heavy hero styling and interview-prep framing.

## Information Architecture

The dashboard will have these top sections:

1. Start Here
   - Calgary-only source note
   - top study priorities
   - safe first recommendations
   - core pairing rules in plain server language

2. Wine Guide
   - by-the-glass cards grouped by bubbly, white, rose, red, and no-alcohol wine
   - each card includes style, grape/region, flavour profile, structure, food pairings, avoid/caveat, guest language, and upgrade path where useful
   - bottle ladder section for upselling from glass to bottle

3. Food Guide
   - cards grouped by snacks, small plates, vegetables, pizza, pasta, mains, dessert, and matinee/late-night
   - each card includes key flavours, price, allergy/safety flags, wine match, cocktail match, zero-proof/beer option, and service angle

4. Pairing Dashboard
   - dropdown controls for dish, guest mood, wine format, and non-alcoholic preference
   - output panel with best wine, bottle upgrade, cocktail option, zero-proof option, why it works, and table phrase
   - static pairing matrix for quick scanning

5. Cocktails, Beer, Zero-Proof, Dessert
   - cocktail cards organized by flavour family
   - beer and non-alcoholic suggestions
   - dessert and digestif pairings
   - allergy notes: nuts, sesame, milk-wash, egg white/foam, raw seafood, shellfish, nuts in dishes

6. Notes And Print
   - local saved notes
   - quick print modes using CSS classes and print-specific sections: BTG wine, food matrix, cocktail map, dessert pairings

## Core Interactions

- Global search filters visible cards across wine, food, cocktails, and pairings.
- Category chips filter by section, style, and pairing need.
- Native `select` controls drive the pairing recommender.
- Details/summary accordions reveal deeper wine notes without making cards too long.
- Save/favorite buttons persist selected items in `localStorage`.
- Notes textarea persists in `localStorage`.
- Print buttons switch the document into focused print modes before calling `window.print()`.

## Learning Design

The dashboard should teach without becoming a full app:

- Use "translation" language: high acid becomes fresh or mouthwatering; tannin becomes dry grip like black tea; minerality becomes salty or stony.
- Explain why a pairing works with structure first: acid, salt, fat, heat, sweetness, tannin, body, and flavour intensity.
- Give practical default choices for a server with developing wine knowledge.
- Include "safe if unsure" recommendations.
- Use caveats where menu or wine sweetness is not confirmed. Do not overstate "bone dry" if the exact sweetness is unknown.

## Accessibility

Build with WCAG-oriented basics:

- Semantic landmarks: header, nav, main, section, footer.
- Visible labels for search and selects.
- Native buttons and form controls.
- `aria-pressed` on saved buttons.
- `aria-live` for filter and recommender result changes.
- High-contrast focus states.
- No text that relies on orange-on-cream at small sizes.
- Respect `prefers-reduced-motion`.
- Use details/summary instead of custom inaccessible accordions.

## Data Integrity Notes

- The menu PDFs are public and may change. Show a "source checked" note using the current build date: June 4, 2026.
- Use menu spelling for item names, but mention likely OCR/spelling caveats only in the internal source note, not on every card.
- The `v` marker in the wine PDF means vegan. Do not label it organic or biodynamic.
- The extracted wine text places "ORGANIC/BIODYNAMIC" near the glass-pour line, but the mapping is unclear. Do not promise that any specific wine is organic or biodynamic unless confirmed elsewhere.
- Confirm allergies with the venue before relying on the dashboard in service.

## Non-Goals

- No interview-prep content.
- No full spaced-repetition engine yet.
- No multi-user accounts.
- No POS integration.
- No live menu sync.
- No claims that the guide is official Bridgette Bar training material.

## Acceptance Criteria

- The final HTML opens locally with no server.
- It includes current Calgary food, drink, dessert/digestif, and matinee/late-night menu coverage.
- It removes interview framing.
- It uses the Bridgette color palette and a refined dashboard layout.
- It provides practical wine education and pairing recommendations.
- It includes an interactive pairing recommender.
- It includes search/filtering, saved items, saved notes, and print-friendly sections.
- It passes a manual smoke test for search, filters, dropdown recommender, save buttons, notes, and print mode controls.
