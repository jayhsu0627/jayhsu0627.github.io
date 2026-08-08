(function () {
  var plotEl = document.getElementById('pca-plot');
  if (!plotEl) return;

  var MANIFEST_URL = './static/data/pca_manifest.json';
  var DOMAIN_COLORS = [
    '#1f77b4', '#d95f02', '#2ca02c', '#d62728',
    '#9467bd', '#8c564b', '#e377c2', '#7f7f7f',
  ];
  var SPLIT_COLORS = { train: '#1f77b4', dev: '#2ca02c', test: '#d95f02' };

  var aboutEl = document.getElementById('about-text');
  var statusEl = document.getElementById('export-status');
  var alphaEl = document.getElementById('alpha');
  var alphaVal = document.getElementById('alpha-val');
  var domainFilter = document.getElementById('domain-filter');
  var colorMode = document.getElementById('color-mode');
  var modelSelect = document.getElementById('model-select');
  var data = null;
  var manifest = null;
  var controlsWired = false;

  function arrowTrace(origin, direction, scale, name, color, width) {
    return {
      type: 'scatter3d',
      mode: 'lines',
      x: [origin.x, origin.x + direction[0] * scale],
      y: [origin.y, origin.y + direction[1] * scale],
      z: [origin.z, origin.z + direction[2] * scale],
      name: name,
      line: { color: color, width: width },
      hoverinfo: 'name',
    };
  }

  function selectedSplits() {
    return Array.prototype.slice
      .call(document.querySelectorAll('.split-filter:checked'))
      .map(function (el) { return el.value; });
  }

  function filteredPoints() {
    var splits = selectedSplits();
    var domain = domainFilter.value;
    return data.points.filter(function (p) {
      if (splits.indexOf(p.split) === -1) return false;
      if (domain !== 'all' && p.domain !== domain) return false;
      return true;
    });
  }

  function pointColor(p, mode, domainIndex) {
    if (mode === 'domain') return DOMAIN_COLORS[domainIndex[p.domain] % DOMAIN_COLORS.length];
    if (mode === 'split') return SPLIT_COLORS[p.split] || '#777';
    return p.kind === 'literal' ? '#1f77b4' : '#d95f02';
  }

  function build() {
    if (!data) return;

    var showLit = document.getElementById('show-literal').checked;
    var showAna = document.getElementById('show-analogy').checked;
    var showMeans = document.getElementById('show-means').checked;
    var showClean = document.getElementById('show-clean').checked;
    var showDirty = document.getElementById('show-dirty').checked;
    var showImagine = document.getElementById('show-imagine').checked;
    var alpha = parseFloat(alphaEl.value);
    var mode = colorMode.value;
    var pts = filteredPoints();
    var domainIndex = {};
    (data.domains || []).forEach(function (d, i) { domainIndex[d] = i; });

    var lit = pts.filter(function (p) { return p.kind === 'literal'; });
    var ana = pts.filter(function (p) { return p.kind === 'analogy'; });
    var traces = [];

    function scatter(subset, name) {
      if (!subset.length) return;
      traces.push({
        type: 'scatter3d',
        mode: 'markers',
        name: name,
        x: subset.map(function (p) { return p.x; }),
        y: subset.map(function (p) { return p.y; }),
        z: subset.map(function (p) { return p.z; }),
        text: subset.map(function (p) {
          return p.concept + ' · ' + p.domain + ' · ' + p.split;
        }),
        marker: {
          size: 2.8,
          color: subset.map(function (p) { return pointColor(p, mode, domainIndex); }),
          opacity: 0.7,
        },
        hovertemplate: '%{text}<extra>' + name + '</extra>',
      });
    }

    if (showLit) scatter(lit, 'Literal');
    if (showAna) scatter(ana, 'Analogy');

    var muL = data.means.literal;
    var muA = data.means.analogy;

    if (showMeans) {
      traces.push({
        type: 'scatter3d',
        mode: 'markers+text',
        name: 'Train means',
        x: [muL.x, muA.x],
        y: [muL.y, muA.y],
        z: [muL.z, muA.z],
        text: ['μ_literal', 'μ_analogy'],
        textposition: 'top center',
        marker: { size: 8, color: ['#1f77b4', '#d95f02'], symbol: 'diamond' },
        hoverinfo: 'text',
      });
      traces.push(arrowTrace(muL, data.vectors.diff_means, 1.0, 'μ_analogy − μ_literal', '#222222', 8));
    }

    if (showClean) {
      traces.push(arrowTrace(muL, data.vectors.clean, 1.0, 'Clean v (α=1)', '#2ca02c', 7));
    }
    if (showDirty) {
      traces.push(arrowTrace(muL, data.vectors.dirty, 1.0, 'Dirty v (α=1)', '#9467bd', 5));
    }
    if (showImagine) {
      var imagNorm = Math.hypot.apply(null, data.vectors.imagine) + 1e-8;
      var cleanNorm = Math.hypot.apply(null, data.vectors.clean) + 1e-8;
      traces.push(arrowTrace(muL, data.vectors.imagine, cleanNorm / imagNorm, 'Imagine dir', '#e377c2', 4));
    }

    var cx = data.vectors.clean;
    traces.push({
      type: 'scatter3d',
      mode: 'markers',
      name: 'Steered (α)',
      x: [muL.x + alpha * cx[0]],
      y: [muL.y + alpha * cx[1]],
      z: [muL.z + alpha * cx[2]],
      marker: { size: 9, color: '#111', symbol: 'x' },
      hovertemplate: 'Steered α=' + alpha.toFixed(1) + '<extra></extra>',
    });

    Plotly.react(
      plotEl,
      traces,
      {
        margin: { l: 0, r: 0, t: 10, b: 0 },
        legend: { orientation: 'h', y: 1.08 },
        scene: {
          xaxis: { title: 'PC1' },
          yaxis: { title: 'PC2' },
          zaxis: { title: 'PC3' },
          aspectmode: 'data',
          camera: { eye: { x: 1.5, y: 1.5, z: 1.1 } },
        },
        paper_bgcolor: '#ffffff',
        plot_bgcolor: '#ffffff',
      },
      { responsive: true, displayModeBar: true }
    );

    document.getElementById('hover-info').textContent =
      'Showing ' + pts.length + ' / ' + data.points.length + ' points' +
      ' (' + lit.length + ' literal, ' + ana.length + ' analogy).';
  }

  function fillDomainOptions() {
    var keep = domainFilter.value || 'all';
    domainFilter.innerHTML = '';
    var all = document.createElement('option');
    all.value = 'all';
    all.textContent = 'All domains';
    domainFilter.appendChild(all);
    (data.domains || []).forEach(function (d) {
      var opt = document.createElement('option');
      opt.value = d;
      opt.textContent = d + (data.domain_counts ? ' (' + data.domain_counts[d] + ')' : '');
      domainFilter.appendChild(opt);
    });
    domainFilter.value = keep;
    if (domainFilter.value !== keep) domainFilter.value = 'all';
  }

  function updateAbout() {
    var ev = data.explained_variance_ratio.map(function (v) {
      return (100 * v).toFixed(1) + '%';
    }).join(' / ');
    var splitTxt = Object.keys(data.splits || {}).map(function (k) {
      return k + '=' + data.splits[k];
    }).join(', ');
    aboutEl.innerHTML =
      '<b>' + (data.label || data.model.split('/').pop()) + '</b>, layer <b>' + data.layer + '</b>.<br>' +
      data.n_pairs + ' concept pairs · ' + data.points.length + ' points' +
      (splitTxt ? ' (' + splitTxt + ')' : '') + '.<br>' +
      'Means / vectors from <b>' + (data.means_from_split || 'train') + '</b> split.<br>' +
      'PCA variance: ' + ev + ' · dirty/clean cos ' +
      data.norms.dirty_clean_cosine.toFixed(3) + '.';
  }

  function updateExportStatus() {
    if (!manifest) return;
    var pending = manifest.models.filter(function (m) { return !m.ready; });
    var nBase = manifest.models.filter(function (m) { return m.role === 'base' && m.ready; }).length;
    var nIt = manifest.models.filter(function (m) { return m.role === 'instruct' && m.ready; }).length;
    if (!pending.length) {
      statusEl.textContent = 'All 14 paper models exported (7 instruct + 7 base).';
      statusEl.classList.remove('pending');
    } else {
      statusEl.textContent =
        'Ready: ' + nIt + ' instruct, ' + nBase + ' base. Still exporting: ' +
        pending.map(function (m) { return m.label; }).join(', ') + '.';
      statusEl.classList.add('pending');
    }
  }

  function wireControls() {
    if (controlsWired) return;
    controlsWired = true;
    [
      'show-literal', 'show-analogy', 'show-means',
      'show-clean', 'show-dirty', 'show-imagine',
    ].forEach(function (id) {
      document.getElementById(id).addEventListener('change', build);
    });
    document.querySelectorAll('.split-filter').forEach(function (el) {
      el.addEventListener('change', build);
    });
    domainFilter.addEventListener('change', build);
    colorMode.addEventListener('change', build);
    alphaEl.addEventListener('input', function () {
      alphaVal.textContent = parseFloat(alphaEl.value).toFixed(1);
      build();
    });
    modelSelect.addEventListener('change', function () {
      loadModel(modelSelect.value);
    });
  }

  function populateModelSelect() {
    modelSelect.innerHTML = '';
    var groups = [
      { role: 'instruct', label: 'Instruct' },
      { role: 'base', label: 'Base' },
    ];
    groups.forEach(function (g) {
      var og = document.createElement('optgroup');
      og.label = g.label;
      manifest.models.filter(function (m) { return m.role === g.role; }).forEach(function (m) {
        var opt = document.createElement('option');
        opt.value = m.key;
        opt.textContent = m.label + ' (L' + m.layer + ')' + (m.ready ? '' : ' — pending');
        opt.disabled = !m.ready;
        og.appendChild(opt);
      });
      modelSelect.appendChild(og);
    });
    var def = manifest.models.find(function (m) { return m.key === manifest.default && m.ready; })
      || manifest.models.find(function (m) { return m.ready; });
    if (def) modelSelect.value = def.key;
  }

  function loadModel(key) {
    var entry = manifest.models.find(function (m) { return m.key === key; });
    if (!entry || !entry.ready) {
      aboutEl.textContent = 'PCA for this model is not ready yet.';
      return;
    }
    aboutEl.textContent = 'Loading ' + entry.label + '…';
    fetch('./static/data/' + entry.file)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (json) {
        data = json;
        fillDomainOptions();
        updateAbout();
        build();
      })
      .catch(function (err) {
        aboutEl.textContent = 'Failed to load model: ' + err.message;
      });
  }

  fetch(MANIFEST_URL)
    .then(function (r) {
      if (!r.ok) throw new Error('Missing pca_manifest.json');
      return r.json();
    })
    .then(function (json) {
      manifest = json;
      populateModelSelect();
      updateExportStatus();
      wireControls();
      if (modelSelect.value) loadModel(modelSelect.value);
      else aboutEl.textContent = 'No exported models yet. Run export_pca_explorer.py --all_instruct';
    })
    .catch(function (err) {
      aboutEl.textContent = 'Could not load model list: ' + err.message;
    });
})();
