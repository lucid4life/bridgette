# check_training.py — S1a structural integrity:
#   1. src/data.js parses under Node --check
#   2. wines/foods/cocktails ids are present and unique
#   3. wine names appear in source_menus/*.txt (loose: accent/punct/space-insensitive)
#   4. dist/Bridgette_Training.html is byte-identical to a fresh bundler build (shipped file in sync with src)
import base64
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

# S1b data-contract allowed values
ALLOWED_LMH = {"low", "medium", "high"}
ALLOWED_SWEET = {"dry", "off-dry", "medium-dry", "medium-sweet", "sweet"}
TRANSLATOR_KEYS = ("ask", "aliases", "bestGlass", "bottleOptions", "familiar", "different", "phrase")


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
    """Evaluate src/data.js in Node and return the parsed BB.data as a dict.

    The JSON is base64-encoded for transport so UTF-8 bytes (accents like ö/ó/é)
    survive Windows console/locale decoding intact — a plain stdout string gets
    mangled (ö -> Ã¶) by the locale codec on some setups.
    """
    snippet = (
        "global.window={};const fs=require('fs');"
        f"eval(fs.readFileSync({json.dumps(str(DATA))},'utf8'));"
        "process.stdout.write(Buffer.from(JSON.stringify(global.window.BB.data),'utf8').toString('base64'));"
    )
    res = subprocess.run(["node", "-e", snippet], capture_output=True, text=True)
    if res.returncode != 0:
        raise RuntimeError("node failed to evaluate data.js:\n" + res.stderr)
    return json.loads(base64.b64decode(res.stdout.strip()).decode("utf-8"))


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

    # 5. wine enrichment contract (S1b)
    for wine in data.get("wines", []):
        wid = wine.get("id", "?")
        pron = wine.get("pronunciation")
        if not isinstance(pron, dict) or not str(pron.get("respell", "")).strip():
            failures.append(f"wine {wid}: missing pronunciation.respell")
        if not isinstance(pron, dict) or not str(pron.get("say", "")).strip():
            failures.append(f"wine {wid}: missing pronunciation.say")
        st = wine.get("structure")
        if not isinstance(st, dict):
            failures.append(f"wine {wid}: structure must be an object {{acidity,body,tannin,sweetness}}")
        else:
            for k in ("acidity", "body", "tannin"):
                if st.get(k) not in ALLOWED_LMH:
                    failures.append(f"wine {wid}: structure.{k}={st.get(k)!r} not in {sorted(ALLOWED_LMH)}")
            if st.get("sweetness") not in ALLOWED_SWEET:
                failures.append(f"wine {wid}: structure.sweetness={st.get('sweetness')!r} not in {sorted(ALLOWED_SWEET)}")
        if not str(wine.get("tenSecond", "")).strip():
            failures.append(f"wine {wid}: missing tenSecond pitch")
        if not str(wine.get("country", "")).strip():
            failures.append(f"wine {wid}: missing country")
        if not isinstance(wine.get("vegan"), bool):
            failures.append(f"wine {wid}: vegan must be a boolean")
        if not isinstance(wine.get("glass"), bool):
            failures.append(f"wine {wid}: glass must be a boolean")
        if not isinstance(wine.get("pair"), list) or not wine.get("pair"):
            failures.append(f"wine {wid}: pair must be a non-empty array")

    # 6. translator contract (S1b) — replaces the static HTML table
    translator = data.get("translator", [])
    if not translator:
        failures.append("translator is empty (static table not migrated to data)")
    wine_names_loose = {loose(w.get("name", "")) for w in data.get("wines", [])}
    for t in translator:
        ask = t.get("ask", "?")
        for k in TRANSLATOR_KEYS:
            if k not in t:
                failures.append(f"translator {ask!r}: missing key {k!r}")
        if not isinstance(t.get("aliases"), list):
            failures.append(f"translator {ask!r}: aliases must be an array")
        if not isinstance(t.get("bottleOptions"), list):
            failures.append(f"translator {ask!r}: bottleOptions must be an array")
        bg = str(t.get("bestGlass", "")).strip()
        if not bg:
            failures.append(f"translator {ask!r}: empty bestGlass")
        elif loose(bg) not in wine_names_loose:
            failures.append(f"translator {ask!r}: bestGlass {bg!r} is not a known wines[].name")

    # 7. lesson stubs (S1b) — learnLink anchors for S3/S4
    lessons = data.get("lessons", [])
    if not lessons:
        failures.append("lessons is empty (no learnLink anchors)")
    seen_lessons = set()
    for lesson in lessons:
        lid = lesson.get("id", "")
        if not lid:
            failures.append("a lesson is missing an id")
        elif lid in seen_lessons:
            failures.append(f"duplicate lesson id: {lid}")
        seen_lessons.add(lid)
        if not str(lesson.get("title", "")).strip():
            failures.append(f"lesson {lid!r}: missing title")
        # S3: each lesson needs a body, a worked example, and one quick check
        if not str(lesson.get("body", "")).strip():
            failures.append(f"lesson {lid!r}: missing body (S3)")
        if not str(lesson.get("workedExample", "")).strip():
            failures.append(f"lesson {lid!r}: missing workedExample (S3)")
        qc = lesson.get("quickCheck")
        if not isinstance(qc, dict):
            failures.append(f"lesson {lid!r}: missing quickCheck object (S3)")
        else:
            if not str(qc.get("q", "")).strip():
                failures.append(f"lesson {lid!r}: quickCheck.q is empty")
            choices = qc.get("choices")
            if not isinstance(choices, list) or len(choices) < 2:
                failures.append(f"lesson {lid!r}: quickCheck.choices must have >=2 options")
            ans = qc.get("answer")
            if not isinstance(ans, int) or isinstance(ans, bool) or not isinstance(choices, list) or not (0 <= ans < len(choices)):
                failures.append(f"lesson {lid!r}: quickCheck.answer must index a choice")

    REQUIRED_LESSONS = {
        "structure-words", "how-to-taste", "pairing-levers",
        "deductive-grid", "pronunciation-primer", "talking-to-a-guest",
    }
    missing_lessons = REQUIRED_LESSONS - seen_lessons
    if missing_lessons:
        failures.append(f"missing required §10 lessons: {sorted(missing_lessons)}")

    # 8. food contract (S1b): structural why + flags array
    for food in data.get("foods", []):
        fid = food.get("id", "?")
        if not str(food.get("why", "")).strip():
            failures.append(f"food {fid}: missing why (structural pairing reason)")
        if not isinstance(food.get("flags"), list):
            failures.append(f"food {fid}: flags must be an array")

    # 9. S2 engine: every deck generates >=1 card with non-empty prompt+answer, unique ids
    gen_snippet = (
        "global.window={};const fs=require('fs');"
        f"eval(fs.readFileSync({json.dumps(str(DATA))},'utf8'));"
        f"eval(fs.readFileSync({json.dumps(str(SRC / 'training.js'))},'utf8'));"
        "const T=global.window.BB.training;const cards=T.allCards(global.window.BB.data);"
        "const bad=cards.filter(c=>!c.prompt||!c.prompt.trim()||!c.answer||!c.answer.trim());"
        "const ids=cards.map(c=>c.id);const dupes=ids.filter((id,i)=>ids.indexOf(id)!==i);"
        "process.stdout.write(JSON.stringify({n:cards.length,bad:bad.map(c=>c.id),dupes:dupes}));"
    )
    gen = subprocess.run(["node", "-e", gen_snippet], capture_output=True, text=True)
    if gen.returncode != 0:
        failures.append("training.js failed to generate decks under Node:\n" + gen.stderr)
    else:
        info = json.loads(gen.stdout)
        if info["n"] < 1:
            failures.append("training.js generated zero cards")
        if info["bad"]:
            failures.append(f"cards with empty prompt/answer: {info['bad'][:5]}")
        if info["dupes"]:
            failures.append(f"duplicate card ids: {sorted(set(info['dupes']))[:5]}")

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
