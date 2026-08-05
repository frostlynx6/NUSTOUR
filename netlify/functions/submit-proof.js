// Netlify Function (ESM) to forward booking details and proof to Discord webhook
import { getReservations, putReservations } from './_lib/store.mjs';

export async function handler(event) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: cors, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: cors, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const {
      date, timeHour, adults, children, name, email,
      fileName, fileType, base64File,
    } = body;

    if (!email || !name || !date || typeof timeHour === 'undefined') {
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    // Persist reservation (reserved, 48h expiry)
    const id = Math.random().toString(36).slice(2);
    const rec = {
      id,
      dateISO: date,
      hour: Number(timeHour),
      adults: Number(adults || 0),
      children: Number(children || 0),
      name,
      email,
      status: 'reserved',
      createdAt: Date.now(),
      expiresAt: Date.now() + 48*60*60*1000,
    };
    const list = await getReservations(rec.dateISO, rec.hour);
    list.push(rec);
    await putReservations(rec.dateISO, rec.hour, list);

    // Compose Discord content
    const content = [
      `New NUSTOUR booking request`,
      `Date: ${date} ${formatHour(timeHour)}`,
      `Adults: ${adults ?? 0}, Children: ${children ?? 0}`,
      `Name: ${name}`,
      `Email: ${email}`,
      `Status: RESERVED (auto-expires in 48h unless confirmed)`
    ].join('\n');

    const form = new FormData();
    form.append('content', content);

    if (base64File) {
      const bin = Buffer.from(base64File, 'base64');
      const blob = new Blob([bin], { type: fileType || 'application/octet-stream' });
      form.append('files[0]', blob, fileName || 'payment-proof');
    }

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL || '';
    if (webhookUrl && !webhookUrl.includes('PLACEHOLDER')) {
      try {
        const resp = await fetch(webhookUrl, { method: 'POST', body: form });
        if (!resp.ok) {
          const text = await resp.text();
          console.error('Discord error', resp.status, text);
        }
      } catch (e) {
        console.error('Discord post failed', e);
      }
    } else {
      console.warn('DISCORD_WEBHOOK_URL not configured; skipping webhook post');
    }

    return { statusCode: 200, headers: { 'Content-Type': 'application/json', ...cors }, body: JSON.stringify({ ok: true, id }) };
  } catch (err) {
    console.error(err);
    // Return a soft error so the client UI doesn't break irrecoverably
    return { statusCode: 200, headers: { 'Content-Type': 'application/json', ...cors }, body: JSON.stringify({ ok: false, error: 'Internal Error' }) };
  }
}

function formatHour(h) {
  try {
    const d = new Date();
    d.setHours(Number(h) || 0, 0, 0, 0);
    return d.toLocaleTimeString(undefined, { hour: 'numeric' });
  } catch { return String(h) + ':00'; }
}
