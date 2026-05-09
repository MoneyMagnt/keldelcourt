# KelDel Court

Standalone static landing page for the KelDel Court luxury residences project in Westlands, Accra.

## Project Structure

- `public/index.html` - main landing page
- `public/styles.css` - site styling
- `public/script.js` - frontend interactions
- `public/assets/` - extracted brochure renders and clipped walkthrough videos
- `server.js` - local static preview server

## Cloudflare Pages Migration

This repo is now prepared for Cloudflare Pages:

1. Connect the GitHub repo to a new Cloudflare Pages project.
2. Set the build command to `npm run build` or `exit 0`.
3. Set the build output directory to `public`.
4. Redeploy after each GitHub push.

## Custom Domain

For the live domain, attach both `keldelcourt.com` and `www.keldelcourt.com` in Cloudflare Pages and set the apex domain as the primary destination. Then add a Cloudflare redirect rule from `www.keldelcourt.com/*` to `https://keldelcourt.com/$1` with a `301` redirect.

## Local Development

### Node preview

Run:

```bash
npm run dev
```

This serves the static site from `public/`.

## Notes

- The site is now fully static. There is no email or enquiry backend in the build.
- This repo was rebuilt from a broken single-file prototype and split into a clean standalone project.
