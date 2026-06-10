# tools/menu_sync/parse_menus.py — step 2 of the menu-sync loop.
# pdfplumber text extraction over source_menus/pdfs/<date>/*.pdf -> normalized
# source_menus/parsed/<date>.json. The printed menus are MULTI-COLUMN layouts
# (drinks/food 2-col, dessert 3-col), so columns are detected per page from
# word x-position coverage gaps and read column-by-column (plain extract_text()
# merges columns into garbled lines). Tolerant by design: lines that don't
# match an item pattern land in unparsed[] for a human to scan, never a hard
# failure.
# Run: python tools/menu_sync/parse_menus.py [YYYY-MM-DD]   (default: newest)
import json
import re
import sys
from pathlib import Path

import pdfplumber

ROOT = Path(__file__).resolve().parents[2]

# "Name v exclusive . . . . 18 | 29 | 90" or ". . . . 115" (1-3 price columns)
ITEM = re.compile(
    r"^(?P<name>.+?)[\s.․·]*?(?P<prices>\d+(?:\s*\|\s*\d+){0,2})\s*$"
)
# Wine sections + spirits-by-the-ounce sections (the latter are flagged
# out-of-scope: the training app teaches wine/cocktails/fortifieds, not the
# spirit list). Matched against a cleaned lowercase line.
SECTION = re.compile(
    r"^(?P<name>bubbly|white|red|rosé|rose|orange|skin contact|snacks|"
    r"snacks small plates|small plates|snacks & salads|vegetables large plates|"
    r"pizza pasta|pizza|pasta|main|dessert|dessert pours|dessert pairings|"
    r"digestifs|after dinner|sherry|port|madeira|cocktails|zero proof|"
    r"non-alcoholic|fortified|amari|beer|cider|"
    # brandy-family digestifs (cognac/armagnac/calvados) ARE taught by the app
    # as fortifieds — only the white-spirits/whisky wall is out of scope
    r"cognac(?:, armagnac & brandy)?|armagnac|calvados|brandy|"
    r"(?P<spirit>spirits|vodka|gin|tequila(?: & mezcal)?|mezcal|rum|"
    r"whisk\(?e\)?y|scotch|bourbon|liqueurs?|aperitivo|digestivo))"
    r"(?: \d+(?:\.\d+)?\s?oz)?$"
)
NOISE = re.compile(
    r"consuming raw|foodborne|^\d{4,}$|gratuity|all prices|glass pours are|"
    r"subject to availability|vegan organic|· (drinks|dessert|food)", re.I
)
YEAR_MIN, YEAR_MAX = 1900, 2100  # a lone trailing "2023" is a vintage, not a price


def clean(line: str) -> str:
    line = re.sub(r"\s+\.\s+(?=[A-Z])", ". ", line)   # "St . John" -> "St. John"
    line = re.sub(r"[.․·](\s*[.․·])+", " ", line)     # dot leaders
    return re.sub(r"\s{2,}", " ", line).strip(" .\t")


def page_lines(page) -> list[str]:
    """Extract text column-by-column.

    Column boundaries are detected from x-coverage gaps: bucket the page width
    into 2pt slots, count words covering each slot, and treat near-empty runs
    >=12pt wide as column separators. A handful of full-width lines (legal
    footers, centered headers) don't bridge columns because the threshold is
    proportional, not zero.
    """
    words = page.extract_words()
    if not words:
        return []
    slot = 2.0
    n = int(page.width / slot) + 2
    cover = [0] * n
    for w in words:
        for x in range(int(w["x0"] / slot), min(n - 1, int(w["x1"] / slot)) + 1):
            cover[x] += 1
    threshold = max(2, max(cover) * 0.06)
    # maximal near-empty runs >= 6 slots (12pt), away from page edges
    seps: list[float] = []
    run = 0
    for i, c in enumerate(cover):
        if c < threshold:
            run += 1
        else:
            if run >= 6 and i - run > 2 and i < n - 3:
                seps.append((i - run / 2) * slot)  # separator midpoint
            run = 0
    bounds = [0.0, *seps, page.width]
    cols: list[list[dict]] = [[] for _ in range(len(bounds) - 1)]
    for w in words:
        cx = (w["x0"] + w["x1"]) / 2
        for ci in range(len(bounds) - 1):
            if bounds[ci] <= cx < bounds[ci + 1]:
                cols[ci].append(w)
                break
    # A "column" that is almost entirely bare numbers is a right-aligned price
    # rail (matinée layout), not a layout column — fold it into the column to
    # its left so line-grouping by top reunites "French Fries … 9".
    merged_cols: list[list[dict]] = []
    for col in cols:
        numeric = [w for w in col if re.fullmatch(r"\d+(?:\.\d+)?|\|", w["text"])]
        if merged_cols and col and len(numeric) >= max(1, int(len(col) * 0.8)):
            merged_cols[-1].extend(col)
        else:
            merged_cols.append(col)
    out: list[str] = []
    for col in merged_cols:
        col.sort(key=lambda w: (w["top"], w["x0"]))
        line: list[dict] = []
        for w in col:
            if line and w["top"] - line[0]["top"] > 3.5:
                line.sort(key=lambda t: t["x0"])
                out.append(" ".join(t["text"] for t in line))
                line = []
            line.append(w)
        if line:
            line.sort(key=lambda t: t["x0"])
            out.append(" ".join(t["text"] for t in line))
    return out


