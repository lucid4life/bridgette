from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "dist" / "Bridgette_Training.html"


def parse_vars(css: str) -> dict[str, str]:
    return dict(re.findall(r"--([a-zA-Z0-9-]+):\s*(#[0-9a-fA-F]{6})", css))


def srgb_channel(value: int) -> float:
    channel = value / 255
    if channel <= 0.04045:
        return channel / 12.92
    return ((channel + 0.055) / 1.055) ** 2.4


def luminance(hex_color: str) -> float:
    value = hex_color.lstrip("#")
    red, green, blue = (int(value[index:index + 2], 16) for index in (0, 2, 4))
    return (
        0.2126 * srgb_channel(red)
        + 0.7152 * srgb_channel(green)
        + 0.0722 * srgb_channel(blue)
    )


def contrast(foreground: str, background: str) -> float:
    light = max(luminance(foreground), luminance(background))
    dark = min(luminance(foreground), luminance(background))
    return (light + 0.05) / (dark + 0.05)


# --- S5: CSS-rule-aware + alpha-blend contrast checks ---------------------
# The token-pair checks above only test colours in the abstract. They cannot see
# that a *rule* applies a light colour to text, nor that a background is a tint.
# The matrix cream-on-cream bug slipped through for exactly that reason. These
# helpers resolve the colour a selector actually declares and composite the real
# (possibly alpha-tinted, multi-layer) surface it sits on, then check contrast.
def _rgb(hex_color: str):
    v = hex_color.lstrip("#")
    return tuple(int(v[i:i + 2], 16) for i in (0, 2, 4))


def _hex(rgb) -> str:
    return "#%02x%02x%02x" % tuple(max(0, min(255, int(round(c)))) for c in rgb)


def composite(layers):
    """layers: [(hex, alpha), ...] painted bottom->top. First layer must be opaque."""
    base = _rgb(layers[0][0])
    for hex_color, alpha in layers[1:]:
        top = _rgb(hex_color)
        base = tuple(alpha * t + (1 - alpha) * b for t, b in zip(top, base))
    return _hex(base)


def resolve(token_or_hex: str, colors: dict):
    """Resolve 'var(--x)' or a literal '#hex' to a #hex using the parsed :root vars."""
    m = re.search(r"var\(\s*--([a-zA-Z0-9-]+)\s*\)", token_or_hex)
    if m:
        return colors.get(m.group(1))
    m = re.search(r"#[0-9a-fA-F]{6}", token_or_hex)
    return m.group(0) if m else None


def rule_decl(css: str, selector: str, prop: str):
    """Last value of `prop` across every flat rule block whose comma-split
    selector list contains `selector` exactly. (Flat parse: rules nested in
    @media are matched individually; none of our targets are redefined there.)"""
    css = re.sub(r"/\*.*?\*/", " ", css, flags=re.S)  # drop CSS comments so they don't glom onto selectors
    found = None
    for sel_list, body in re.findall(r"([^{}]+)\{([^{}]*)\}", css):
        sels = [s.strip() for s in sel_list.split(",")]
        if selector in sels:
            # value runs to the next ';' OR the end of the block (last decl may omit ';')
            matches = re.findall(r"(?<![-\w])" + re.escape(prop) + r"\s*:\s*([^;]+?)\s*(?:;|$)", body)
            if matches:
                found = matches[-1].strip()
    return found


def main() -> int:
    css = HTML.read_text(encoding="utf-8")
    colors = parse_vars(css)
    # Rule checks must look at CSS only — the bundle inlines 600KB+ of JS whose
    # braces would wreck a flat rule parse. Isolate the <style> block(s).
    style_css = "\n".join(re.findall(r"<style[^>]*>(.*?)</style>", css, flags=re.S | re.I)) or css
    required = [
        ("cream", "ink"),
        ("cream", "ink-2"),
        ("label-light", "paper"),
        ("label-light", "paper-3"),
        ("cream", "accent-dark"),
        ("accent-dark", "paper"),
        ("ink", "gold"),
        ("ink", "paper"),
        ("brown", "paper"),
        # S3 Wine School components (lessons, quick checks, deductive grid)
        ("green", "paper"),          # qc-result "correct" text
        ("paper", "green"),          # qc-key cream-on-green chip
        ("muted-paper", "paper"),    # dg-intro / dg-hit name + score
        ("ink", "paper-2"),          # worked example + dg-result body text
        ("accent-dark", "paper-2"),  # worked-example label
        ("label-light", "paper-2"),  # dg-result "no match" state
    ]
    failures = []
    for foreground, background in required:
        if foreground not in colors:
            failures.append(f"missing color var --{foreground}")
            continue
        if background not in colors:
            failures.append(f"missing color var --{background}")
            continue
        ratio = contrast(colors[foreground], colors[background])
        if ratio < 4.5:
            failures.append(
                f"--{foreground} on --{background} contrast is {ratio:.2f}:1, below 4.5:1"
            )

    # S5: rule-applied colour on its REAL (composited) surface — catches the
    # matrix/section-sub/choice-key bug class the token-pair list cannot see.
    surfaces = {
        # solid cream matrix body
        "matrix-cell": [(colors.get("cream", "#ffeed7"), 1.0)],
        # light section-head: orange tint (accent-dark @ 8%) over paper-3 (worst left edge)
        # resolve tint colours from the live tokens so retuning --accent-dark/--green
        # keeps the test's composited surface honest (alphas are CSS literals, kept).
        "section-head-light": [(colors.get("paper-3", "#f3e0c5"), 1.0), (colors.get("accent-dark", "#a83212"), 0.08)],
        # correct MC choice: cream face -> 70% white button -> 20% green correct state
        "choice-correct": [(colors.get("cream", "#ffeed7"), 1.0), ("#ffffff", 0.7), (colors.get("green", "#506f5f"), 0.2)],
        # Wine School lesson body: solid paper
        "lesson": [(colors.get("paper", "#ffeed7"), 1.0)],
    }
    rule_checks = [
        (".matrix td", "color", "matrix-cell", "matrix data cells (dark-on-light, not cream-on-cream)"),
        (".section-sub", "color", "section-head-light", "section subtitle on tinted section-head"),
        (".choice-btn.correct .choice-key", "color", "choice-correct", "correct-answer key glyph"),
        (".lesson", "color", "lesson", "Wine School lesson body"),
    ]
    for selector, prop, surface, label in rule_checks:
        raw = rule_decl(style_css, selector, prop)
        if not raw:
            failures.append(f"{selector!r} declares no explicit {prop} (regression-prone) — {label}")
            continue
        fg = resolve(raw, colors)
        if not fg:
            failures.append(f"{selector!r} {prop} {raw!r} did not resolve to a hex")
            continue
        bg = composite(surfaces[surface])
        ratio = contrast(fg, bg)
        if ratio < 4.5:
            failures.append(f"{label}: {selector} {fg} on {bg} is {ratio:.2f}:1, below 4.5:1")

    if re.search(r"(?<![-\w])color\s*:\s*var\(--orange\)", css):
        failures.append(
            "small text should not use --orange directly; use --label-light on light surfaces or --gold on dark surfaces"
        )

    if failures:
        print("FAIL:")
        for failure in failures:
            print(f"- {failure}")
        return 1
    print("PASS: dashboard contrast checks passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
