import { getStore } from '@netlify/blobs';

const SLOTS_BUCKET = 'nustour-slots';
const LOCKS_KEY = 'locks:dates';

export function slotKey(dateISO, hour) {
  return `slot:${dateISO}:${hour}`;
}

export async function getLockedDates() {
  const store = getStore({ name: SLOTS_BUCKET });
  const raw = await store.get(LOCKS_KEY, { type: 'json' });
  return raw?.dates || [];
}

export async function setLockedDates(dates) {
  const store = getStore({ name: SLOTS_BUCKET });
  await store.set(LOCKS_KEY, JSON.stringify({ dates: Array.from(new Set(dates)).sort() }));
}

export async function getReservations(dateISO, hour) {
  const store = getStore({ name: SLOTS_BUCKET });
  const key = slotKey(dateISO, hour);
  const data = await store.get(key, { type: 'json' });
  return data?.reservations || [];
}

export async function putReservations(dateISO, hour, reservations) {
  const store = getStore({ name: SLOTS_BUCKET });
  const key = slotKey(dateISO, hour);
  await store.set(key, JSON.stringify({ reservations }));
}

export function summarize(reservations) {
  let reserved = 0, confirmed = 0, confirmedAE = 0;
  for (const it of reservations) {
    const pax = (it.adults || 0) + (it.children || 0);
    const ae = (it.adults || 0) + (it.children || 0) / 2;
    if (it.status === 'confirmed') { confirmed += pax; confirmedAE += ae; }
    else if (it.status === 'reserved') reserved += pax;
  }
  return { reserved, confirmed, confirmedAE };
}

export async function cleanupExpired(dateISO, hour) {
  const now = Date.now();
  const list = await getReservations(dateISO, hour);
  const filtered = list.filter(r => !(r.status === 'reserved' && r.expiresAt && r.expiresAt < now));
  if (filtered.length !== list.length) {
    await putReservations(dateISO, hour, filtered);
  }
  return filtered;
}

// Admin helpers
export async function listKeys(prefix = '') {
  const store = getStore({ name: SLOTS_BUCKET });
  const keys = [];
  try {
    const iter = store.list ? store.list({ prefix }) : null;
    if (iter) {
      for await (const k of iter) {
        // k can be string or { key }
        const key = typeof k === 'string' ? k : (k.key || '');
        if (key) keys.push(key);
      }
    }
  } catch (e) {
    console.error('listKeys failed', e);
  }
  return keys;
}

export async function deleteKey(key) {
  const store = getStore({ name: SLOTS_BUCKET });
  try {
    if (store.delete) await store.delete(key);
    else await store.set(key, JSON.stringify({ reservations: [] }));
  } catch (e) {
    console.error('deleteKey failed', e);
  }
}

export async function wipeAllReservations() {
  const keys = await listKeys('slot:');
  await Promise.all(keys.map(k => deleteKey(k)));
  await setLockedDates([]);
  return { wiped: keys.length };
}
