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
      // reverse: learner typed a superset that contains the full short target
      var allInputTokens = tokenSet(norm);
      var targetCovered = target.split(" ").every(function (t) { return allInputTokens[t]; });
      if (targetCovered) return true;
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
    var ident = data.wines.map(function (w) { return w.grape + " — " + w.region; });
    return data.wines.map(function (w, i) {
      var ans = w.grape + " — " + w.region;
      return {
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
      };
    });
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

  function migrateProgress(raw, validIds) {
    var base = defaultProgressShape();
    if (!raw || typeof raw !== "object") return base;
    base.schema = SCHEMA;
    if (raw.cards && typeof raw.cards === "object") {
      Object.keys(raw.cards).forEach(function (id) {
        if (!validIds || validIds.has(id)) base.cards[id] = raw.cards[id];
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
    recomputeMastery(progress, window.BB && window.BB.data);
    return JSON.stringify(progress, null, 2);
  }

  function importProgress(json, validIds) {
    var raw;
    try { raw = JSON.parse(json); } catch (e) { return null; }
    if (!raw || typeof raw !== "object" || !raw.cards || typeof raw.cards !== "object") return null;
    return migrateProgress(raw, validIds);
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
    saveProgress: saveProgress
  };
})();
