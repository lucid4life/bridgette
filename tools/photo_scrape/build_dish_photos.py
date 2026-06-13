# Build square dish photos for the app-v3 food flashcards.
#
# Source: Adrian's labeled phone photos in repo-root /Photos/*.jpg (all 3072x4080
# portrait). The teach-card photo band is square (1:1), so each portrait is
# smart-cropped to a centered square framing the plate, resized to 1080x1080,
# and encoded WebP under ~120KB (matching the existing scraped-photo convention
# in fetch_convert.py). Output id = the food catalog id (TeachCard renders
# /img/<id>.webp when <id> is in the manifest).
#
# Usage:
#   python build_dish_photos.py            # stage crops -> out_dishes/ + contact sheet
#   python build_dish_photos.py --install  # also copy webps into app-v3/static/img/
#
# Per-image framing is tunable via VCENTER / HCENTER below (fraction of the
# original portrait where the square's CENTER should sit; 0.5 = dead middle).
import io, os, re, sys, glob, json, shutil, unicodedata
import numpy as np
from PIL import Image, ImageOps, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC_DIR = os.path.join(ROOT, "Photos")
OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out_dishes")
STATIC_IMG = os.path.join(ROOT, "app-v3", "static", "img")
SIDE = 1080
MAX_BYTES = 120 * 1024

# filename (normalized) -> food id, only where simple normalization isn't enough
OVERRIDE = {
    "oysters-12-dozen": "oysters-1-2-dozen",
    "shimp-crab-linguini": "shrimp-crab",
    "truffled-mushroom-rigatoni": "rigatoni",
}

# The exact 22 food ids these photos must map to (verified against data.foods).
EXPECTED = {
    "bibb-lettuce", "burrata-cheese", "chocolate-pot-de-creme",
    "crispy-smashed-potatoes", "eggplant-fries", "garlic-bread",
    "grilled-octopus-salad", "italian-pork-sausage", "lamb-sausage",
    "maple-bbq-rainbow-trout", "oysters-1-2-dozen", "ricotta-dumplings",
    "roasted-olives", "shrimp-crab", "smashed-cucumbers", "spiced-beet-salad",
    "rigatoni", "wagyu-beef-carpaccio", "wood-grilled-asparagus",
    "wood-grilled-beef-strip-steak", "wood-roasted-half-duck",
    "wood-roasted-halibut",
}

# Per-id framing overrides (square CENTER as a fraction of the portrait).
# Filled in after the first visual review pass. Default None = auto (plate
# brightness centroid).
VCENTER = {}
HCENTER = {}

# Tight zoom overrides for the rare frame where a hand / neighbouring plate sits
# beside the dish (can't be removed by vertical cropping alone). Each value is
# (cx_frac, cy_frac, side_frac) in ORIGINAL-image fractions — cx/side relative
# to width, cy relative to height — placing a smaller centred square on the dish.
ZOOM = {
    # burrata: a hand holds the bowl on the right and a bread plate creeps in at
    # the top — zoom onto the bowl so the burrata fills the square cleanly.
    "burrata-cheese": (0.345, 0.62, 0.69),
    # smashed-cucumbers: an order ticket sits top-left — shift right + slight zoom.
    "smashed-cucumbers": (0.57, 0.50, 0.86),
    # pot de crème: dark dessert on bright marble fooled the auto-centroid (sat
    # high, two tickets across the top) — recentre and enlarge the bowl.
    "chocolate-pot-de-creme": (0.46, 0.64, 0.80),
    # crispy potatoes: trim a receipt sliver at the left + a dark table corner.
    "crispy-smashed-potatoes": (0.52, 0.50, 0.90),
}


def norm_id(name: str) -> str:
    s = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    s = s.lower().replace("&", " ")
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return OVERRIDE.get(s, s)


