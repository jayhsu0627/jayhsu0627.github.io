(function () {
  var DATA_BASE = "./static/data/examples/";
  var CONDITIONS = [
    { key: "unsteered_literal", label: "Unsteered" },
    { key: "steered_clean", label: "Steered" },
    { key: "prompting_baseline", label: "Prompting" },
  ];

  var root = document.getElementById("example-browser");
  if (!root) return;

  var els = {
    model: document.getElementById("ex-model"),
    domain: document.getElementById("ex-domain"),
    hm: document.getElementById("ex-hm"),
    search: document.getElementById("ex-search"),
    list: document.getElementById("ex-list"),
    status: document.getElementById("ex-status"),
    counter: document.getElementById("ex-counter"),
    meta: document.getElementById("ex-meta"),
    scores: document.getElementById("ex-scores"),
    chat: document.getElementById("ex-chat"),
    prev: document.getElementById("ex-prev"),
    next: document.getElementById("ex-next"),
    condWrap: document.getElementById("ex-conditions"),
  };

  var manifest = null;
  var payload = null;
  var filtered = [];
  var pos = 0;
  var condition = "steered_clean";
  var cache = {};

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fmt(v) {
    if (v == null || Number.isNaN(v)) return "—";
    return Number(v).toFixed(2);
  }

  function activeCond(ex) {
    return (ex.conditions && ex.conditions[condition]) || null;
  }

  function hmOf(ex) {
    var c = activeCond(ex);
    return c && c.judge ? Number(c.judge.hm) : NaN;
  }

  function setStatus(msg) {
    if (els.status) els.status.textContent = msg || "";
  }

  function fillModels() {
    var instruct = document.createElement("optgroup");
    instruct.label = "Instruct";
    var base = document.createElement("optgroup");
    base.label = "Base";
    manifest.models.forEach(function (m) {
      var opt = document.createElement("option");
      opt.value = m.key;
      opt.textContent = m.label;
      (m.role === "base" ? base : instruct).appendChild(opt);
    });
    els.model.innerHTML = "";
    els.model.appendChild(instruct);
    els.model.appendChild(base);
    var def = manifest.default || "gemma-2-9b-it";
    els.model.value = def;
  }

  function fillDomains() {
    var domains = {};
    (payload.examples || []).forEach(function (ex) {
      if (ex.domain) domains[ex.domain] = true;
    });
    var cur = els.domain.value;
    els.domain.innerHTML = '<option value="">All domains</option>';
    Object.keys(domains)
      .sort()
      .forEach(function (d) {
        var opt = document.createElement("option");
        opt.value = d;
        opt.textContent = d;
        els.domain.appendChild(opt);
      });
    if (cur && domains[cur]) els.domain.value = cur;
  }

  function applyFilters() {
    var q = (els.search.value || "").trim().toLowerCase();
    var domain = els.domain.value || "";
    var minHm = parseFloat(els.hm.value || "0");
    filtered = [];
    (payload.examples || []).forEach(function (ex, i) {
      if (domain && ex.domain !== domain) return;
      var hm = hmOf(ex);
      if (!Number.isNaN(minHm) && minHm > 0 && !(hm >= minHm)) return;
      if (q) {
        var hay = (
          (ex.concept_id || "") +
          " " +
          (ex.domain || "") +
          " " +
          ((ex.conditions.unsteered_literal && ex.conditions.unsteered_literal.prompt) || "") +
          " " +
          ((ex.conditions.steered_clean && ex.conditions.steered_clean.generation) || "")
        ).toLowerCase();
        if (hay.indexOf(q) < 0) return;
      }
      filtered.push(i);
    });
    if (pos >= filtered.length) pos = Math.max(0, filtered.length - 1);
    renderList();
    renderEntry();
  }

  function renderList() {
    var html = "";
    filtered.forEach(function (idx, listPos) {
      var ex = payload.examples[idx];
      var c = activeCond(ex);
      var preview = (c && c.prompt) || "";
      var hm = hmOf(ex);
      html +=
        '<button type="button" class="ex-entry' +
        (listPos === pos ? " is-active" : "") +
        '" data-pos="' +
        listPos +
        '">' +
        '<span class="ex-entry-idx">#' +
        (listPos + 1) +
        (ex.domain ? " · " + escapeHtml(ex.domain) : "") +
        "</span>" +
        '<span class="ex-entry-preview">' +
        escapeHtml(preview) +
        "</span>" +
        '<span class="ex-entry-hm">HM ' +
        fmt(hm) +
        "</span>" +
        "</button>";
    });
    els.list.innerHTML = html || '<p class="ex-empty">No matching examples.</p>';
    els.list.querySelectorAll(".ex-entry").forEach(function (btn) {
      btn.addEventListener("click", function () {
        pos = parseInt(btn.getAttribute("data-pos"), 10) || 0;
        renderList();
        renderEntry();
      });
    });
  }

  function renderScores(judge) {
    if (!judge) {
      els.scores.innerHTML = "";
      return;
    }
    var chips = [
      ["AQ", judge.aq],
      ["FL", judge.fl],
      ["IF", judge.iff],
      ["HM", judge.hm],
    ];
    els.scores.innerHTML = chips
      .map(function (pair) {
        return (
          '<span class="ex-chip' +
          (pair[0] === "HM" ? " is-hm" : "") +
          '"><span class="k">' +
          pair[0] +
          '</span><span class="v">' +
          fmt(pair[1]) +
          "</span></span>"
        );
      })
      .join("");
  }

  function renderEntry() {
    els.prev.disabled = pos <= 0 || filtered.length === 0;
    els.next.disabled = pos >= filtered.length - 1 || filtered.length === 0;
    els.counter.textContent =
      filtered.length === 0 ? "0 / 0" : pos + 1 + " / " + filtered.length;

    if (!payload || filtered.length === 0) {
      els.meta.textContent = "No example selected";
      els.scores.innerHTML = "";
      els.chat.innerHTML =
        '<p class="ex-empty">Choose a model and pick an example from the list.</p>';
      return;
    }

    var ex = payload.examples[filtered[pos]];
    var c = activeCond(ex);
    var alpha = c && c.alpha != null ? c.alpha : payload.paper_alpha;
    var layer = payload.layer;
    els.meta.innerHTML =
      "<strong>" +
      escapeHtml(payload.label) +
      "</strong>" +
      (layer != null ? " · layer " + layer : "") +
      (condition === "steered_clean" ? " · α = " + alpha : "") +
      (ex.domain ? " · " + escapeHtml(ex.domain) : "") +
      " · <code>" +
      escapeHtml(ex.concept_id) +
      "</code>";

    renderScores(c && c.judge);

    if (!c) {
      els.chat.innerHTML =
        '<p class="ex-empty">This condition is missing for the selected example.</p>';
      return;
    }

    var rationale =
      c.judge && c.judge.rationale
        ? '<div class="ex-rationale"><strong>Judge rationale</strong>' +
          escapeHtml(c.judge.rationale) +
          "</div>"
        : "";

    els.chat.innerHTML =
      '<div class="ex-turn">' +
      '<div class="ex-avatar user">U</div>' +
      '<div class="ex-turn-body">' +
      '<div class="ex-turn-label">Prompt</div>' +
      '<div class="ex-turn-text">' +
      escapeHtml(c.prompt) +
      "</div></div></div>" +
      '<div class="ex-turn">' +
      '<div class="ex-avatar assistant">A</div>' +
      '<div class="ex-turn-body">' +
      '<div class="ex-turn-label">Generation · ' +
      escapeHtml(
        CONDITIONS.find(function (x) {
          return x.key === condition;
        }).label
      ) +
      "</div>" +
      '<div class="ex-turn-text">' +
      escapeHtml(c.generation) +
      "</div>" +
      rationale +
      "</div></div>";
  }

  function syncConditionButtons() {
    els.condWrap.querySelectorAll("button").forEach(function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-cond") === condition);
    });
  }

  function loadModel(key) {
    var entry = manifest.models.find(function (m) {
      return m.key === key;
    });
    if (!entry) return;
    setStatus("Loading " + entry.label + "…");
    var done = function (data) {
      payload = data;
      cache[key] = data;
      fillDomains();
      pos = 0;
      applyFilters();
      if (key === "gemma-2-9b-it") {
        var hit = filtered.findIndex(function (i) {
          var ex = data.examples[i];
          var p =
            (ex.conditions.unsteered_literal && ex.conditions.unsteered_literal.prompt) ||
            "";
          return p.toLowerCase().indexOf("topical pain relievers") >= 0;
        });
        if (hit >= 0) {
          pos = hit;
          renderList();
          renderEntry();
        }
      }
      setStatus(
        entry.label +
          " · " +
          data.n +
          " test examples · paper α = " +
          data.paper_alpha
      );
    };

    if (cache[key]) {
      done(cache[key]);
      return;
    }

    fetch(DATA_BASE + entry.file)
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(done)
      .catch(function (err) {
        setStatus("Failed to load: " + err.message);
        payload = null;
        filtered = [];
        renderList();
        renderEntry();
      });
  }

  els.condWrap.querySelectorAll("button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      condition = btn.getAttribute("data-cond");
      syncConditionButtons();
      applyFilters();
    });
  });

  els.model.addEventListener("change", function () {
    loadModel(els.model.value);
  });
  els.domain.addEventListener("change", applyFilters);
  els.hm.addEventListener("change", applyFilters);
  els.search.addEventListener("input", applyFilters);
  els.prev.addEventListener("click", function () {
    if (pos > 0) {
      pos -= 1;
      renderList();
      renderEntry();
      var active = els.list.querySelector(".ex-entry.is-active");
      if (active) active.scrollIntoView({ block: "nearest" });
    }
  });
  els.next.addEventListener("click", function () {
    if (pos < filtered.length - 1) {
      pos += 1;
      renderList();
      renderEntry();
      var active = els.list.querySelector(".ex-entry.is-active");
      if (active) active.scrollIntoView({ block: "nearest" });
    }
  });

  document.addEventListener("keydown", function (e) {
    if (!root.contains(document.activeElement) && document.activeElement !== document.body) {
      return;
    }
    var tag = (document.activeElement && document.activeElement.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if (e.key === "ArrowLeft") {
      els.prev.click();
      e.preventDefault();
    } else if (e.key === "ArrowRight") {
      els.next.click();
      e.preventDefault();
    }
  });

  syncConditionButtons();
  setStatus("Loading model list…");
  fetch(DATA_BASE + "manifest.json")
    .then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(function (m) {
      manifest = m;
      fillModels();
      loadModel(els.model.value);
    })
    .catch(function (err) {
      setStatus("Failed to load manifest: " + err.message);
    });
})();
