(() => {
  const adminCalGrid = document.getElementById('adminCalGrid');
  const slotList = document.getElementById('slotList');
  const selDateText = document.getElementById('selDateText');
  const adminKeyInput = document.getElementById('adminKey');
  const saveKeyBtn = document.getElementById('saveKey');
  const adminStatus = document.getElementById('adminStatus');

  const SLOT_START = 9, SLOT_END = 16;
  let adminKey = sessionStorage.getItem('nustourAdminKey') || '';
  try {
    if (!adminKey) {
      // Show fallback hint and redirect
      const fb = document.getElementById('adminFallback'); if (fb) fb.style.display = 'block';
      setTimeout(() => window.location.replace('/admin-login.html'), 0);
      return;
    } else {
      const fb = document.getElementById('adminFallback'); if (fb) fb.style.display = 'none';
    }
  } catch {}
  let locked = new Set();
  let selectedDateISO = null;
  let viewMonth = null;

  function ensureViewMonth() {
    if (!viewMonth) {
      const now = new Date();
      viewMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return viewMonth;
  }

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

  async function refreshLocked(monthDate) {
    // Fetch locked dates for visible month range (wider)
    const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const last = new Date(monthDate.getFullYear(), monthDate.getMonth()+1, 0);
    const res = await fetch(`/api/slots?start=${fmtDateISO(first)}&end=${fmtDateISO(last)}`);
    const data = await res.json();
    locked = new Set(data.lockedDates || []);
  }

  async function toggleLock(dateISO) {
    if (!adminKey) return alert('Set Admin Key first.');
    const isLocked = locked.has(dateISO);
    const action = isLocked ? 'unlockDate' : 'lockDate';
    const resp = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey },
      body: JSON.stringify({ action, date: dateISO })
    });
    if (!resp.ok) { alert((window.NUSI18N?.t('admin.failedToggle')) || 'Failed to toggle lock'); return; }
    await refreshLocked(ensureViewMonth());
    buildCalendar();
    await loadReservations(dateISO);
    if (adminStatus) adminStatus.textContent = `${dateISO} ${locked.has(dateISO) ? 'locked' : 'unlocked'}`;
  }

  function buildCalendar() {
    adminCalGrid.innerHTML = '';
    if (!viewMonth) viewMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const last = new Date(viewMonth.getFullYear(), viewMonth.getMonth()+1, 0);
    // alignment blanks (Mon-first)
    const mondayIndex = ((first.getDay() + 6) % 7);
    for (let i=0;i<mondayIndex;i++) {
      const blank = document.createElement('div'); blank.className = 'cal-day disabled blank'; adminCalGrid.appendChild(blank);
    }
    for (let d = new Date(first); d <= last; d.setDate(d.getDate()+1)) {
      const iso = fmtDateISO(d);
      const div = document.createElement('div');
      div.className = 'cal-day';
      div.textContent = d.getDate();
      const isWk = isWeekday(d);
      if (!isWk) div.classList.add('disabled');
      if (locked.has(iso)) div.classList.add('locked');
      if (isWk) {
        // Click to view info for the date
        div.addEventListener('click', () => loadReservations(iso));
      }
      adminCalGrid.appendChild(div);
    }
  }

  // Month navigation controls (added above calendar grid if not present)
  (function ensureMonthNav(){
    const cal = document.getElementById('adminCal');
    if (!cal) return;
    if (!document.getElementById('adminCalNav')) {
      const nav = document.createElement('div');
      nav.id = 'adminCalNav';
      nav.style.display = 'flex'; nav.style.justifyContent='space-between'; nav.style.alignItems='center'; nav.style.margin='8px 0';
      const prev = document.createElement('button'); prev.className='button sm'; prev.textContent='‹';
      const label = document.createElement('div'); label.id='adminCalMonthLabel'; label.className='hint';
      const next = document.createElement('button'); next.className='button sm'; next.textContent='›';
      nav.appendChild(prev); nav.appendChild(label); nav.appendChild(next);
      cal.appendChild(nav);
      prev.addEventListener('click', async ()=>{ const vm = ensureViewMonth(); viewMonth = new Date(vm.getFullYear(), vm.getMonth()-1, 1); await refreshLocked(viewMonth); buildCalendar(); updateMonthLabel(); });
      next.addEventListener('click', async ()=>{ const vm = ensureViewMonth(); viewMonth = new Date(vm.getFullYear(), vm.getMonth()+1, 1); await refreshLocked(viewMonth); buildCalendar(); updateMonthLabel(); });
      function updateMonthLabel(){ const vm = ensureViewMonth(); const first = new Date(vm.getFullYear(), vm.getMonth(), 1); label.textContent = first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }); }
      updateMonthLabel();
    }
  })();

  async function loadReservations(dateISO) {
    selectedDateISO = dateISO;
    selDateText.textContent = new Date(dateISO + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
    slotList.innerHTML = '';
    const url = `/api/admin?date=${dateISO}`;
    const resp = await fetch(url, { headers: { 'X-Admin-Key': adminKey || '' } });
    if (!resp.ok) { slotList.textContent = (window.NUSI18N?.t('admin.failedLoad')) || 'Failed to load.'; return; }
    const data = await resp.json();
    const isLocked = (data.lockedDates || []).includes(dateISO);
    // Day info header with lock button
    const infoBar = document.createElement('div');
    infoBar.style.display = 'flex'; infoBar.style.alignItems = 'center'; infoBar.style.gap='8px'; infoBar.style.margin='6px 0 12px';
    const lockBtn = document.createElement('button'); lockBtn.className = 'button sm'; lockBtn.textContent = isLocked ? 'Unlock Day' : 'Lock Day';
    lockBtn.addEventListener('click', () => toggleLock(dateISO));
    infoBar.appendChild(lockBtn);
    slotList.appendChild(infoBar);
    const hours = data.hours || {};
    for (let h = SLOT_START; h <= SLOT_END; h++) {
      const row = hours[h];
      const card = document.createElement('div');
      card.className = 'slot-card';
      const time = new Date(); time.setHours(h,0,0,0);
      const title = document.createElement('h4'); title.textContent = time.toLocaleTimeString(undefined,{hour:'numeric'});
      card.appendChild(title);
      const controls = document.createElement('div');
      controls.style.display='grid'; controls.style.gridTemplateColumns='repeat(5, max-content)'; controls.style.gap='8px'; controls.style.alignItems='center';
      const cLabel = document.createElement('label'); cLabel.textContent='Confirmed';
      const cInput = document.createElement('input'); cInput.type='number'; cInput.min='0'; cInput.max='20'; cInput.value= row? row.summary.confirmed : 0;
      const rLabel = document.createElement('label'); rLabel.textContent='Reserved';
      const rInput = document.createElement('input'); rInput.type='number'; rInput.min='0'; rInput.max='20'; rInput.value= row? row.summary.reserved : 0;
      const save = document.createElement('button'); save.className='button sm'; save.textContent='Save';
      save.addEventListener('click', async ()=>{
        const c = Number(cInput.value||0), r = Number(rInput.value||0);
        if (c<0 || r<0 || (c+r)>20) { alert('Counts invalid (sum must be ≤ 20).'); return; }
        const resp = await fetch('/api/admin', { method:'POST', headers:{ 'Content-Type':'application/json', 'X-Admin-Key': adminKey||'' }, body: JSON.stringify({ action:'setSlotCounts', date: dateISO, hour: h, confirmed: c, reserved: r })});
        if (!resp.ok) { alert((window.NUSI18N?.t('admin.failedAction')) || 'Failed'); return; }
        await loadReservations(dateISO);
      });
      controls.appendChild(cLabel); controls.appendChild(cInput); controls.appendChild(rLabel); controls.appendChild(rInput); controls.appendChild(save);
      card.appendChild(controls);

      // Existing reservation list (optional details)
      const list = document.createElement('div');
      if (!row) { list.textContent = (window.NUSI18N?.t('admin.noReservations')) || 'No reservations.'; }
      else {
        for (const r of row.reservations) {
          const item = document.createElement('div'); item.className='res-item';
          const tag = `<span class="tag ${r.status}">${r.status.toUpperCase()}</span>`;
          const btnConfirm = (window.NUSI18N?.t('admin.confirm')) || 'Confirm';
          const btnDelete = (window.NUSI18N?.t('admin.delete')) || 'Delete';
          item.innerHTML = `<div>${tag} ${r.name} — ${r.email} · A:${r.adults} C:${r.children}</div><button class="button sm" data-act="confirm">${btnConfirm}</button><button class="button sm ghost" data-act="delete">${btnDelete}</button>`;
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
    try { ensureViewMonth(); await refreshLocked(viewMonth); } catch {}
    buildCalendar();
  })();

  // Wipe-all button injection under calendar
  (function ensureWipeButton(){
    const wrap = document.querySelector('.locks'); if (!wrap) return;
    if (!document.getElementById('wipeAllBtn')){
      const btn = document.createElement('button'); btn.id='wipeAllBtn'; btn.className='button ghost'; btn.textContent='Wipe All Data'; btn.style.marginTop='8px';
      btn.addEventListener('click', async ()=>{
        if (!adminKey) return alert('Set Admin Key first.');
        const confirm1 = confirm('This will clear ALL reservations and locks. Proceed?');
        if (!confirm1) return;
        const resp = await fetch('/api/admin', { method:'POST', headers:{ 'Content-Type':'application/json', 'X-Admin-Key': adminKey }, body: JSON.stringify({ action:'wipeAll' })});
        if (!resp.ok) return alert((window.NUSI18N?.t('admin.failedAction')) || 'Failed');
        await refreshLocked(viewMonth);
        buildCalendar();
        slotList.innerHTML = '';
        if (adminStatus) adminStatus.textContent = 'All data wiped.';
      });
      wrap.appendChild(btn);
    }
  })();
})();
