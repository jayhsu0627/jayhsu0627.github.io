(function () {
  // Only individual blog posts — not /blog/ index, not homepage.
  if (!document.body.classList.contains('is-blog-post')) return;

  function isLightboxable(img) {
    if (!img || img.tagName !== 'IMG') return false;
    if (img.hasAttribute('data-no-lightbox')) return false;
    if (img.closest('#img-lightbox')) return false;
    // In-post <figure> only (excludes banner markdown images).
    if (!img.closest('.post-content figure')) return false;
    return true;
  }

  function markImages() {
    var imgs = document.querySelectorAll('.post-content figure img');
    for (var i = 0; i < imgs.length; i++) {
      var img = imgs[i];
      if (!isLightboxable(img)) continue;
      img.classList.add('lightboxable');
      img.style.cursor = 'zoom-in';
      img.title = img.title || 'Click to enlarge';
    }
  }

  function init() {
    if (document.getElementById('img-lightbox')) return;

    var overlay = document.createElement('div');
    overlay.id = 'img-lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Enlarged image');
    overlay.innerHTML =
      '<img alt="">' +
      '<button type="button" class="img-lightbox-close" aria-label="Close">&times;</button>';
    document.body.appendChild(overlay);

    var big = overlay.querySelector('img');
    var closeBtn = overlay.querySelector('.img-lightbox-close');

    function open(src, alt) {
      big.src = src;
      big.alt = alt || '';
      overlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }

    function close() {
      overlay.classList.remove('is-open');
      document.body.style.overflow = '';
      big.removeAttribute('src');
    }

    markImages();

    document.addEventListener('click', function (e) {
      var img = e.target.closest('img');
      if (!img || !isLightboxable(img)) return;
      e.preventDefault();
      e.stopPropagation();
      open(img.currentSrc || img.src, img.alt);
    });

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay || e.target === closeBtn) close();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
