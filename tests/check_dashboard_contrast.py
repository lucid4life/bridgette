from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "Bridgette_Bar_Calgary_Menu_Wine_Pairing_Dashboard.html"


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


def main() -> int:
    css = HTML.read_text(encoding="utf-8")
    colors = parse_vars(css)
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
