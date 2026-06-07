const savedKey = "bb_calgary_saved_cards_v1";
    const notesKey = "bb_calgary_notes_v1";
    let activeFilter = "all";
    let activeDrillType = "food";
    let currentDrill = null;
    let lastDrillKey = "";
    let saved = new Set(JSON.parse(localStorage.getItem(savedKey) || "[]"));

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
      }[char]));
    }

    function tokenText(item) {
      const out = [];
      const walk = value => {
        if (value == null) return;
        if (Array.isArray(value)) value.forEach(walk);
        else if (typeof value === "object") Object.values(value).forEach(walk);
        else out.push(String(value));
      };
      walk(item);
      return out.join(" ").toLowerCase();
    }

    function joinList(value) {
      return Array.isArray(value) ? value.join(", ") : (value == null ? "" : String(value));
    }

    function structureText(structure) {
      if (!structure || typeof structure !== "object") return joinList(structure);
      const parts = [];
      if (structure.acidity) parts.push(structure.acidity + " acidity");
      if (structure.body) parts.push(structure.body + " body");
      if (structure.tannin) parts.push(structure.tannin + " tannin");
      if (structure.sweetness) parts.push(structure.sweetness);
      return parts.join(", ");
    }

    function structureMeters(structure, note) {
      if (!structure || typeof structure !== "object") return "";
      const levels = {low: 1, medium: 2, high: 3};
      const row = (label, value) => {
        const filled = levels[value] || 0;
        const segs = [1, 2, 3].map(i => `<span class="smeter-seg${i <= filled ? " on" : ""}" aria-hidden="true"></span>`).join("");
        return `<div class="smeter" role="img" aria-label="${escapeHtml(label)}: ${escapeHtml(value || "not rated")}">
          <span class="smeter-label">${escapeHtml(label)}</span>
          <span class="smeter-track">${segs}</span>
          <span class="smeter-value">${escapeHtml(value || "")}</span></div>`;
      };
      const sweet = structure.sweetness
        ? `<div class="smeter"><span class="smeter-label">Sweetness</span><span class="smeter-value chip">${escapeHtml(structure.sweetness)}</span></div>`
        : "";
      const noteHtml = note ? `<p class="smeter-note">≈ ${escapeHtml(note)}</p>` : "";
      return `<div class="structure-meters" aria-label="Structure, low to high">${row("Acidity", structure.acidity)}${row("Body", structure.body)}${row("Tannin", structure.tannin)}${sweet}</div>${noteHtml}`;
    }

    function renderCard(item, type) {
      const tags = (item.tags || []).map(tag => `<span class="badge">${escapeHtml(tag)}</span>`).join("");
      const pressed = saved.has(item.name) ? "true" : "false";
      const saveLabel = saved.has(item.name) ? `Remove ${item.name} from saved` : `Save ${item.name}`;
      const text = escapeHtml(tokenText(item));
      const isWine = type === "wine";
      const isFood = type === "food";
      const isCocktail = type === "cocktail";
      const caveat = joinList(item.flags) || item.avoid || item.caveat || "Confirm with the team if unsure.";
      const lead = isWine
        ? item.say
        : isFood
          ? `${item.wine}. ${item.why}`
          : item.say;
      return `
        <article class="study-card" data-group="${escapeHtml(item.group)}" data-category="${escapeHtml(item.category)}" data-tags="${escapeHtml((item.tags || []).join(" "))}" data-text="${text}">
          <div class="card-head">
            <div>
              <h3 class="card-title">${escapeHtml(item.name)}</h3>
              <p class="meta">${escapeHtml(item.category)}${item.price ? " / " + escapeHtml(item.price) : ""}</p>
            </div>
            <button class="save-btn" type="button" aria-pressed="${pressed}" aria-label="${escapeHtml(saveLabel)}" data-save="${escapeHtml(item.name)}">${pressed === "true" ? "★" : "☆"}</button>
          </div>
          <div class="card-body">
            <div class="lead-line">${escapeHtml(lead)}</div>
            <div class="confirm-line"><b>Confirm</b>${escapeHtml(caveat)}</div>
            <div class="badge-row">${tags}</div>
            ${isWine ? `<p><strong>${escapeHtml(item.grape)}</strong><br>${escapeHtml(item.region)}</p>` : ""}
            ${isWine && item.pronunciation ? `<p class="pron"><strong>Say it:</strong> ${escapeHtml(item.pronunciation.respell)} <button class="speak-btn" type="button" data-audio="${escapeHtml(item.id)}" aria-label="Hear ${escapeHtml(item.name)} pronounced">🔊 Hear it</button></p>` : ""}
            ${isWine ? structureMeters(item.structure, item.structureNote) : ""}
            ${isWine && item.tenSecond ? `<div class="pair-line"><b>10-second pour</b>${escapeHtml(item.tenSecond)}</div>` : ""}
            ${isFood ? `<p><strong>Menu:</strong> ${escapeHtml(item.menu)}</p>` : ""}
            ${isCocktail
              ? `<p><strong>Profile:</strong> ${escapeHtml(item.profile || "")}</p>`
              : `<p>${escapeHtml(item.profile || item.flavor || "")}</p>`}
            <div class="pair-line"><b>${isWine ? "Best food pairings" : isFood ? "Wine match" : "Food pairings"}</b>${escapeHtml(isWine ? joinList(item.pair) : isFood ? item.wine : joinList(item.pair))}</div>
            ${isWine || isFood ? `<div class="pair-line"><b>${isWine ? "Table language" : "Cocktail / drink match"}</b>${escapeHtml(isWine ? item.say : item.cocktail)}</div>` : ""}
            ${isFood ? `<div class="pair-line"><b>Zero-proof / beer</b>${escapeHtml(item.zero)}</div>` : ""}
            <details>
              <summary>Why it works and caveats</summary>
              <p>${escapeHtml(item.why || structureText(item.structure) || "")}</p>
              <p><strong>Caveat:</strong> ${escapeHtml(caveat)}</p>
              ${isWine ? `<p><strong>Bottle lane:</strong> ${escapeHtml(item.upgrade)}</p>` : ""}
            </details>
          </div>
        </article>
      `;
    }

    function renderWine() {
      const bottleHtml = `
        <article class="study-card" data-group="wine" data-category="bottle ladder" data-tags="wine bottle upsell" data-text="${escapeHtml(window.BB.data.bottleLadders.flat().join(" ").toLowerCase())}">
          <div class="card-head"><div><h3 class="card-title">Bottle Ladder</h3><p class="meta">Bottle upgrade paths that feel natural</p></div></div>
          <div class="card-body">
            ${window.BB.data.bottleLadders.map(([title, lane]) => `<div class="pair-line"><b>${escapeHtml(title)}</b>${escapeHtml(lane)}</div>`).join("")}
            <p class="quote">Try: "If you want to turn that glass into a bottle, this is the same lane but a little more special."</p>
          </div>
        </article>
        <article class="study-card" data-group="wine" data-category="bottle map" data-tags="wine bottle list upsell" data-text="${escapeHtml(window.BB.data.bottleMap.flat().join(" ").toLowerCase())}">
          <div class="card-head"><div><h3 class="card-title">Bottle Map</h3><p class="meta">Recognize the rest of the Calgary wine list by lane</p></div></div>
          <div class="card-body">
            ${window.BB.data.bottleMap.map(([title, lane]) => `<div class="pair-line"><b>${escapeHtml(title)}</b>${escapeHtml(lane)}</div>`).join("")}
            <details>
              <summary>How to use the bottle map</summary>
              <p>When you do not know a bottle deeply yet, sell the lane honestly: crisp seafood white, textured white, light red, structured steak red, or bubbles. Then confirm with a lead, bartender, or manager before making a high-price promise.</p>
            </details>
          </div>
        </article>`;
      document.getElementById("wineCards").innerHTML = window.BB.data.wines.map(item => renderCard(item, "wine")).join("") + bottleHtml;
    }

    function renderFood() {
      document.getElementById("foodCards").innerHTML = window.BB.data.foods.map(item => renderCard(item, "food")).join("");
    }

    function renderCocktails() {
      document.getElementById("cocktailCards").innerHTML = window.BB.data.cocktails.map(item => renderCard(item, "cocktail")).join("");
      document.getElementById("beerZero").innerHTML = window.BB.data.beerZero.join("");
    }

    function renderTranslator() {
      const container = document.getElementById("translatorTable");
      if (!container) return;
      const rows = window.BB.data.translator.map(item => `
        <tr>
          <th scope="row">${escapeHtml(item.ask)}</th>
          <td><strong>${escapeHtml(item.bestGlass)}</strong></td>
          <td>${escapeHtml(joinList(item.bottleOptions))}</td>
          <td>${escapeHtml(item.familiar)}</td>
          <td>${escapeHtml(item.different)} <span class="say">Say: "${escapeHtml(item.phrase)}"</span></td>
        </tr>`).join("");
      container.innerHTML = `
        <caption>Use this table when a guest asks for a common varietal and the Calgary list uses a more niche wine.</caption>
        <thead>
          <tr>
            <th scope="col">Guest asks for</th>
            <th scope="col">Best Bridgette answer</th>
            <th scope="col">Second or bottle option</th>
            <th scope="col">What feels familiar</th>
            <th scope="col">What feels different / phrase</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>`;
    }

    function renderMatrix() {
      const rows = window.BB.data.foods.filter(item => ["Small Plates","Pizza","Pasta","Main","Dessert","Vegetables"].includes(item.category)).map(item => `
        <tr>
          <td><strong>${escapeHtml(item.name)}</strong><br><span>${escapeHtml(item.flavor)}</span></td>
          <td>${escapeHtml(item.wine)}</td>
          <td>${escapeHtml(item.cocktail)}</td>
          <td>${escapeHtml(item.zero)}</td>
          <td>${escapeHtml(item.why)}</td>
        </tr>
      `).join("");
      document.getElementById("pairingMatrix").innerHTML = `
        <caption>Fast pairing reference for common Calgary food-menu items.</caption>
        <thead><tr><th scope="col">Dish</th><th scope="col">Wine</th><th scope="col">Cocktail</th><th scope="col">Zero-proof / beer</th><th scope="col">Why</th></tr></thead>
        <tbody>${rows}</tbody>
      `;
    }

    function populateSelects() {
      const dishSelect = document.getElementById("dishSelect");
      dishSelect.innerHTML = window.BB.data.foods.map(item => `<option value="${escapeHtml(item.name)}">${escapeHtml(item.name)}</option>`).join("");
      dishSelect.value = "Wood Grilled Beef Strip Steak";
    }

    function buildDrillDeck(type) {
      if (type === "wine") {
        return window.BB.data.wines.map(wine => ({
          key: `wine:${wine.name}`,
          label: "Wine Talk",
          prompt: `Describe ${wine.name} without sounding like a textbook.`,
          lines: [
            ["Say it", wine.pronunciation ? wine.pronunciation.respell : ""],
            ["Style", `${wine.grape}; ${structureText(wine.structure)}`],
            ["Table phrase", wine.say],
            ["Best pairings", joinList(wine.pair)],
            ["Confirm", wine.avoid],
            ["Bottle lane", wine.upgrade]
          ]
        }));
      }
      if (type === "cocktail") {
        return window.BB.data.cocktails.map(cocktail => ({
          key: `cocktail:${cocktail.name}`,
          label: "Cocktail Lane",
          prompt: `What guest lane does ${cocktail.name} fit, and what food would you pair it with?`,
          lines: [
            ["Lane", `${cocktail.category}; ${cocktail.profile}`],
            ["Table phrase", cocktail.say],
            ["Food pairings", cocktail.pair],
            ["Confirm", cocktail.caveat]
          ]
        }));
      }
      if (type === "safety") {
        return window.BB.data.foods.concat(window.BB.data.cocktails).map(item => ({
          key: `safety:${item.name}`,
          label: "Safety Check",
          prompt: `What needs confirming before recommending ${item.name}?`,
          lines: [
            ["Confirm", joinList(item.flags) || item.caveat || item.avoid || "Confirm availability and details with the team."],
            ["Service move", "Name the caveat calmly, then offer a nearby safe lane if needed."],
            ["Pairing note", item.wine || item.pair || item.say || "Use the main card for the best pairing lane."]
          ],
          dish: item.group === "food" ? item.name : ""
        }));
      }
      return window.BB.data.foods.map(food => ({
        key: `food:${food.name}`,
        label: "Food Pairing",
        prompt: `Guest orders ${food.name}. What would you recommend, and why?`,
        lines: [
          ["Wine", food.wine],
          ["Cocktail", food.cocktail],
          ["Zero-proof / beer", food.zero],
          ["Why it works", food.why],
          ["Confirm", food.flags]
        ],
        dish: food.name
      }));
    }

    function renderDrillAnswer(lines) {
      return lines.map(([label, value]) => `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`).join("");
    }

    function setDrill(drill, reveal = false) {
      currentDrill = drill;
      document.getElementById("drillTypeLabel").textContent = drill.label;
      document.getElementById("drillPrompt").textContent = drill.prompt;
      const answer = document.getElementById("drillAnswer");
      answer.innerHTML = renderDrillAnswer(drill.lines);
      answer.toggleAttribute("hidden", !reveal);
      const revealButton = document.getElementById("revealDrill");
      revealButton.setAttribute("aria-expanded", String(reveal));
      revealButton.textContent = reveal ? "Hide answer" : "Reveal answer";
      document.getElementById("drillStatus").textContent = reveal ? "Answer shown." : "Prompt ready. Answer out loud before revealing.";
    }

    function nextDrill() {
      const deck = buildDrillDeck(activeDrillType);
      if (!deck.length) return;
      let index = Math.floor(Math.random() * deck.length);
      if (deck.length > 1) {
        while (deck[index].key === lastDrillKey) index = Math.floor(Math.random() * deck.length);
      }
      lastDrillKey = deck[index].key;
      setDrill(deck[index], false);
    }

    function recommendationFor(food, style, format, budget) {
      let wine = food.wine;
      let bottle = "Use the bottle ladder in the same style as the glass.";
      if (food.tags.includes("steak")) bottle = budget === "premium" ? "White Rock Cabernet Sauvignon or Aia Vecchia Sor Ugo" : "Chateau Larose Perganson or Whitehall Lane Merlot";
      else if (food.tags.includes("seafood")) bottle = budget === "premium" ? "Denizot Sancerre, Griesel Blanc de Noirs, or Mount Eden Wolff Vineyard" : "Landron Muscadet or Raventos i Blanc de Nit Rose";
      else if (food.tags.includes("pizza") || food.tags.includes("tomato")) bottle = "Castello di Potentino Sacromonte or Domaine de Colette";
      else if (food.tags.includes("lamb")) bottle = "Brandini Langhe Filari Corti, Gigondas, or Terroir Sense Fronteres";
      else if (food.tags.includes("dessert")) bottle = "Domaine Pouderoux, Barbeito Madeira, Valdespino Cream Sherry, or Tawny Port";

      if (style === "bright") wine = food.tags.includes("steak") ? "Ca' del Baio Langhe" : (food.tags.includes("seafood") ? "Blue Mountain Brut or Ameztoi Rubentis" : wine);
      if (style === "bold") wine = food.tags.includes("steak") || food.tags.includes("lamb") ? "St. John Claret or Bodega Cerron Remordimiento Tinto" : wine;
      if (style === "adventurous") wine = food.tags.includes("spice") ? "Fattoria Moretto Semprebon or Darting Durkheimer Fronhof" : wine;
      if (style === "zero") wine = food.zero;

      const lead = format === "bottle" ? bottle : format === "cocktail" ? food.cocktail : format === "zero" ? food.zero : wine;
      return {lead, wine, bottle, cocktail: food.cocktail, zero: food.zero};
    }

    function updatePairing() {
      const dish = document.getElementById("dishSelect").value;
      const style = document.getElementById("styleSelect").value;
      const format = document.getElementById("formatSelect").value;
      const budget = document.getElementById("budgetSelect").value;
      const food = window.BB.data.foods.find(item => item.name === dish) || window.BB.data.foods[0];
      const rec = recommendationFor(food, style, format, budget);
      document.getElementById("pairingResult").innerHTML = `
        <div class="result-main">
          <h3>${escapeHtml(food.name)}</h3>
          <p><strong>Lead recommendation:</strong> ${escapeHtml(rec.lead)}</p>
          <p>${escapeHtml(food.why)}</p>
          <p class="quote">"For ${escapeHtml(food.name)}, I would steer you toward ${escapeHtml(rec.lead)}. It works because ${escapeHtml(food.why.toLowerCase())}"</p>
        </div>
        <div class="result-item"><strong>By the glass</strong><br>${escapeHtml(rec.wine)}</div>
        <div class="result-item"><strong>Bottle lane</strong><br>${escapeHtml(rec.bottle)}</div>
        <div class="result-item"><strong>Cocktail</strong><br>${escapeHtml(rec.cocktail)}</div>
        <div class="result-item"><strong>Zero-proof / beer</strong><br>${escapeHtml(rec.zero)}</div>
        <div class="result-item"><strong>Caveat</strong><br>${escapeHtml(joinList(food.flags))}</div>
      `;
    }

    function applyFilters() {
      const query = document.getElementById("globalSearch").value.trim().toLowerCase();
      const cards = Array.from(document.querySelectorAll(".study-card"));
      let shown = 0;
      cards.forEach(card => {
        const groupMatch = activeFilter === "all" || card.dataset.group === activeFilter || card.dataset.tags.includes(activeFilter) || card.dataset.category.toLowerCase().includes(activeFilter);
        const queryMatch = !query || card.dataset.text.includes(query) || card.dataset.tags.includes(query);
        const visible = groupMatch && queryMatch;
        card.style.display = visible ? "" : "none";
        if (visible) shown++;
      });
      document.getElementById("liveStatus").textContent = `Showing ${shown} dashboard cards.`;
    }

    function bindEvents() {
      document.getElementById("globalSearch").addEventListener("input", applyFilters);
      document.querySelectorAll("[data-filter]").forEach(button => {
        button.addEventListener("click", () => {
          activeFilter = button.dataset.filter;
          document.querySelectorAll("[data-filter]").forEach(btn => {
            const isActive = btn === button;
            btn.classList.toggle("active", isActive);
            btn.setAttribute("aria-pressed", String(isActive));
          });
          applyFilters();
        });
      });
      document.querySelectorAll("[data-drill-type]").forEach(button => {
        button.addEventListener("click", () => {
          activeDrillType = button.dataset.drillType;
          document.querySelectorAll("[data-drill-type]").forEach(btn => {
            const isActive = btn === button;
            btn.classList.toggle("active", isActive);
            btn.setAttribute("aria-pressed", String(isActive));
          });
          nextDrill();
        });
      });
      document.getElementById("newDrill").addEventListener("click", nextDrill);
      document.getElementById("newDrillTop").addEventListener("click", nextDrill);
      document.getElementById("revealDrill").addEventListener("click", () => {
        if (!currentDrill) return;
        const answer = document.getElementById("drillAnswer");
        const reveal = answer.hasAttribute("hidden");
        setDrill(currentDrill, reveal);
      });
      document.getElementById("jumpToPairing").addEventListener("click", () => {
        if (currentDrill && currentDrill.dish) {
          const dishSelect = document.getElementById("dishSelect");
          dishSelect.value = currentDrill.dish;
          updatePairing();
        }
        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        document.getElementById("pairing").scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "start"
        });
      });
      document.querySelectorAll("select").forEach(select => select.addEventListener("change", updatePairing));
      document.body.addEventListener("click", event => {
        const btn = event.target.closest("[data-audio]");
        if (!btn) return;
        const id = btn.dataset.audio;
        const wine = (window.BB.data.wines || []).find(w => w.id === id);
        if (!wine || !window.BB.playPronunciation) return;
        const lang = (window.BB.training && window.BB.training.langFor)
          ? window.BB.training.langFor(wine.country) : "";
        const say = wine.pronunciation ? wine.pronunciation.say : wine.name;
        window.BB.playPronunciation(id, say, lang);
      });
      document.body.addEventListener("click", event => {
        const button = event.target.closest("[data-save]");
        if (!button) return;
        const name = button.dataset.save;
        if (saved.has(name)) saved.delete(name);
        else saved.add(name);
        localStorage.setItem(savedKey, JSON.stringify(Array.from(saved)));
        updateSaveButtons();
        renderSaved();
      });
      document.querySelectorAll("[data-print]").forEach(button => {
        button.addEventListener("click", () => {
          const mode = button.dataset.print;
          document.body.dataset.printMode = mode === "all" ? "" : mode;
          window.print();
          setTimeout(() => { document.body.dataset.printMode = ""; }, 500);
        });
      });
      const notes = document.getElementById("notesArea");
      notes.value = localStorage.getItem(notesKey) || "";
      notes.addEventListener("input", () => localStorage.setItem(notesKey, notes.value));
    }

    function updateSaveButtons() {
      document.querySelectorAll("[data-save]").forEach(button => {
        const isSaved = saved.has(button.dataset.save);
        button.setAttribute("aria-pressed", String(isSaved));
        button.textContent = isSaved ? "★" : "☆";
        button.setAttribute("aria-label", `${isSaved ? "Remove" : "Save"} ${button.dataset.save}`);
      });
    }

    function renderSaved() {
      const list = document.getElementById("savedList");
      if (!saved.size) {
        list.textContent = "No saved cards yet.";
        return;
      }
      list.innerHTML = Array.from(saved).sort().map(name => `<span class="saved-pill">${escapeHtml(name)}</span>`).join("");
    }

    function init() {
      renderWine();
      renderFood();
      renderCocktails();
      renderTranslator();
      renderMatrix();
      populateSelects();
      bindEvents();
      nextDrill();
      updatePairing();
      updateSaveButtons();
      renderSaved();
      applyFilters();
    }

    init();
  
