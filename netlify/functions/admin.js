import { getLockedDates, setLockedDates, getReservations, putReservations, summarize, cleanupExpired, wipeAllReservations, deleteKey, slotKey } from './_lib/store.mjs';

export async function handler(event) {
  const cors = baseCors();
  if (event.httpMethod === 'OPTIONS') return ok('', cors);

  const adminKey = event.headers['x-admin-key'] || event.headers['X-Admin-Key'] || event.headers['x-admin-key'];
  if (!adminKey || adminKey !== (process.env.ADMIN_KEY || '')) {
    return err(401, 'Unauthorized', cors);
  }

  try {
    if (event.httpMethod === 'GET') {
      // List reservations for a specific date
      const url = new URL(event.rawUrl || `http://localhost${event.path}`);
      const ping = url.searchParams.get('ping');
      if (ping === '1') {
        return json({ ok: true }, cors);
      }
      const date = url.searchParams.get('date');
      if (!date) return err(400, 'date required (YYYY-MM-DD)', cors);
      const out = {};
      for (let h = 9; h <= 16; h++) {
        const list = await cleanupExpired(date, h);
        if (list.length) out[h] = { reservations: list, summary: summarize(list) };
      }
      const lockedDates = await getLockedDates();
      return json({ date, hours: out, lockedDates }, cors);
    }

    // POST for mutations
    if (event.httpMethod !== 'POST') return err(405, 'Method Not Allowed', cors);
    const body = JSON.parse(event.body || '{}');
    const action = body.action;

    if (action === 'lockDate' || action === 'unlockDate') {
      const { date } = body;
      if (!date) return err(400, 'date required', cors);
      const dates = await getLockedDates();
      if (action === 'lockDate') {
        if (!dates.includes(date)) dates.push(date);
      } else {
        const idx = dates.indexOf(date);
        if (idx >= 0) dates.splice(idx, 1);
      }
      await setLockedDates(dates);
      return json({ ok: true, lockedDates: await getLockedDates() }, cors);
    }

    if (action === 'confirmReservation' || action === 'deleteReservation') {
      const { date, hour, id } = body;
      if (!date || typeof hour === 'undefined' || !id) return err(400, 'date, hour, id required', cors);
      const list = await getReservations(date, hour);
      const idx = list.findIndex(r => r.id === id);
      if (idx === -1) return err(404, 'Reservation not found', cors);
      if (action === 'confirmReservation') list[idx].status = 'confirmed';
      if (action === 'deleteReservation') list.splice(idx, 1);
      await putReservations(date, hour, list);
      return json({ ok: true }, cors);
    }

    if (action === 'setSlotCounts') {
      const { date, hour, confirmed, reserved } = body;
      if (!date || typeof hour === 'undefined') return err(400, 'date, hour required', cors);
      const c = Number(confirmed||0), r = Number(reserved||0);
      if (c < 0 || r < 0 || c + r > 20) return err(400, 'invalid counts', cors);
      const list = [];
      for (let i=0;i<c;i++) list.push({ id: `admin-c-${i+1}`, dateISO: date, hour, adults: 1, children: 0, name: 'admin', email: '', status: 'confirmed', createdAt: Date.now() });
      for (let i=0;i<r;i++) list.push({ id: `admin-r-${i+1}`, dateISO: date, hour, adults: 1, children: 0, name: 'admin', email: '', status: 'reserved', createdAt: Date.now(), expiresAt: Date.now()+48*60*60*1000 });
      await putReservations(date, hour, list);
      return json({ ok: true }, cors);
    }

    if (action === 'wipeAll') {
      // Try wide wipe; if list-based wipe fails or wipes nothing, scan a broad date range instead
      let out = { wiped: 0 };
      try { out = await wipeAllReservations(); } catch (e) { console.warn('wipeAllReservations failed, falling back', e); }
      if (!out || !Number.isFinite(out.wiped) || out.wiped === 0) {
        const bodyStart = body.start;
        const bodyEnd = body.end;
        const now = new Date();
        const start = bodyStart ? new Date(bodyStart + 'T00:00:00') : new Date(now.getFullYear(), now.getMonth()-3, 1);
        const end = bodyEnd ? new Date(bodyEnd + 'T00:00:00') : new Date(now.getFullYear(), now.getMonth()+6, 0);
        let wiped = 0;
        for (let d = new Date(start); d <= end; d.setDate(d.getDate()+1)) {
          const iso = d.toISOString().slice(0,10);
          for (let h = 9; h <= 16; h++) {
            try { await deleteKey(slotKey(iso, h)); wiped++; } catch {}
          }
        }
        out = { wiped };
      }
      try { await setLockedDates([]); } catch {}
      return json({ ok: true, ...out }, cors);
    }

    return err(400, 'Unknown action', cors);
  } catch (e) {
    console.error(e);
    return err(500, 'Internal Error', cors);
  }
}

function baseCors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
  };
}
function json(data, headers) { return { statusCode: 200, headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(data) }; }
function ok(body, headers) { return { statusCode: 200, headers, body }; }
function err(code, message, headers) { return { statusCode: code, headers, body: JSON.stringify({ error: message }) }; }
