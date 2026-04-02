# KelDel Court

Standalone landing page and enquiry flow for the KelDel Court luxury residences project in WestLands, Accra.

## Project Structure

- `index.html` - main landing page
- `styles.css` - site styling
- `script.js` - frontend interactions and form submission
- `api/enquiry.js` - local enquiry handler for preview/testing
- `assets/` - extracted brochure renders
- `.env.example` - delivery configuration examples

## Enquiry Delivery

Production on Netlify uses `Netlify Forms`, so submissions are stored in the Netlify dashboard and can trigger email notifications to your inbox.

To receive enquiry emails on Netlify:

1. Open your site in Netlify.
2. Go to `Project configuration` -> `Notifications`.
3. Add an `Email` notification for `Form submissions`.
4. Choose the `keldel-court-enquiry` form and enter your destination email address.

## Local Preview / Fallback Delivery

The local preview server still supports one configured delivery target at a time, in this order:

1. `CRM_WEBHOOK_URL`
2. `RESEND_API_KEY` + `RESEND_FROM_EMAIL` + `KELDEL_COURT_TO_EMAIL`
3. `FORMSPREE_ENDPOINT`

Copy `.env.example` to `.env` and fill one of those options only if you want the local Node preview server to deliver real enquiries outside Netlify.

## Notes

- On Netlify, the form posts to `/` using standard URL-encoded submission so Netlify can capture it.
- In local preview, `node server.js` accepts the same form POST and routes it through `api/enquiry.js`.
- This repo was rebuilt from a broken single-file prototype and split into a clean standalone project.
