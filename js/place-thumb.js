// Tiny interactive r/place logo for the homepage project card.
(() => {
  const O = '#ff4500', W = '#ffffff', B = '#1a1a1b';
  // White field, orange border, black center — place "r" counter
  const LOGO = [
    [O, O, O, O, W],
    [O, W, W, W, O],
    [O, W, B, W, O],
    [O, W, W, W, O],
    [O, W, O, O, O],
  ];
  const PAL = ['#3690EA','#00A368','#FFD635','#B44AC0','#FF99AA','#7EED56','#51E9F4','#FFA800','#BE0039','#FFFFFF'];

  function boot(canvas) {
    const N = 5, S = canvas.width / N;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const cells = Array.from({ length: N * N }, () => null);
    const order = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      order.push({ x, y, c: LOGO[y][x] });
    }
    for (let i = order.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [order[i], order[j]] = [order[j], order[i]];
    }

    let placed = 0, hover = false, t0 = performance.now();
    const href = canvas.dataset.href || '/projects/place-2022/';

    function paint() {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const c = cells[y * N + x];
        if (!c) continue;
        ctx.fillStyle = c;
        ctx.fillRect(x * S, y * S, S, S);
      }
    }

    function tick(now) {
      const speed = hover ? 28 : 9;
      const target = Math.min(order.length, Math.floor((now - t0) / 1000 * speed));
      while (placed < target) {
        const p = order[placed++];
        cells[p.y * N + p.x] = p.c;
      }
      if (hover && Math.random() < 0.35) {
        const x = (Math.random() * N) | 0, y = (Math.random() * N) | 0;
        cells[y * N + x] = PAL[(Math.random() * PAL.length) | 0];
      }
      if (placed >= order.length && Math.random() < (hover ? 0.08 : 0.02)) {
        const p = order[(Math.random() * order.length) | 0];
        cells[p.y * N + p.x] = p.c;
      }
      paint();
      requestAnimationFrame(tick);
    }

    canvas.addEventListener('pointerenter', () => { hover = true; });
    canvas.addEventListener('pointerleave', () => {
      hover = false;
      for (const p of order) cells[p.y * N + p.x] = p.c;
    });
    canvas.addEventListener('click', () => { location.href = href; });
    canvas.title = 'Open interactive timelapse';
    paint(); // white field immediately
    requestAnimationFrame(tick);
  }

  document.querySelectorAll('canvas.place-thumb').forEach(boot);
})();
