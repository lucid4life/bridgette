from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "dist" / "Bridgette_Training.html"

REQUIRED_TEXT = [
    "Bridgette Bar Calgary",
    "Food Guide",
    "Wine Guide",
    "Common guest ask translator",
    "If you like Sauvignon for crispness",
    "If you like Malbec",
    "Service Drill",
    "Practice The Table Moment",
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
    "Menu reference checked: June 4, 2026",
    "Verify nightly menu changes, 86s, BTG availability, and allergy language",
    "Answer out loud before revealing",
]

REQUIRED_IDS = [
    "globalSearch",
    "dishSelect",
    "styleSelect",
    "formatSelect",
    "pairingResult",
    "drillPrompt",
    "drillAnswer",
    "revealDrill",
    "newDrill",
    "guestAskTranslator",
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
