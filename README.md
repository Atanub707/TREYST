# TREYST Website

Bilingual (Faroese/English) marketing site for TREYST — ítróttarklæðir, liðbúni & útgerð til føroysk ítróttarfeløg.

## Stack

- Astro 5 (static output) + Tailwind CSS v4
- i18n: Faroese at `/`, English at `/en/`
- Tests: `node --test` against the built `dist/` output

## Run

    cd site
    npm install
    npm run dev        # local dev server
    npm test           # build + full test suite
    npm run build      # production build to dist/
    npm run preview    # preview the production build

## Structure

- `site/src/i18n/ui.mjs` — all copy, both languages. Edit text here only.
- `site/src/data/services.mjs` — service metadata and route slugs.
- `site/src/pages/` — thin route wrappers; page bodies live in `site/src/components/`.
- `site/src/assets/photos/` — local photography (see `CREDITS.md`).

## Contact form

The form posts JSON to the URL in `PUBLIC_FORM_ENDPOINT`. Set it before building:

    PUBLIC_FORM_ENDPOINT="https://formspree.io/f/<id>" npm run build

- Formspree works on any host. Create a form at formspree.io and use its endpoint URL.
- Netlify Forms is not supported out of the box — the form script always handles submission. Use any provider that accepts a JSON POST (Formspree, Basin, or your own serverless function).
- With no endpoint set, the form falls back to opening the visitor's mail client with a prefilled message to info@treyst.fo.

## Deploy

Static build — deploy `site/dist/` anywhere:

- Netlify: set base directory to `site`, build command `npm run build`, publish directory `dist`.
- Cloudflare Pages: set root directory to `site`, build command `npm run build`, output directory `dist`.

`astro.config.mjs` sets `site: 'https://treyst.fo'` — update it if the domain changes so sitemap/canonical URLs stay correct.

## Try-on page (Phase A)

`/roynd` (EN: `/en/try-on`) shows the jersey collection. Each card links to the quote form with
`?kit=<slug>`, which prefills "Interested in: <name>".

- Swap jerseys: replace files in `site/src/assets/jerseys/` (same names), update `src/data/jerseys.mjs`
  and the names in `src/i18n/ui.mjs` (`jersey.n1`…), and refresh `CREDITS.md`.
- Phase B: the live try-on (Anywear widget) is wired when the client's Anywear account/script exists —
  the jersey data is already shaped for it (slug + image).

## Swapping assets

- Photos: replace files in `site/src/assets/photos/` keeping the same names (hero, apparel, equipment, printing, clubshop, about, philosophy), then rebuild.
- Wordmark: the text wordmark is styled inline (`font-display`) in `Nav.astro` (desktop bar and mobile drawer) and `Footer.astro`; replace those with an `<img>` when a logo file exists.
- Favicon / OG image: `site/public/favicon.svg` and `site/public/og-image.png` (regenerate the OG PNG with `node scripts/generate-og.mjs`).

## Before launch (client actions)

1. Have a native Faroese speaker review all copy in `site/src/i18n/ui.mjs` (drafted from TREYST's existing published copy).
2. Legal review of `/treytir` and `/privatlivspolitikkur` — current text is a short placeholder edition.
3. Confirm contact details (email, phone, location) are current.
4. Add real product/club photography when available and refresh `CREDITS.md`.
