/* src/wineschool.js — window.BB.wineschool
 * Wine School lessons (rendered from data.lessons[]) + beginner deductive-grid tool.
 * Classic script, no modules. DOM wiring is guarded so Node can load it for unit tests.
 */
(function () {
  "use strict";
  window.BB = window.BB || {};

  // Dimensions a beginner can observe; "category" is colour/style, the rest are
  // the 3-point low/medium/high structure axes (sweetness uses the dry scale).
  var DG_DIMS = ["category", "acidity", "body", "tannin", "sweetness"];

  function wineValue(wine, dim) {
    if (dim === "category") return wine.category;
    return wine.structure ? wine.structure[dim] : undefined;
  }

  // Pure. clues: a subset of DG_DIMS -> value; empty/missing values are ignored.
  // Returns rows {wine, matched, total, exact} for wines matching >=1 set clue,
  // sorted by match count descending (stable, so ties keep list order).
  function deduce(wines, clues) {
    clues = clues || {};
    var active = DG_DIMS.filter(function (d) { return clues[d]; });
    if (!active.length) return [];
    var rows = [];
    (wines || []).forEach(function (w) {
      var matched = 0;
      active.forEach(function (d) {
        var wv = wineValue(w, d);
        if (wv != null && String(wv).toLowerCase() === String(clues[d]).toLowerCase()) matched++;
      });
      if (matched > 0) rows.push({ wine: w, matched: matched, total: active.length, exact: matched === active.length });
    });
    rows.sort(function (a, b) { return b.matched - a.matched; });
    return rows;
  }

  function checkQuickCheck(lesson, choiceIndex) {
    return !!lesson && !!lesson.quickCheck && choiceIndex === lesson.quickCheck.answer;
  }

  function slug(s) {
    return String(s == null ? "" : s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  // ---------------- rendering (DOM-guarded) ----------------
  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c];
    });
  }
  function $(id) { return document.getElementById(id); }

  function lessonArticle(lesson, index) {
    var qc = lesson.quickCheck || { q: "", choices: [], answer: 0 };
    var choices = (qc.choices || []).map(function (c, i) {
      return '<button class="qc-choice" type="button" data-i="' + i + '">' +
        '<span class="qc-key" aria-hidden="true">' + String.fromCharCode(65 + i) + '</span>' +
        '<span>' + esc(c) + '</span></button>';
    }).join("");
    // Each lesson is its own landmark + the learnLink anchor (id = lesson id).
    return '<article class="lesson" id="' + esc(lesson.id) + '" aria-labelledby="' + esc(lesson.id) + '-h" tabindex="-1">' +
      '<p class="lesson-num" aria-hidden="true">Lesson ' + (index + 1) + '</p>' +
      '<h3 class="lesson-title" id="' + esc(lesson.id) + '-h">' + esc(lesson.title) + '</h3>' +
      '<p class="lesson-body">' + esc(lesson.body) + '</p>' +
      '<div class="lesson-worked"><p class="lesson-worked-label">Worked example</p><p>' + esc(lesson.workedExample) + '</p></div>' +
      '<div class="quick-check" data-lesson="' + esc(lesson.id) + '">' +
        '<p class="qc-q"><span class="qc-tag">Quick check</span> ' + esc(qc.q) + '</p>' +
        '<div class="qc-choices" role="group" aria-label="Quick check answers for ' + esc(lesson.title) + '">' + choices + '</div>' +
        '<p class="qc-result" aria-live="polite" role="status"></p>' +
      '</div>' +
    '</article>';
  }

  function wireQuickCheck(article, lesson) {
    var result = article.querySelector(".qc-result");
    var buttons = article.querySelectorAll(".qc-choice");
    Array.prototype.forEach.call(buttons, function (btn) {
      btn.addEventListener("click", function () {
        var i = parseInt(btn.getAttribute("data-i"), 10);
        var ok = checkQuickCheck(lesson, i);
        Array.prototype.forEach.call(buttons, function (b) {
          b.classList.remove("is-correct", "is-wrong");
          b.removeAttribute("aria-pressed");
        });
        btn.setAttribute("aria-pressed", "true");
        btn.classList.add(ok ? "is-correct" : "is-wrong");
        if (ok) {
          result.className = "qc-result is-correct";
          result.textContent = "Correct. " + lesson.quickCheck.choices[lesson.quickCheck.answer] + " is the answer.";
        } else {
          // reveal the right choice for learning (worked-example spirit)
          var right = buttons[lesson.quickCheck.answer];
          if (right) right.classList.add("is-correct");
          result.className = "qc-result is-wrong";
          result.textContent = "Not quite — the answer is " + lesson.quickCheck.choices[lesson.quickCheck.answer] + ". Re-read the worked example above.";
        }
      });
    });
  }

  function renderLessons() {
    var list = $("lessonList");
    if (!list || !window.BB.data || !window.BB.data.lessons) return;
    var lessons = window.BB.data.lessons;
    list.innerHTML = lessons.map(lessonArticle).join("");
    lessons.forEach(function (lesson) {
      var article = document.getElementById(lesson.id);
      if (article) wireQuickCheck(article, lesson);
    });
    mountDeductiveGrid();
  }

  function mountDeductiveGrid() { /* implemented in Task 4 */ }

  function init() {
    if (!window.BB || !window.BB.data) return;
    renderLessons();
  }

  if (typeof document !== "undefined" && document.getElementById) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  }

  // ---- public API ----
  window.BB.wineschool = {
    DG_DIMS: DG_DIMS,
    deduce: deduce,
    checkQuickCheck: checkQuickCheck,
    slug: slug,
    wineValue: wineValue,
    renderLessons: renderLessons,
    init: init
  };
})();
