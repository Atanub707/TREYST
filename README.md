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
- Alternative (Netlify): add `data-netlify="true"` + a hidden `form-name` input to `ContactForm.astro` and deploy on Netlify; no env var needed.
- With no endpoint set, the form falls back to opening the visitor's mail client with a prefilled message to info@treyst.fo.

## Deploy

Static build — deploy `site/dist/` anywhere:

- Netlify: build command `npm run build`, publish directory `site/dist` (set base to `site`).
- Cloudflare Pages: build command `npm run build`, output directory `site/dist`.

`astro.config.mjs` sets `site: 'https://treyst.fo'` — update it if the domain changes so sitemap/canonical URLs stay correct.

## Swapping assets

- Photos: replace files in `site/src/assets/photos/` keeping the same names (hero, apparel, equipment, printing, clubshop, about, philosophy), then rebuild.
- Wordmark: the text wordmark is styled inline (`font-display`) in `Nav.astro`, `Footer.astro` and `Hero.astro`; replace those with an `<img>` when a logo file exists.
- Favicon / OG image: `site/public/favicon.svg` and `site/public/og-image.png` (regenerate the OG PNG with `node scripts/generate-og.mjs`).

## Before launch (client actions)

1. Have a native Faroese speaker review all copy in `site/src/i18n/ui.mjs` (drafted from TREYST's existing published copy).
2. Legal review of `/treytir` and `/privatlivspolitikkur` — current text is a short placeholder edition.
3. Confirm contact details (email, phone, location) are current.
4. Add real product/club photography when available and refresh `CREDITS.md`.
