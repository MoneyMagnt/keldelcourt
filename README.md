# KelDel Court

Standalone landing page and enquiry flow for the KelDel Court luxury residences project in WestLands, Accra.

## Project Structure

- `index.html` - main landing page
- `styles.css` - site styling
- `script.js` - frontend interactions and form submission
- `api/enquiry.js` - serverless enquiry handler
- `assets/` - extracted brochure renders
- `.env.example` - delivery configuration examples

## Enquiry Delivery

The enquiry API supports one configured delivery target at a time, in this order:

1. `CRM_WEBHOOK_URL`
2. `RESEND_API_KEY` + `RESEND_FROM_EMAIL` + `KELDEL_COURT_TO_EMAIL`
3. `FORMSPREE_ENDPOINT`

Copy `.env.example` to `.env` and fill one of those options before deploying.

## Notes

- Opening `index.html` directly with `file://` is fine for layout review, but live form submission requires serving the project from a host that supports `/api` routes.
- This repo was rebuilt from a broken single-file prototype and split into a clean standalone project.
