(() => {
  async function validateKey(key) {
    try {
      const resp = await fetch(`/api/admin?ping=1`, { headers: { 'X-Admin-Key': key || '' } });
      return resp.ok;
    } catch { return false; }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('adminLoginForm');
    const pwd = document.getElementById('adminPwd');
    const toggle = document.getElementById('togglePwd');
    const status = document.getElementById('loginStatus');
    const btn = document.getElementById('signInBtn');

    toggle?.addEventListener('click', () => {
      if (!pwd) return;
      pwd.type = pwd.type === 'password' ? 'text' : 'password';
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!pwd || !pwd.value.trim()) return;
      btn.disabled = true; status.textContent = '';
      const key = pwd.value.trim();
      const ok = await validateKey(key);
      if (!ok) {
        status.textContent = (window.NUSI18N?.t('admin.login.badKey')) || 'Invalid admin key. Please try again.';
        btn.disabled = false; return;
      }
      sessionStorage.setItem('nustourAdminKey', key);
      window.location.href = '/admin.html';
    });

    // Apply i18n now that DOM is ready
    if (window.NUSI18N) window.NUSI18N.apply();
  });
})();
