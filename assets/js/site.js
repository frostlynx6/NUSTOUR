(() => {
  function initLangSelect() {
    const sel = document.getElementById('langSelect');
    if (!sel) return;
    sel.value = NUSI18N.getLang();
    sel.addEventListener('change', () => {
      NUSI18N.setLang(sel.value);
      NUSI18N.apply();
    });
  }

  function initHamburger() {
    const btn = document.getElementById('navToggle');
    const nav = document.getElementById('siteNav');
    if (!btn || !nav) return;
    btn.addEventListener('click', () => {
      nav.classList.toggle('open');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initLangSelect();
    initHamburger();
    if (window.NUSI18N) NUSI18N.apply();
  });
})();
