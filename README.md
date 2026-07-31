# NUSTOUR

A simple, modern website for NUS campus tours with three pages:
- Main Page
- About NUS Tour
- Book Now (weekday hourly slots, 9am–4pm)

The booking flow reserves a slot after proof-of-payment is uploaded and forwards details to a Discord webhook via a Netlify Function. Reservations are stored locally in the browser for now (48h auto-expire). We can add shared persistence next (e.g., Netlify KV/Blobs or Supabase).

## Quick start (local)

Prerequisites: Node 18+, Netlify CLI (optional for local functions)

```bash
npm i -g netlify-cli
netlify dev
```

Then open http://localhost:8888

## Deploy to Netlify

1) Push this folder to a Git repository (GitHub/GitLab/Bitbucket).
2) In Netlify, create a new site from the repo.
3) Set the following in Site settings -> Environment variables:
   - `DISCORD_WEBHOOK_URL` = your Discord webhook URL
   - `ADMIN_KEY` = a strong secret to access the admin API
4) No build command is required. Publish directory: `.`
5) Deploy the site.

API routes are exposed under `/api/*` and proxied to Netlify Functions.

## Files of note

- [index.html](index.html) — Main Page with badges and image placeholder
- [about.html](about.html) — About page with your provided copy
- [book.html](book.html) — Booking UI and dialogs
- [assets/css/styles.css](assets/css/styles.css) — NUS blue/orange theme and animations
- [assets/js/book.js](assets/js/book.js) — Slot rendering and booking logic
- [netlify/functions/submit-proof.js](netlify/functions/submit-proof.js) — Webhook proxy (JSON + base64 file)
- [netlify.toml](netlify.toml) — Functions dir and `/api/*` redirect

## Admin

- Visit /admin.html (not linked in the UI). Enter the Admin Key to access controls.
- Lock/unlock dates by clicking on days (double-click a day to load reservations).
- Confirm or delete reservations per time slot.

Security: All admin API calls require the `ADMIN_KEY`. Do not share the key publicly.

## Admin confirmation (next iteration)

The process requires an admin to confirm a reserved slot after payment verification. In the next step, we can add:
- A protected admin function to mark reservations as confirmed
- Shared storage (Netlify KV/Blobs) to persist slot counts globally across users
- Email notifications upon confirmation via a provider (e.g., Resend, SendGrid)

## Images

Upload your images to [assets/images](assets/images). Replace the placeholder `payment-qr.png` with your QR code when ready.

## Disclaimer

Any opinion or information on this website does not represent NUS.

***

If you want, I can wire up Netlify KV/Blobs for shared counts and auto-expiry next.