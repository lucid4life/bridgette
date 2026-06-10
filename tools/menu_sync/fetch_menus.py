# tools/menu_sync/fetch_menus.py — step 1 of the menu-sync loop.
# Finds the CURRENT official menu PDFs on bridgettebar.com (the Squarespace
# filenames carry version suffixes like BB-FoodMenu-87-0602.pdf, so links are
# discovered from the live pages, never hardcoded) and downloads them into
# source_menus/pdfs/YYYY-MM-DD/. Run: python tools/menu_sync/fetch_menus.py
import re
import sys
import datetime
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PAGES = [
    "https://www.bridgettebar.com/calgary",
    "https://www.bridgettebar.com/calgary-menus",
    "https://www.bridgettebar.com/menus",
    "https://www.bridgettebar.com/",
]
# Which PDFs we care about, and the stable local name each is saved under
# (matches the source_menus/*.txt naming so downstream tooling stays simple).
KINDS = {
    "food": ("calgary-food.pdf", re.compile(r"food", re.I)),
    "drink": ("calgary-drink.pdf", re.compile(r"drink", re.I)),
    "dessert": ("calgary-dessert-digestifs.pdf", re.compile(r"dessert", re.I)),
    "matinee": ("calgary-matinee-late-night.pdf", re.compile(r"matinee", re.I)),
}
UA = {"User-Agent": "Mozilla/5.0 (menu-sync; personal study tool)"}


def get(url: str) -> bytes:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def main() -> int:
    found: dict[str, str] = {}  # kind -> absolute pdf url
    for page in PAGES:
        if len(found) == len(KINDS):
            break
        try:
            html = get(page).decode("utf-8", "replace")
        except Exception as e:  # page moved — keep scanning the others
            print(f"  skip {page}: {e}")
            continue
        for href in re.findall(r'href="([^"]+\.pdf)"', html):
            url = href if href.startswith("http") else "https://www.bridgettebar.com" + href
            for kind, (_, pat) in KINDS.items():
                if kind not in found and pat.search(url.rsplit("/", 1)[-1]):
                    found[kind] = url

    if not found:
        print("ERROR: no menu PDF links found on any page — site layout changed?")
        return 1

    stamp = datetime.date.today().isoformat()
    outdir = ROOT / "source_menus" / "pdfs" / stamp
    outdir.mkdir(parents=True, exist_ok=True)
    for kind, (local, _) in KINDS.items():
        url = found.get(kind)
        if not url:
            print(f"  MISSING: no current link found for '{kind}' menu")
            continue
        dest = outdir / local
        dest.write_bytes(get(url))
        print(f"  {kind:8s} {url.rsplit('/', 1)[-1]}  ->  {dest.relative_to(ROOT)}")
    print(f"done — next: python tools/menu_sync/parse_menus.py {stamp}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
