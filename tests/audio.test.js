"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");

// Load src/audio.js into a fake browser global, stubbing Audio + speechSynthesis.
function loadAudio(opts) {
  opts = opts || {};
  const calls = { audio: [], speak: [], cancel: 0 };
  const g = {};
  g.window = g;
  g.Audio = function (src) {
    calls.audio.push(src);
    this.src = src;
    this._listeners = {};
    this.addEventListener = (ev, cb) => { this._listeners[ev] = cb; };
    this.pause = () => { calls.paused = (calls.paused || 0) + 1; };
    this.play = () => (opts.rejectPlay ? Promise.reject(new Error("blocked")) : Promise.resolve());
  };
  g.SpeechSynthesisUtterance = function (t) { this.text = t; this.lang = ""; };
  g.speechSynthesis = { cancel() { calls.cancel++; }, speak(u) { calls.speak.push(u); } };
  const code = fs.readFileSync(path.join(__dirname, "..", "src", "audio.js"), "utf8");
  new Function("window", "Audio", "SpeechSynthesisUtterance", "speechSynthesis", code)
    .call(g, g, g.Audio, g.SpeechSynthesisUtterance, g.speechSynthesis);
  return { BB: g.window.BB, calls, g };
}

test("missing clip falls back to speechSynthesis with the fallback text", () => {
  const { BB, calls } = loadAudio();
  BB.playPronunciation("definitely-not-a-wine-id", "Hiedler Loess", "de-AT");
  assert.equal(calls.audio.length, 0, "must not construct Audio for a missing clip");
  assert.equal(calls.speak.length, 1, "must speak the fallback");
  assert.equal(calls.speak[0].text, "Hiedler Loess");
  assert.equal(calls.speak[0].lang, "de-AT");
});

test("audioFallback list and audio map both exist", () => {
  const { BB } = loadAudio();
  assert.ok(BB.audio && typeof BB.audio === "object");
  assert.ok(Array.isArray(BB.audioFallback));
  assert.equal(typeof BB.playPronunciation, "function");
});

// When a clip IS present, it plays via Audio (no Web-Speech). The committed repo
// always has the 17 clips embedded, so this asserts the map is non-empty rather
// than silently passing on an empty map.
test("present clip plays via Audio, not speechSynthesis", () => {
  const { BB, calls } = loadAudio();
  const ids = Object.keys(BB.audio || {});
  assert.ok(ids.length > 0, "expected embedded clips in src/audio.js (run tools/build_audio_js.py)");
  BB.playPronunciation(ids[0], "fallback text", "en");
  assert.equal(calls.audio.length, 1, "must construct an Audio for a present clip");
  assert.ok(String(calls.audio[0]).startsWith("data:audio/mpeg;base64,"));
  assert.equal(calls.speak.length, 0, "must not use Web Speech when a clip exists");
});

// A present clip whose play() is rejected (autoplay policy / no user gesture) must
// fall back to Web Speech — the real-browser path that the .then(_, reject) handles.
test("present clip whose play() is blocked falls back to speechSynthesis", async () => {
  const { BB, calls } = loadAudio({ rejectPlay: true });
  const ids = Object.keys(BB.audio || {});
  assert.ok(ids.length > 0);
  BB.playPronunciation(ids[0], "Blocked Fallback", "en");
  await new Promise((r) => setTimeout(r, 10)); // let the rejected play() promise settle
  assert.equal(calls.audio.length, 1, "constructed the Audio element");
  assert.equal(calls.speak.length, 1, "fell back to Web Speech on play() rejection");
  assert.equal(calls.speak[0].text, "Blocked Fallback");
});
