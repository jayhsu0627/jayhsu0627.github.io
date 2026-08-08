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
})();
