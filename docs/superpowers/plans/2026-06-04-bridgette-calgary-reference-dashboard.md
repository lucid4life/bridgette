# Bridgette Calgary Reference Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished single-file Calgary-only Bridgette Bar reference dashboard focused on menu knowledge, wine learning, food pairings, cocktail pairings, saved notes, and print-friendly cheat sheets.

**Architecture:** One static HTML document contains semantic markup, embedded CSS, embedded menu/pairing data, and lightweight vanilla JavaScript. A small Python verification script checks that the required sections, source notes, accessibility hooks, and key menu content exist.

**Tech Stack:** HTML, CSS, vanilla JavaScript, localStorage, Python standard library for verification.

---

## File Structure

- Create: `Bridgette_Bar_Calgary_Menu_Wine_Pairing_Dashboard.html`
  - Single local dashboard file with all styles, data, and behavior embedded.
- Create: `tests/check_dashboard.py`
  - Static verification checks for required sections, key menu items, no interview framing, and core interactive hooks.
- Use: `source_menus/*.txt`
  - Source text already extracted from the official Calgary PDFs.
- Reference: `docs/superpowers/specs/2026-06-04-bridgette-calgary-reference-dashboard-design.md`
  - Approved design basis.

## Task 1: Write Verification Script First

- [ ] **Step 1: Create `tests/check_dashboard.py`**

```python
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "Bridgette_Bar_Calgary_Menu_Wine_Pairing_Dashboard.html"

REQUIRED_TEXT = [
    "Bridgette Bar Calgary",
    "Food Guide",
    "Wine Guide",
    "Pairing Dashboard",
    "Cocktails, Beer & Zero-Proof",
    "Dessert & Digestifs",
    "Blue Mountain Brut",
    "Hiedler Loss",
    "Ameztoi Rubentis",
    "St. John Claret",
    "Wood Grilled Beef Strip Steak",
    "Maple BBQ Rainbow Trout",
    "Spicy Sandia",
    "Lovers Mountain",
    "Chocolate Pot de Creme",
    "source checked: June 4, 2026",
]

REQUIRED_IDS = [
    "globalSearch",
    "dishSelect",
    "styleSelect",
    "formatSelect",
    "pairingResult",
    "notesArea",
    "liveStatus",
]

FORBIDDEN = [
    "interview sprint",
    "manager-facing mode",
    "walk in",
    "why bridgette",
]

def main() -> int:
    if not HTML.exists():
        print(f"FAIL: missing dashboard file: {HTML}")
        return 1

    text = HTML.read_text(encoding="utf-8")
    lowered = text.lower()
    failures = []

    for item in REQUIRED_TEXT:
        if item.lower() not in lowered:
            failures.append(f"missing required text: {item}")

    for item in REQUIRED_IDS:
        if f'id="{item}"' not in text and f"id='{item}'" not in text:
            failures.append(f"missing required id: {item}")

    for item in FORBIDDEN:
        if item in lowered:
            failures.append(f"forbidden interview-era text remains: {item}")

    if not re.search(r"<main\b", text, re.I):
        failures.append("missing semantic <main>")
    if not re.search(r"<nav\b", text, re.I):
        failures.append("missing semantic <nav>")
    if "aria-live" not in text:
        failures.append("missing aria-live status region")
    if "localStorage" not in text:
        failures.append("missing localStorage persistence")
    if "@media print" not in text:
        failures.append("missing print stylesheet")

    if failures:
        print("FAIL:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("PASS: dashboard static checks passed")
    return 0

if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 2: Run verification and confirm it fails before implementation**

Run:

```powershell
& "C:\Users\abeek\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" tests\check_dashboard.py
```

Expected: `FAIL: missing dashboard file`.

## Task 2: Build Dashboard HTML Shell

- [ ] **Step 1: Create the HTML file with semantic landmarks**

Create `Bridgette_Bar_Calgary_Menu_Wine_Pairing_Dashboard.html` with:

- `<!doctype html>` and `<html lang="en">`
- header with Bridgette Bar Calgary title and source date
- nav links for Start, Wine, Food, Pair, Drinks, Notes
- main sections with matching IDs
- `aria-live` status region

- [ ] **Step 2: Add Bridgette-inspired CSS**

Add embedded CSS with:

- official palette variables
- responsive desktop grid and mobile single-column layout
- high-contrast focus states
- card, table, chip, button, details, and print styles
- `prefers-reduced-motion` handling

## Task 3: Add Menu And Wine Content

- [ ] **Step 1: Add by-the-glass wine cards**

Add cards for current Calgary by-the-glass wines:

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

- [ ] **Step 2: Add food cards**

Add cards for representative current menu items across snacks, small plates, vegetables, pizza, pasta, mains, dessert, and matinee/late-night, with pairings and allergy notes.

- [ ] **Step 3: Add cocktail, beer, zero-proof, and dessert/digestif cards**

Add flavour-family cards for cocktails and concise pairing sections for beer, zero-proof, and dessert/digestifs.

## Task 4: Add Interactions

- [ ] **Step 1: Implement global search and filter chips**

Use vanilla JavaScript to filter cards by name, category, tags, and body text.

- [ ] **Step 2: Implement pairing recommender dropdowns**

Use the selected dish, guest style, and format to render:

- best glass
- bottle upgrade
- cocktail option
- zero-proof option
- why it works
- table phrase
- caveat

- [ ] **Step 3: Implement saved items and notes**

Persist saved card names and note text in `localStorage`.

- [ ] **Step 4: Implement print mode buttons**

Set a `data-print-mode` attribute on the body before `window.print()` for targeted cheat-sheet output.

## Task 5: Verify And Polish

- [ ] **Step 1: Run the static verification script**

Run:

```powershell
& "C:\Users\abeek\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" tests\check_dashboard.py
```

Expected: `PASS: dashboard static checks passed`.

- [ ] **Step 2: Open the HTML locally**

Open:

```text
file:///C:/Users/abeek/OneDrive/Documents/Bridgette%20Barr/Bridgette_Bar_Calgary_Menu_Wine_Pairing_Dashboard.html
```

Smoke test:

- search for `riesling`
- use the dish dropdown for `Wood Grilled Beef Strip Steak`
- save a wine card
- type a note and reload
- click print buttons and confirm print stylesheet does not show interactive clutter

- [ ] **Step 3: Final review**

Check:

- no interview framing remains
- Calgary-only wording is clear
- source/date note is visible
- wine guidance is practical and not overconfident where the source is ambiguous
- layout is readable on desktop and mobile widths
