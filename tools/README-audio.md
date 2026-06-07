# Pronunciation audio — generation runbook (Session S4.5)

Human-sounding pronunciation clips for the 17 by-the-glass wines, generated **once** with
ElevenLabs and base64-embedded into `src/audio.js` so the app stays offline and one-file
shippable. **No API key lives in the app or the repo** — generation went through the
connected ElevenLabs MCP, which holds auth out-of-band.

## Approved settings (Adrian, 2026-06-06, on the preview batch)

- **Engine / model:** ElevenLabs, `eleven_multilingual_v2`
- **Voice:** `Sarah - Mature, Reassuring, Confident` — voice_id `EXAVITQu4vr4xnSDxMaL` (a **premade** voice; free tier cannot use professional/library voices via the API)
- **Recipe:** feed the **listed name** with `language=en` → confident, lightly anglicized, not a thick native accent (serves an English-speaking Calgary floor)
- **Clip text:** listed name only (e.g. `Hiedler Löss`), so audio matches the always-visible on-screen respelling
- **Output:** `mp3_44100_128`; settings stability 0.5 / similarity_boost 0.75 / style 0.0 / use_speaker_boost true / speed 1.0

All of this is recorded machine-readably in `tools/audio_manifest.json` (`wines.<id>.text`,
`.language`, `.source`).

## How to (re)generate a clip

1. Call the ElevenLabs MCP `text_to_speech` with:
   - `text` = `audio_manifest.json` → `wines.<id>.text`
   - `voice_id` = `EXAVITQu4vr4xnSDxMaL`
   - `model_id` = `eleven_multilingual_v2`
   - `language` = `wines.<id>.language` (currently `en` for all)
   - `output_directory` = `<repo>/tools/audio_clips`
   - `output_format` = `mp3_44100_128`
2. The MCP saves `tts_<prefix>_<timestamp>.mp3` and returns the path. **Rename it to
   `tools/audio_clips/<wine-id>.mp3`** (the build requires the `<id>.mp3` convention).
3. Rebuild the embedded JS: `python tools/build_audio_js.py` → writes `src/audio.js`.
4. Rebuild the bundle: `python build_single_file.py`.
5. Verify: `python tests/check_training.py` and `node --test tests/audio.test.js`.

## Per-name overrides (if a clip sounds wrong)

Switch `wines.<id>.source` to `respell` and set `text` to the respelling rewritten as natural
English (hyphens → spaces, e.g. `HEED-ler LURSS` → `Heedler Lurss`), or try different
`settings`/voice, then regenerate just that clip. To leave a name on Web-Speech fallback,
delete its mp3, set `"fallback": true`, rerun the build (the id moves into
`window.BB.audioFallback`), and add it to `APPROVED_WEB_SPEECH_FALLBACK` in
`tests/check_training.py`.

## Notes

- `tools/audio_clips/<wine-id>.mp3` are committed as provenance — they let `build_audio_js.py`
  reproduce `src/audio.js` byte-identically without re-calling the TTS (a test enforces this).
- `tools/audio_clips/_preview/` (voice/recipe comparison clips) is gitignored.
