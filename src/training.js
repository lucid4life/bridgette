/* src/training.js — window.BB.training
 * Leitner engine (pure) + deck generators + progress persistence + Practice/Progress UI.
 * Classic script, no modules. DOM wiring is guarded so Node can load it for unit tests.
 */
(function () {
  "use strict";
  window.BB = window.BB || {};

  // ---- constants (spec §8 / research convergence) ----
  var BOX_DUE_DAYS = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 14 };
  var NEW_CAP = 9;     // new cards per session (anti-burnout cap, separate from size)
  var SIZE_CAP = 18;   // total cards per session

  // ---- day math: local calendar day -> exact integer ordinal (DST-proof) ----
  function dayNumber(date) {
    date = date || new Date();
    return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  }

  function clampBox(b) { return Math.max(1, Math.min(5, b)); }

  // Pure. Returns a NEW card state. `today` is a day integer (dayNumber()).
  function grade(state, correct, today) {
    var s = {
      box: state.box, due: state.due, lastSeen: state.lastSeen,
      correct: state.correct || 0, wrong: state.wrong || 0,
      consecutiveWrong: state.consecutiveWrong || 0
    };
    if (correct) {
      s.box = clampBox(s.box + 1);
      s.correct += 1;
      s.consecutiveWrong = 0;
    } else {
      s.wrong += 1;
      s.consecutiveWrong += 1;
      // Gentle lapse: one miss demotes a single box; box 1 only after TWO in a row.
      s.box = s.consecutiveWrong >= 2 ? 1 : clampBox(s.box - 1);
    }
    s.lastSeen = today;
    s.due = today + BOX_DUE_DAYS[s.box];
    return s;
  }

  var ARTICLES = { the: 1, a: 1, an: 1, le: 1, la: 1, les: 1, el: 1, il: 1, "of": 1, and: 1 };

  function normalizeAnswer(s) {
    s = String(s == null ? "" : s);
    s = s.normalize("NFKD").replace(/[̀-ͯ]/g, ""); // strip accents
    s = s.toLowerCase();
    s = s.replace(/[^a-z0-9\s]+/g, " ");      // drop punctuation
    var tokens = s.split(/\s+/).filter(function (t) { return t && !ARTICLES[t]; });
    return tokens.join(" ").trim();
  }

  function tokenSet(s) {
    var out = {};
    normalizeAnswer(s).split(" ").forEach(function (t) { if (t) out[t] = 1; });
    return out;
  }

  // Pure boolean. The UI still always offers an "I got it / I didn't" override.
  function gradeTyped(card, input) {
    var norm = normalizeAnswer(input);
    if (!norm) return false;
    var candidates = [card.answer].concat(card.aliases || []);
    for (var i = 0; i < candidates.length; i++) {
      var target = normalizeAnswer(candidates[i]);
      if (!target) continue;
      if (norm === target) return true;
      // token-subset: every meaningful token the learner typed appears in the target,
      // AND they covered a distinctive chunk (>=2 tokens, or the whole single-token target).
      var targetTokens = tokenSet(target);
      var inTokens = norm.split(" ");
      var covered = inTokens.length > 0 && inTokens.every(function (t) { return targetTokens[t]; });
      if (covered && (inTokens.length >= 2 || Object.keys(targetTokens).length === 1)) return true;
      // reverse: learner typed the full target plus at most one extra qualifier word
      // (bounded so a verbose/wrong answer that merely embeds the target is rejected)
      var allInputTokens = tokenSet(norm);
      var targetToks = target.split(" ");
      var inputLen = inTokens.length;
      var targetCovered = targetToks.every(function (t) { return allInputTokens[t]; });
      if (targetCovered && (inputLen - targetToks.length) <= 1) return true;
    }
    return false;
  }

  // Lenient streak: a single missed day (gap of 2) is forgiven; 2+ missed days reset.
  function updateStreak(streak, today) {
    var last = streak && streak.lastStudyDate;
    var current = (streak && streak.current) || 0;
    if (last == null) return { current: 1, lastStudyDate: today };
    var gap = today - last;
    if (gap === 0) return { current: current, lastStudyDate: last };
    if (gap <= 2) return { current: current + 1, lastStudyDate: today }; // gap 1 or 2 (grace)
    return { current: 1, lastStudyDate: today };
  }

  function isDue(state, today) {
    if (today == null) today = dayNumber();
    return today >= state.due;
  }

  function newState(today) {
    if (today == null) today = dayNumber();
    return { box: 1, due: today, lastSeen: today, correct: 0, wrong: 0, consecutiveWrong: 0 };
  }

  // ---------------- deck generators (pure: data -> Card[]) ----------------
  var DECKS = {
    "translator":    { label: "Translator",    learnLink: "common-substitutions" },
    "wine-identity": { label: "Wine Identity",  learnLink: "deductive-grid" },
    "pronunciation": { label: "Pronunciation",  learnLink: "pronunciation-primer" },
    "pairing":       { label: "Pairing & Why",  learnLink: "pairing-levers" },
    "structure":     { label: "Structure",      learnLink: "structure-words" }
  };

  var COUNTRY_LANG = {
    Austria: "de-AT", Germany: "de-DE", France: "fr-FR", Italy: "it-IT",
    Spain: "es-ES", Portugal: "pt-PT", Canada: "en-CA"
  };
  function langFor(country) { return COUNTRY_LANG[country] || "en-US"; }

  function slug(s) {
    return String(s).normalize("NFKD").replace(/[̀-ͯ]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  // Deterministic distractor picker: rotates through the pool so cards differ.
  function pickDistractors(pool, answer, count, seed) {
    var opts = pool.filter(function (x) { return x !== answer; });
    var picks = [];
    var n = opts.length;
    for (var i = 0; i < n && picks.length < count; i++) {
      var v = opts[(seed + i) % n];
      if (picks.indexOf(v) === -1) picks.push(v);
    }
    return picks;
  }

  function wineByName(data, name) {
    for (var i = 0; i < data.wines.length; i++) if (data.wines[i].name === name) return data.wines[i];
    return null;
  }

  function genTranslator(data) {
    var wineNames = data.wines.map(function (w) { return w.name; });
    return data.translator.map(function (t, i) {
      var w = wineByName(data, t.bestGlass);
      return {
        id: "translator:" + slug(t.ask) + ":ask",
        deck: "translator", kind: "recall",
        prompt: "A guest asks for " + t.ask + ". What's your by-the-glass pour?",
        answer: t.bestGlass,
        why: t.phrase,
        choices: [t.bestGlass].concat(pickDistractors(wineNames, t.bestGlass, 3, i)),
        aliases: (w && w.aliases) ? w.aliases.slice() : [],
        scenario: "A guest says “I usually drink " + t.ask + ".” Name the by-the-glass pour and one sentence on why it fits.",
        learnLink: DECKS.translator.learnLink,
        tags: ["translator"].concat(w && w.tags ? w.tags : [])
      };
    });
  }

  function genWineIdentity(data) {
    var wineNames = data.wines.map(function (w) { return w.name; });
    var ident = data.wines.map(function (w) { return w.grape + " — " + w.region; });
    var cards = [];
    data.wines.forEach(function (w, i) {
      var ans = w.grape + " — " + w.region;
      cards.push({
        id: "wine-identity:" + w.id + ":grape",
        deck: "wine-identity", kind: "recall",
        prompt: w.name + ": what grape and region?",
        answer: ans,
        why: w.profile || "",
        choices: [ans].concat(pickDistractors(ident, ans, 3, i)),
        aliases: [w.grape, w.region],
        scenario: "A regular asks what " + w.name + " actually is. Give the grape and region and one line of character.",
        learnLink: DECKS["wine-identity"].learnLink,
        tags: (w.tags || []).slice()
      });
      cards.push({
        id: "wine-identity:" + w.id + ":name",
        deck: "wine-identity", kind: "recall",
        prompt: w.grape + " from " + w.region + " — which wine on our list?",
        answer: w.name,
        why: w.tenSecond || w.profile || "",
        choices: [w.name].concat(pickDistractors(wineNames, w.name, 3, i)),
        aliases: (w.aliases || []).slice(),
        scenario: "A guest wants the " + w.grape + " from " + w.region + ". Name the exact pour on our list.",
        learnLink: DECKS["wine-identity"].learnLink,
        tags: (w.tags || []).slice()
      });
    });
    return cards;
  }

  function genPronunciation(data) {
    return data.wines.map(function (w) {
      return {
        id: "pronunciation:" + w.id + ":say",
        deck: "pronunciation", kind: "pronounce",
        prompt: "How do you say “" + w.name + "”?",
        answer: w.pronunciation.respell,
        why: w.mnemonic || "",
        audioText: w.pronunciation.say,
        lang: langFor(w.country),
        learnLink: DECKS.pronunciation.learnLink,
        tags: (w.tags || []).slice()
      };
    });
  }

  function genPairing(data) {
    var wineNames = data.wines.map(function (w) { return w.name; });
    return data.foods.filter(function (f) { return f.wine; }).map(function (f, i) {
      var w = wineByName(data, f.wine);
      return {
        id: "pairing:" + f.id + ":match",
        deck: "pairing", kind: "recall",
        prompt: "A guest orders " + f.name + ". Best by-the-glass — and why?",
        answer: f.wine,
        why: f.why || "",
        choices: [f.wine].concat(pickDistractors(wineNames, f.wine, 3, i)),
        aliases: (w && w.aliases) ? w.aliases.slice() : [],
        scenario: "Table just ordered " + f.name + ". Recommend the glass and give the one structural reason it works.",
        learnLink: DECKS.pairing.learnLink,
        tags: (f.tags || []).slice()
      };
    });
  }

  var LEVEL = { low: 1, medium: 2, high: 3 };
  function genStructure(data) {
    var cards = [];
    ["acidity", "tannin", "body"].forEach(function (attr) {
      var highs = data.wines.filter(function (w) { return w.structure && w.structure[attr] === "high"; });
      var lowers = data.wines.filter(function (w) { return w.structure && LEVEL[w.structure[attr]] < 3; });
      highs.forEach(function (w, i) {
        var others = pickDistractors(lowers.map(function (x) { return x.name; }), w.name, 2, i);
        if (others.length < 2) return; // need a full triple
        cards.push({
          id: "structure:" + attr + "-" + w.id + ":pick",
          deck: "structure", kind: "discriminate",
          prompt: "Which has the highest " + attr + "?",
          answer: w.name,
          why: w.name + " sits at high " + attr + "; the others are lower.",
          choices: [w.name].concat(others),
          aliases: [],
          learnLink: DECKS.structure.learnLink,
          tags: ["structure", attr]
        });
      });
    });
    return cards;
  }

  function generateDeck(deckId, data) {
    data = data || (window.BB && window.BB.data);
    switch (deckId) {
      case "translator": return genTranslator(data);
      case "wine-identity": return genWineIdentity(data);
      case "pronunciation": return genPronunciation(data);
      case "pairing": return genPairing(data);
      case "structure": return genStructure(data);
      default: return [];
    }
  }

  function allCards(data) {
    data = data || (window.BB && window.BB.data);
    var all = [];
    Object.keys(DECKS).forEach(function (id) { all = all.concat(generateDeck(id, data)); });
    return all;
  }

  // ---------------- session composition (pure) ----------------
  function defaultProgressShape() {
    return {
      schema: 1, cards: {}, decks: {}, tags: {}, readiness: null,
      streak: { current: 0, lastStudyDate: null },
      settings: { difficulty: "adaptive", audio: true }
    };
  }
  // localStorage-backed persistence (file://-safe; degrades silently if denied/quota).
  function validIdSet() { return new Set(allCards(window.BB.data).map(function (c) { return c.id; })); }
  function loadProgress() {
    if (typeof localStorage === "undefined") return defaultProgressShape();
    var raw = null;
    try { raw = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) { raw = null; }
    return migrateProgress(raw, validIdSet());
  }
  function saveProgress(progress) {
    if (typeof localStorage === "undefined") return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch (e) { /* ignore */ }
  }

  function shuffle(arr, rng) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor((rng ? rng() : Math.random()) * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  // Pure session composer. ctx = { data, progress, today, newCap, sizeCap, rng }.
  // deckId null => Smart Review (mixed across all decks, interleaved).
  function buildSession(deckId, ctx) {
    ctx = ctx || {};
    var data = ctx.data || (window.BB && window.BB.data);
    var progress = ctx.progress || loadProgress();
    var today = ctx.today != null ? ctx.today : dayNumber();
    var newCap = ctx.newCap != null ? ctx.newCap : NEW_CAP;
    var sizeCap = ctx.sizeCap != null ? ctx.sizeCap : SIZE_CAP;
    var rng = ctx.rng || Math.random;

    var cards = deckId == null ? allCards(data) : generateDeck(deckId, data);

    var due = [], fresh = [];
    cards.forEach(function (c) {
      var st = progress.cards[c.id];
      if (!st) { fresh.push(c); return; }
      if (isDue(st, today)) due.push({ card: c, st: st });
    });

    // weak-first: lower box, then more wrong, then least-recently seen
    due.sort(function (a, b) {
      return (a.st.box - b.st.box) || (b.st.wrong - a.st.wrong) || (a.st.lastSeen - b.st.lastSeen);
    });

    var review = due.slice(0, sizeCap).map(function (d) { return d.card; });
    var newSlots = Math.max(0, Math.min(newCap, sizeCap - review.length, fresh.length));
    var newest = fresh.slice(0, newSlots);

    var session = review.concat(newest);
    if (deckId == null) session = shuffle(session, rng); // interleave for Mixed practice
    return session;
  }

  // ---------------- progress layer (pure transforms) ----------------
  var STORAGE_KEY = "bb_progress_v1";
  var SCHEMA = 1;

  // Coerce a (possibly partial / hand-edited / older-schema) card state into a
  // valid, schedulable shape so it can never silently disappear (missing `due`)
  // or corrupt the engine (out-of-range box).
  function normalizeCardState(s, today) {
    s = s || {};
    var box = Math.round(Number(s.box));
    if (!isFinite(box)) box = 1;
    box = clampBox(box);
    var due = Number(s.due); if (!isFinite(due)) due = today;
    var lastSeen = Number(s.lastSeen); if (!isFinite(lastSeen)) lastSeen = today;
    return {
      box: box, due: due, lastSeen: lastSeen,
      correct: Number(s.correct) || 0,
      wrong: Number(s.wrong) || 0,
      consecutiveWrong: Number(s.consecutiveWrong) || 0
    };
  }

  function migrateProgress(raw, validIds) {
    var base = defaultProgressShape();
    if (!raw || typeof raw !== "object") return base;
    base.schema = SCHEMA;
    var today = dayNumber();
    if (raw.cards && typeof raw.cards === "object") {
      Object.keys(raw.cards).forEach(function (id) {
        if (!validIds || validIds.has(id)) base.cards[id] = normalizeCardState(raw.cards[id], today);
      });
    }
    if (raw.streak && typeof raw.streak === "object") {
      base.streak = {
        current: raw.streak.current || 0,
        lastStudyDate: raw.streak.lastStudyDate != null ? raw.streak.lastStudyDate : null
      };
    }
    if (raw.settings && typeof raw.settings === "object") {
      base.settings.difficulty = raw.settings.difficulty || base.settings.difficulty;
      base.settings.audio = raw.settings.audio !== false;
    }
    if (raw.readiness) base.readiness = raw.readiness;
    return base;
  }

  // mastery for a deck id OR a tag: mean of (box-1)/4*100 over matching cards (unseen=box1=0).
  function masteryFor(progress, key, data) {
    data = data || (window.BB && window.BB.data);
    var all = allCards(data);
    var matching = all.filter(function (c) { return c.deck === key || (c.tags && c.tags.indexOf(key) !== -1); });
    if (!matching.length) return 0;
    var sum = 0;
    matching.forEach(function (c) {
      var st = progress.cards[c.id];
      var box = st ? st.box : 1;
      sum += ((box - 1) / 4) * 100;
    });
    return Math.round(sum / matching.length);
  }

  function recomputeMastery(progress, data) {
    data = data || (window.BB && window.BB.data);
    progress.decks = {};
    Object.keys(DECKS).forEach(function (id) { progress.decks[id] = { mastery: masteryFor(progress, id, data) }; });
    progress.tags = {};
    var tags = {};
    allCards(data).forEach(function (c) { (c.tags || []).forEach(function (t) { tags[t] = 1; }); });
    Object.keys(tags).forEach(function (t) { progress.tags[t] = { mastery: masteryFor(progress, t, data) }; });
    return progress;
  }

  // Pure: returns a new progress object with the card graded + streak updated.
  function recordResult(progress, card, correct, today) {
    if (today == null) today = dayNumber();
    var next = JSON.parse(JSON.stringify(progress));
    var prev = next.cards[card.id] || newState(today);
    next.cards[card.id] = grade(prev, correct, today);
    next.streak = updateStreak(next.streak, today);
    return next;
  }

  function exportProgress(progress) {
    if (!progress) progress = loadProgress();
    var snap = JSON.parse(JSON.stringify(progress)); // never mutate the caller's object
    recomputeMastery(snap, window.BB && window.BB.data);
    return JSON.stringify(snap, null, 2);
  }

  function importProgress(json, validIds) {
    var raw;
    try { raw = JSON.parse(json); } catch (e) { return null; }
    if (!raw || typeof raw !== "object" || !raw.cards || typeof raw.cards !== "object") return null;
    return migrateProgress(raw, validIds);
  }

  // ---------------- Practice UI (DOM-guarded) ----------------
  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c];
    });
  }
  function $(id) { return document.getElementById(id); }
  function prefersReducedMotion() {
    return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  function modeForBox(card, box) {
    if (card.kind === "pronounce") return "flip";
    if (card.kind === "discriminate") return "mc";
    if (box <= 2) return "mc";
    if (box >= 5) return "scenario";
    return "typed";
  }

  // Guidance scaffolding that fades as expertise grows (worked-example /
  // expertise-reversal effect, spec §3): boxes 1-2 get a labelled "Worked example"
  // (pronounce cards get a "Memory hook"), 3-4 a lighter "Why it works", and at
  // box 5 (production) the explanation is removed entirely. Pure → unit-tested.
  function whyDisplay(card, box) {
    if (box >= 5 || !card.why) return { label: "", text: "" };
    var label = card.kind === "pronounce" ? "Memory hook" : (box <= 2 ? "Worked example" : "Why it works");
    return { label: label, text: card.why };
  }

  var session = null; // { queue, idx, results, deckId, requeued, correct, total, pendingCorrect }

  function startSession(deckId) {
    var cards = buildSession(deckId, {});
    if (!cards.length) { renderCaughtUp(deckId); return; }
    session = { queue: cards, idx: 0, baseTotal: cards.length, results: [], deckId: deckId, requeued: {}, correct: 0, total: 0, pendingCorrect: null };
    $("practiceHome").hidden = true;
    $("summaryScreen").hidden = true;
    $("sessionScreen").hidden = false;
    showCard();
  }

  function renderCaughtUp(deckId) {
    $("practiceHome").hidden = true;
    $("sessionScreen").hidden = true;
    var s = $("summaryScreen");
    s.hidden = false;
    $("summaryTitle").textContent = "You're caught up";
    $("summaryStats").textContent = deckId
      ? "No cards are due in this deck right now. Come back later, or drill another deck."
      : "Nothing is due across your decks right now. Nicely done — rest is part of spacing.";
    $("summaryWeak").textContent = "";
  }

  function currentState(card) {
    var p = loadProgress();
    return p.cards[card.id] || newState(dayNumber());
  }

  function showCard() {
    var card = session.queue[session.idx];
    var box = currentState(card).box;
    var mode = modeForBox(card, box);
    session.pendingCorrect = null;
    var flashcard = $("flashcard");
    flashcard.classList.remove("flipped");
    setActiveFace(false);
    $("frontDeck").textContent = (DECKS[card.deck] ? DECKS[card.deck].label : card.deck) + " · box " + box;
    $("cardPrompt").textContent = card.prompt;
    $("cardAnswer").textContent = card.answer;
    var wd = whyDisplay(card, box);
    var whyLabel = $("cardWhyLabel"), whyText = $("cardWhy");
    if (whyLabel) { whyLabel.textContent = wd.label; whyLabel.hidden = !wd.label; }
    whyText.textContent = wd.text; whyText.hidden = !wd.text;
    var fb = $("cardFeedback");
    fb.textContent = ""; fb.className = "feedback";
    // learnLink: deep-link to the lesson section if it exists (S3), else the fundamentals Start section.
    var learn = $("cardLearnLink");
    learn.setAttribute("href", (card.learnLink && document.getElementById(card.learnLink)) ? "#" + card.learnLink : "#start");
    // Stable denominator: the original session size. Re-shown misses are labelled
    // as quick reviews so the count never silently grows past where it started.
    if (session.idx >= session.baseTotal) {
      var rTotal = session.queue.length - session.baseTotal;
      var rNum = session.idx - session.baseTotal + 1;
      $("sessionProgress").textContent = "Quick review " + rNum + " of " + rTotal;
    } else {
      $("sessionProgress").textContent = "Card " + (session.idx + 1) + " of " + session.baseTotal;
    }
    buildQuiz(card, mode);
    buildGradeRow(card, mode);
    $("cardPrompt").focus();
  }

  function buildQuiz(card, mode) {
    var area = $("quizArea");
    area.innerHTML = "";
    area.dataset.mode = mode;
    if (mode === "mc") {
      var choices = shuffle(card.choices || [card.answer], Math.random);
      choices.forEach(function (choice, i) {
        var b = document.createElement("button");
        b.type = "button"; b.className = "choice-btn"; b.dataset.choice = choice;
        b.innerHTML = '<span class="choice-key" aria-hidden="true">' + (i + 1) + '</span><span>' + esc(choice) + "</span>";
        b.addEventListener("click", function () { chooseMC(card, choice); });
        area.appendChild(b);
      });
    } else if (mode === "typed" || mode === "scenario") {
      if (mode === "scenario" && card.scenario) {
        var note = document.createElement("p");
        note.className = "scenario-note"; note.textContent = card.scenario;
        area.appendChild(note);
      }
      var row = document.createElement("div");
      row.className = "typed-row";
      var input = document.createElement("input");
      input.type = "text"; input.id = "typedInput";
      input.setAttribute("aria-label", "Type your answer"); input.autocomplete = "off";
      var submit = document.createElement("button");
      submit.type = "button"; submit.className = "btn primary"; submit.textContent = "Check";
      submit.addEventListener("click", function () { submitTyped(card); });
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); submitTyped(card); } });
      row.appendChild(input); row.appendChild(submit);
      area.appendChild(row);
    } else { // flip (pronounce)
      var hint = document.createElement("p");
      hint.className = "scenario-note";
      hint.textContent = "Say it out loud, then flip to check the respelling.";
      area.appendChild(hint);
      if (card.audioText) area.appendChild(makeSpeakButton(card));
      var flipBtn = document.createElement("button");
      flipBtn.type = "button"; flipBtn.className = "btn gold"; flipBtn.textContent = "Flip to answer";
      flipBtn.addEventListener("click", function () { flip(true); });
      area.appendChild(flipBtn);
    }
  }

  function makeSpeakButton(card) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "speak-btn";
    b.setAttribute("aria-label", "Hear " + card.answer + " spoken aloud");
    b.textContent = "🔊 Hear it";
    b.addEventListener("click", function () { speak(card.audioText, card.lang); });
    return b;
  }
  function speak(text, lang) {
    if (typeof window.speechSynthesis === "undefined" || typeof window.SpeechSynthesisUtterance === "undefined") return;
    var u = new window.SpeechSynthesisUtterance(text);
    if (lang) u.lang = lang;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  function buildGradeRow(card, mode) {
    var row = $("gradeRow");
    row.innerHTML = "";
    if (card.audioText) row.appendChild(makeSpeakButton(card));
    var got = document.createElement("button");
    got.type = "button"; got.className = "btn primary"; got.textContent = "I got it (1)";
    got.addEventListener("click", function () { commit(card, true); });
    var missed = document.createElement("button");
    missed.type = "button"; missed.className = "btn"; missed.textContent = "I didn't (2)";
    missed.addEventListener("click", function () { commit(card, false); });
    row.appendChild(got); row.appendChild(missed);
  }

  function chooseMC(card, choice) {
    var correct = choice === card.answer;
    var buttons = $("quizArea").querySelectorAll(".choice-btn");
    Array.prototype.forEach.call(buttons, function (b) {
      b.disabled = true;
      if (b.dataset.choice === card.answer) b.classList.add("correct");
      else if (b.dataset.choice === choice) b.classList.add("wrong");
    });
    announce(correct);
    session.pendingCorrect = correct;
    // Defer the reveal slightly so the right/wrong colours register — but guard
    // against the session being ended/replaced during the delay.
    var snapSession = session, snapCard = card;
    setTimeout(function () {
      if (session === snapSession && session.queue[session.idx] === snapCard && !$("sessionScreen").hidden) flip(true);
    }, prefersReducedMotion() ? 0 : 220);
  }

  function submitTyped(card) {
    var input = $("typedInput");
    var correct = gradeTyped(card, input.value);
    announce(correct);
    session.pendingCorrect = correct;
    flip(true);
  }

  function announce(correct) {
    var f = $("cardFeedback");
    f.textContent = correct ? "Correct." : "Not quite — check the answer, then grade yourself.";
    f.className = "feedback " + (correct ? "ok" : "no");
  }

  // Keep the inactive face out of the tab order AND the accessibility tree while
  // it is only visually hidden by backface-visibility (animated path).
  function setActiveFace(flipped) {
    var front = document.querySelector(".flashcard-front");
    var back = document.querySelector(".flashcard-back");
    if (front) front.inert = !!flipped;
    if (back) back.inert = !flipped;
  }

  function flip(toBack) {
    var fc = $("flashcard");
    if (toBack) fc.classList.add("flipped"); else fc.classList.remove("flipped");
    setActiveFace(toBack);
    if (toBack) {
      // Focus (and thereby announce) the revealed answer so screen-reader users
      // hear what they are self-grading; the "why" is linked via aria-describedby.
      var ans = $("cardAnswer");
      if (ans) ans.focus();
    } else {
      var prompt = $("cardPrompt");
      if (prompt) prompt.focus();
    }
  }

  function commit(card, correct) {
    // A re-shown (already-requeued) card is a brief practice repetition only —
    // it must NOT write Leitner state a second time (no double-grade / over-lapse).
    var isReshow = !!session.requeued[card.id];
    if (!isReshow) {
      saveProgress(recordResult(loadProgress(), card, correct, dayNumber()));
      session.total += 1;
      if (correct) session.correct += 1;
      session.results.push({ id: card.id, correct: correct, deck: card.deck });
      // gentle same-session re-show on a miss (once)
      if (!correct) {
        session.requeued[card.id] = true;
        session.queue.push(card);
      }
    }
    session.idx += 1;
    if (session.idx >= session.queue.length) finishSession();
    else showCard();
  }

  function finishSession() {
    $("sessionScreen").hidden = true;
    var s = $("summaryScreen");
    s.hidden = false;
    var pct = session.total ? Math.round((session.correct / session.total) * 100) : 0;
    $("summaryTitle").textContent = "Session complete";
    $("summaryStats").textContent = session.correct + " of " + session.total + " correct (" + pct + "%).";
    var weak = session.results.filter(function (r) { return !r.correct; });
    $("summaryWeak").textContent = weak.length
      ? "Re-queued for soon: " + weak.length + " card" + (weak.length === 1 ? "" : "s") + ". They'll resurface in Smart Review."
      : "Clean run — those cards move up a box.";
    renderProgress();
    session = null;
  }

  // ---------------- Progress UI + guided path + export/import ----------------
  function renderDeckHome() {
    var grid = $("deckGrid");
    if (!grid) return;
    var p = loadProgress();
    grid.innerHTML = "";
    Object.keys(DECKS).forEach(function (id) {
      var m = masteryFor(p, id, window.BB.data);
      var count = generateDeck(id, window.BB.data).length;
      var tile = document.createElement("button");
      tile.type = "button"; tile.className = "deck-tile"; tile.dataset.session = id;
      var name = document.createElement("span"); name.className = "deck-name"; name.textContent = DECKS[id].label;
      var meta = document.createElement("span"); meta.className = "deck-meta"; meta.textContent = count + " cards";
      var mast = document.createElement("span"); mast.className = "deck-mastery"; mast.textContent = m + "% mastered";
      tile.appendChild(name); tile.appendChild(meta); tile.appendChild(mast);
      grid.appendChild(tile);
    });
  }

  function ringColor(pct) {
    if (pct >= 80) return "var(--green)";
    if (pct >= 40) return "var(--gold)";
    return "var(--accent-dark)";
  }
  function ringEl(label, pct) {
    var card = document.createElement("div");
    card.className = "ring-card";
    var ring = document.createElement("div");
    ring.className = "ring";
    ring.setAttribute("role", "img");
    ring.setAttribute("aria-label", label + ": " + pct + "% mastered");
    ring.style.background = "conic-gradient(" + ringColor(pct) + " " + (pct * 3.6) + "deg, var(--paper-2) 0)";
    var inner = document.createElement("div");
    inner.style.width = "70px"; inner.style.height = "70px"; inner.style.borderRadius = "50%";
    inner.style.background = "var(--cream)"; inner.style.display = "grid"; inner.style.placeItems = "center";
    var num = document.createElement("span"); num.className = "ring-num"; num.textContent = pct;
    inner.appendChild(num);
    ring.appendChild(inner);
    var cap = document.createElement("div"); cap.className = "ring-label"; cap.textContent = label;
    card.appendChild(ring); card.appendChild(cap);
    return card;
  }

  var TAG_RINGS = ["acidity", "tannin", "body", "white", "red", "rose", "spice", "seafood", "steak"];

  function renderProgress() {
    if (!$("deckRings")) return;
    var p = loadProgress();
    var dr = $("deckRings"); dr.innerHTML = "";
    Object.keys(DECKS).forEach(function (id) { dr.appendChild(ringEl(DECKS[id].label, masteryFor(p, id, window.BB.data))); });
    var tr = $("tagRings"); tr.innerHTML = "";
    TAG_RINGS.forEach(function (t) { tr.appendChild(ringEl(t, masteryFor(p, t, window.BB.data))); });

    var sl = $("streakLine");
    if (p.streak && p.streak.current > 0) {
      sl.innerHTML = '<span aria-hidden="true">🔥</span> ' + p.streak.current +
        " day streak. A single missed day is forgiven — keep it lenient.";
    } else {
      sl.textContent = "No study days yet — start a session to begin your streak.";
    }

    var weak = [];
    allCards(window.BB.data).forEach(function (c) {
      var st = p.cards[c.id];
      if (st && st.box <= 2 && st.wrong > 0) weak.push(c);
    });
    var wl = $("weakList");
    if (!weak.length) { wl.textContent = "Nothing flagged weak yet — good sign, or just early."; }
    else {
      wl.innerHTML = weak.slice(0, 24).map(function (c) {
        return '<span class="weak-pill" title="' + esc(c.prompt) + '">' + esc(DECKS[c.deck].label) + ": " + esc(c.answer) + "</span>";
      }).join("");
    }
    renderGuidedPath(p);
    renderDeckHome();
  }

  var GUIDED = [
    { type: "learn", label: "Read Wine School: what the structure words mean", target: "#start" },
    { type: "deck", deck: "translator", label: "Focus: Translator (your #1 table priority)" },
    { type: "deck", deck: "wine-identity", label: "Focus: Wine Identity (grape + region)" },
    { type: "deck", deck: "pronunciation", label: "Focus: Pronunciation (say each name)" },
    { type: "deck", deck: "pairing", label: "Focus: Pairing & Why (dish → glass + reason)" },
    { type: "deck", deck: "structure", label: "Focus: Structure (highest acid/tannin/body)" },
    { type: "smart", label: "Smart Review: mix it all together" }
  ];
  function renderGuidedPath(p) {
    var host = $("guidedPath");
    if (!host) return;
    host.innerHTML = "";
    var firstActive = true;
    GUIDED.forEach(function (step, i) {
      var done = false;
      if (step.type === "deck") done = masteryFor(p, step.deck, window.BB.data) >= 40;
      if (step.type === "smart") done = Object.keys(DECKS).every(function (d) { return masteryFor(p, d, window.BB.data) >= 40; });
      var div = document.createElement("div");
      div.className = "guided-step" + (done ? " done" : "");
      var active = !done && firstActive;
      if (active) { div.classList.add("active"); firstActive = false; }
      var action = step.type === "deck"
        ? '<button class="btn primary" type="button" data-session="' + step.deck + '">Start</button>'
        : step.type === "smart"
          ? '<button class="btn primary" type="button" data-session="smart">Start</button>'
          : '<a class="btn" href="' + step.target + '">Open</a>';
      div.innerHTML = '<span class="step-n">' + (i + 1) + '</span>' +
        '<span class="step-text">' + esc(step.label) + '</span>' +
        '<span class="step-state">' + (done ? "Done" : active ? "Do this next" : "Later") + "</span>" + action;
      host.appendChild(div);
    });
  }

  function setIoStatus(msg) { var el = $("ioStatus"); if (el) el.textContent = msg; }
  function doExport() {
    var json = exportProgress(loadProgress());
    try {
      var blob = new Blob([json], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url; a.download = "bridgette-progress.json";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      setIoStatus("Progress exported to bridgette-progress.json.");
    } catch (e) { setIoStatus("Export not available in this browser context."); }
  }
  function doImport(file) {
    var reader = new FileReader();
    reader.onerror = function () { setIoStatus("Import failed — couldn't read that file."); };
    reader.onload = function () {
      var imported = importProgress(String(reader.result), validIdSet());
      if (!imported) { setIoStatus("Import failed — that file isn't valid progress JSON."); return; }
      saveProgress(imported);
      renderProgress();
      setIoStatus("Progress imported and merged. Boxes, streak, and mastery restored.");
    };
    reader.readAsText(file);
  }

  function onKeydown(e) {
    if (!session || $("sessionScreen").hidden) return;
    var tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea") return; // typing flows; input has its own Enter
    var fc = $("flashcard");
    var flipped = fc.classList.contains("flipped");
    var card = session.queue[session.idx];
    if (/^[1-4]$/.test(e.key)) {
      if (!flipped) {
        var btns = $("quizArea").querySelectorAll(".choice-btn");
        var idx = parseInt(e.key, 10) - 1;
        if (btns[idx]) { e.preventDefault(); btns[idx].click(); }
      } else if (e.key === "1") { e.preventDefault(); commit(card, true); }
      else if (e.key === "2") { e.preventDefault(); commit(card, false); }
      return;
    }
    if (tag === "button" || tag === "a") return; // let a focused control handle its own Space/Enter
    if (e.code === "Space" || e.key === " ") { e.preventDefault(); flip(!flipped); return; }
    if (e.key === "Enter") {
      e.preventDefault();
      if (flipped && session.pendingCorrect != null) commit(card, session.pendingCorrect);
    }
  }

  function bindUI() {
    document.body.addEventListener("click", function (e) {
      var trig = e.target.closest ? e.target.closest("[data-session]") : null;
      if (!trig) return;
      var v = trig.dataset.session;
      startSession(v === "smart" ? null : v);
      var prm = document.getElementById("practice");
      if (prm) prm.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    });
    var end = $("endSession"); if (end) end.addEventListener("click", function () {
      session = null; $("sessionScreen").hidden = true; $("practiceHome").hidden = false; renderDeckHome();
    });
    var again = $("summaryAgain"); if (again) again.addEventListener("click", function () {
      $("summaryScreen").hidden = true; $("practiceHome").hidden = false; renderDeckHome();
    });
    var sp = $("summaryProgress"); if (sp) sp.addEventListener("click", function () {
      document.getElementById("progress").scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
    });
    [$("exportProgress"), $("exportProgress2")].forEach(function (b) { if (b) b.addEventListener("click", doExport); });
    var imp = $("importProgress"); if (imp) imp.addEventListener("click", function () { $("importFile").click(); });
    var impFile = $("importFile"); if (impFile) impFile.addEventListener("change", function (e) {
      if (e.target.files && e.target.files[0]) doImport(e.target.files[0]);
      e.target.value = ""; // allow re-selecting the same file to re-trigger import
    });
    document.addEventListener("keydown", onKeydown);
  }

  function init() {
    if (!window.BB || !window.BB.data) return;
    saveProgress(loadProgress()); // migrate/persist on boot: orphan ids dropped, new ids implicit box 1
    bindUI();
    renderDeckHome();
    renderProgress();
  }

  if (typeof document !== "undefined" && document.getElementById) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  }

  // Public API (filled in by later tasks).
  window.BB.training = {
    BOX_DUE_DAYS: BOX_DUE_DAYS,
    NEW_CAP: NEW_CAP,
    SIZE_CAP: SIZE_CAP,
    dayNumber: dayNumber,
    grade: grade,
    isDue: isDue,
    newState: newState,
    normalizeAnswer: normalizeAnswer,
    gradeTyped: gradeTyped,
    updateStreak: updateStreak,
    DECKS: DECKS,
    generateDeck: generateDeck,
    allCards: allCards,
    langFor: langFor,
    slug: slug,
    buildSession: buildSession,
    shuffle: shuffle,
    STORAGE_KEY: STORAGE_KEY,
    defaultProgress: defaultProgressShape,
    migrateProgress: migrateProgress,
    masteryFor: masteryFor,
    recomputeMastery: recomputeMastery,
    recordResult: recordResult,
    exportProgress: exportProgress,
    importProgress: importProgress,
    loadProgress: loadProgress,
    saveProgress: saveProgress,
    init: init,
    renderProgress: renderProgress,
    whyDisplay: whyDisplay
  };
})();