def auto_vcenter(im: Image.Image) -> float:
    """Vertical center fraction biased to the brightest band (the plate)."""
    w, h = im.size
    small = im.convert("L").resize((48, max(1, h // 32)), Image.LANCZOS)
    arr = np.asarray(small, dtype=np.float32)
    rb = arr.mean(axis=1)
    # emphasize the plate: weight by how much brighter than the row median
    rb = np.clip(rb - np.median(rb) * 0.6, 0, None)
    if rb.sum() <= 0:
        return 0.5
    ys = np.arange(len(rb))
    return float((ys * rb).sum() / rb.sum() / max(1, len(rb) - 1))


def square_crop(im: Image.Image, vcenter=None, hcenter=0.5, zoom=None) -> Image.Image:
    im = ImageOps.exif_transpose(im).convert("RGB")
    w, h = im.size
    if zoom is not None:  # explicit (cx_frac, cy_frac, side_frac) on width
        cxf, cyf, sf = zoom
        side = int(round(min(sf * w, w, h)))
        x = int(round(cxf * w - side / 2))
        y = int(round(cyf * h - side / 2))
        x = max(0, min(w - side, x))
        y = max(0, min(h - side, y))
        return im.crop((x, y, x + side, y + side))
    side = min(w, h)
    if w > h:  # landscape -> crop width
        cx = (hcenter if hcenter is not None else 0.5) * w
        x = int(round(cx - side / 2))
        x = max(0, min(w - side, x))
        return im.crop((x, 0, x + side, h))
    # portrait -> crop height
    if vcenter is None:
        vcenter = auto_vcenter(im)
    cy = vcenter * h
    y = int(round(cy - side / 2))
    y = max(0, min(h - side, y))
    return im.crop((0, y, w, y + side))


def encode_webp(im: Image.Image) -> bytes:
    im = im.resize((SIDE, SIDE), Image.LANCZOS)
    data = None
    for q in (82, 78, 74, 68, 60, 50, 40):
        buf = io.BytesIO()
        im.save(buf, "WEBP", quality=q, method=6)
        data = buf.getvalue()
        if len(data) <= MAX_BYTES:
            break
    return data


def main():
    install = "--install" in sys.argv
    os.makedirs(OUT_DIR, exist_ok=True)
    files = sorted(glob.glob(os.path.join(SRC_DIR, "*.jpg")))
    assert files, f"no photos found in {SRC_DIR}"

    results = []  # (id, srcname, bytes, vcenter_used)
    seen = set()
    for f in files:
        base = os.path.splitext(os.path.basename(f))[0]
        fid = norm_id(base)
        if fid in seen:
            raise SystemExit(f"DUPLICATE id {fid} from {base}")
        seen.add(fid)
        im = Image.open(f)
        zoom = ZOOM.get(fid)
        vc = VCENTER.get(fid, auto_vcenter(ImageOps.exif_transpose(im).convert("RGB")))
        hc = HCENTER.get(fid, 0.5)
        sq = square_crop(im, vcenter=vc, hcenter=hc, zoom=zoom)
        data = encode_webp(sq)
        with open(os.path.join(OUT_DIR, fid + ".webp"), "wb") as out:
            out.write(data)
        results.append((fid, base, len(data), vc))

    got = {r[0] for r in results}
    missing = EXPECTED - got
    extra = got - EXPECTED
    print(f"generated {len(results)} crops -> {OUT_DIR}")
    for fid, base, n, vc in results:
        print(f"  {fid:32} {n//1024:4}KB  vcenter={vc:.2f}   <- {base}")
    if missing:
        print("!! MISSING expected ids:", sorted(missing))
    if extra:
        print("!! UNEXPECTED ids (not in catalog):", sorted(extra))
    assert not missing and not extra, "id mapping mismatch — fix before install"

    build_contact_sheet(results)

    if install:
        for fid, *_ in results:
            shutil.copy2(os.path.join(OUT_DIR, fid + ".webp"),
                         os.path.join(STATIC_IMG, fid + ".webp"))
        print(f"installed {len(results)} webp -> {STATIC_IMG}")
        update_manifest(results)


def update_manifest(results):
    """Upsert the 22 dish photos into static/img/manifest.json, preserving the
    existing scraped entries (and their rich provenance) untouched."""
    mpath = os.path.join(STATIC_IMG, "manifest.json")
    with open(mpath, encoding="utf-8") as f:
        man = json.load(f)
    by_id = {img["id"]: img for img in man["images"]}
    order = [img["id"] for img in man["images"]]
    for fid, base, n, vc in results:
        if fid not in by_id:
            order.append(fid)
        by_id[fid] = {
            "id": fid,
            "kind": "food",
            "file": fid + ".webp",
            "source": "local",
            "sourceUrl": "",
            "matchedBy": f"Adrian's labeled dish photo ({base}.jpg), "
                         "square-cropped to the food-card band",
        }
    man["images"] = [by_id[i] for i in order]
    food = sum(1 for i in man["images"] if i["kind"] == "food")
    ckt = len(man["images"]) - food
    man["generated"] = "2026-06-13"
    man["notes"] = (
        f"{len(man['images'])} images ({food} food, {ckt} cocktail). "
        "5 cocktail + 4 food shots were scraped/name-matched from "
        "bridgettebar.com + Instagram (see this file's git history for the "
        "original provenance). The remaining 22 food shots are Adrian's own "
        "labeled phone photos (repo /Photos), square-cropped to the teach-card "
        "band by tools/photo_scrape/build_dish_photos.py."
    )
    with open(mpath, "w", encoding="utf-8") as f:
        json.dump(man, f, indent=2)
        f.write("\n")
    print(f"manifest: {len(man['images'])} images ({food} food, {ckt} cocktail)")


def build_contact_sheet(results):
    cols = 5
    T, pad, lh = 230, 8, 18
    cw, ch = T + pad * 2, T + pad + lh
    rows = (len(results) + cols - 1) // cols
    sheet = Image.new("RGB", (cw * cols, ch * rows), (240, 237, 231))
    d = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 12)
    except Exception:
        font = ImageFont.load_default()
    for i, (fid, base, n, vc) in enumerate(results):
        im = Image.open(os.path.join(OUT_DIR, fid + ".webp")).resize((T, T), Image.LANCZOS)
        cx, cy = (i % cols) * cw, (i // cols) * ch
        sheet.paste(im, (cx + pad, cy + pad))
        d.text((cx + pad, cy + pad + T + 1), f"{fid}", fill=(25, 25, 25), font=font)
    out = os.path.join(OUT_DIR, "_result_sheet.png")
    sheet.save(out)
    print("contact sheet ->", out)


if __name__ == "__main__":
    main()