def parse_pdf(path: Path) -> dict:
    items, unparsed = [], []
    section, spirit_scope, current = None, False, None
    lines: list[str] = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            lines.extend(page_lines(page))
    for raw in lines:
        line = raw.strip()
        if not line or NOISE.search(line):
            continue
        low = clean(line).lower()
        sec = SECTION.match(low)
        if sec:
            section = sec.group("name")
            spirit_scope = bool(sec.group("spirit"))
            current = None
            continue
        m = ITEM.match(line)
        if m and len(clean(m.group("name"))) >= 3:
            prices = [int(p) for p in re.findall(r"\d+", m.group("prices"))]
            # a single trailing 4-digit "price" is a vintage year on a
            # grape/region detail line — treat the whole line as detail
            if len(prices) == 1 and YEAR_MIN <= prices[0] <= YEAR_MAX:
                if current is not None and len(current["detail"]) < 3:
                    current["detail"].append(clean(line))
                else:
                    unparsed.append(line)
                continue
            name = clean(m.group("name"))
            flags = []
            name, n = re.subn(r"\s+v$", "", name)
            if n:
                flags.append("v")
            name, n = re.subn(r"\s+exclusive$", "", name, flags=re.I)
            if n:
                flags.append("exclusive")
            name = re.sub(r"\s+\d+(?:\.\d+)?\s*oz$", "", name)  # "Spicy Sandia 2.5 oz"
            current = {
                "name": name,
                "prices": prices,
                "detail": [],
                "section": section,
                "outOfScope": spirit_scope,
                "flags": flags,
            }
            items.append(current)
        elif current is not None and len(current["detail"]) < 3:
            current["detail"].append(clean(line))
        else:
            unparsed.append(line)
    return {"items": items, "unparsed": unparsed}


def main() -> int:
    pdf_root = ROOT / "source_menus" / "pdfs"
    dates = sorted(d.name for d in pdf_root.iterdir() if d.is_dir()) if pdf_root.exists() else []
    stamp = sys.argv[1] if len(sys.argv) > 1 else (dates[-1] if dates else None)
    if not stamp:
        print("ERROR: no source_menus/pdfs/<date>/ folder — run fetch_menus.py first")
        return 1
    indir = pdf_root / stamp
    out = {"date": stamp, "menus": {}}
    for pdf in sorted(indir.glob("*.pdf")):
        parsed = parse_pdf(pdf)
        out["menus"][pdf.stem] = parsed
        in_scope = sum(1 for i in parsed["items"] if not i["outOfScope"])
        print(f"  {pdf.name}: {len(parsed['items'])} items ({in_scope} in scope), "
              f"{len(parsed['unparsed'])} unparsed lines")
    outdir = ROOT / "source_menus" / "parsed"
    outdir.mkdir(parents=True, exist_ok=True)
    dest = outdir / f"{stamp}.json"
    dest.write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"wrote {dest.relative_to(ROOT)} — next: node tools/menu_sync/diff_menu.mjs {stamp}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
