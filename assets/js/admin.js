(() => {
  const adminCalGrid = document.getElementById('adminCalGrid');
  const slotList = document.getElementById('slotList');
  const selDateText = document.getElementById('selDateText');
  const adminKeyInput = document.getElementById('adminKey');
  const saveKeyBtn = document.getElementById('saveKey');
  const adminStatus = document.getElementById('adminStatus');

  const SLOT_START = 9, SLOT_END = 16;
  let adminKey = sessionStorage.getItem('nustourAdminKey') || '';
  let locked = new Set();
  let selectedDateISO = null;

  if (adminKey) adminKeyInput.value = adminKey;
  saveKeyBtn.addEventListener('click', () => {
    adminKey = adminKeyInput.value.trim();
    if (!adminKey) return alert('Enter an Admin Key');
    sessionStorage.setItem('nustourAdminKey', adminKey);
    alert((window.NUSI18N?.t('admin.keySaved')) || 'Admin key saved for this session.');
  });

  function isWeekday(d) { const wd = d.getDay(); return wd >= 1 && wd <= 5; }
  function fmtDateISO(d) { return d.toISOString().slice(0,10); }
  function nextWeekday(from = new Date()) { const d = new Date(from); d.setDate(d.getDate() + 1); while (!isWeekday(d)) d.setDate(d.getDate() + 1); return d; }

  async function refreshLocked() {
    // Use slots endpoint to get lockedDates quickly
    const start = nextWeekday();
    const end = new Date(start); end.setDate(end.getDate() + 20);
    const res = await fetch(`/api/slots?start=${fmtDateISO(start)}&end=${fmtDateISO(end)}`);
    const data = await res.json();
    locked = new Set(data.lockedDates || []);
  }

  async function toggleLock(dateISO) {
    if (!adminKey) return alert('Set Admin Key first.');
    const action = locked.has(dateISO) ? 'unlockDate' : 'lockDate';
    const resp = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey },
      body: JSON.stringify({ action, date: dateISO })
    });
    if (!resp.ok) { alert((window.NUSI18N?.t('admin.failedToggle')) || 'Failed to toggle lock'); return; }
    await refreshLocked();
    buildCalendar();
    if (adminStatus) adminStatus.textContent = `${dateISO} ${locked.has(dateISO) ? 'locked' : 'unlocked'}`;
  }

  function buildCalendar() {
    adminCalGrid.innerHTML = '';
    const start = nextWeekday();
    for (let i = 0; i < 21; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const iso = fmtDateISO(d);
      const div = document.createElement('div');
      div.className = 'cal-day';
      div.textContent = d.getDate();
      const isWk = isWeekday(d);
      if (!isWk) div.classList.add('disabled');
      if (locked.has(iso)) div.classList.add('locked');
      if (isWk) {
        div.addEventListener('click', () => toggleLock(iso));
        div.addEventListener('dblclick', () => loadReservations(iso));
      }
      adminCalGrid.appendChild(div);
    }
  }

  async function loadReservations(dateISO) {
    selectedDateISO = dateISO;
    selDateText.textContent = new Date(dateISO + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
    slotList.innerHTML = '';
    const url = `/api/admin?date=${dateISO}`;
    const resp = await fetch(url, { headers: { 'X-Admin-Key': adminKey || '' } });
    if (!resp.ok) { slotList.textContent = (window.NUSI18N?.t('admin.failedLoad')) || 'Failed to load.'; return; }
    const data = await resp.json();
    const hours = data.hours || {};
    for (let h = SLOT_START; h <= SLOT_END; h++) {
      const row = hours[h];
      const card = document.createElement('div');
      card.className = 'slot-card';
      const time = new Date(); time.setHours(h,0,0,0);
      card.innerHTML = `<h4>${time.toLocaleTimeString(undefined,{hour:'numeric'})}</h4>`;
      const list = document.createElement('div');
      if (!row) { list.textContent = (window.NUSI18N?.t('admin.noReservations')) || 'No reservations.'; }
      else {
        for (const r of row.reservations) {
          const item = document.createElement('div');
          item.className = 'res-item';
          const tag = `<span class="tag ${r.status}">${r.status.toUpperCase()}</span>`;
          const btnConfirm = (window.NUSI18N?.t('admin.confirm')) || 'Confirm';
          const btnDelete = (window.NUSI18N?.t('admin.delete')) || 'Delete';
          item.innerHTML = `
            <div>${tag} ${r.name} — ${r.email} · A:${r.adults} C:${r.children}</div>
            <button class="button sm" data-act="confirm">${btnConfirm}</button>
            <button class="button sm ghost" data-act="delete">${btnDelete}</button>
          `;
          const confirmBtn = item.querySelector('[data-act="confirm"]');
          const deleteBtn = item.querySelector('[data-act="delete"]');
          if (r.status === 'confirmed') confirmBtn.disabled = true;
          confirmBtn.addEventListener('click', () => mutate('confirmReservation', dateISO, h, r.id));
          deleteBtn.addEventListener('click', () => mutate('deleteReservation', dateISO, h, r.id));
          list.appendChild(item);
        }
      }
      card.appendChild(list);
      slotList.appendChild(card);
    }
  }

  async function mutate(action, date, hour, id) {
    if (!adminKey) return alert('Set Admin Key first.');
    const resp = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey },
      body: JSON.stringify({ action, date, hour, id })
    });
    if (!resp.ok) return alert((window.NUSI18N?.t('admin.failedAction')) || 'Failed');
    await loadReservations(selectedDateISO);
  }

  (async () => {
    try { await refreshLocked(); } catch {}
    buildCalendar();
  })();
})();
