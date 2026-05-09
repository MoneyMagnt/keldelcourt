# KelDel Court

Standalone landing page and enquiry flow for the KelDel Court luxury residences project in WestLands, Accra.

## Project Structure

- `public/index.html` - main landing page
- `public/styles.css` - site styling
- `public/script.js` - frontend interactions and form submission
- `public/assets/` - extracted brochure renders and clipped walkthrough videos
- `functions/api/enquiry.js` - Cloudflare Pages Function for production enquiries
- `api/enquiry.js` - local Node enquiry handler for preview/testing
- `server.js` - local static preview server
- `.env.example` - delivery configuration examples

## Cloudflare Pages Migration

This repo is now prepared for Cloudflare Pages:

1. Connect the GitHub repo to a new Cloudflare Pages project.
2. Set the build command to `npm run build` or `exit 0`.
3. Set the build output directory to `public`.
4. Add the enquiry delivery variables in `Settings` -> `Variables and Secrets`.
5. Redeploy after adding or changing any variables.

The site form now posts directly to `/api/enquiry`, which maps to the Cloudflare Pages Function in `functions/api/enquiry.js`.

## Enquiry Delivery

Both the Cloudflare Pages Function and the local Node preview support one configured delivery target at a time, in this order:

1. `CRM_WEBHOOK_URL`
2. `RESEND_API_KEY` + `RESEND_FROM_EMAIL` + `KELDEL_COURT_TO_EMAIL`
3. `FORMSPREE_ENDPOINT`

Copy `.env.example` to `.env` for local Node preview, or load the same variables into Cloudflare Pages through the dashboard for production.

## Local Development

### Node preview

Run:

```bash
npm run dev
```

This serves the static site from `public/` and accepts `POST /api/enquiry` through `api/enquiry.js`.

### Cloudflare preview

Run:

```bash
npx wrangler pages dev public
```

Cloudflare local dev can load secrets from `.dev.vars` or `.env`. Do not commit either file.

## Notes

- The old Netlify-specific `data-netlify` form wiring has been removed.
- The hidden `bot-field` remains as a simple honeypot and is silently filtered server-side.
- This repo was rebuilt from a broken single-file prototype and split into a clean standalone project.
