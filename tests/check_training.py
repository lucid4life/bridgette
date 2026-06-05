# check_training.py — S1a structural integrity:
#   1. src/data.js parses under Node --check
#   2. wines/foods/cocktails ids are present and unique
#   3. wine names appear in source_menus/*.txt (loose: accent/punct/space-insensitive)
#   4. dist/Bridgette_Training.html is byte-identical to a fresh bundler build (shipped file in sync with src)
import json
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
DATA = SRC / "data.js"
DIST = ROOT / "dist" / "Bridgette_Training.html"
MENUS = ROOT / "source_menus"


def loose(text: str) -> str:
    """ASCII-fold, lowercase, and strip all non-alphanumerics.

    S1a keeps names accent-free on purpose (accents are fixed in S1b), and the
    source PDFs have extraction quirks (curly apostrophes, 'St . John' spacing).
    Loose matching ignores punctuation/whitespace/accents but still catches a
    misspelled or missing word.
    """
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "", text.lower())


def node_data():
    """Evaluate src/data.js in Node and return the parsed BB.data as a dict."""
    snippet = (
        "global.window={};const fs=require('fs');"
        f"eval(fs.readFileSync({json.dumps(str(DATA))},'utf8'));"
        "process.stdout.write(JSON.stringify(global.window.BB.data));"
    )
    res = subprocess.run(["node", "-e", snippet], capture_output=True, text=True)
    if res.returncode != 0:
        raise RuntimeError("node failed to evaluate data.js:\n" + res.stderr)
    return json.loads(res.stdout)


def main() -> int:
    failures = []

    if not DATA.exists():
        print(f"FAIL: missing {DATA}")
        return 1

    # 1. parse check
    parse = subprocess.run(["node", "--check", str(DATA)], capture_output=True, text=True)
    if parse.returncode != 0:
        failures.append("data.js does not parse under `node --check`:\n" + parse.stderr)

    # load data
    try:
        data = node_data()
    except Exception as exc:  # noqa: BLE001
        print(f"FAIL: {exc}")
        return 1

    # 2. ids present + unique
    for key in ("wines", "foods", "cocktails"):
        items = data.get(key, [])
        if not items:
            failures.append(f"{key} is empty")
            continue
        ids = [it.get("id", "") for it in items]
        if any(not i for i in ids):
            failures.append(f"{key} has an entry with an empty/missing id")
        if len(ids) != len(set(ids)):
            dupes = sorted({i for i in ids if ids.count(i) > 1})
            failures.append(f"{key} has duplicate ids: {dupes}")

    # 3. wine names appear in source menus (loose: accent/punct/space-insensitive)
    menu_text = ""
    for txt in MENUS.glob("*.txt"):
        menu_text += "\n" + txt.read_text(encoding="utf-8")
    menu_loose = loose(menu_text)
    for wine in data.get("wines", []):
        name = wine.get("name", "")
        if loose(name) not in menu_loose:
            failures.append(f"wine name not found in source_menus: {name!r}")

    # 4. bundler byte-sync: dist must equal a fresh build
    if not DIST.exists():
        failures.append(f"missing built bundle {DIST} (run `python build_single_file.py`)")
    else:
        before = DIST.read_bytes()
        build = subprocess.run(
            [sys.executable, str(ROOT / "build_single_file.py")], capture_output=True, text=True
        )
        if build.returncode != 0:
            failures.append("bundler failed to run:\n" + build.stderr)
        after = DIST.read_bytes()
        if before != after:
            failures.append(
                "dist/Bridgette_Training.html is NOT in sync with src — rebuild before committing"
            )

    if failures:
        print("FAIL:")
        for f in failures:
            print(f"- {f}")
        return 1
    print("PASS: training/data structural checks passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
