import { getLockedDates, cleanupExpired, getReservations, summarize } from './_lib/store.mjs';

export async function handler(event) {
  const cors = baseCors();
  if (event.httpMethod === 'OPTIONS') return ok('', cors);
  if (event.httpMethod !== 'GET') return err(405, 'Method Not Allowed', cors);

  try {
    const url = new URL(event.rawUrl || `http://localhost${event.path}`);
    const start = url.searchParams.get('start');
    const end = url.searchParams.get('end');
    if (!start || !end) return err(400, 'start and end required (YYYY-MM-DD)', cors);

    const startDate = new Date(start + 'T00:00:00Z');
    const endDate = new Date(end + 'T00:00:00Z');
    if (isNaN(startDate) || isNaN(endDate)) return err(400, 'Invalid date', cors);

    const days = {};
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayISO = d.toISOString().slice(0,10);
      days[dayISO] = {};
      for (let h = 9; h <= 16; h++) {
        const list = await cleanupExpired(dayISO, h);
        const s = summarize(list);
        if (s.reserved || s.confirmed) {
          days[dayISO][h] = s;
        }
      }
      // Remove a day if no hours have any data (empty object)
      if (Object.keys(days[dayISO]).length === 0) delete days[dayISO];
    }

    const lockedDates = await getLockedDates();
    return json({ days, lockedDates }, cors);
  } catch (e) {
    console.error(e);
    return err(500, 'Internal Error', cors);
  }
}

function baseCors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
function json(data, headers) { return { statusCode: 200, headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(data) }; }
function ok(body, headers) { return { statusCode: 200, headers, body }; }
function err(code, message, headers) { return { statusCode: code, headers, body: JSON.stringify({ error: message }) }; }
