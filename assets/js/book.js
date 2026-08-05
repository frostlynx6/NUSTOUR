(() => {
  const CAPACITY = 20;
  const SLOT_START = 9; // 9am
  const SLOT_END = 16; // 4pm inclusive as a start hour

  const slotsEl = document.getElementById('slots');
  const calGrid = document.getElementById('calGrid');
  const calPrevBtn = document.getElementById('calPrevBtn');
  const calNextBtn = document.getElementById('calNextBtn');
  const calMonthLabel = document.getElementById('calMonthLabel');
  const selectedDateLabel = document.getElementById('selectedDateLabel');
  const dayTpl = document.getElementById('slot-day-tpl');
  const itemTpl = document.getElementById('slot-item-tpl');

  // Dialogs & forms
  const reserveDialog = document.getElementById('reserveDialog');
  const reserveForm = document.getElementById('reserveForm');
  const cancelReserveBtn = document.getElementById('cancelReserve');
  const resvDate = document.getElementById('resvDate');
  const resvTime = document.getElementById('resvTime');
  const resvAdults = document.getElementById('resvAdults');
  const resvChildren = document.getElementById('resvChildren');
  const resvEmail = document.getElementById('resvEmail');
  const resvName = document.getElementById('resvName');

  const uploadDialog = document.getElementById('uploadDialog');
  const uploadForm = document.getElementById('uploadForm');
  const backToReserveBtn = document.getElementById('backToReserve');
  const uploadInput = document.getElementById('proof');
  const uploadStatus = document.getElementById('uploadStatus');

  // Time picker dialog
  const dateTimesDialog = document.getElementById('dateTimesDialog');
  const dateTimesTitle = document.getElementById('dateTimesTitle');
  const dateTimesGrid = document.getElementById('dateTimesGrid');

  let pendingSelection = null; // { dateISO, hour, adults, children, name, email }
  let latestSummary = { days: {}, lockedDates: [] };
  let viewMonth = null; // first day of current month in calendar view

  function isWeekday(d) {
    const wd = d.getDay(); // 0 Sun - 6 Sat
    return wd >= 1 && wd <= 5;
  }
  function fmtDateISO(d) {
    // Local-date ISO (no timezone shifting)
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${da}`;
  }
  function localDateFromISO(dateISO) {
    const [y, m, da] = dateISO.split('-').map(Number);
    return new Date(y, (m || 1) - 1, da || 1);
  }
  function fmtDayTitle(d) {
    return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  }
  function fmtTimeLabel(h) {
    const dt = new Date(); dt.setHours(h, 0, 0, 0);
    return dt.toLocaleTimeString(undefined, { hour: 'numeric' });
  }
  function nextWeekday(from = new Date()) {
    const d = new Date(from);
    d.setDate(d.getDate() + 1);
    while (!isWeekday(d)) d.setDate(d.getDate() + 1);
    return d;
  }

  function times() {
    const arr = [];
    for (let h = SLOT_START; h <= SLOT_END; h++) arr.push(h);
    return arr;
  }

  function slotStatsFromSummary(dateISO, hour) {
    const d = latestSummary.days?.[dateISO] || {};
    const s = d[hour] || { reserved: 0, confirmed: 0, confirmedAE: 0 };
    const available = Math.max(0, CAPACITY - s.reserved - s.confirmed);
    const neededAE = Math.max(0, 5 - Math.floor(s.confirmedAE || 0));
    return { ...s, available, neededAE };
  }

  async function fetchSummary(startDate, endDate) {
    const start = fmtDateISO(startDate);
    const end = fmtDateISO(endDate);
    const res = await fetch(`/api/slots?start=${start}&end=${end}`);
    if (!res.ok) throw new Error('Failed to fetch slots');
    latestSummary = await res.json();
  }

  async function fetchSummaryForMonth(monthDate) {
    const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const last = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    await fetchSummary(first, last);
  }

  function computeDayStatusMap() {
    const map = {};
    const days = latestSummary.days || {};
    for (const dateISO of Object.keys(days)) {
      const hours = days[dateISO] || {};
      let hasGrey = false, hasOrange = false, hasRed = false;
      for (const h of Object.keys(hours)) {
        const s = hours[h] || {};
        const total = (s.reserved || 0) + (s.confirmed || 0);
        const confirmedAE = s.confirmedAE || 0;
        if (total >= CAPACITY) { hasRed = true; break; }
        if (confirmedAE >= 5) { hasOrange = true; }
        else if (total > 0) { hasGrey = true; }
      }
      if (hasRed) map[dateISO] = 'red';
      else if (hasOrange) map[dateISO] = 'orange';
      else if (hasGrey) map[dateISO] = 'grey';
    }
    return map;
  }

  async function render() {
    slotsEl.innerHTML = '';
    if (selectedDateLabel) selectedDateLabel.textContent = '';
    const day = nextWeekday();
    const dayISO = fmtDateISO(day);
    addDayBlock(day);

    // Also render any future days that have bookings per server summary
    const futureDates = Object.keys(latestSummary.days || {})
      .filter(d => d > dayISO)
      .sort();
    for (const d of futureDates) {
      const dt = localDateFromISO(d);
      addDayBlock(dt);
    }
  }

  function addDayBlock(dateObj) {
    const node = dayTpl.content.cloneNode(true);
    const sec = node.querySelector('section.day-block');
    const grid = node.querySelector('.grid');
    node.querySelector('.day-title').textContent = fmtDayTitle(dateObj);
    const dateISO = fmtDateISO(dateObj);
    if (sec) sec.dataset.date = dateISO;

    for (const h of times()) {
      const item = itemTpl.content.cloneNode(true);
      const timeLabel = item.querySelector('.time');
      timeLabel.textContent = fmtTimeLabel(h);
      const barConfirmed = item.querySelector('.bar .seg.confirmed');
      const barReserved = item.querySelector('.bar .seg.reserved');
      const barAvail = item.querySelector('.bar .seg.available');
      const statConfirmed = item.querySelector('.confirmed-stat');
      const statReserved = item.querySelector('.reserved-stat');
      const statAvailable = item.querySelector('.available-stat');
      const neededEl = item.querySelector('.needed');
      const reserveBtn = item.querySelector('.reserve-btn');

      const st = slotStatsFromSummary(dateISO, h);
      const pctConfirmed = (st.confirmed / CAPACITY) * 100;
      const pctReserved = (st.reserved / CAPACITY) * 100;
      const pctAvail = 100 - pctConfirmed - pctReserved;
      barConfirmed.style.width = pctConfirmed + '%';
      barReserved.style.width = pctReserved + '%';
      barAvail.style.width = pctAvail + '%';
      statConfirmed.textContent = (window.NUSI18N?.t('stats.confirmed', { n: st.confirmed })) || `Confirmed: ${st.confirmed}`;
      statReserved.textContent = (window.NUSI18N?.t('stats.reserved', { n: st.reserved })) || `Reserved: ${st.reserved}`;
      statAvailable.textContent = (window.NUSI18N?.t('stats.available', { n: st.available })) || `Available: ${st.available}`;
      neededEl.textContent = String(st.neededAE);

      const isLocked = latestSummary.lockedDates?.includes?.(dateISO);
      const isWeekend = !isWeekday(localDateFromISO(dateISO));
      const atCapacity = st.available <= 0;
      if (isLocked || isWeekend) {
        reserveBtn.disabled = true;
        reserveBtn.textContent = isLocked ? (window.NUSI18N?.t('status.locked') || 'Locked') : (window.NUSI18N?.t('status.weekend') || 'Weekend');
      } else if (atCapacity) {
        reserveBtn.disabled = true;
        reserveBtn.textContent = (window.NUSI18N?.t('status.full') || 'Full');
      } else {
        reserveBtn.addEventListener('click', () => openReserve(dateISO, h, st));
      }
      grid.appendChild(item);
    }

    // Replace existing block for same date to avoid duplicates
    slotsEl.querySelector(`.day-block[data-date="${dateISO}"]`)?.remove();
    slotsEl.appendChild(node);
  }

  function openReserve(dateISO, hour, st) {
    resvDate.value = dateISO;
    resvTime.value = fmtTimeLabel(hour);
    resvAdults.value = '1';
    resvChildren.value = '0';
    resvEmail.value = '';
    resvName.value = '';
    pendingSelection = { dateISO, hour };
    reserveDialog.showModal();
  }

  function closeReserve() { reserveDialog.close(); }
  function closeUpload() { uploadDialog.close(); }

  cancelReserveBtn.addEventListener('click', closeReserve);
  backToReserveBtn.addEventListener('click', () => { closeUpload(); reserveDialog.showModal(); });

  reserveForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!pendingSelection) return;
    const adults = Number(resvAdults.value || 0);
    const children = Number(resvChildren.value || 0);
    const name = resvName.value.trim();
    const email = resvEmail.value.trim();

    if (!name || !email) return;
    if (adults < 1) { alert((window.NUSI18N?.t('alerts.adultRequired')) || 'At least 1 Adult is required to be present.'); return; }

    // Capacity check against current server summary
    const st = slotStatsFromSummary(pendingSelection.dateISO, pendingSelection.hour);
    const needed = CAPACITY - (st.confirmed + st.reserved);
    const pax = adults + children;
    if (pax > needed) { alert((window.NUSI18N?.t('alerts.onlyLeft', { n: needed })) || `Only ${needed} slots left for this time.`); return; }

    pendingSelection = { ...pendingSelection, adults, children, name, email };
    closeReserve();
    uploadStatus.textContent = '';
    uploadInput.value = '';
    uploadDialog.showModal();
    // Build receipt (confirmation fee $5 per person)
    const pricePer = 5;
    const paxAdults = adults;
    const paxChildren = children;
    const subtotal = (paxAdults + paxChildren) * pricePer;
    const rc = document.getElementById('receipt');
    if (rc) {
      rc.innerHTML = '';
      const add = (label, val) => { const span = document.createElement('span'); span.textContent = `${label}: ${val}`; rc.appendChild(span); };
      add((window.NUSI18N?.t('receipt.adults')) || 'Adults', `${paxAdults} × $${pricePer} = $${paxAdults*pricePer}`);
      add((window.NUSI18N?.t('receipt.children')) || 'Children', `${paxChildren} × $${pricePer} = $${paxChildren*pricePer}`);
      add((window.NUSI18N?.t('receipt.subtotal')) || 'Subtotal', `$${subtotal}`);
      add((window.NUSI18N?.t('receipt.total')) || 'Total', `$${subtotal}`);
    }
  });

  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!pendingSelection) return;
    const file = uploadInput.files && uploadInput.files[0];
    if (!file) { alert((window.NUSI18N?.t('alerts.uploadProof')) || 'Please upload a payment proof.'); return; }

    uploadStatus.textContent = (window.NUSI18N?.t('status.submitting')) || 'Submitting...';
    try {
      const base64 = await fileToBase64(file);
      const payload = {
        date: pendingSelection.dateISO,
        timeHour: pendingSelection.hour,
        adults: pendingSelection.adults,
        children: pendingSelection.children,
        name: pendingSelection.name,
        email: pendingSelection.email,
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        base64File: base64,
      };
      const resp = await fetch('/api/submit-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error('Submission failed');
      const data = await resp.json();

      // data.ok is always true in dev; use data.persisted to know if server storage worked

      // Optimistic update in case server summary is empty
      try {
        const r = data.record || {};
        const iso = r.dateISO || pendingSelection.dateISO;
        const hr = r.hour ?? pendingSelection.hour;
        const add = (Number(r.adults||0) + Number(r.children||0)) || ((pendingSelection.adults||0)+(pendingSelection.children||0));
        latestSummary.days = latestSummary.days || {};
        latestSummary.days[iso] = latestSummary.days[iso] || {};
        const cur = latestSummary.days[iso][hr] || { reserved: 0, confirmed: 0, confirmedAE: 0 };
        latestSummary.days[iso][hr] = { ...cur, reserved: (cur.reserved||0) + add };
      } catch (_) {}

      // Refresh from server and re-render (authoritative)
      if (data.persisted) {
        try { await primeSummary(); } catch (_) {}
      }
      await render();

      uploadStatus.textContent = (window.NUSI18N?.t('status.submitted')) || 'Submitted! Your slot is reserved for 48 hours pending verification.';
      setTimeout(() => closeUpload(), 1200);
    } catch (err) {
      console.error(err);
      uploadStatus.textContent = (window.NUSI18N?.t('status.error')) || 'Error submitting proof. Please try again.';
    }
  });

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const res = String(reader.result || '');
        const base64 = res.includes(',') ? res.split(',')[1] : res;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function buildCalendar() {
    calGrid.innerHTML = '';
    const today = new Date();
    if (!viewMonth) viewMonth = new Date(nextWeekday(today).getFullYear(), nextWeekday(today).getMonth(), 1);
    const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const last = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);
    const days = [];
    const mondayIndex = ((first.getDay() + 6) % 7);
    for (let i = 0; i < mondayIndex; i++) {
      const blank = document.createElement('div');
      blank.className = 'cal-day disabled blank';
      calGrid.appendChild(blank);
    }
    for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) days.push(new Date(d));
    const bookedDates = new Set(Object.keys(latestSummary.days || {}));
    const lockedDates = new Set(latestSummary.lockedDates || []);
    const statusMap = computeDayStatusMap();
    const allowStart = nextWeekday(new Date());
    const allowEnd = new Date(allowStart); allowEnd.setDate(allowStart.getDate() + 20);

    for (const d of days) {
      const div = document.createElement('div');
      const iso = fmtDateISO(d);
      div.className = 'cal-day';
      div.setAttribute('role', 'button');
      div.setAttribute('tabindex', '0');
      div.textContent = d.getDate();
      const isWk = isWeekday(d);
      const inRange = d >= allowStart && d <= allowEnd;
      if (!isWk || !inRange) div.classList.add('disabled');
      if (bookedDates.has(iso)) div.classList.add('has-bookings');
      if (lockedDates.has(iso)) div.classList.add('locked');
      const status = statusMap[iso];
      if (status) {
        const dot = document.createElement('span');
        dot.className = `cal-dot cal-dot-${status}`;
        dot.title = status === 'red' ? 'Some slot is full' : status === 'orange' ? 'A slot has enough to start' : 'Some reservations exist';
        div.appendChild(dot);
      }
      if (isWk && inRange && !lockedDates.has(iso)) {
        div.addEventListener('click', async () => {
          document.querySelectorAll('.cal-day.selected').forEach(e => e.classList.remove('selected'));
          div.classList.add('selected');
          await openTimePicker(iso);
          if (selectedDateLabel) {
            const lab = localDateFromISO(iso).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
            selectedDateLabel.textContent = `${(window.NUSI18N?.t('selected.prefix')) || 'Selected:'} ${lab}`;
          }
        });
        div.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); div.click(); }
        });
      }
      calGrid.appendChild(div);
    }
    if (calMonthLabel) calMonthLabel.textContent = first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }

  function addOrReplaceDay(dateISO) {
    // Remove existing block for this date if any, then add and scroll into view
    slotsEl.querySelector(`.day-block[data-date="${dateISO}"]`)?.remove();
    addDayBlock(localDateFromISO(dateISO));
    slotsEl.querySelector(`.day-block[data-date="${dateISO}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  calPrevBtn?.addEventListener('click', async () => {
    if (!viewMonth) return;
    viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1);
    try { await fetchSummaryForMonth(viewMonth); } catch {}
    buildCalendar();
  });
  calNextBtn?.addEventListener('click', async () => {
    if (!viewMonth) return;
    viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
    try { await fetchSummaryForMonth(viewMonth); } catch {}
    buildCalendar();
  });

  async function openTimePicker(dateISO) {
    // Get fresh summary for the selected day only
    try {
      const res = await fetch(`/api/slots?start=${dateISO}&end=${dateISO}`);
      if (res.ok) {
        const data = await res.json();
        // Merge into latestSummary.days
        if (data.days && Object.keys(data.days).length) {
          latestSummary.days[dateISO] = data.days[dateISO];
        } else {
          // Ensure an empty entry to show zeroed times
          latestSummary.days[dateISO] = latestSummary.days[dateISO] || {};
        }
      }
    } catch (_) {}

    const tpTitle = (window.NUSI18N?.t('timepicker.title')) || 'Choose a Time';
    dateTimesTitle.textContent = `${tpTitle} — ${localDateFromISO(dateISO).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}`;
    dateTimesGrid.innerHTML = '';
    const isLocked = latestSummary.lockedDates?.includes?.(dateISO);
    const isWeekend = !isWeekday(localDateFromISO(dateISO));
    for (const h of times()) {
      const item = itemTpl.content.cloneNode(true);
      const timeLabel = item.querySelector('.time');
      timeLabel.textContent = fmtTimeLabel(h);
      const barConfirmed = item.querySelector('.bar .seg.confirmed');
      const barReserved = item.querySelector('.bar .seg.reserved');
      const barAvail = item.querySelector('.bar .seg.available');
      const statConfirmed = item.querySelector('.confirmed-stat');
      const statReserved = item.querySelector('.reserved-stat');
      const statAvailable = item.querySelector('.available-stat');
      const neededEl = item.querySelector('.needed');
      const reserveBtn = item.querySelector('.reserve-btn');

      const st = slotStatsFromSummary(dateISO, h);
      const pctConfirmed = (st.confirmed / CAPACITY) * 100;
      const pctReserved = (st.reserved / CAPACITY) * 100;
      const pctAvail = 100 - pctConfirmed - pctReserved;
      barConfirmed.style.width = pctConfirmed + '%';
      barReserved.style.width = pctReserved + '%';
      barAvail.style.width = pctAvail + '%';
      statConfirmed.textContent = (window.NUSI18N?.t('stats.confirmed', { n: st.confirmed })) || `Confirmed: ${st.confirmed}`;
      statReserved.textContent = (window.NUSI18N?.t('stats.reserved', { n: st.reserved })) || `Reserved: ${st.reserved}`;
      statAvailable.textContent = (window.NUSI18N?.t('stats.available', { n: st.available })) || `Available: ${st.available}`;
      neededEl.textContent = String(st.neededAE);

      const atCapacity = st.available <= 0;
      if (isLocked || isWeekend) {
        reserveBtn.disabled = true;
        reserveBtn.textContent = isLocked ? (window.NUSI18N?.t('status.locked') || 'Locked') : (window.NUSI18N?.t('status.weekend') || 'Weekend');
      } else if (atCapacity) {
        reserveBtn.disabled = true;
        reserveBtn.textContent = (window.NUSI18N?.t('status.full') || 'Full');
      } else {
        reserveBtn.addEventListener('click', () => {
          pendingSelection = { dateISO, hour: h };
          dateTimesDialog.close();
          openReserve(dateISO, h, st);
        });
      }
      dateTimesGrid.appendChild(item);
    }
    dateTimesDialog.showModal();
  }

  async function primeSummary() {
    const start = nextWeekday();
    const end = new Date(start);
    end.setDate(end.getDate() + 20);
    await fetchSummary(start, end);
  }

  // Initial load
  (async () => {
    try {
      await primeSummary();
    } catch (_) { /* ignore, local-only fallback not implemented now */ }
    buildCalendar();
    await render();
  })();
})();
