#!/usr/bin/env python3
"""Generate the per-wine pronunciation clips from tools/audio_manifest.json.

This is the **reusable, standalone** generator (no MCP required). The S4.5 batch
was actually produced via the connected ElevenLabs MCP (see tools/README-audio.md),
but this script reproduces the exact same clips by calling the ElevenLabs REST API
directly, so anyone with a free key can regenerate them.

Standard library only (urllib). The API key is read from the environment variable
ELEVENLABS_API_KEY or from tools/.elevenlabs.key (BOTH untracked — the key file is
gitignored; never commit it and never put it in the app).

Usage:
    # one of:
    setx ELEVENLABS_API_KEY "sk_..."        # Windows, new shell           OR
    echo sk_... > tools/.elevenlabs.key      # untracked, gitignored
    python tools/generate_audio.py           # writes tools/audio_clips/<id>.mp3
    python tools/build_audio_js.py           # embed -> src/audio.js
    python build_single_file.py              # rebuild the shippable bundle

Pass wine ids as args to regenerate only those, e.g.:
    python tools/generate_audio.py leitz-eins-zwei-dry-rose ameztoi-rubentis
"""
import json
import os
import sys
import urllib.request
import urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "tools" / "audio_manifest.json"
CLIPS = ROOT / "tools" / "audio_clips"
KEY_FILE = ROOT / "tools" / ".elevenlabs.key"
API = "https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format={fmt}"


def read_key():
    key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if not key and KEY_FILE.exists():
        key = KEY_FILE.read_text(encoding="utf-8").strip()
    if not key:
        sys.exit(
            "No API key. Set ELEVENLABS_API_KEY or write it to tools/.elevenlabs.key "
            "(gitignored). NEVER commit the key."
        )
    return key


def synth(key, voice_id, model_id, fmt, settings, text):
    body = json.dumps({
        "text": text,
        "model_id": model_id,
        "voice_settings": settings,
    }).encode("utf-8")
    req = urllib.request.Request(
        API.format(voice_id=voice_id, fmt=fmt),
        data=body,
        method="POST",
        headers={
            "xi-api-key": key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        },
    )
    with urllib.request.urlopen(req) as resp:
        return resp.read()


def main():
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    voice_id = manifest["voice_id"]
    model_id = manifest["model_id"]
    fmt = manifest.get("output_format", "mp3_44100_128")
    settings = manifest.get("settings", {})
    wines = manifest["wines"]

    if voice_id in ("", "PENDING_PREVIEW"):
        sys.exit("audio_manifest.json voice_id is not set — run the preview/voice-pick step first.")

    only = set(sys.argv[1:])
    key = read_key()
    CLIPS.mkdir(parents=True, exist_ok=True)

    made, skipped = 0, 0
    for wid, spec in wines.items():
        if only and wid not in only:
            continue
        if spec.get("fallback"):
            print(f"skip {wid} (intentional Web-Speech fallback)")
            skipped += 1
            continue
        text = spec["text"]
        try:
            audio = synth(key, voice_id, model_id, fmt, settings, text)
        except urllib.error.HTTPError as exc:
            sys.exit(f"FAIL {wid}: HTTP {exc.code} {exc.read().decode('utf-8', 'ignore')}")
        out = CLIPS / (wid + ".mp3")
        out.write_bytes(audio)
        print(f"wrote {out.name} ({len(audio):,} bytes)  <- {text!r}")
        made += 1

    print(f"\nDone: {made} clip(s) written, {skipped} skipped.")
    print("Next: python tools/build_audio_js.py  &&  python build_single_file.py")


if __name__ == "__main__":
    main()
