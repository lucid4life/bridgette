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

// When a clip IS present, it plays via Audio (no Web-Speech). Skipped until clips
// exist; auto-activates once tools/build_audio_js.py has embedded real mp3s.
test("present clip plays via Audio, not speechSynthesis", () => {
  const { BB, calls } = loadAudio();
  const ids = Object.keys(BB.audio || {});
  if (ids.length === 0) return; // no clips embedded yet (Task 2 scaffold)
  BB.playPronunciation(ids[0], "fallback text", "en");
  assert.equal(calls.audio.length, 1, "must construct an Audio for a present clip");
  assert.ok(String(calls.audio[0]).startsWith("data:audio/mpeg;base64,"));
  assert.equal(calls.speak.length, 0, "must not use Web Speech when a clip exists");
});
