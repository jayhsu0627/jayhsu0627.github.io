(function () {
  var copyBtn = document.getElementById('copy-bibtex');
  var bibtex = document.getElementById('bibtex');
  if (copyBtn && bibtex) {
    copyBtn.addEventListener('click', function () {
      navigator.clipboard.writeText(bibtex.textContent).then(function () {
        copyBtn.textContent = 'Copied';
        setTimeout(function () {
          copyBtn.textContent = 'Copy';
        }, 1500);
      });
    });
  }

  var burgers = document.querySelectorAll('.navbar-burger');
  burgers.forEach(function (burger) {
    burger.addEventListener('click', function () {
      var target = document.getElementById(burger.dataset.target);
      burger.classList.toggle('is-active');
      if (target) target.classList.toggle('is-active');
    });
  });

  // ExDark qualitative browser
  var samples = [
    { id: '2015_02344', label: 'People / street' },
    { id: '2015_00249', label: 'Indoor scene' },
    { id: '2015_03884', label: 'Vehicle' },
    { id: '2015_00461', label: 'Low-light object' },
    { id: '2015_05647', label: 'Cluttered scene' }
  ];
  var sampleSelect = document.getElementById('exdark-sample');
  var panels = {
    org: document.getElementById('exdark-org'),
    mamba: document.getElementById('exdark-mamba'),
    our: document.getElementById('exdark-our')
  };

  function setExdark(id) {
    if (!panels.org) return;
    panels.org.src = './static/images/exdark/' + id + '_org_inset.jpg';
    panels.mamba.src = './static/images/exdark/' + id + '_mamba_inset.jpg';
    panels.our.src = './static/images/exdark/' + id + '_our_inset.jpg';
  }

  if (sampleSelect) {
    samples.forEach(function (s, i) {
      var opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.label;
      if (i === 0) opt.selected = true;
      sampleSelect.appendChild(opt);
    });
    sampleSelect.addEventListener('change', function () {
      setExdark(sampleSelect.value);
    });
    setExdark(samples[0].id);
  }

  // CARLA condition tabs
  var carlaTabs = document.querySelectorAll('[data-carla]');
  var carlaRaw = document.getElementById('carla-raw');
  var carlaRelit = document.getElementById('carla-relit');
  var carlaLabel = document.getElementById('carla-label');
  var carlaMap = {
    night: {
      raw: './static/images/carla/night_progress_020p_raw_frame_000477.png',
      relit: './static/images/carla/night_progress_020p_relit_frame_000477.png',
      label: 'Night (22:00) — raw sensor vs. generative neural sensor'
    },
    sunset: {
      raw: './static/images/carla/sunset_progress_020p_raw_frame_000450.png',
      relit: './static/images/carla/sunset_progress_020p_relit_frame_000450.png',
      label: 'Sunset (18:00) — raw sensor vs. generative neural sensor'
    },
    day: {
      raw: './static/images/carla/day_progress_020p_raw_frame_000439.png',
      relit: './static/images/carla/day_progress_020p_relit_frame_000439.png',
      label: 'Day (12:00) — oracle lighting (relighting optional)'
    }
  };

  function setCarla(key) {
    var entry = carlaMap[key];
    if (!entry || !carlaRaw) return;
    carlaRaw.src = entry.raw;
    carlaRelit.src = entry.relit;
    if (carlaLabel) carlaLabel.textContent = entry.label;
    carlaTabs.forEach(function (btn) {
      btn.classList.toggle('is-active', btn.dataset.carla === key);
    });
  }

  carlaTabs.forEach(function (btn) {
    btn.addEventListener('click', function () {
      setCarla(btn.dataset.carla);
    });
  });
  setCarla('night');
})();
