# build_single_file.py — inline src/styles.css + src/*.js into one portable HTML.
# Standard library only. Usage: python build_single_file.py
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
DIST = ROOT / "dist"

def inline(html: str) -> str:
    def css_repl(m):
        css = (SRC / m.group(1)).read_text(encoding="utf-8")
        return f"<style>\n{css}\n</style>"
    html = re.sub(r'<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>', css_repl, html)
    def js_repl(m):
        js = (SRC / m.group(1)).read_text(encoding="utf-8")
        return f"<script>\n{js}\n</script>"
    html = re.sub(r'<script[^>]*\ssrc="([^"]+)"[^>]*>\s*</script>', js_repl, html)
    return html

def main():
    DIST.mkdir(exist_ok=True)
    html = (SRC / "index.html").read_text(encoding="utf-8")
    out = inline(html)
    (DIST / "Bridgette_Training.html").write_text(out, encoding="utf-8")
    print(f"Built dist/Bridgette_Training.html ({len(out):,} bytes)")

if __name__ == "__main__":
    main()
