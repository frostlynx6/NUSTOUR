(() => {
  const CAPACITY = 20;
  const SLOT_START = 9; // 9am
  const SLOT_END = 16; // 4pm inclusive as a start hour

  const slotsEl = document.getElementById('slots');
  const calGrid = document.getElementById('calGrid');
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

  let pendingSelection = null; // { dateISO, hour, adults, children, name, email }
  let latestSummary = { days: {}, lockedDates: [] };

  function isWeekday(d) {
    const wd = d.getDay(); // 0 Sun - 6 Sat
    return wd >= 1 && wd <= 5;
  }
  function fmtDateISO(d) {
    return d.toISOString().slice(0,10);
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

  async function render() {
    slotsEl.innerHTML = '';
    const day = nextWeekday();
    const dayISO = fmtDateISO(day);
    addDayBlock(day);

    // Also render any future days that have bookings per server summary
    const futureDates = Object.keys(latestSummary.days || {})
      .filter(d => d > dayISO)
      .sort();
    for (const d of futureDates) {
      const dt = new Date(d + 'T00:00:00');
      addDayBlock(dt);
    }
  }

  function addDayBlock(dateObj) {
    const node = dayTpl.content.cloneNode(true);
    const sec = node.querySelector('section.day-block');
    const grid = node.querySelector('.grid');
    node.querySelector('.day-title').textContent = fmtDayTitle(dateObj);
    const dateISO = fmtDateISO(dateObj);

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
      statConfirmed.textContent = `Confirmed: ${st.confirmed}`;
      statReserved.textContent = `Reserved: ${st.reserved}`;
      statAvailable.textContent = `Available: ${st.available}`;
      neededEl.textContent = String(st.neededAE);

      const isLocked = latestSummary.lockedDates?.includes?.(dateISO);
      const isWeekend = !isWeekday(new Date(dateISO + 'T00:00:00'));
      const atCapacity = st.available <= 0;
      if (isLocked || isWeekend) {
        reserveBtn.disabled = true;
        reserveBtn.textContent = isLocked ? 'Locked' : 'Weekend';
      } else if (atCapacity) {
        reserveBtn.disabled = true;
        reserveBtn.textContent = 'Full';
      } else {
        reserveBtn.addEventListener('click', () => openReserve(dateISO, h, st));
      }
      grid.appendChild(item);
    }

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
    if (adults < 1) { alert('At least 1 Adult is required to be present.'); return; }

    // Capacity check against current server summary
    const st = slotStatsFromSummary(pendingSelection.dateISO, pendingSelection.hour);
    const needed = CAPACITY - (st.confirmed + st.reserved);
    const pax = adults + children;
    if (pax > needed) { alert(`Only ${needed} slots left for this time.`); return; }

    pendingSelection = { ...pendingSelection, adults, children, name, email };
    closeReserve();
    uploadStatus.textContent = '';
    uploadInput.value = '';
    uploadDialog.showModal();
  });

  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!pendingSelection) return;
    const file = uploadInput.files && uploadInput.files[0];
    if (!file) { alert('Please upload a payment proof.'); return; }

    uploadStatus.textContent = 'Submitting...';
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

      // Refresh from server and re-render
      await primeSummary();
      await render();

      uploadStatus.textContent = 'Submitted! Your slot is reserved for 48 hours pending verification.';
      setTimeout(() => closeUpload(), 1200);
    } catch (err) {
      console.error(err);
      uploadStatus.textContent = 'Error submitting proof. Please try again.';
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
    const start = nextWeekday(today);
    const days = [];
    for (let i = 0; i < 21; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    const bookedDates = new Set(Object.keys(latestSummary.days || {}));
    const lockedDates = new Set(latestSummary.lockedDates || []);

    for (const d of days) {
      const div = document.createElement('div');
      const iso = fmtDateISO(d);
      div.className = 'cal-day';
      div.textContent = d.getDate();
      const isWk = isWeekday(d);
      if (!isWk) div.classList.add('disabled');
      if (bookedDates.has(iso)) div.classList.add('has-bookings');
      if (lockedDates.has(iso)) div.classList.add('locked');
      if (isWk && !lockedDates.has(iso)) {
        div.addEventListener('click', async () => {
          document.querySelectorAll('.cal-day.selected').forEach(e => e.classList.remove('selected'));
          div.classList.add('selected');
          // Add or replace a block for this date
          addOrReplaceDay(iso);
        });
      }
      calGrid.appendChild(div);
    }
  }

  function addOrReplaceDay(dateISO) {
    // Remove existing block for this date if any, then add
    const blocks = Array.from(slotsEl.querySelectorAll('.day-block'));
    for (const b of blocks) {
      const title = b.querySelector('.day-title')?.textContent || '';
      if (title.includes(new Date(dateISO + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric' }))) {
        b.remove();
      }
    }
    addDayBlock(new Date(dateISO + 'T00:00:00'));
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
