# TREYST Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the bilingual (FO/EN) multi-page TREYST marketing website as a static Astro 5 + Tailwind CSS v4 site in `Treyst/site/`, per the approved spec `docs/superpowers/specs/2026-10-03-treyst-website-design.md`.

**Architecture:** Astro static output with built-in i18n (`fo` at root, `en` under `/en/`). All copy lives in FO/EN dictionaries (`src/i18n/ui.mjs`); service metadata in `src/data/services.mjs`; shared page bodies live in "page components" (`HomePage.astro`, `ServicePage.astro`, …) so each route file is a ~6-line wrapper. Interactive bits are minimal and vanilla: native `<dialog>` mobile nav, a small contact-form script, and a ~1 KB shirt customizer. Tests run `astro build` then assert against `dist/` output with `node --test`.

**Tech Stack:** Astro 5, Tailwind CSS v4 (via `@tailwindcss/vite`), `@astrojs/sitemap`, `@fontsource-variable/archivo`, `@fontsource-variable/inter`, `sharp` (astro:assets + OG image script), Node 20+ built-in test runner.

## Global Constraints

- Only dependencies listed above; no animation libraries, no third-party JS, no CSS frameworks beyond Tailwind.
- JS budget: total gzipped `dist/_astro/*.js` < 35 KB.
- Copy: every user-visible string comes from `src/i18n/ui.mjs` (FO + EN). No hardcoded user-visible strings in components.
- Token names (Tailwind v4 `@theme`): `fjord` `#0C1512`, `fjord-soft` `#16211D`, `brand` `#0F766E`, `brand-bright` `#2DD4BF`, `fog` `#F6F5F1`, `ink` `#101814`, plus the semantic status token `danger` `#B91C1C` (error text only). No other accent hues.
- Fonts: `"Archivo Variable"` display/wordmark, `"Inter Variable"` body (fontsource variable packages).
- FO pages at root; EN under `/en/`. Route pairs are the single source of truth in `src/i18n/utils.mjs` (`ROUTE_PAIRS`).
- Every page starts with a dark (`fjord`) top area so the transparent-to-solid nav works everywhere.
- Motion gated behind `prefers-reduced-motion`; content visible without JS (`.js` class pattern).
- Contact details: `info@treyst.fo`, `+298 504082`, `Hoyvík, Føroyar`. Site URL: `https://treyst.fo`.
- Commit after every task. Work inside the `Treyst/` git repo.
- Node >= 20 (`node --test tests/` directory discovery).

## File Structure

```
Treyst/
├── docs/superpowers/specs/2026-10-03-treyst-website-design.md   (exists)
├── README.md                                    # Task 16
└── site/
    ├── package.json                             # Task 1
    ├── astro.config.mjs                         # Task 1
    ├── tsconfig.json                            # Task 1
    ├── .gitignore                               # Task 1
    ├── scripts/generate-og.mjs                  # Task 14
    ├── public/
    │   ├── favicon.svg                          # Task 1
    │   ├── robots.txt                           # Task 14
    │   └── og-image.png                         # Task 14 (generated)
    ├── tests/
    │   ├── helpers.mjs                          # Task 1
    │   ├── build.test.mjs                       # grows in Tasks 1,2,4,6–14
    │   ├── i18n.test.mjs                        # Task 3
    │   └── budget.test.mjs                      # Task 15
    └── src/
        ├── styles/global.css                    # Task 2
        ├── i18n/ui.mjs                          # Task 3
        ├── i18n/utils.mjs                       # Task 3
        ├── data/services.mjs                    # Task 3
        ├── data/photos.mjs                      # Task 5
        ├── assets/photos/*.jpg + CREDITS.md     # Task 5
        ├── layouts/BaseLayout.astro             # Task 2 (grows in Task 4)
        ├── components/                          # Tasks 2,4,6–13 (see each task)
        └── pages/                               # Tasks 6–13 (thin wrappers)
```

All paths below are relative to `Treyst/` unless stated otherwise. Run commands with workdir `Treyst/site` unless stated otherwise.

---

### Task 1: Scaffold Astro project + test harness

**Files:**
- Create: `site/package.json`, `site/astro.config.mjs`, `site/tsconfig.json`, `site/.gitignore`
- Create: `site/public/favicon.svg`
- Create: `site/src/pages/index.astro`, `site/src/pages/en/index.astro` (temporary minimal pages; replaced in Tasks 6–7)
- Create: `site/tests/helpers.mjs`, `site/tests/build.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: working `npm test` (= `astro build && node --test tests/`); `readDist(rel)`, `exists(rel)` test helpers; `Astro.site` = `https://treyst.fo`; i18n config `fo` default at root, `en` under `/en/`.

- [ ] **Step 1: Create `site/package.json`**

```json
{
  "name": "treyst-site",
  "type": "module",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "astro build && node --test tests/"
  },
  "dependencies": {
    "@astrojs/sitemap": "^3.2.1",
    "@fontsource-variable/archivo": "^5.1.1",
    "@fontsource-variable/inter": "^5.1.1",
    "@tailwindcss/vite": "^4.0.0",
    "astro": "^5.0.0",
    "sharp": "^0.33.5",
    "tailwindcss": "^4.0.0"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`
Expected: install completes; `node_modules/` created.

- [ ] **Step 3: Create `site/astro.config.mjs`**

```js
// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://treyst.fo',
  output: 'static',
  i18n: {
    defaultLocale: 'fo',
    locales: ['fo', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [sitemap()],
  vite: { plugins: [tailwindcss()] },
});
```

- [ ] **Step 4: Create `site/tsconfig.json` and `site/.gitignore`**

`site/tsconfig.json`:
```json
{ "extends": "astro/tsconfigs/base" }
```

`site/.gitignore`:
```
node_modules/
dist/
.astro/
.DS_Store
.env
```

- [ ] **Step 5: Create `site/public/favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="#0C1512"/>
  <path d="M8 9h16v4.4h-5.8V24h-4.4V13.4H8z" fill="#2DD4BF"/>
</svg>
```

- [ ] **Step 6: Create temporary minimal home pages**

`site/src/pages/index.astro`:
```astro
---
const title = 'TREYST';
---
<!doctype html>
<html lang="fo">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>{title}</title>
  </head>
  <body>
    <h1>TREYST</h1>
  </body>
</html>
```

`site/src/pages/en/index.astro`: identical but `<html lang="en">`.

- [ ] **Step 7: Create `site/tests/helpers.mjs`**

```js
import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export const distPath = (rel) => fileURLToPath(new URL(`../dist/${rel}`, import.meta.url));

export async function readDist(rel) {
  return readFile(distPath(rel), 'utf8');
}

export async function exists(rel) {
  try {
    await access(distPath(rel));
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 8: Create `site/tests/build.test.mjs` (first assertions)**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readDist, exists } from './helpers.mjs';

test('home page builds', async () => {
  assert.equal(await exists('index.html'), true, 'dist/index.html should exist');
});

test('home page is Faroese with proper head', async () => {
  const html = await readDist('index.html');
  assert.match(html, /<html lang="fo"/);
  assert.match(html, /<title>TREYST<\/title>/);
  assert.match(html, /rel="icon"/);
});

test('english home builds under /en/', async () => {
  assert.equal(await exists('en/index.html'), true, 'dist/en/index.html should exist');
});
```

- [ ] **Step 9: Run tests to verify they pass**

Run: `npm test`
Expected: build succeeds; `pass 3`.

- [ ] **Step 10: Commit**

```bash
git add site/package.json site/package-lock.json site/astro.config.mjs site/tsconfig.json site/.gitignore site/public/favicon.svg site/src/pages site/tests
git commit -m "feat(site): scaffold Astro + Tailwind project with build test harness"
```

---

### Task 2: Design tokens, fonts, BaseLayout, SeoHead

**Files:**
- Create: `site/src/styles/global.css`, `site/src/components/SeoHead.astro`, `site/src/layouts/BaseLayout.astro`
- Modify: `site/src/pages/index.astro`, `site/src/pages/en/index.astro`
- Test: `site/tests/build.test.mjs` (extend)

**Interfaces:**
- Consumes: Task 1 scaffold.
- Produces: `BaseLayout` props `{ lang: 'fo' | 'en', title: string, description: string, path: string, altPath: string }`; `SeoHead` props `{ lang, title, description, path, altPath }`; utilities `bg-fjord bg-fjord-soft bg-brand bg-brand-bright bg-fog text-ink text-brand font-display font-body`; reveal contract: `.js [data-reveal]` + `.is-visible` (driven by the BaseLayout observer), `data-reveal-delay="1|2|3"`.

- [ ] **Step 1: Extend tests first (failing)**

Append to `site/tests/build.test.mjs`:

```js
test('token CSS variables are emitted', async () => {
  const html = await readDist('index.html');
  const cssHref = html.match(/href="(\/_astro\/[^"]+\.css)"/)?.[1];
  assert.ok(cssHref, 'a bundled CSS file should be linked');
  const css = await readDist(cssHref.replace(/^\//, ''));
  assert.match(css, /--color-fjord:\s*#0C1512/);
  assert.match(css, /--color-brand:\s*#0F766E/);
  assert.match(css, /--font-display:\s*"Archivo Variable"/);
});

test('layout has skip link, main landmark and reveal contract', async () => {
  const html = await readDist('index.html');
  assert.match(html, /class="skip-link"/);
  assert.match(html, /<main id="main">/);
  assert.match(html, /classList\.add\('js'\)/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — no CSS link, no `.skip-link`, no `<main id="main">`.

- [ ] **Step 3: Create `site/src/styles/global.css`**

```css
@import "tailwindcss";
@import "@fontsource-variable/archivo";
@import "@fontsource-variable/inter";

@theme {
  --color-fjord: #0C1512;
  --color-fjord-soft: #16211D;
  --color-brand: #0F766E;
  --color-brand-bright: #2DD4BF;
  --color-fog: #F6F5F1;
  --color-ink: #101814;
  --color-danger: #B91C1C;

  --font-display: "Archivo Variable", ui-sans-serif, system-ui, sans-serif;
  --font-body: "Inter Variable", ui-sans-serif, system-ui, sans-serif;
}

html { scroll-behavior: smooth; }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }

body { @apply font-body text-ink bg-white antialiased; }
h1, h2, h3 { @apply font-display; text-wrap: balance; }
p { text-wrap: pretty; }

.skip-link {
  position: absolute; left: 1rem; top: -3rem; z-index: 100;
  padding: 0.5rem 1rem; background: var(--color-brand); color: white;
  border-radius: 0.375rem; transition: top 150ms ease;
}
.skip-link:focus { top: 1rem; }

:focus-visible { outline: 2px solid var(--color-brand-bright); outline-offset: 2px; }

/* Scroll reveal: hidden only when JS is available; always visible otherwise */
.js [data-reveal] {
  opacity: 0; transform: translateY(12px);
  transition: opacity 600ms ease-out, transform 600ms ease-out;
}
.js [data-reveal].is-visible { opacity: 1; transform: none; }
@media (prefers-reduced-motion: reduce) {
  .js [data-reveal] { opacity: 1; transform: none; transition: none; }
}
.js [data-reveal][data-reveal-delay="1"] { transition-delay: 100ms; }
.js [data-reveal][data-reveal-delay="2"] { transition-delay: 200ms; }
.js [data-reveal][data-reveal-delay="3"] { transition-delay: 300ms; }

img { max-width: 100%; height: auto; }
```

- [ ] **Step 4: Create `site/src/components/SeoHead.astro`**

```astro
---
const { lang, title, description, path, altPath } = Astro.props;
const site = Astro.site ?? new URL('https://treyst.fo');
const canonical = new URL(path, site).href;
const alt = new URL(altPath, site).href;
const locales = { fo: 'fo_FO', en: 'en_US' };
const fullTitle = title === 'TREYST' ? title : `${title} | TREYST`;
---
<title>{fullTitle}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonical} />
<link rel="alternate" hreflang="fo" href={lang === 'fo' ? canonical : alt} />
<link rel="alternate" hreflang="en" href={lang === 'en' ? canonical : alt} />
<link rel="alternate" hreflang="x-default" href={lang === 'fo' ? canonical : alt} />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="TREYST" />
<meta property="og:title" content={fullTitle} />
<meta property="og:description" content={description} />
<meta property="og:url" content={canonical} />
<meta property="og:image" content={new URL('/og-image.png', site).href} />
<meta property="og:locale" content={locales[lang]} />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={fullTitle} />
<meta name="twitter:description" content={description} />
<meta name="twitter:image" content={new URL('/og-image.png', site).href} />
```

- [ ] **Step 5: Create `site/src/layouts/BaseLayout.astro`**

```astro
---
import '../styles/global.css';
import Nav from '../components/Nav.astro';
import Footer from '../components/Footer.astro';
import SeoHead from '../components/SeoHead.astro';
import { t } from '../i18n/utils.mjs';

const { lang = 'fo', title, description, path, altPath } = Astro.props;
const skip = t(lang, 'skip');
---
<!doctype html>
<html lang={lang}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <SeoHead lang={lang} title={title} description={description} path={path} altPath={altPath} />
    <script is:inline>document.documentElement.classList.add('js');</script>
  </head>
  <body>
    <a href="#main" class="skip-link">{skip}</a>
    <main id="main"><slot /></main>
    <script>
      const els = document.querySelectorAll('[data-reveal]');
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced || !('IntersectionObserver' in window)) {
        els.forEach((el) => el.classList.add('is-visible'));
      } else {
        const io = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                io.unobserve(entry.target);
              }
            }
          },
          { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
        );
        els.forEach((el) => io.observe(el));
      }
    </script>
  </body>
</html>
```

Note: Nav/Footer are added in Task 4; this task intentionally renders only `main`.

- [ ] **Step 6: Rewrite FO/EN home pages to use the layout**

`site/src/pages/index.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout
  lang="fo"
  title="TREYST"
  description="Klæðir, útgerð og loysnir til føroyskan ítrótt."
  path="/"
  altPath="/en/"
>
  <h1>TREYST</h1>
</BaseLayout>
```

`site/src/pages/en/index.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout
  lang="en"
  title="TREYST"
  description="Apparel, equipment and solutions for Faroese sport."
  path="/en/"
  altPath="/"
>
  <h1>TREYST</h1>
</BaseLayout>
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
git add site/src site/tests
git commit -m "feat(site): design tokens, fonts, base layout and SEO head"
```

---

### Task 3: i18n core — dictionaries, utils, services data

**Files:**
- Create: `site/src/data/services.mjs`
- Create: `site/src/i18n/utils.mjs`
- Create: `site/src/i18n/ui.mjs`
- Test: `site/tests/i18n.test.mjs`

**Interfaces:**
- Consumes: nothing (pure modules, no Astro imports).
- Produces:
  - `ui` (named + default export): `{ [key: string]: { fo: string | Array; en: string | Array } }`
  - `utils.mjs`: `t(lang, key)` → localized value with `fo` fallback then key; `ROUTE_PAIRS: {fo, en}[]`; `switchLocalePath(pathname, targetLang)`; `localizePath(foPath, lang)`; `slugFor(id, lang)`; `LANGS = ['fo','en']`.
  - `services.mjs`: `services` (order: apparel, equipment, printing, clubshop), `serviceById(id)`, `otherServices(id)`.

- [ ] **Step 1: Write failing unit tests — `site/tests/i18n.test.mjs`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { t, switchLocalePath, localizePath } from '../src/i18n/utils.mjs';
import { services, otherServices, serviceById } from '../src/data/services.mjs';

test('t returns localized string', () => {
  assert.equal(t('fo', 'nav.home'), 'Heim');
  assert.equal(t('en', 'nav.home'), 'Home');
});

test('t falls back to fo then key', () => {
  assert.equal(t('de', 'nav.home'), 'Heim');
  assert.equal(t('fo', 'nope.missing'), 'nope.missing');
});

test('switchLocalePath maps both directions', () => {
  assert.equal(switchLocalePath('/klaedir', 'en'), '/en/apparel');
  assert.equal(switchLocalePath('/en/apparel', 'fo'), '/klaedir');
  assert.equal(switchLocalePath('/en/', 'fo'), '/');
  assert.equal(switchLocalePath('/', 'en'), '/en/');
});

test('switchLocalePath handles unknown paths gracefully', () => {
  assert.equal(switchLocalePath('/whatever', 'en'), '/en/');
});

test('localizePath localizes known paths', () => {
  assert.equal(localizePath('/um-okkum', 'en'), '/en/about');
  assert.equal(localizePath('/um-okkum', 'fo'), '/um-okkum');
});

test('services data is well-formed', () => {
  assert.equal(services.length, 4);
  assert.deepEqual(services.map((s) => s.id), ['apparel', 'equipment', 'printing', 'clubshop']);
  assert.equal(serviceById('printing').slugs.fo, '/prenting');
  assert.equal(otherServices('printing').length, 3);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/i18n.test.mjs`
Expected: FAIL — cannot find module `../src/i18n/utils.mjs`.

- [ ] **Step 3: Create `site/src/data/services.mjs`**

```js
export const services = [
  { id: 'apparel',   slugs: { fo: '/klaedir',   en: '/en/apparel'   }, icon: 'shirt',    image: 'apparel',   key: 'services.apparel' },
  { id: 'equipment', slugs: { fo: '/utgerd',    en: '/en/equipment' }, icon: 'dumbbell', image: 'equipment', key: 'services.equipment' },
  { id: 'printing',  slugs: { fo: '/prenting',  en: '/en/printing'  }, icon: 'printer',  image: 'printing',  key: 'services.printing' },
  { id: 'clubshop',  slugs: { fo: '/club-shop', en: '/en/club-shop' }, icon: 'cart',     image: 'clubshop',  key: 'services.clubshop' },
];

export const serviceById = (id) => services.find((s) => s.id === id);

export const otherServices = (id) => services.filter((s) => s.id !== id);
```

- [ ] **Step 4: Create `site/src/i18n/utils.mjs`**

```js
import { ui } from './ui.mjs';
import { services } from '../data/services.mjs';

export const LANGS = ['fo', 'en'];

export function t(lang, key) {
  const entry = ui[key];
  if (!entry) return key;
  return entry[lang] ?? entry.fo ?? key;
}

export const ROUTE_PAIRS = [
  { fo: '/', en: '/en/' },
  ...services.map((s) => ({ fo: s.slugs.fo, en: s.slugs.en })),
  { fo: '/um-okkum', en: '/en/about' },
  { fo: '/samband', en: '/en/contact' },
  { fo: '/treytir', en: '/en/terms' },
  { fo: '/privatlivspolitikkur', en: '/en/privacy' },
];

const strip = (path) => (path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path);

export function switchLocalePath(pathname, targetLang) {
  const current = strip(pathname || '/');
  const pair = ROUTE_PAIRS.find((p) => strip(p.fo) === current || strip(p.en) === current);
  if (!pair) return targetLang === 'en' ? '/en/' : '/';
  return targetLang === 'en' ? pair.en : pair.fo;
}

export function localizePath(path, lang) {
  if (lang !== 'en') return path;
  const pair = ROUTE_PAIRS.find((p) => p.fo === path);
  return pair ? pair.en : '/en/';
}

export function slugFor(id, lang) {
  const service = services.find((s) => s.id === id);
  if (!service) return '/';
  return service.slugs[lang] ?? service.slugs.fo;
}
```

- [ ] **Step 5: Create `site/src/i18n/ui.mjs`**

The full FO/EN dictionary is provided verbatim in the two steps that follow (Step 5a and Step 5b) so no copy is left to interpretation. Create the file in 5a, then append the rest in 5b.

**Step 5a — write `site/src/i18n/ui.mjs` with the first half:**

```js
/** All user-visible copy. Every key must have `fo` and `en` values. */
export const ui = {
  // ---- shared / nav / footer ----
  'brand.tagline': { fo: 'Ikki bert ein veitari — ein viðleikari.', en: 'Not just a supplier — a teammate.' },
  'nav.home': { fo: 'Heim', en: 'Home' },
  'nav.services': { fo: 'Tænastur', en: 'Services' },
  'nav.about': { fo: 'Um okkum', en: 'About' },
  'nav.contact': { fo: 'Samband', en: 'Contact' },
  'nav.cta': { fo: 'Set teg í samband', en: 'Get in touch' },
  'nav.menu.open': { fo: 'Lat valmynd upp', en: 'Open menu' },
  'nav.menu.close': { fo: 'Lat valmynd aftur', en: 'Close menu' },
  'lang.switch': { fo: 'EN', en: 'FØ' },
  'lang.switchLabel': { fo: 'Broyta til enskt', en: 'Switch to Faroese' },
  'footer.services': { fo: 'Tænastur', en: 'Services' },
  'footer.pages': { fo: 'Síður', en: 'Pages' },
  'footer.contact': { fo: 'Samband', en: 'Contact' },
  'footer.legal': { fo: 'Lógligt', en: 'Legal' },
  'footer.terms': { fo: 'Treytir', en: 'Terms' },
  'footer.privacy': { fo: 'Privatlívspolitikkur', en: 'Privacy policy' },
  'footer.rights': { fo: 'Øll rættindi varðveitt.', en: 'All rights reserved.' },
  'common.learnMore': { fo: 'Kanna nærri', en: 'Learn more' },

  // ---- meta ----
  'meta.home.title': { fo: 'TREYST', en: 'TREYST' },
  'meta.home.description': {
    fo: 'Klæðir, útgerð, prenting og club shop til føroysk ítróttarfeløg. Minni umsiting. Meira ítrótt.',
    en: 'Apparel, equipment, printing and club shops for Faroese sports clubs. Less admin. More sport.',
  },
  'meta.about.title': { fo: 'Um okkum', en: 'About' },
  'meta.about.description': {
    fo: 'TREYST er ikki bert ein veitari — vit eru ein viðleikari fyri føroyskan ítrótt.',
    en: 'TREYST is not just a supplier — we are a teammate for Faroese sport.',
  },
  'meta.contact.title': { fo: 'Samband', en: 'Contact' },
  'meta.contact.description': {
    fo: 'Set teg í samband við TREYST — vit hjálpa tínum felag skjótt og persónligt.',
    en: 'Get in touch with TREYST — we help your club quickly and personally.',
  },

  // ---- home hero ----
  'home.badge': { fo: 'Minni umsiting. Meira ítrótt.', en: 'Less admin. More sport.' },
  'home.h1a': { fo: 'Klæðir, útgerð og loysnir til', en: 'Apparel, equipment and solutions for' },
  'home.h1b': { fo: 'føroyskan ítrótt.', en: 'Faroese sport.' },
  'home.intro': {
    fo: 'TREYST hjálpir føroyskum ítróttarfeløgum við klæðum, útgerð, prenting og samskipan, so tit kunnu brúka minni tíð upp á umsiting og meira tíð upp á ítrótt.',
    en: 'TREYST helps Faroese sports clubs with apparel, equipment, printing and coordination — so you spend less time on admin and more time on sport.',
  },
  'home.ctaPrimary': { fo: 'Set teg í samband', en: 'Get in touch' },
  'home.ctaSecondary': { fo: 'Kanna tænastur', en: 'Explore services' },
  'home.heroAlt': { fo: 'Ítróttarfólk í venjing', en: 'Athletes in training' },

  // ---- sports strip ----
  'sports.label': { fo: 'Vit hjálpa øllum ítróttagreinum í Føroyum', en: 'We support every sport in the Faroe Islands' },
  'sports.items': {
    fo: ['Fótbóltur', 'Handbóltur', 'Badminton', 'Rógving', 'Svimjing', 'Frælsur ítrótt'],
    en: ['Football', 'Handball', 'Badminton', 'Rowing', 'Swimming', 'Athletics'],
  },

  // ---- services ----
  'services.eyebrow': { fo: 'Tænastur', en: 'Services' },
  'services.title': { fo: 'Hvat gera vit?', en: 'What we do' },
  'services.apparel.title': { fo: 'Klæðir', en: 'Apparel' },
  'services.apparel.desc': {
    fo: 'Liðbúni, venjingarbúni, felagsbúni og gerandisklæðir frá álítandi veitarum.',
    en: 'Team kits, training wear, club wear and everyday apparel from trusted suppliers.',
  },
  'services.equipment.title': { fo: 'Útgerð', en: 'Equipment' },
  'services.equipment.desc': {
    fo: 'Ítróttarútgerð og loysnir til feløg, laga til tykkara ítróttagrein.',
    en: 'Sports equipment and solutions for clubs, tailored to your sport.',
  },
  'services.printing.title': { fo: 'Prenting', en: 'Printing' },
  'services.printing.desc': {
    fo: 'Navn, nummar, logo og stuðlar. Hágóðsku prent, beint á klæðini.',
    en: 'Names, numbers, logos and sponsors. High-quality print, straight onto the kit.',
  },
  'services.clubshop.title': { fo: 'Club Shop', en: 'Club Shop' },
  'services.clubshop.desc': {
    fo: 'Online bíleggingarloysnir til limir, foreldur og leikarar. Lætt at keypa.',
    en: 'Online ordering solutions for members, parents and players. Easy to buy.',
  },

  // ---- values / philosophy / process / cta ----
  'values.title': { fo: 'Alt á einum stað.', en: 'All in one place.' },
  'values.sub': {
    fo: 'TREYST hjálpir føroyskum ítróttarfeløgum við klæðum, útgerð og loysnum til gerandisdagin.',
    en: 'TREYST helps Faroese sports clubs with apparel, equipment and everyday solutions.',
  },
  'values.personal.title': { fo: 'Persónlig tænasta', en: 'Personal service' },
  'values.personal.desc': { fo: 'Vit eru altíð klár til at hjálpa.', en: 'We are always ready to help.' },
  'values.comms.title': { fo: 'Lætt samskifti', en: 'Easy communication' },
  'values.comms.desc': { fo: 'Tit vita altíð, hvønn tit tosa við.', en: 'You always know who you are talking to.' },
  'values.simple.title': { fo: 'Einfalt', en: 'Simple' },
  'values.simple.desc': {
    fo: 'Vit arbeiða fyri at gera tað lættari at reka eitt ítróttarfelag.',
    en: 'We work to make running a sports club easier.',
  },
  'philosophy.statement': { fo: 'TREYST er ikki bert ein veitari.', en: 'TREYST is not just a supplier.' },
  'philosophy.accent': { fo: 'TREYST er ein viðleikari.', en: 'TREYST is a teammate.' },
  'philosophy.quote': {
    fo: '“Alt rundan um klæðir og útgerð skal vera lættari.”',
    en: '“Everything around kit and equipment should be easier.”',
  },
  'philosophy.support': {
    fo: 'Vit eru til reiðar at hjálpa í øllum ítróttagreinum í Føroyum.',
    en: 'We are ready to help in every sport in the Faroe Islands.',
  },
  'philosophy.alt': { fo: 'Føroyskt ítróttafelag', en: 'A Faroese sports club' },
  'process.title': { fo: 'Hvussu vit arbeiða', en: 'How we work' },
  'process.s1.title': { fo: 'Samband', en: 'Get in touch' },
  'process.s1.desc': { fo: 'Tit setið tykkum í samband — vit hoyra, hvat felagið hevur tørv á.', en: 'Reach out — we listen to what your club needs.' },
  'process.s2.title': { fo: 'Tilboð & design', en: 'Quote & design' },
  'process.s2.desc': { fo: 'Vit gera tilboð og hjálpa við designi av búna og útgerð.', en: 'We prepare a quote and help design the kit and equipment.' },
  'process.s3.title': { fo: 'Prenting & framleiðsla', en: 'Printing & production' },
  'process.s3.desc': { fo: 'Nøvn, nummur, logo og stuðlar verða prentað við hágóðsku.', en: 'Names, numbers, logos and sponsors are printed to a high standard.' },
  'process.s4.title': { fo: 'Levering & stuðning', en: 'Delivery & support' },
  'process.s4.desc': { fo: 'Vit levera til felagið og standa við tykkum eftir tað.', en: 'We deliver to your club and stand by you afterwards.' },
  'cta.title': { fo: 'Ger gerandisdagin lættari', en: 'Make everyday easier' },
  'cta.desc': { fo: 'Set teg í samband við okkum í dag.', en: 'Get in touch with us today.' },
  'cta.button': { fo: 'Set teg í samband', en: 'Get in touch' },
```

**Step 5b — append the rest of the dictionary and the export to `site/src/i18n/ui.mjs`:**

```js

  // ---- service pages (shared) ----
  'svc.capabilities': { fo: 'Hvat vit bjóða', en: 'What we offer' },
  'svc.details': { fo: 'Meira um tænastuna', en: 'More about the service' },
  'svc.related': { fo: 'Aðrar tænastur', en: 'Other services' },

  // apparel
  'svc.apparel.eyebrow': { fo: 'Tænastur / Klæðir', en: 'Services / Apparel' },
  'svc.apparel.h1': { fo: 'Klæðir til ítróttafeløg', en: 'Apparel for sports clubs' },
  'svc.apparel.intro': { fo: 'Frá liðbúna til gerandisklæðir — vit klæða felagið frá toppi til táa, við klæðum frá álítandi veitarum.', en: 'From team kits to everyday wear — we dress your club from head to toe with apparel from trusted suppliers.' },
  'svc.apparel.capabilities': {
    fo: [
      { title: 'Liðbúni', text: 'Heimabúni og útibúni við tínum litum, logoi og stuðlum.' },
      { title: 'Venjingarbúni', text: 'Venjingartrøyggjur, shorts, sokkar og jakkar til allan skarðin.' },
      { title: 'Felagsbúni', text: 'Hoodies, jakkar og t-shirts til limir, leiðarar og stuðlarar.' },
      { title: 'Gerandisklæðir', text: 'Klæði til hvønn dag við góðari góðsku.' },
    ],
    en: [
      { title: 'Team kits', text: 'Home and away kits in your colours, with your crest and sponsors.' },
      { title: 'Training wear', text: 'Training tops, shorts, socks and jackets for the whole squad.' },
      { title: 'Club wear', text: 'Hoodies, jackets and t-shirts for members, coaches and supporters.' },
      { title: 'Everyday apparel', text: 'Everyday wear with the quality you expect.' },
    ],
  },
  'svc.apparel.details': {
    fo: [
      { q: 'Hvørji vørumerki arbeiða tit við?', a: 'Vit arbeiða við álítandi veitarum og finna tað, sum passar tínum felag.' },
      { q: 'Kunnu vit blanda støddir og litir?', a: 'Ja, vit seta saman búnan soleiðis, sum tykkum passar.' },
      { q: 'Hvussu leingi tekur tað?', a: 'Vanliga 3–5 vikur frá góðkenning av designi.' },
      { q: 'Fáa vit hjálp við støddum?', a: 'Ja, vit hjálpa við støddarvegleiðing og støddarprøvum.' },
    ],
    en: [
      { q: 'Which brands do you work with?', a: 'We work with trusted suppliers and find what fits your club.' },
      { q: 'Can we mix sizes and colours?', a: 'Yes — we put the kit together the way that suits you.' },
      { q: 'How long does it take?', a: 'Usually 3–5 weeks from design approval.' },
      { q: 'Do you help with sizing?', a: 'Yes, we help with size guides and fitting samples.' },
    ],
  },
  'meta.apparel.title': { fo: 'Klæðir', en: 'Apparel' },
  'meta.apparel.description': { fo: 'Liðbúni, venjingarbúni, felagsbúni og gerandisklæðir til føroysk ítróttafeløg.', en: 'Team kits, training wear and club apparel for Faroese sports clubs.' },

  // equipment
  'svc.equipment.eyebrow': { fo: 'Tænastur / Útgerð', en: 'Services / Equipment' },
  'svc.equipment.h1': { fo: 'Útgerð til ítróttafeløg', en: 'Equipment for sports clubs' },
  'svc.equipment.intro': { fo: 'Útgerð, laga til tykkara ítróttagrein — frá bóltum og málum til badminton og rógving.', en: 'Equipment tailored to your sport — from balls and goals to badminton and rowing.' },
  'svc.equipment.capabilities': {
    fo: [
      { title: 'Bóltar & mál', text: 'Bóltar, mál, net og haldarar til kapping og venjing.' },
      { title: 'Venjingarútgerð', text: 'Keglar, haldarar, vestar og annað, sum ger venjingina betri.' },
      { title: 'Kappingarútgerð', text: 'Alt tað, sum krevst fyri at halda kapping eftir reglunum.' },
      { title: 'Loysnir eftir máti', text: 'Vit finna útgerð, sum passar júst tínum felag.' },
    ],
    en: [
      { title: 'Balls & goals', text: 'Balls, goals, nets and stands for matches and training.' },
      { title: 'Training equipment', text: 'Cones, stands, bibs and everything that makes training better.' },
      { title: 'Competition equipment', text: 'Everything needed to run a competition to the rules.' },
      { title: 'Tailored solutions', text: 'We find the equipment that fits your club exactly.' },
    ],
  },
  'svc.equipment.details': {
    fo: [
      { q: 'Kunnu tit útvega til aðrar ítróttagreinir enn fótbólt?', a: 'Ja — vit hjálpa øllum ítróttagreinum í Føroyum.' },
      { q: 'Fáa vit útgerð til eina heila sesong?', a: 'Ja, vit planleggja útgerðina saman við tykkum fyri árið.' },
      { q: 'Kunnu vit leiga útgerð?', a: 'Hoyr okkum — vit finna eina loysn, sum passar.' },
      { q: 'Hvussu verður útgerðin leverað?', a: 'Vit levera til felagið ella til handil í Føroyum.' },
    ],
    en: [
      { q: 'Can you supply sports other than football?', a: 'Yes — we help every sport in the Faroe Islands.' },
      { q: 'Can we get equipment for a whole season?', a: 'Yes, we plan the season’s equipment together with you.' },
      { q: 'Can we rent equipment?', a: 'Talk to us — we will find a solution that fits.' },
      { q: 'How is equipment delivered?', a: 'We deliver to your club or to a store in the Faroe Islands.' },
    ],
  },
  'meta.equipment.title': { fo: 'Útgerð', en: 'Equipment' },
  'meta.equipment.description': { fo: 'Ítróttarútgerð og loysnir til feløg, laga til tykkara ítróttagrein.', en: 'Sports equipment and club solutions, tailored to your sport.' },

  // printing
  'svc.printing.eyebrow': { fo: 'Tænastur / Prenting', en: 'Services / Printing' },
  'svc.printing.h1': { fo: 'Prenting', en: 'Printing' },
  'svc.printing.intro': { fo: 'Nøvn, nummur, logo og stuðlar — hágóðsku prent, beint á klæðini.', en: 'Names, numbers, logos and sponsors — high-quality print, straight onto the kit.' },
  'svc.printing.capabilities': {
    fo: [
      { title: 'Nøvn', text: 'Navnið á bakið á troyggjuni, beint og greitt.' },
      { title: 'Nummur', text: 'Kappingarnummur við góðum kontrasti.' },
      { title: 'Logo & brennimørk', text: 'Felagslogo og brennimørk við hvøssum detailum.' },
      { title: 'Stuðlalogo', text: 'Stuðlar fáa pláss á búna og klæðini.' },
    ],
    en: [
      { title: 'Names', text: 'The name on the back of the shirt, clean and sharp.' },
      { title: 'Numbers', text: 'Competition numbers with strong contrast.' },
      { title: 'Logos & crests', text: 'Club logos and crests with crisp detail.' },
      { title: 'Sponsor logos', text: 'Sponsors get their place on the kit.' },
    ],
  },
  'svc.printing.details': {
    fo: [
      { q: 'Hvørjar prenttøknir nýta tit?', a: 'Vit nýta hágóðsku prent og vevnaðarprent, valt eftir klæðum og tørvi.' },
      { q: 'Kunnu vit senda okkara egna logo-fílu?', a: 'Ja, send okkum fíluna — vit gera hana klára til prent.' },
      { q: 'Hvussu skjótt fáa vit vørurnar?', a: 'Vanliga 2–4 vikur eftir stødd og nøgd.' },
      { q: 'Kunnu tit prenta einstakar vørur?', a: 'Ja, eisini smáar nøgdir.' },
    ],
    en: [
      { q: 'Which printing methods do you use?', a: 'We use high-quality print and transfer, chosen to suit the garment and use.' },
      { q: 'Can we send our own logo file?', a: 'Yes, send us the file — we prepare it for print.' },
      { q: 'How fast do we get the items?', a: 'Usually 2–4 weeks depending on size and quantity.' },
      { q: 'Can you print single items?', a: 'Yes, small quantities too.' },
    ],
  },
  'customizer.title': { fo: 'Royn teg framman', en: 'Try it yourself' },
  'customizer.sub': { fo: 'Vel lit og skriva navn og nummar — síðani gera vit tað veruliga.', en: 'Pick a colour and type a name and number — then we make the real thing.' },
  'customizer.color': { fo: 'Vel lit', en: 'Pick a colour' },
  'customizer.name': { fo: 'Navn á baki', en: 'Name on back' },
  'customizer.number': { fo: 'Nummar', en: 'Number' },
  'customizer.jerseyAlt': { fo: 'Design av troyggju', en: 'Jersey design preview' },
  'meta.printing.title': { fo: 'Prenting', en: 'Printing' },
  'meta.printing.description': { fo: 'Nøvn, nummur, logo og stuðlar — hágóðsku prent beint á klæðini.', en: 'Names, numbers, logos and sponsors — high-quality printing straight onto the kit.' },

  // club shop
  'svc.clubshop.eyebrow': { fo: 'Tænastur / Club Shop', en: 'Services / Club Shop' },
  'svc.clubshop.h1': { fo: 'Club Shop til títt felag', en: 'A club shop for your club' },
  'svc.clubshop.intro': { fo: 'Online bíleggingarloysnir til limir, foreldur og leikarar. Lætt at keypa.', en: 'Online ordering solutions for members, parents and players. Easy to buy.' },
  'svc.clubshop.capabilities': {
    fo: [
      { title: 'Uppseting', text: 'Vit seta upp felags-sjópin við tykkara vørumerki og vørulýsing.' },
      { title: 'Vørulýsing', text: 'Felagið velur vørur, litir og nøvn til sesongina.' },
      { title: 'Bíleggingar', text: 'Limir og foreldur bíleggja beint á netinum — eisini úr telefoninum.' },
      { title: 'Levering', text: 'Vit pakka og levera — til felagið ella beint til hús.' },
    ],
    en: [
      { title: 'Setup', text: 'We set up the club shop with your branding and products.' },
      { title: 'Catalogue', text: 'The club chooses items, colours and names for the season.' },
      { title: 'Orders', text: 'Members and parents order straight from their phone.' },
      { title: 'Delivery', text: 'We pack and deliver — to the club or straight to the door.' },
    ],
  },
  'svc.clubshop.details': {
    fo: [
      { q: 'Hvør eigur sjóp’in?', a: 'Felagið — vit standa fyri tøknini og umsitingini.' },
      { q: 'Kunnu vit nýta okkara egna logo?', a: 'Ja, alt verður merkt við tykkara felag.' },
      { q: 'Hvat kostar tað?', a: 'Hoyr okkum — vit finna eina loysn fyri tykkara felag.' },
      { q: 'Fáa stuðlar pláss?', a: 'Ja, stuðlar fáa pláss á vørunum.' },
    ],
    en: [
      { q: 'Who owns the shop?', a: 'The club does — we provide the technology and admin.' },
      { q: 'Can we use our own logo?', a: 'Yes, everything is branded as your club.' },
      { q: 'What does it cost?', a: 'Talk to us — we will find a solution for your club.' },
      { q: 'Can sponsors be included?', a: 'Yes, sponsors get their place on the items.' },
    ],
  },
  'meta.clubshop.title': { fo: 'Club Shop', en: 'Club Shop' },
  'meta.clubshop.description': { fo: 'Online club shop loysnir til føroysk ítróttarfeløg — lætt at keypa.', en: 'Online club shop solutions for Faroese sports clubs — easy to buy.' },

  // ---- about ----
  'about.eyebrow': { fo: 'Um TREYST', en: 'About TREYST' },
  'about.h1': { fo: 'Ikki bert ein veitari.', en: 'Not just a supplier.' },
  'about.h1accent': { fo: 'Ein viðleikari.', en: 'A teammate.' },
  'about.p1': {
    fo: 'TREYST varð stovnað við einum einfaldum endamáli: at gera tað lættari at reka eitt ítróttarfelag í Føroyum. Alt frá klæðum og útgerð til prenting og club shop skal vera á einum stað, við persónligari tænastu og skjóttum samskifti.',
    en: 'TREYST was founded with a simple goal: to make running a sports club in the Faroe Islands easier. Everything from apparel and equipment to printing and the club shop should live in one place, with personal service and quick communication.',
  },
  'about.p2': {
    fo: 'Vit hjálpa í øllum ítróttagreinum, og vit møta hvørjum felagi har tað er.',
    en: 'We help in every sport, and we meet each club where it is.',
  },
  'about.quote': {
    fo: '“Alt rundan um klæðir og útgerð skal vera lættari.”',
    en: '“Everything around kit and equipment should be easier.”',
  },
  'about.alt': { fo: 'Venjing í felag', en: 'Training together' },

  // ---- contact ----
  'contact.h1': { fo: 'Set teg í samband', en: 'Get in touch' },
  'contact.intro': { fo: 'Setið tykkum í samband við okkum — vit svara skjótt.', en: 'Reach out to us — we reply quickly.' },
  'contact.email': { fo: 'Teldupostur', en: 'Email' },
  'contact.phone': { fo: 'Telefon', en: 'Phone' },
  'contact.location': { fo: 'Staðseting', en: 'Location' },
  'contact.locationValue': { fo: 'Hoyvík, Føroyar', en: 'Hoyvík, Faroe Islands' },
  'contact.replyNote': { fo: 'Vit svara skjótt.', en: 'We reply quickly.' },
  'form.name': { fo: 'Navn', en: 'Name' },
  'form.club': { fo: 'Felag', en: 'Club' },
  'form.email': { fo: 'Teldupostur', en: 'Email' },
  'form.phone': { fo: 'Telefonnummar', en: 'Phone number' },
  'form.topic': { fo: 'Hvat hevur tú tørv á?', en: 'What do you need?' },
  'form.topic.other': { fo: 'Annað', en: 'Something else' },
  'form.message': { fo: 'Boð', en: 'Message' },
  'form.submit': { fo: 'Send fyrispurning', en: 'Send request' },
  'form.submitting': { fo: 'Sendir…', en: 'Sending…' },
  'form.success': { fo: 'Takk fyri tína fráboðan. Vit seta okkum í samband við teg skjótast gjørligt.', en: 'Thank you for your message. We will get back to you as soon as possible.' },
  'form.error': { fo: 'Onkur feilur hendi. Royn aftur seinni ella send teldupost til info@treyst.fo.', en: 'Something went wrong. Try again later or email info@treyst.fo.' },
  'form.required': { fo: 'Vinarliga fyll út allar skyldugu teigir.', en: 'Please fill in all required fields.' },
  'form.invalidEmail': { fo: 'Vinarliga skriva eina gilda teldupostadressu.', en: 'Please enter a valid email address.' },
  'form.mailSubject': { fo: 'Fyrispurningur frá', en: 'Enquiry from' },

  // ---- legal ----
  'meta.terms.title': { fo: 'Treytir', en: 'Terms' },
  'meta.terms.description': { fo: 'Treytir fyri nýtslu av treyst.fo.', en: 'Terms of use for treyst.fo.' },
  'meta.privacy.title': { fo: 'Privatlívspolitikkur', en: 'Privacy policy' },
  'meta.privacy.description': { fo: 'Hvussu TREYST viðger persónsupplýsingar.', en: 'How TREYST handles personal data.' },
  'legal.stubNote': {
    fo: 'Hetta er ein stutt frumútgáva. Fullgjørda útgávan verður løgd út seinni.',
    en: 'This is a short first version. The complete version will be published later.',
  },
  'legal.terms.p1': {
    fo: 'Innihaldið á treyst.fo er til kunningar. Vørur, tænastur og prísir kunnu broytast uttan fyriávaring.',
    en: 'The content on treyst.fo is for information. Products, services and prices may change without notice.',
  },
  'legal.terms.p2': {
    fo: 'Fyri spurningar um sáttmálar og treytir, set teg í samband við okkum á info@treyst.fo.',
    en: 'For questions about contracts and terms, contact us at info@treyst.fo.',
  },
  'legal.privacy.p1': {
    fo: 'TREYST viðger bert tær upplýsingar, sum tú sendir okkum í sambandi við fyrispurningar, og bert til at svara tínum fyrispurningi.',
    en: 'TREYST only processes the information you send us in connection with enquiries, and only to answer your enquiry.',
  },
  'legal.privacy.p2': {
    fo: 'Vit selja ella deila ikki tínar upplýsingar við triðjapart. Fyri spurningar, skriva til info@treyst.fo.',
    en: 'We do not sell or share your information with third parties. For questions, write to info@treyst.fo.',
  },

  // ---- 404 ----
  'notfound.title': { fo: 'Síðan varð ikki funnin.', en: 'Page not found.' },
  'notfound.desc': { fo: 'Síðan, sum tú leitaði eftir, er ikki til.', en: 'The page you were looking for does not exist.' },
  'notfound.home': { fo: 'Heim', en: 'Home' },
};

export default ui;
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `node --test tests/i18n.test.mjs`
Expected: all 6 tests pass.

- [ ] **Step 7: Run full suite**

Run: `npm test`
Expected: build + all tests pass.

- [ ] **Step 8: Commit**

```bash
git add site/src/i18n site/src/data/services.mjs site/tests/i18n.test.mjs
git commit -m "feat(site): FO/EN dictionaries, i18n utils and services data"
```

---

### Task 4: Nav, Footer, LanguageSwitcher, Button, Icon

**Files:**
- Create: `site/src/components/Icon.astro`, `site/src/components/Button.astro`, `site/src/components/LanguageSwitcher.astro`, `site/src/components/Nav.astro`, `site/src/components/Footer.astro`
- Modify: `site/src/i18n/ui.mjs` (add shared value keys), `site/src/styles/global.css` (nav scroll styles), `site/src/layouts/BaseLayout.astro` (render Nav + Footer, dictionary-driven skip link)
- Test: `site/tests/build.test.mjs` (extend)

**Interfaces:**
- Consumes: Task 3 i18n utils (`t`, `localizePath`), `services` data.
- Produces: `Nav`/`Footer` props `{ lang }`; `Icon` props `{ name: 'menu'|'close'|'chevron'|'arrow'|'mail'|'phone'|'pin'|'shirt'|'dumbbell'|'printer'|'cart'|'users'|'message'|'check', class? }`; `Button` props `{ href?, type?, variant: 'primary'|'ghost-light'|'ghost-dark'|'on-brand', class? }`; `LanguageSwitcher` props `{ lang }`.

- [ ] **Step 1: Extend tests first (failing)**

Append to `site/tests/build.test.mjs`:

```js
test('nav and footer render on home', async () => {
  const html = await readDist('index.html');
  assert.match(html, /data-nav/);
  assert.match(html, /Heim/);
  assert.match(html, /info@treyst\.fo/);
  assert.match(html, /href="\/en\/"/);
});

test('english nav links point to english pages', async () => {
  const html = await readDist('en/index.html');
  assert.match(html, /href="\/en\/about"/);
  assert.match(html, /href="\/en\/contact"/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — no `data-nav`, no footer email on built pages.

- [ ] **Step 2b: Add shared value keys to `site/src/i18n/ui.mjs`**

All contact values shown as visible text must come from the dictionary (Global Constraint). Insert after the `'lang.switchLabel'` entry:

```js
  'skip': { fo: 'Hoppa til innihalds', en: 'Skip to content' },
  'contact.emailValue': { fo: 'info@treyst.fo', en: 'info@treyst.fo' },
  'contact.phoneValue': { fo: '+298 504082', en: '+298 504082' },
```

(Hrefs such as `mailto:info@treyst.fo` remain literal — they are functional targets, not copy.)

- [ ] **Step 3: Create `site/src/components/Icon.astro`**

```astro
---
const { name, class: className = 'h-5 w-5' } = Astro.props;

const icons = {
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  shirt: '<path d="M20.4 8.5 16 6l-1-2H9L8 6 3.6 8.5a2 2 0 0 0-1 2.3l.7 2.7a1 1 0 0 0 1.2.7L8 13v7a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-7l3.5 1.2a1 1 0 0 0 1.2-.7l.7-2.7a2 2 0 0 0-1-2.3z"/>',
  dumbbell: '<path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/>',
  printer: '<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3h12v6"/><rect x="6" y="14" width="12" height="8" rx="1"/>',
  cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2 2h2l2.7 12.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L22 6H5"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
  message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
};
---
<svg
  xmlns="http://www.w3.org/2000/svg"
  class={className}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.5"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
  set:html={icons[name] ?? ''}
/>
```

- [ ] **Step 4: Create `site/src/components/Button.astro`**

```astro
---
const { href, type, variant = 'primary', class: className = '' } = Astro.props;

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-semibold transition-colors';
const variants = {
  primary: 'bg-brand text-white hover:bg-brand/90',
  'ghost-light': 'border-2 border-white/25 text-white hover:border-white/40 hover:bg-white/10',
  'ghost-dark': 'border-2 border-ink/15 text-ink hover:bg-ink/5',
  'on-brand': 'bg-white text-fjord hover:bg-fog',
};
const cls = `${base} ${variants[variant]} ${className}`;
---
{href
  ? <a href={href} class={cls}><slot /></a>
  : <button type={type ?? 'submit'} class={cls}><slot /></button>}
```

- [ ] **Step 5: Create `site/src/components/LanguageSwitcher.astro`**

```astro
---
import { switchLocalePath, t } from '../i18n/utils.mjs';

const { lang } = Astro.props;
const target = lang === 'fo' ? 'en' : 'fo';
const targetPath = switchLocalePath(Astro.url.pathname, target);
---
<a
  href={targetPath}
  hreflang={target}
  aria-label={t(lang, 'lang.switchLabel')}
  class="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-white/20 px-3 text-xs font-semibold tracking-wider text-white transition-colors hover:border-white/50"
>{t(lang, 'lang.switch')}</a>
```

- [ ] **Step 6: Create `site/src/components/Nav.astro`**

```astro
---
import Button from './Button.astro';
import Icon from './Icon.astro';
import LanguageSwitcher from './LanguageSwitcher.astro';
import { t, localizePath } from '../i18n/utils.mjs';
import { services } from '../data/services.mjs';

const { lang } = Astro.props;
const home = localizePath('/', lang);
const about = localizePath('/um-okkum', lang);
const contact = localizePath('/samband', lang);
const items = services.map((s) => ({
  id: s.id,
  href: localizePath(s.slugs.fo, lang),
  label: t(lang, `${s.key}.title`),
}));
const link = 'text-sm font-medium text-white/80 transition-colors hover:text-white';
---
<header class="site-nav fixed inset-x-0 top-0 z-50" data-nav>
  <div class="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
    <a href={home} class="font-display text-2xl font-extrabold tracking-[0.08em] text-white" aria-label="TREYST">TREYST</a>

    <nav class="hidden items-center gap-8 md:flex" aria-label={t(lang, 'nav.services')}>
      <a href={home} class={link}>{t(lang, 'nav.home')}</a>
      <div class="group relative">
        <button type="button" class={`${link} inline-flex items-center gap-1`} aria-haspopup="true">
          {t(lang, 'nav.services')}
          <Icon name="chevron" class="h-4 w-4" />
        </button>
        <div class="invisible absolute left-1/2 top-full w-60 -translate-x-1/2 pt-3 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
          <div class="rounded-2xl border border-white/10 bg-fjord-soft p-2 shadow-2xl">
            {items.map((item) => (
              <a href={item.href} class="block rounded-xl px-4 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/5 hover:text-white">
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>
      <a href={about} class={link}>{t(lang, 'nav.about')}</a>
      <a href={contact} class={link}>{t(lang, 'nav.contact')}</a>
    </nav>

    <div class="hidden items-center gap-4 md:flex">
      <LanguageSwitcher lang={lang} />
      <Button href={contact} variant="primary" class="px-5 py-2.5 text-sm">{t(lang, 'nav.cta')}</Button>
    </div>

    <div class="flex items-center gap-3 md:hidden">
      <LanguageSwitcher lang={lang} />
      <button type="button" class="text-white" aria-label={t(lang, 'nav.menu.open')} data-menu-open>
        <Icon name="menu" class="h-7 w-7" />
      </button>
    </div>
  </div>
</header>

<dialog data-menu class="h-dvh w-full max-w-none bg-fjord p-0 text-white backdrop:bg-fjord">
  <div class="flex h-dvh flex-col overflow-y-auto px-6 py-6">
    <div class="flex items-center justify-between">
      <span class="font-display text-2xl font-extrabold tracking-[0.08em]">TREYST</span>
      <button type="button" aria-label={t(lang, 'nav.menu.close')} data-menu-close class="text-white">
        <Icon name="close" class="h-7 w-7" />
      </button>
    </div>
    <nav class="mt-10 flex flex-col gap-6 text-2xl font-display font-bold" aria-label={t(lang, 'nav.services')}>
      <a href={home} class="hover:text-brand-bright">{t(lang, 'nav.home')}</a>
      <div>
        <div class="text-base font-semibold uppercase tracking-wider text-white/50">{t(lang, 'nav.services')}</div>
        <div class="mt-3 flex flex-col gap-3 text-xl">
          {items.map((item) => (
            <a href={item.href} class="hover:text-brand-bright">{item.label}</a>
          ))}
        </div>
      </div>
      <a href={about} class="hover:text-brand-bright">{t(lang, 'nav.about')}</a>
      <a href={contact} class="hover:text-brand-bright">{t(lang, 'nav.contact')}</a>
    </nav>
    <div class="mt-auto pt-10">
      <Button href={contact} variant="primary" class="w-full">{t(lang, 'nav.cta')}</Button>
      <div class="mt-6 flex items-center gap-3 text-sm text-white/60">
        <Icon name="mail" class="h-4 w-4" />
        <a href="mailto:info@treyst.fo" class="hover:text-white">{t(lang, 'contact.emailValue')}</a>
      </div>
    </div>
  </div>
</dialog>

<script>
  const header = document.querySelector('[data-nav]');
  const onScroll = () => header?.classList.toggle('is-scrolled', window.scrollY > 24);
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });

  const dialog = document.querySelector('[data-menu]');
  document.querySelector('[data-menu-open]')?.addEventListener('click', () => dialog?.showModal());
  document.querySelector('[data-menu-close]')?.addEventListener('click', () => dialog?.close());
  dialog?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => dialog.close()));
</script>
```

- [ ] **Step 7: Create `site/src/components/Footer.astro`**

```astro
---
import Icon from './Icon.astro';
import LanguageSwitcher from './LanguageSwitcher.astro';
import { t, localizePath } from '../i18n/utils.mjs';
import { services } from '../data/services.mjs';

const { lang } = Astro.props;
const year = new Date().getFullYear();
const items = services.map((s) => ({
  href: localizePath(s.slugs.fo, lang),
  label: t(lang, `${s.key}.title`),
}));
const pages = [
  { href: localizePath('/um-okkum', lang), label: t(lang, 'nav.about') },
  { href: localizePath('/samband', lang), label: t(lang, 'nav.contact') },
];
const legal = [
  { href: localizePath('/treytir', lang), label: t(lang, 'footer.terms') },
  { href: localizePath('/privatlivspolitikkur', lang), label: t(lang, 'footer.privacy') },
];
const heading = 'text-sm font-semibold uppercase tracking-wider text-white';
const link = 'text-sm text-white/70 transition-colors hover:text-white';
---
<footer class="bg-fjord">
  <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
    <div class="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
      <div>
        <div class="font-display text-2xl font-extrabold tracking-[0.08em] text-white">TREYST</div>
        <p class="mt-3 max-w-xs text-sm text-white/70">{t(lang, 'brand.tagline')}</p>
      </div>
      <div>
        <h3 class={heading}>{t(lang, 'footer.services')}</h3>
        <ul class="mt-4 space-y-2">
          {items.map((item) => <li><a href={item.href} class={link}>{item.label}</a></li>)}
        </ul>
      </div>
      <div>
        <h3 class={heading}>{t(lang, 'footer.pages')}</h3>
        <ul class="mt-4 space-y-2">
          {pages.map((item) => <li><a href={item.href} class={link}>{item.label}</a></li>)}
        </ul>
      </div>
      <div>
        <h3 class={heading}>{t(lang, 'footer.contact')}</h3>
        <ul class="mt-4 space-y-3 text-sm text-white/70">
          <li class="flex items-center gap-2">
            <Icon name="mail" class="h-4 w-4 shrink-0" />
            <a href="mailto:info@treyst.fo" class="transition-colors hover:text-white">{t(lang, 'contact.emailValue')}</a>
          </li>
          <li class="flex items-center gap-2">
            <Icon name="phone" class="h-4 w-4 shrink-0" />
            <a href="tel:+298504082" class="transition-colors hover:text-white">{t(lang, 'contact.phoneValue')}</a>
          </li>
          <li class="flex items-center gap-2">
            <Icon name="pin" class="h-4 w-4 shrink-0" />
            <span>{t(lang, 'contact.locationValue')}</span>
          </li>
        </ul>
        <div class="mt-5"><LanguageSwitcher lang={lang} /></div>
      </div>
    </div>
    <div class="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row sm:items-center">
      <p>© {year} TREYST · {t(lang, 'contact.locationValue')}. {t(lang, 'footer.rights')}</p>
      <ul class="flex flex-wrap gap-4">
        {legal.map((item) => <li><a href={item.href} class="transition-colors hover:text-white">{item.label}</a></li>)}
      </ul>
    </div>
  </div>
</footer>
```

- [ ] **Step 8: Add nav scroll styles to `site/src/styles/global.css`**

Append:

```css
.site-nav {
  transition: background-color 200ms ease, border-color 200ms ease;
  border-bottom: 1px solid transparent;
}
.site-nav.is-scrolled {
  background: color-mix(in srgb, var(--color-fjord) 92%, transparent);
  backdrop-filter: blur(8px);
  border-bottom-color: rgb(255 255 255 / 0.08);
}
dialog::backdrop { background: var(--color-fjord); }
```

- [ ] **Step 9: Wire Nav/Footer into `site/src/layouts/BaseLayout.astro`**

In the frontmatter add:

```js
import Nav from '../components/Nav.astro';
import Footer from '../components/Footer.astro';
```

In the body, replace `<main id="main"><slot /></main>` with:

```astro
<Nav lang={lang} />
<main id="main"><slot /></main>
<Footer lang={lang} />
```

- [ ] **Step 10: Run tests to verify they pass**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 11: Commit**

```bash
git add site/src site/tests
git commit -m "feat(site): nav, footer, language switcher, button and icon components"
```

---

### Task 5: Curate photos + photo map

**Files:**
- Create: `site/src/assets/photos/*.jpg` (7 files), `site/src/assets/photos/CREDITS.md`, `site/src/data/photos.mjs`
- Test: `site/tests/build.test.mjs` (extend)

**Interfaces:**
- Consumes: nothing.
- Produces: `photos` map from `site/src/data/photos.mjs` exporting Astro image metadata: keys `hero`, `apparel`, `equipment`, `printing`, `clubshop`, `about`, `philosophy`. Components import it and pass values to `astro:assets` `<Image src={...}>`.

Required files (exact names): `hero.jpg`, `apparel.jpg`, `equipment.jpg`, `printing.jpg`, `clubshop.jpg`, `about.jpg`, `philosophy.jpg`.

**Selection criteria:** landscape orientation, ≥ 1600 px wide, sports subjects (team sport action, kit/jersey detail, equipment, rowing/swimming/athletics), photorealistic, no visible watermark, no text overlays.

- [ ] **Step 1: Create the photo directory**

Run: `mkdir -p src/assets/photos`

- [ ] **Step 2: Download photos from Pexels**

The client's current site already uses two Pexels photos; start with those (verified working), then fill the rest with the search-driven procedure in Step 3.

```bash
curl -fL "https://images.pexels.com/photos/24286301/pexels-photo-24286301.png?auto=compress&cs=tinysrgb&w=1920" -o src/assets/photos/hero.jpg
curl -fL "https://images.pexels.com/photos/38134409/pexels-photo-38134409.jpeg?auto=compress&cs=tinysrgb&w=1920" -o src/assets/photos/philosophy.jpg
```

Note: Pexels serves the requested format regardless of the URL's file extension; if a download is actually PNG data saved to a `.jpg` name, re-run the Step 3 conversion command (`sips` re-encodes by extension).

- [ ] **Step 3: Source and download the remaining 5 photos**

For each target subject below, list candidates and take the first one that passes verification:

```bash
# Example for "equipment": search Pexels and extract candidate image URLs
curl -s "https://www.pexels.com/search/sports%20equipment/" \
  | grep -o 'https://images.pexels.com/photos/[0-9]*/pexels-photo-[0-9]*\.jpeg' \
  | sort -u | head -10
```

Targets and search pages to use:
| File | Pexels search page | Subject to pick |
|---|---|---|
| `apparel.jpg` | `https://www.pexels.com/search/football%20team%20jersey/` | team kit / jersey detail |
| `equipment.jpg` | `https://www.pexels.com/search/sports%20equipment/` | balls / gear on pitch or court |
| `printing.jpg` | `https://www.pexels.com/search/jersey%20printing/` | fabric / print / number detail |
| `clubshop.jpg` | `https://www.pexels.com/search/sports%20club%20match/` | club match atmosphere / players |
| `about.jpg` | `https://www.pexels.com/search/team%20training%20together/` | squad training together |

Download the chosen URL (append `?auto=compress&cs=tinysrgb&w=1920` if absent), then run the verification loop below. If nothing usable passes, fall back to any of the remaining URLs from the search list.

- [ ] **Step 4: Verify and normalize every photo**

Run this loop; it checks file type, converts to JPEG via `sips` if needed, and fails loudly if anything is missing or too small:

```bash
for f in hero apparel equipment printing clubshop about philosophy; do
  file "src/assets/photos/$f.jpg" | grep -qE 'JPEG|PNG' || { echo "BAD FILE: $f"; exit 1; }
  sips -s format jpeg "src/assets/photos/$f.jpg" --out "/tmp/treyst-$f.jpg" >/dev/null
  mv "/tmp/treyst-$f.jpg" "src/assets/photos/$f.jpg"
  w=$(sips -g pixelWidth "src/assets/photos/$f.jpg" | awk '/pixelWidth/ {print $2}')
  echo "$f: ${w}px"
  [ "$w" -ge 1600 ] || { echo "TOO SMALL: $f"; exit 1; }
done
```

Expected: 7 lines, each ≥ 1600px, no errors.

- [ ] **Step 5: Write `site/src/assets/photos/CREDITS.md`**

For each photo, record the file name, the Pexels photo page URL (`https://www.pexels.com/photo/<id>/`) and the license line:

```md
# Photo credits

All photos are sourced from Pexels (https://www.pexels.com/license/) — free to use,
no attribution required (credit kept here for traceability).

| File | Source |
|---|---|
| hero.jpg | https://www.pexels.com/photo/24286301/ |
| philosophy.jpg | https://www.pexels.com/photo/38134409/ |
| apparel.jpg | <!-- paste the photo page URL you picked --> |
| equipment.jpg | <!-- paste the photo page URL you picked --> |
| printing.jpg | <!-- paste the photo page URL you picked --> |
| clubshop.jpg | <!-- paste the photo page URL you picked --> |
| about.jpg | <!-- paste the photo page URL you picked --> |
```

Replace each `<!-- … -->` comment with the actual `https://www.pexels.com/photo/<id>/` URL used in Step 3 — no comments may remain.

- [ ] **Step 6: Create `site/src/data/photos.mjs`**

```js
import hero from '../assets/photos/hero.jpg';
import apparel from '../assets/photos/apparel.jpg';
import equipment from '../assets/photos/equipment.jpg';
import printing from '../assets/photos/printing.jpg';
import clubshop from '../assets/photos/clubshop.jpg';
import about from '../assets/photos/about.jpg';
import philosophy from '../assets/photos/philosophy.jpg';

export const photos = { hero, apparel, equipment, printing, clubshop, about, philosophy };
```

- [ ] **Step 7: Extend tests (photo presence)**

Append to `site/tests/build.test.mjs`:

```js
import { access } from 'node:fs/promises';

test('all photo assets exist and are non-trivial in size', async () => {
  const names = ['hero', 'apparel', 'equipment', 'printing', 'clubshop', 'about', 'philosophy'];
  for (const name of names) {
    const url = new URL(`../src/assets/photos/${name}.jpg`, import.meta.url);
    await access(url); // throws if missing
  }
});
```

- [ ] **Step 8: Run tests**

Run: `npm test`
Expected: build + all tests pass (photos are not yet rendered anywhere; they are validated in later tasks).

- [ ] **Step 9: Commit**

```bash
git add site/src/assets/photos site/src/data/photos.mjs site/tests/build.test.mjs
git commit -m "feat(site): curated photo assets and photo map"
```

---

### Task 6: Home part 1 — Hero, SportStrip, ServicesGrid

**Files:**
- Create: `site/src/components/Reveal.astro`, `site/src/components/SectionHeading.astro`, `site/src/components/Hero.astro`, `site/src/components/SportStrip.astro`, `site/src/components/ServiceCard.astro`, `site/src/components/ServicesGrid.astro`
- Modify: `site/src/pages/index.astro`, `site/src/pages/en/index.astro`
- Test: `site/tests/build.test.mjs` (extend)

**Interfaces:**
- Consumes: Tasks 3–5 (i18n, services, photos).
- Produces: `Reveal` props `{ delay?: 0|1|2|3, class? }`; `SectionHeading` props `{ eyebrow?, title, lede?, align?: 'left'|'center', dark?: boolean }`; `Hero`/`SportStrip`/`ServicesGrid` props `{ lang }`; `ServiceCard` props `{ lang, service }`.

- [ ] **Step 1: Extend tests first (failing)**

Append to `site/tests/build.test.mjs`:

```js
test('home hero and services render (FO)', async () => {
  const html = await readDist('index.html');
  assert.match(html, /Minni umsiting\. Meira ítrótt\./);
  assert.match(html, /føroyskan ítrótt\./);
  assert.match(html, /href="\/klaedir"/);
  assert.match(html, /href="\/utgerd"/);
  assert.match(html, /href="\/prenting"/);
  assert.match(html, /href="\/club-shop"/);
});

test('home hero and services render (EN)', async () => {
  const html = await readDist('en/index.html');
  assert.match(html, /Faroese sport\./);
  assert.match(html, /href="\/en\/apparel"/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — hero copy missing.

- [ ] **Step 3: Create `site/src/components/Reveal.astro`**

```astro
---
const { delay = 0, class: className = '' } = Astro.props;
---
<div data-reveal data-reveal-delay={delay > 0 ? delay : undefined} class={className}>
  <slot />
</div>
```

- [ ] **Step 4: Create `site/src/components/SectionHeading.astro`**

```astro
---
const { eyebrow, title, lede, align = 'left', dark = false } = Astro.props;
const centered = align === 'center';
---
<div class:list={['max-w-3xl', centered && 'mx-auto text-center']}>
  {eyebrow && (
    <div class:list={['mb-4 flex items-center gap-4', centered && 'justify-center']}>
      <span class:list={['h-px w-12', dark ? 'bg-brand-bright' : 'bg-brand']} />
      <span class:list={['text-sm font-semibold uppercase tracking-wider', dark ? 'text-brand-bright' : 'text-brand']}>{eyebrow}</span>
    </div>
  )}
  <h2 class:list={['text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl', dark ? 'text-white' : 'text-ink']}>{title}</h2>
  {lede && <p class:list={['mt-5 text-lg', dark ? 'text-white/70' : 'text-ink/70']}>{lede}</p>}
</div>
```

- [ ] **Step 5: Create `site/src/components/Hero.astro`**

```astro
---
import { Image } from 'astro:assets';
import Button from './Button.astro';
import Icon from './Icon.astro';
import Reveal from './Reveal.astro';
import { photos } from '../data/photos.mjs';
import { t, localizePath } from '../i18n/utils.mjs';

const { lang } = Astro.props;
const contact = localizePath('/samband', lang);
---
<section class="relative flex min-h-[92vh] items-center overflow-hidden bg-fjord pt-20">
  <Image
    src={photos.hero}
    alt={t(lang, 'home.heroAlt')}
    widths={[800, 1280, 1920]}
    sizes="100vw"
    loading="eager"
    fetchpriority="high"
    class="absolute inset-0 h-full w-full object-cover opacity-30"
  />
  <div class="absolute inset-0 bg-gradient-to-br from-fjord via-fjord/90 to-fjord-soft/80"></div>
  <div class="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl py-24">
      <Reveal>
        <span class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 backdrop-blur-sm">
          <span class="h-2 w-2 animate-pulse rounded-full bg-brand-bright"></span>
          <span class="text-xs font-semibold uppercase tracking-wider text-white/90">{t(lang, 'home.badge')}</span>
        </span>
      </Reveal>
      <Reveal delay={1}>
        <h1 class="mt-6 text-5xl font-extrabold leading-[1.05] tracking-tight text-white md:text-6xl lg:text-7xl">
          {t(lang, 'home.h1a')} <span class="text-brand-bright">{t(lang, 'home.h1b')}</span>
        </h1>
      </Reveal>
      <Reveal delay={2}>
        <p class="mt-7 max-w-2xl text-lg font-light leading-relaxed text-white/75 md:text-xl">{t(lang, 'home.intro')}</p>
      </Reveal>
      <Reveal delay={3}>
        <div class="mt-10 flex flex-col gap-4 sm:flex-row">
          <Button href={contact} variant="primary">
            {t(lang, 'home.ctaPrimary')} <Icon name="arrow" class="h-5 w-5" />
          </Button>
          <Button href="#taenastur" variant="ghost-light">{t(lang, 'home.ctaSecondary')}</Button>
        </div>
      </Reveal>
    </div>
  </div>
</section>
```

- [ ] **Step 6: Create `site/src/components/SportStrip.astro`**

```astro
---
import { t } from '../i18n/utils.mjs';

const { lang } = Astro.props;
const items = t(lang, 'sports.items');
---
<section class="border-b border-ink/5 bg-fog py-10">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <p class="text-center text-xs font-semibold uppercase tracking-[0.2em] text-ink/70">{t(lang, 'sports.label')}</p>
    <ul class="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
      {items.map((item) => (
        <li class="font-display text-lg font-bold uppercase tracking-wide text-ink/70">{item}</li>
      ))}
    </ul>
  </div>
</section>
```

- [ ] **Step 7: Create `site/src/components/ServiceCard.astro`**

```astro
---
import { Image } from 'astro:assets';
import Icon from './Icon.astro';
import { photos } from '../data/photos.mjs';
import { t } from '../i18n/utils.mjs';

const { lang, service } = Astro.props;
const title = t(lang, `${service.key}.title`);
const desc = t(lang, `${service.key}.desc`);
const href = service.slugs[lang] ?? service.slugs.fo;
---
<a
  href={href}
  class="group flex h-full flex-col overflow-hidden rounded-3xl border border-ink/5 bg-white transition-shadow duration-300 hover:shadow-xl"
>
  <div class="relative aspect-[4/3] overflow-hidden">
    <Image
      src={photos[service.image]}
      alt=""
      widths={[480, 800]}
      sizes="(min-width: 1024px) 40vw, 100vw"
      loading="lazy"
      class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
    />
  </div>
  <div class="flex flex-1 flex-col p-7">
    <div class="flex items-center gap-3">
      <Icon name={service.icon} class="h-6 w-6 shrink-0 text-brand" />
      <h3 class="text-2xl font-bold text-ink">{title}</h3>
    </div>
    <p class="mt-3 flex-1 leading-relaxed text-ink/70">{desc}</p>
    <span class="mt-6 inline-flex items-center gap-2 font-semibold text-brand">
      {t(lang, 'common.learnMore')}
      <Icon name="arrow" class="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
    </span>
  </div>
</a>
```

- [ ] **Step 8: Create `site/src/components/ServicesGrid.astro`**

```astro
---
import Reveal from './Reveal.astro';
import SectionHeading from './SectionHeading.astro';
import ServiceCard from './ServiceCard.astro';
import { services } from '../data/services.mjs';
import { t } from '../i18n/utils.mjs';

const { lang } = Astro.props;
---
<section id="taenastur" class="bg-white py-24 lg:py-32">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <SectionHeading eyebrow={t(lang, 'services.eyebrow')} title={t(lang, 'services.title')} />
    <div class="mt-16 grid gap-8 md:grid-cols-2">
      {services.map((service, i) => (
        <Reveal delay={i % 2} class="h-full">
          <ServiceCard lang={lang} service={service} />
        </Reveal>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 9: Assemble the FO home page — rewrite `site/src/pages/index.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Hero from '../components/Hero.astro';
import SportStrip from '../components/SportStrip.astro';
import ServicesGrid from '../components/ServicesGrid.astro';
import { t } from '../i18n/utils.mjs';

const lang = 'fo';
---
<BaseLayout
  lang={lang}
  title={t(lang, 'meta.home.title')}
  description={t(lang, 'meta.home.description')}
  path="/"
  altPath="/en/"
>
  <Hero lang={lang} />
  <SportStrip lang={lang} />
  <ServicesGrid lang={lang} />
</BaseLayout>
```

- [ ] **Step 10: Assemble the EN home page — rewrite `site/src/pages/en/index.astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import Hero from '../../components/Hero.astro';
import SportStrip from '../../components/SportStrip.astro';
import ServicesGrid from '../../components/ServicesGrid.astro';
import { t } from '../../i18n/utils.mjs';

const lang = 'en';
---
<BaseLayout
  lang={lang}
  title={t(lang, 'meta.home.title')}
  description={t(lang, 'meta.home.description')}
  path="/en/"
  altPath="/"
>
  <Hero lang={lang} />
  <SportStrip lang={lang} />
  <ServicesGrid lang={lang} />
</BaseLayout>
```

- [ ] **Step 11: Run tests to verify they pass**

Run: `npm test`
Expected: all tests pass (image optimization runs during build; first build may take longer).

- [ ] **Step 12: Commit**

```bash
git add site/src site/tests
git commit -m "feat(site): home hero, sports strip and services grid"
```

---

### Task 7: Home part 2 — Values, Philosophy, Process, CTA + HomePage

**Files:**
- Create: `site/src/components/ValuesSection.astro`, `site/src/components/PhilosophySection.astro`, `site/src/components/ProcessSteps.astro`, `site/src/components/CtaBand.astro`, `site/src/components/HomePage.astro`
- Modify: `site/src/pages/index.astro`, `site/src/pages/en/index.astro`
- Test: `site/tests/build.test.mjs` (extend)

**Interfaces:**
- Consumes: Tasks 3–6.
- Produces: `ValuesSection`, `PhilosophySection`, `ProcessSteps`, `CtaBand`, `HomePage` — all props `{ lang }`.

- [ ] **Step 1: Extend tests first (failing)**

Append to `site/tests/build.test.mjs`:

```js
test('home values, philosophy, process and cta render (FO)', async () => {
  const html = await readDist('index.html');
  assert.match(html, /Alt á einum stað\./);
  assert.match(html, /TREYST er ein viðleikari\./);
  assert.match(html, /Hvussu vit arbeiða/);
  assert.match(html, /Ger gerandisdagin lættari/);
});

test('home values, philosophy, process and cta render (EN)', async () => {
  const html = await readDist('en/index.html');
  assert.match(html, /All in one place\./);
  assert.match(html, /TREYST is a teammate\./);
  assert.match(html, /How we work/);
  assert.match(html, /Make everyday easier/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — sections missing.

- [ ] **Step 3: Create `site/src/components/ValuesSection.astro`**

```astro
---
import Icon from './Icon.astro';
import Reveal from './Reveal.astro';
import SectionHeading from './SectionHeading.astro';
import { t } from '../i18n/utils.mjs';

const { lang } = Astro.props;
const values = [
  { icon: 'users', title: t(lang, 'values.personal.title'), desc: t(lang, 'values.personal.desc') },
  { icon: 'message', title: t(lang, 'values.comms.title'), desc: t(lang, 'values.comms.desc') },
  { icon: 'check', title: t(lang, 'values.simple.title'), desc: t(lang, 'values.simple.desc') },
];
---
<section class="bg-fog py-24 lg:py-28">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <SectionHeading align="center" title={t(lang, 'values.title')} lede={t(lang, 'values.sub')} />
    <div class="mt-16 grid gap-8 md:grid-cols-3">
      {values.map((value, i) => (
        <Reveal delay={i} class="h-full">
          <div class="flex h-full flex-col rounded-2xl border border-ink/5 bg-white p-8 shadow-sm">
            <div class="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Icon name={value.icon} class="h-7 w-7" />
            </div>
            <h3 class="text-xl font-bold text-ink">{value.title}</h3>
            <p class="mt-3 leading-relaxed text-ink/70">{value.desc}</p>
          </div>
        </Reveal>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 4: Create `site/src/components/PhilosophySection.astro`**

```astro
---
import { Image } from 'astro:assets';
import Reveal from './Reveal.astro';
import { photos } from '../data/photos.mjs';
import { t } from '../i18n/utils.mjs';

const { lang } = Astro.props;
---
<section class="overflow-hidden bg-fjord py-24 lg:py-32">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div class="grid items-center gap-16 lg:grid-cols-2">
      <Reveal>
        <div>
          <h2 class="text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl">
            {t(lang, 'philosophy.statement')}
            <br />
            <span class="text-brand-bright">{t(lang, 'philosophy.accent')}</span>
          </h2>
          <p class="mt-8 text-lg font-light leading-relaxed text-white/70">{t(lang, 'philosophy.support')}</p>
          <div class="mt-10 rounded-2xl border-l-4 border-brand-bright bg-fjord-soft p-8">
            <p class="font-display text-2xl font-bold leading-snug text-white md:text-3xl">{t(lang, 'philosophy.quote')}</p>
          </div>
        </div>
      </Reveal>
      <Reveal delay={1}>
        <div class="relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/10">
          <Image
            src={photos.philosophy}
            alt={t(lang, 'philosophy.alt')}
            widths={[600, 960]}
            sizes="(min-width: 1024px) 45vw, 100vw"
            loading="lazy"
            class="h-full w-full object-cover"
          />
        </div>
      </Reveal>
    </div>
  </div>
</section>
```

- [ ] **Step 5: Create `site/src/components/ProcessSteps.astro`**

```astro
---
import Reveal from './Reveal.astro';
import SectionHeading from './SectionHeading.astro';
import { t } from '../i18n/utils.mjs';

const { lang } = Astro.props;
const steps = [1, 2, 3, 4].map((n) => ({
  title: t(lang, `process.s${n}.title`),
  desc: t(lang, `process.s${n}.desc`),
}));
---
<section class="bg-white py-24 lg:py-28">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <SectionHeading title={t(lang, 'process.title')} />
    <ol class="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((step, i) => (
        <li class="border-t border-ink/10 pt-6">
          <Reveal delay={i % 4}>
            <span class="font-display text-5xl font-extrabold text-brand/80">0{i + 1}</span>
            <h3 class="mt-4 text-xl font-bold text-ink">{step.title}</h3>
            <p class="mt-2 leading-relaxed text-ink/70">{step.desc}</p>
          </Reveal>
        </li>
      ))}
    </ol>
  </div>
</section>
```

- [ ] **Step 6: Create `site/src/components/CtaBand.astro`**

```astro
---
import Button from './Button.astro';
import Icon from './Icon.astro';
import { t, localizePath } from '../i18n/utils.mjs';

const { lang } = Astro.props;
const contact = localizePath('/samband', lang);
---
<section class="bg-brand py-20">
  <div class="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
    <h2 class="text-4xl font-bold tracking-tight text-white md:text-5xl">{t(lang, 'cta.title')}</h2>
    <p class="mt-4 text-lg text-white">{t(lang, 'cta.desc')}</p>
    <div class="mt-8 flex justify-center">
      <Button href={contact} variant="on-brand">
        {t(lang, 'cta.button')} <Icon name="arrow" class="h-5 w-5" />
      </Button>
    </div>
  </div>
</section>
```

- [ ] **Step 7: Create `site/src/components/HomePage.astro`**

```astro
---
import Hero from './Hero.astro';
import SportStrip from './SportStrip.astro';
import ServicesGrid from './ServicesGrid.astro';
import ValuesSection from './ValuesSection.astro';
import PhilosophySection from './PhilosophySection.astro';
import ProcessSteps from './ProcessSteps.astro';
import CtaBand from './CtaBand.astro';

const { lang } = Astro.props;
---
<Hero lang={lang} />
<SportStrip lang={lang} />
<ServicesGrid lang={lang} />
<ValuesSection lang={lang} />
<PhilosophySection lang={lang} />
<ProcessSteps lang={lang} />
<CtaBand lang={lang} />
```

- [ ] **Step 8: Point both home pages at `HomePage`**

Replace the body of `site/src/pages/index.astro` (frontmatter + template) with:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import HomePage from '../components/HomePage.astro';
import { t } from '../i18n/utils.mjs';

const lang = 'fo';
---
<BaseLayout
  lang={lang}
  title={t(lang, 'meta.home.title')}
  description={t(lang, 'meta.home.description')}
  path="/"
  altPath="/en/"
>
  <HomePage lang={lang} />
</BaseLayout>
```

Replace the body of `site/src/pages/en/index.astro` with:

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import HomePage from '../../components/HomePage.astro';
import { t } from '../../i18n/utils.mjs';

const lang = 'en';
---
<BaseLayout
  lang={lang}
  title={t(lang, 'meta.home.title')}
  description={t(lang, 'meta.home.description')}
  path="/en/"
  altPath="/"
>
  <HomePage lang={lang} />
</BaseLayout>
```

- [ ] **Step 9: Run tests to verify they pass**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 10: Commit**

```bash
git add site/src site/tests
git commit -m "feat(site): complete home page with values, philosophy, process and cta"
```

---

### Task 8: Service page template + Klæðir + Útgerð

**Files:**
- Create: `site/src/components/PageHero.astro`, `site/src/components/CapabilityGrid.astro`, `site/src/components/Accordion.astro`, `site/src/components/RelatedServices.astro`, `site/src/components/ServicePage.astro`
- Create: `site/src/pages/klaedir.astro`, `site/src/pages/utgerd.astro`, `site/src/pages/en/apparel.astro`, `site/src/pages/en/equipment.astro`
- Test: `site/tests/build.test.mjs` (extend)

**Interfaces:**
- Consumes: Tasks 3–7 (`t`, `serviceById`, `otherServices`, `photos`, `localizePath`, `CtaBand`, `SectionHeading`, `Reveal`).
- Produces: `ServicePage` props `{ lang, id }` used by all four service routes; `PageHero` props `{ lang, eyebrow, title, lede, image? }`; `CapabilityGrid` props `{ title, items: {title,text}[] }`; `Accordion` props `{ items: {q,a}[] }`; `RelatedServices` props `{ lang, excludeId, title }`.

- [ ] **Step 1: Extend tests first (failing)**

Append to `site/tests/build.test.mjs`:

```js
test('apparel page renders (FO)', async () => {
  const html = await readDist('klaedir/index.html');
  assert.match(html, /Klæðir til ítróttafeløg/);
  assert.match(html, /Liðbúni/);
  assert.match(html, /<details/);
  assert.match(html, /href="\/samband"/);
});

test('equipment page renders (EN)', async () => {
  const html = await readDist('en/equipment/index.html');
  assert.match(html, /Equipment for sports clubs/);
  assert.match(html, /href="\/en\/contact"/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — pages missing.

- [ ] **Step 3: Create `site/src/components/PageHero.astro`**

```astro
---
import { Image } from 'astro:assets';
import { t, localizePath } from '../i18n/utils.mjs';

const { lang, eyebrow, title, lede, image } = Astro.props;
const home = localizePath('/', lang);
---
<section class="relative overflow-hidden bg-fjord pt-20">
  {image && (
    <Image
      src={image}
      alt=""
      widths={[800, 1280, 1920]}
      sizes="100vw"
      loading="eager"
      fetchpriority="high"
      class="absolute inset-0 h-full w-full object-cover opacity-25"
    />
  )}
  <div class="absolute inset-0 bg-gradient-to-b from-fjord/95 via-fjord/85 to-fjord"></div>
  <div class="relative mx-auto max-w-7xl px-4 pb-20 pt-14 sm:px-6 lg:px-8 lg:pb-24">
    <nav aria-label="Breadcrumb">
      <ol class="flex items-center gap-2 text-sm text-white/60">
        <li><a href={home} class="transition-colors hover:text-white">{t(lang, 'nav.home')}</a></li>
        <li aria-hidden="true">/</li>
        <li class="text-white/90">{title}</li>
      </ol>
    </nav>
    <p class="mt-8 text-sm font-semibold uppercase tracking-wider text-brand-bright">{eyebrow}</p>
    <h1 class="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-white md:text-5xl lg:text-6xl">{title}</h1>
    {lede && <p class="mt-6 max-w-2xl text-lg font-light leading-relaxed text-white/75">{lede}</p>}
  </div>
</section>
```

- [ ] **Step 4: Create `site/src/components/CapabilityGrid.astro`**

```astro
---
import Icon from './Icon.astro';
import Reveal from './Reveal.astro';
import SectionHeading from './SectionHeading.astro';

const { title, items } = Astro.props;
---
<section class="bg-white py-24">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <SectionHeading title={title} />
    <div class="mt-14 grid gap-6 md:grid-cols-2">
      {items.map((item, i) => (
        <Reveal delay={i % 2} class="h-full">
          <div class="flex h-full gap-5 rounded-2xl border border-ink/5 bg-fog p-7">
            <div class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Icon name="check" class="h-6 w-6" />
            </div>
            <div>
              <h3 class="text-xl font-bold text-ink">{item.title}</h3>
              <p class="mt-2 leading-relaxed text-ink/70">{item.text}</p>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 5: Create `site/src/components/Accordion.astro`**

```astro
---
import Icon from './Icon.astro';

const { items } = Astro.props;
---
<div class="divide-y divide-ink/10 border-y border-ink/10">
  {items.map((item) => (
    <details class="group">
      <summary class="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left text-lg font-semibold text-ink [&::-webkit-details-marker]:hidden">
        {item.q}
        <Icon name="chevron" class="h-5 w-5 shrink-0 text-brand transition-transform duration-300 group-open:rotate-180" />
      </summary>
      <p class="pb-6 pr-10 leading-relaxed text-ink/70">{item.a}</p>
    </details>
  ))}
</div>
```

- [ ] **Step 6: Create `site/src/components/RelatedServices.astro`**

```astro
---
import Icon from './Icon.astro';
import Reveal from './Reveal.astro';
import SectionHeading from './SectionHeading.astro';
import { otherServices } from '../data/services.mjs';
import { t, localizePath } from '../i18n/utils.mjs';

const { lang, excludeId, title } = Astro.props;
const items = otherServices(excludeId).map((s) => ({
  href: localizePath(s.slugs.fo, lang),
  label: t(lang, `${s.key}.title`),
  icon: s.icon,
}));
---
<section class="bg-fog py-20">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <SectionHeading title={title} />
    <div class="mt-10 grid gap-6 md:grid-cols-3">
      {items.map((item, i) => (
        <Reveal delay={i % 3}>
          <a href={item.href} class="group flex items-center gap-4 rounded-2xl border border-ink/5 bg-white p-6 transition-shadow hover:shadow-lg">
            <Icon name={item.icon} class="h-6 w-6 shrink-0 text-brand" />
            <span class="font-display text-lg font-bold text-ink">{item.label}</span>
            <Icon name="arrow" class="ml-auto h-4 w-4 text-ink/40 transition-transform group-hover:translate-x-1" />
          </a>
        </Reveal>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 7: Create `site/src/components/ServicePage.astro`**

```astro
---
import PageHero from './PageHero.astro';
import CapabilityGrid from './CapabilityGrid.astro';
import Accordion from './Accordion.astro';
import RelatedServices from './RelatedServices.astro';
import CtaBand from './CtaBand.astro';
import SectionHeading from './SectionHeading.astro';
import { serviceById } from '../data/services.mjs';
import { photos } from '../data/photos.mjs';
import { t } from '../i18n/utils.mjs';

const { lang, id } = Astro.props;
const service = serviceById(id);
const base = `svc.${id}`;
---
<PageHero
  lang={lang}
  eyebrow={t(lang, `${base}.eyebrow`)}
  title={t(lang, `${base}.h1`)}
  lede={t(lang, `${base}.intro`)}
  image={photos[service.image]}
/>
<CapabilityGrid title={t(lang, 'svc.capabilities')} items={t(lang, `${base}.capabilities`)} />
<section class="bg-white pb-24">
  <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
    <SectionHeading title={t(lang, 'svc.details')} />
    <div class="mt-10"><Accordion items={t(lang, `${base}.details`)} /></div>
  </div>
</section>
<RelatedServices lang={lang} excludeId={id} title={t(lang, 'svc.related')} />
<CtaBand lang={lang} />
```

- [ ] **Step 8: Create the four route wrappers**

`site/src/pages/klaedir.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import ServicePage from '../components/ServicePage.astro';
import { t } from '../i18n/utils.mjs';

const lang = 'fo';
const id = 'apparel';
---
<BaseLayout
  lang={lang}
  title={t(lang, `meta.${id}.title`)}
  description={t(lang, `meta.${id}.description`)}
  path="/klaedir"
  altPath="/en/apparel"
>
  <ServicePage lang={lang} id={id} />
</BaseLayout>
```

`site/src/pages/utgerd.astro`: same as above with `id = 'equipment'`, `path="/utgerd"`, `altPath="/en/equipment"`.

`site/src/pages/en/apparel.astro`:
```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import ServicePage from '../../components/ServicePage.astro';
import { t } from '../../i18n/utils.mjs';

const lang = 'en';
const id = 'apparel';
---
<BaseLayout
  lang={lang}
  title={t(lang, `meta.${id}.title`)}
  description={t(lang, `meta.${id}.description`)}
  path="/en/apparel"
  altPath="/klaedir"
>
  <ServicePage lang={lang} id={id} />
</BaseLayout>
```

`site/src/pages/en/equipment.astro`: same with `id = 'equipment'`, `path="/en/equipment"`, `altPath="/utgerd"`.

- [ ] **Step 9: Run tests to verify they pass**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 10: Commit**

```bash
git add site/src site/tests
git commit -m "feat(site): service page template with apparel and equipment pages"
```

---

### Task 9: Prenting page + Jersey customizer

**Files:**
- Create: `site/src/components/JerseyCustomizer.astro`
- Create: `site/src/pages/prenting.astro`, `site/src/pages/en/printing.astro`
- Modify: `site/src/i18n/ui.mjs` (color label keys), `site/src/components/ServicePage.astro` (render customizer on printing)
- Test: `site/tests/build.test.mjs` (extend)

**Interfaces:**
- Consumes: Task 8 `ServicePage`, Task 3 i18n.
- Produces: `JerseyCustomizer` props `{ lang }`.

- [ ] **Step 1: Extend tests first (failing)**

Append to `site/tests/build.test.mjs`:

```js
test('printing page includes the jersey customizer (FO)', async () => {
  const html = await readDist('prenting/index.html');
  assert.match(html, /data-customizer/);
  assert.match(html, /data-jersey-body/);
  assert.match(html, /data-name-input/);
  assert.match(html, /name="jersey-color"/);
});

test('printing page includes the jersey customizer (EN)', async () => {
  const html = await readDist('en/printing/index.html');
  assert.match(html, /data-customizer/);
  assert.match(html, /Try it yourself/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `prenting/index.html` does not exist yet.

- [ ] **Step 3: Add color label keys to `site/src/i18n/ui.mjs`**

Insert into the printing section (after `'customizer.jerseyAlt'`):

```js
  'color.white': { fo: 'Hvítur', en: 'White' },
  'color.dark': { fo: 'Svartur', en: 'Black' },
  'color.teal': { fo: 'Grønur', en: 'Green' },
  'color.mint': { fo: 'Mint', en: 'Mint' },
  'color.light': { fo: 'Ljósur', en: 'Light' },
```

- [ ] **Step 4: Create `site/src/components/JerseyCustomizer.astro`**

```astro
---
import SectionHeading from './SectionHeading.astro';
import { t } from '../i18n/utils.mjs';

const { lang } = Astro.props;
const colors = [
  { hex: '#FFFFFF', key: 'color.white' },
  { hex: '#0C1512', key: 'color.dark' },
  { hex: '#0F766E', key: 'color.teal' },
  { hex: '#2DD4BF', key: 'color.mint' },
  { hex: '#F6F5F1', key: 'color.light' },
];
---
<section class="bg-fog py-24">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <SectionHeading align="center" title={t(lang, 'customizer.title')} lede={t(lang, 'customizer.sub')} />
    <div class="mt-14 grid items-center gap-12 lg:grid-cols-2" data-customizer>
      <div class="flex justify-center">
        <svg viewBox="0 0 200 220" class="w-full max-w-sm" role="img" aria-label={t(lang, 'customizer.jerseyAlt')}>
          <path
            data-jersey-body
            d="M70 24c0 0 8 10 30 10s30-10 30-10l32 14 20 36-30 14-10-16v124H58V72l-10 16-30-14 20-36z"
            fill="#FFFFFF"
            stroke="rgba(16,24,20,0.15)"
            stroke-width="2"
          />
          <text data-jersey-name x="100" y="170" text-anchor="middle" font-size="15" font-weight="600" letter-spacing="2" fill="#101814" font-family="Archivo Variable, sans-serif">TREYST</text>
          <text data-jersey-number x="100" y="150" text-anchor="middle" font-size="52" font-weight="800" fill="#101814" font-family="Archivo Variable, sans-serif">10</text>
        </svg>
      </div>
      <div>
        <fieldset>
          <legend class="text-sm font-semibold uppercase tracking-wider text-ink/60">{t(lang, 'customizer.color')}</legend>
          <div class="mt-4 flex flex-wrap gap-3">
            {colors.map((color, i) => (
              <label class="cursor-pointer">
                <input
                  type="radio"
                  name="jersey-color"
                  value={color.hex}
                  data-color-input
                  class="peer sr-only"
                  checked={i === 0}
                />
                <span
                  class="block h-11 w-11 rounded-full border-2 border-ink/10 transition peer-checked:border-brand peer-checked:ring-2 peer-checked:ring-brand/30 peer-focus-visible:ring-2 peer-focus-visible:ring-ink peer-focus-visible:ring-offset-2"
                  style={`background:${color.hex}`}
                />
                <span class="sr-only">{t(lang, color.key)}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div class="mt-8 grid gap-6 sm:grid-cols-2">
          <label class="block">
            <span class="text-sm font-semibold uppercase tracking-wider text-ink/60">{t(lang, 'customizer.name')}</span>
            <input data-name-input type="text" maxlength="12" value="TREYST" class="mt-2 w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-ink" />
          </label>
          <label class="block">
            <span class="text-sm font-semibold uppercase tracking-wider text-ink/60">{t(lang, 'customizer.number')}</span>
            <input data-number-input type="text" inputmode="numeric" maxlength="2" value="10" class="mt-2 w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-ink" />
          </label>
        </div>
      </div>
    </div>
  </div>
</section>

<script>
  const root = document.querySelector('[data-customizer]');
  if (root) {
    const body = root.querySelector('[data-jersey-body]');
    const nameEl = root.querySelector('[data-jersey-name]');
    const numEl = root.querySelector('[data-jersey-number]');

    const contrast = (hex) => {
      const n = parseInt(hex.slice(1), 16);
      const r = (n >> 16) & 255;
      const g = (n >> 8) & 255;
      const b = n & 255;
      return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.6 ? '#101814' : '#FFFFFF';
    };

    const update = () => {
      const checked = root.querySelector('input[name="jersey-color"]:checked');
      const hex = checked ? checked.value : '#FFFFFF';
      const fg = contrast(hex);
      body.setAttribute('fill', hex);
      nameEl.setAttribute('fill', fg);
      numEl.setAttribute('fill', fg);
    };

    root.querySelectorAll('[data-color-input]').forEach((el) => el.addEventListener('change', update));

    root.querySelector('[data-name-input]').addEventListener('input', (e) => {
      nameEl.textContent = e.target.value.toUpperCase() || 'TREYST';
    });

    root.querySelector('[data-number-input]').addEventListener('input', (e) => {
      numEl.textContent = e.target.value.replace(/\D/g, '').slice(0, 2) || '10';
    });

    update();
  }
</script>
```

- [ ] **Step 5: Render the customizer on the printing service page**

In `site/src/components/ServicePage.astro`, add to the frontmatter:

```js
import JerseyCustomizer from './JerseyCustomizer.astro';
```

Directly after `<CapabilityGrid … />`, insert:

```astro
{id === 'printing' && <JerseyCustomizer lang={lang} />}
```

- [ ] **Step 6: Create `site/src/pages/prenting.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import ServicePage from '../components/ServicePage.astro';
import { t } from '../i18n/utils.mjs';

const lang = 'fo';
const id = 'printing';
---
<BaseLayout
  lang={lang}
  title={t(lang, `meta.${id}.title`)}
  description={t(lang, `meta.${id}.description`)}
  path="/prenting"
  altPath="/en/printing"
>
  <ServicePage lang={lang} id={id} />
</BaseLayout>
```

- [ ] **Step 7: Create `site/src/pages/en/printing.astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import ServicePage from '../../components/ServicePage.astro';
import { t } from '../../i18n/utils.mjs';

const lang = 'en';
const id = 'printing';
---
<BaseLayout
  lang={lang}
  title={t(lang, `meta.${id}.title`)}
  description={t(lang, `meta.${id}.description`)}
  path="/en/printing"
  altPath="/prenting"
>
  <ServicePage lang={lang} id={id} />
</BaseLayout>
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 9: Commit**

```bash
git add site/src site/tests
git commit -m "feat(site): printing page with interactive jersey customizer"
```

---

### Task 10: Club Shop page (numbered walkthrough)

**Files:**
- Modify: `site/src/components/CapabilityGrid.astro` (add `numbered` prop), `site/src/components/ServicePage.astro` (pass `numbered` for clubshop)
- Create: `site/src/pages/club-shop.astro`, `site/src/pages/en/club-shop.astro`
- Test: `site/tests/build.test.mjs` (extend)

**Interfaces:**
- Consumes: Task 8 `ServicePage`.
- Produces: `CapabilityGrid` props now `{ title, items, numbered?: boolean }`.

- [ ] **Step 1: Extend tests first (failing)**

Append to `site/tests/build.test.mjs`:

```js
test('club shop page renders steps (FO)', async () => {
  const html = await readDist('club-shop/index.html');
  assert.match(html, /Club Shop til títt felag/);
  assert.match(html, /Uppseting/);
  assert.match(html, /Bíleggingar/);
  assert.match(html, /01/);
  assert.match(html, /04/);
});

test('club shop page renders steps (EN)', async () => {
  const html = await readDist('en/club-shop/index.html');
  assert.match(html, /A club shop for your club/);
  assert.match(html, /Catalogue/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — club shop pages missing.

- [ ] **Step 3: Add the `numbered` prop to `site/src/components/CapabilityGrid.astro`**

Change the frontmatter to:

```js
const { title, items, numbered = false } = Astro.props;
```

Replace the icon block inside the card with:

```astro
{numbered ? (
              <span class="inline-flex h-11 w-11 shrink-0 items-center justify-center font-display text-xl font-extrabold text-brand/80">0{i + 1}</span>
) : (
  <div class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
    <Icon name="check" class="h-6 w-6" />
  </div>
)}
```

(The `Icon` import stays; it is still used by the non-numbered branch.)

- [ ] **Step 4: Pass `numbered` for clubshop in `site/src/components/ServicePage.astro`**

Change the CapabilityGrid line to:

```astro
<CapabilityGrid title={t(lang, 'svc.capabilities')} items={t(lang, `${base}.capabilities`)} numbered={id === 'clubshop'} />
```

- [ ] **Step 5: Create `site/src/pages/club-shop.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import ServicePage from '../components/ServicePage.astro';
import { t } from '../i18n/utils.mjs';

const lang = 'fo';
const id = 'clubshop';
---
<BaseLayout
  lang={lang}
  title={t(lang, `meta.${id}.title`)}
  description={t(lang, `meta.${id}.description`)}
  path="/club-shop"
  altPath="/en/club-shop"
>
  <ServicePage lang={lang} id={id} />
</BaseLayout>
```

- [ ] **Step 6: Create `site/src/pages/en/club-shop.astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import ServicePage from '../../components/ServicePage.astro';
import { t } from '../../i18n/utils.mjs';

const lang = 'en';
const id = 'clubshop';
---
<BaseLayout
  lang={lang}
  title={t(lang, `meta.${id}.title`)}
  description={t(lang, `meta.${id}.description`)}
  path="/en/club-shop"
  altPath="/club-shop"
>
  <ServicePage lang={lang} id={id} />
</BaseLayout>
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
git add site/src site/tests
git commit -m "feat(site): club shop page with numbered walkthrough"
```

---

### Task 11: Um okkum (About) page

**Files:**
- Create: `site/src/components/AboutPage.astro`
- Create: `site/src/pages/um-okkum.astro`, `site/src/pages/en/about.astro`
- Test: `site/tests/build.test.mjs` (extend)

**Interfaces:**
- Consumes: Tasks 3–7 (`photos`, `t`, `ValuesSection`, `CtaBand`, `Icon`, `Reveal`).
- Produces: `AboutPage` props `{ lang }`.

- [ ] **Step 1: Extend tests first (failing)**

Append to `site/tests/build.test.mjs`:

```js
test('about page renders (FO)', async () => {
  const html = await readDist('um-okkum/index.html');
  assert.match(html, /Ikki bert ein veitari\./);
  assert.match(html, /Ein viðleikari\./);
  assert.match(html, /info@treyst\.fo/);
});

test('about page renders (EN)', async () => {
  const html = await readDist('en/about/index.html');
  assert.match(html, /Not just a supplier\./);
  assert.match(html, /A teammate\./);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — about pages missing.

- [ ] **Step 3: Create `site/src/components/AboutPage.astro`**

```astro
---
import { Image } from 'astro:assets';
import Icon from './Icon.astro';
import Reveal from './Reveal.astro';
import ValuesSection from './ValuesSection.astro';
import CtaBand from './CtaBand.astro';
import { photos } from '../data/photos.mjs';
import { t } from '../i18n/utils.mjs';

const { lang } = Astro.props;
const contactCards = [
  { icon: 'mail', label: t(lang, 'contact.email'), value: t(lang, 'contact.emailValue'), href: 'mailto:info@treyst.fo' },
  { icon: 'phone', label: t(lang, 'contact.phone'), value: t(lang, 'contact.phoneValue'), href: 'tel:+298504082' },
  { icon: 'pin', label: t(lang, 'contact.location'), value: t(lang, 'contact.locationValue'), href: null },
];
---
<section class="bg-fjord pt-20">
  <div class="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
    <div class="grid items-center gap-16 lg:grid-cols-2">
      <Reveal>
        <div>
          <p class="text-sm font-semibold uppercase tracking-wider text-brand-bright">{t(lang, 'about.eyebrow')}</p>
          <h1 class="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
            {t(lang, 'about.h1')}
            <br />
            <span class="text-brand-bright">{t(lang, 'about.h1accent')}</span>
          </h1>
          <p class="mt-8 text-lg font-light leading-relaxed text-white/75">{t(lang, 'about.p1')}</p>
          <p class="mt-5 text-lg font-light leading-relaxed text-white/75">{t(lang, 'about.p2')}</p>
        </div>
      </Reveal>
      <Reveal delay={1}>
        <div class="relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/10">
          <Image
            src={photos.about}
            alt={t(lang, 'about.alt')}
            widths={[600, 960]}
            sizes="(min-width: 1024px) 45vw, 100vw"
            loading="eager"
            class="h-full w-full object-cover"
          />
        </div>
      </Reveal>
    </div>
  </div>
</section>

<ValuesSection lang={lang} />

<section class="bg-white py-24">
  <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
    <blockquote class="border-y-2 border-brand py-12 text-center">
      <p class="font-display text-3xl font-bold leading-snug text-ink md:text-4xl">{t(lang, 'about.quote')}</p>
    </blockquote>
  </div>
</section>

<section class="bg-fog py-20">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div class="grid gap-6 md:grid-cols-3">
      {contactCards.map((card) => (
        <div class="flex items-center gap-4 rounded-2xl border border-ink/5 bg-white p-6">
          <div class="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Icon name={card.icon} class="h-6 w-6" />
          </div>
          <div>
            <div class="text-sm font-semibold uppercase tracking-wider text-ink/70">{card.label}</div>
            {card.href
              ? <a href={card.href} class="font-semibold text-ink transition-colors hover:text-brand">{card.value}</a>
              : <div class="font-semibold text-ink">{card.value}</div>}
          </div>
        </div>
      ))}
    </div>
  </div>
</section>

<CtaBand lang={lang} />
```

- [ ] **Step 4: Create `site/src/pages/um-okkum.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import AboutPage from '../components/AboutPage.astro';
import { t } from '../i18n/utils.mjs';

const lang = 'fo';
---
<BaseLayout
  lang={lang}
  title={t(lang, 'meta.about.title')}
  description={t(lang, 'meta.about.description')}
  path="/um-okkum"
  altPath="/en/about"
>
  <AboutPage lang={lang} />
</BaseLayout>
```

- [ ] **Step 5: Create `site/src/pages/en/about.astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import AboutPage from '../../components/AboutPage.astro';
import { t } from '../../i18n/utils.mjs';

const lang = 'en';
---
<BaseLayout
  lang={lang}
  title={t(lang, 'meta.about.title')}
  description={t(lang, 'meta.about.description')}
  path="/en/about"
  altPath="/um-okkum"
>
  <AboutPage lang={lang} />
</BaseLayout>
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add site/src site/tests
git commit -m "feat(site): about page"
```

---

### Task 12: Samband (Contact) page + form

**Files:**
- Create: `site/src/components/ContactForm.astro`, `site/src/components/ContactPage.astro`
- Create: `site/src/pages/samband.astro`, `site/src/pages/en/contact.astro`
- Test: `site/tests/build.test.mjs` (extend)

**Interfaces:**
- Consumes: Tasks 3–4 (`t`, `Button`, `Icon`).
- Produces: `ContactForm` props `{ lang }` — posts JSON to `import.meta.env.PUBLIC_FORM_ENDPOINT` when set, else falls back to `mailto:info@treyst.fo`. `ContactPage` props `{ lang }`.

- [ ] **Step 1: Extend tests first (failing)**

Append to `site/tests/build.test.mjs`:

```js
test('contact page has the form (FO)', async () => {
  const html = await readDist('samband/index.html');
  assert.match(html, /name="name"/);
  assert.match(html, /name="club"/);
  assert.match(html, /name="email"/);
  assert.match(html, /name="message"/);
  assert.match(html, /data-msg-success/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /honeypot/);
});

test('contact page has the form (EN)', async () => {
  const html = await readDist('en/contact/index.html');
  assert.match(html, /Get in touch/);
  assert.match(html, /name="message"/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — contact pages missing.

- [ ] **Step 3: Create `site/src/components/ContactForm.astro`**

```astro
---
import Button from './Button.astro';
import { t } from '../i18n/utils.mjs';
import { services } from '../data/services.mjs';

const { lang } = Astro.props;
const endpoint = import.meta.env.PUBLIC_FORM_ENDPOINT ?? '';
const topics = [
  ...services.map((s) => ({ value: s.id, label: t(lang, `${s.key}.title`) })),
  { value: 'other', label: t(lang, 'form.topic.other') },
];
const field =
  'mt-2 w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-ink transition-colors focus:border-brand focus:outline-none';
const label = 'block text-sm font-semibold text-ink/70';
---
<form
  data-contact-form
  data-endpoint={endpoint}
  data-msg-required={t(lang, 'form.required')}
  data-msg-invalid={t(lang, 'form.invalidEmail')}
  data-msg-success={t(lang, 'form.success')}
  data-msg-error={t(lang, 'form.error')}
  data-msg-submitting={t(lang, 'form.submitting')}
  data-msg-subject={t(lang, 'form.mailSubject')}
  novalidate
  class="rounded-3xl border border-ink/5 bg-fog p-8"
>
  <div class="grid gap-6 sm:grid-cols-2">
    <div>
      <label class={label} for="cf-name">{t(lang, 'form.name')} *</label>
      <input class={field} id="cf-name" name="name" type="text" required autocomplete="name" />
    </div>
    <div>
      <label class={label} for="cf-club">{t(lang, 'form.club')}</label>
      <input class={field} id="cf-club" name="club" type="text" autocomplete="organization" />
    </div>
    <div>
      <label class={label} for="cf-email">{t(lang, 'form.email')} *</label>
      <input class={field} id="cf-email" name="email" type="email" required autocomplete="email" />
    </div>
    <div>
      <label class={label} for="cf-phone">{t(lang, 'form.phone')}</label>
      <input class={field} id="cf-phone" name="phone" type="tel" autocomplete="tel" />
    </div>
    <div class="sm:col-span-2">
      <label class={label} for="cf-topic">{t(lang, 'form.topic')}</label>
      <select class={field} id="cf-topic" name="topic">
        {topics.map((topic) => <option value={topic.value}>{topic.label}</option>)}
      </select>
    </div>
    <div class="sm:col-span-2">
      <label class={label} for="cf-message">{t(lang, 'form.message')} *</label>
      <textarea class={field} id="cf-message" name="message" rows="5" required></textarea>
    </div>
  </div>
  <div class="honeypot" aria-hidden="true">
    <label>Company <input name="company" type="text" tabindex="-1" autocomplete="off" /></label>
  </div>
  <div class="mt-8 flex items-center gap-4">
    <Button type="submit" variant="primary" class="px-8" data-submit>{t(lang, 'form.submit')}</Button>
    <p data-status role="status" aria-live="polite" class="text-sm font-medium"></p>
  </div>
</form>

<style>
  .honeypot {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
</style>

<script>
  const form = document.querySelector('[data-contact-form]');
  if (form) {
    const status = form.querySelector('[data-status]');
    const submit = form.querySelector('[data-submit]');
    const msg = (name) => form.getAttribute(`data-msg-${name}`) || '';

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const name = String(data.get('name') || '').trim();
      const email = String(data.get('email') || '').trim();
      const message = String(data.get('message') || '').trim();
      const honeypot = String(data.get('company') || '').trim();

      if (honeypot) return; // silently drop bots

      if (!name || !email || !message) {
        status.textContent = msg('required');
        status.className = 'text-sm font-medium text-danger';
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        status.textContent = msg('invalid');
        status.className = 'text-sm font-medium text-danger';
        return;
      }

      const payload = {
        name,
        club: String(data.get('club') || '').trim(),
        email,
        phone: String(data.get('phone') || '').trim(),
        topic: String(data.get('topic') || ''),
        message,
      };

      const endpoint = form.getAttribute('data-endpoint');

      if (!endpoint) {
        const subject = encodeURIComponent(`${msg('subject')} ${name}`);
        const body = encodeURIComponent(
          `Navn: ${name}\nFelag: ${payload.club}\nTeldupostur: ${email}\nTelefon: ${payload.phone}\nTørvur: ${payload.topic}\n\n${message}`
        );
        window.location.href = `mailto:info@treyst.fo?subject=${subject}&body=${body}`;
        status.textContent = msg('success');
        status.className = 'text-sm font-medium text-brand';
        return;
      }

      submit.disabled = true;
      status.textContent = msg('submitting');
      status.className = 'text-sm font-medium text-ink/60';

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        form.reset();
        status.textContent = msg('success');
        status.className = 'text-sm font-medium text-brand';
      } catch {
        status.textContent = msg('error');
        status.className = 'text-sm font-medium text-danger';
      } finally {
        submit.disabled = false;
      }
    });
  }
</script>
```

- [ ] **Step 4: Create `site/src/components/ContactPage.astro`**

```astro
---
import ContactForm from './ContactForm.astro';
import Icon from './Icon.astro';
import { t } from '../i18n/utils.mjs';

const { lang } = Astro.props;
const cards = [
  { icon: 'mail', label: t(lang, 'contact.email'), value: t(lang, 'contact.emailValue'), href: 'mailto:info@treyst.fo' },
  { icon: 'phone', label: t(lang, 'contact.phone'), value: t(lang, 'contact.phoneValue'), href: 'tel:+298504082' },
  { icon: 'pin', label: t(lang, 'contact.location'), value: t(lang, 'contact.locationValue'), href: null },
];
---
<section class="bg-fjord pt-20">
  <div class="mx-auto max-w-7xl px-4 pb-24 pt-14 sm:px-6 lg:px-8">
    <p class="text-sm font-semibold uppercase tracking-wider text-brand-bright">{t(lang, 'nav.contact')}</p>
    <h1 class="mt-4 text-4xl font-extrabold tracking-tight text-white md:text-5xl">{t(lang, 'contact.h1')}</h1>
    <p class="mt-5 max-w-2xl text-lg font-light text-white/75">{t(lang, 'contact.intro')}</p>
  </div>
</section>

<section class="bg-white py-20">
  <div class="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-5 lg:px-8">
    <div class="lg:col-span-2">
      <div class="space-y-6">
        {cards.map((card) => (
          <div class="flex items-center gap-4">
            <div class="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Icon name={card.icon} class="h-6 w-6" />
            </div>
            <div>
              <div class="text-sm font-semibold uppercase tracking-wider text-ink/70">{card.label}</div>
              {card.href
                ? <a href={card.href} class="font-semibold text-ink transition-colors hover:text-brand">{card.value}</a>
                : <div class="font-semibold text-ink">{card.value}</div>}
            </div>
          </div>
        ))}
      </div>
      <p class="mt-8 text-sm font-medium text-ink/60">{t(lang, 'contact.replyNote')}</p>
    </div>
    <div class="lg:col-span-3">
      <ContactForm lang={lang} />
    </div>
  </div>
</section>
```

- [ ] **Step 5: Create `site/src/pages/samband.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import ContactPage from '../components/ContactPage.astro';
import { t } from '../i18n/utils.mjs';

const lang = 'fo';
---
<BaseLayout
  lang={lang}
  title={t(lang, 'meta.contact.title')}
  description={t(lang, 'meta.contact.description')}
  path="/samband"
  altPath="/en/contact"
>
  <ContactPage lang={lang} />
</BaseLayout>
```

- [ ] **Step 6: Create `site/src/pages/en/contact.astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import ContactPage from '../../components/ContactPage.astro';
import { t } from '../../i18n/utils.mjs';

const lang = 'en';
---
<BaseLayout
  lang={lang}
  title={t(lang, 'meta.contact.title')}
  description={t(lang, 'meta.contact.description')}
  path="/en/contact"
  altPath="/samband"
>
  <ContactPage lang={lang} />
</BaseLayout>
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
git add site/src site/tests
git commit -m "feat(site): contact page with validated form and mailto fallback"
```

---

### Task 13: Legal stubs, 404, hreflang matrix

**Files:**
- Create: `site/src/components/LegalPage.astro`, `site/src/components/NotFoundPage.astro`
- Create: `site/src/pages/treytir.astro`, `site/src/pages/privatlivspolitikkur.astro`, `site/src/pages/404.astro`
- Create: `site/src/pages/en/terms.astro`, `site/src/pages/en/privacy.astro`, `site/src/pages/en/404.astro`
- Test: `site/tests/build.test.mjs` (extend)

**Interfaces:**
- Consumes: Tasks 3–4 (`t`, `Button`, `Icon`).
- Produces: `LegalPage` props `{ lang, title, paragraphs: string[] }`; `NotFoundPage` props `{ lang }`.

- [ ] **Step 1: Extend tests first (failing)**

Append to `site/tests/build.test.mjs`:

```js
test('legal pages and 404 render', async () => {
  assert.equal(await exists('treytir/index.html'), true);
  assert.equal(await exists('privatlivspolitikkur/index.html'), true);
  assert.equal(await exists('en/terms/index.html'), true);
  assert.equal(await exists('en/privacy/index.html'), true);
  assert.equal(await exists('404.html'), true);
  const notFound = await readDist('404.html');
  assert.match(notFound, /Síðan varð ikki funnin\./);
});

const PAIRS = [
  ['index.html', 'en/index.html', '/', '/en/'],
  ['klaedir/index.html', 'en/apparel/index.html', '/klaedir', '/en/apparel'],
  ['utgerd/index.html', 'en/equipment/index.html', '/utgerd', '/en/equipment'],
  ['prenting/index.html', 'en/printing/index.html', '/prenting', '/en/printing'],
  ['club-shop/index.html', 'en/club-shop/index.html', '/club-shop', '/en/club-shop'],
  ['um-okkum/index.html', 'en/about/index.html', '/um-okkum', '/en/about'],
  ['samband/index.html', 'en/contact/index.html', '/samband', '/en/contact'],
  ['treytir/index.html', 'en/terms/index.html', '/treytir', '/en/terms'],
  ['privatlivspolitikkur/index.html', 'en/privacy/index.html', '/privatlivspolitikkur', '/en/privacy'],
];

test('hreflang pairs are reciprocal on every page', async () => {
  for (const [foFile, enFile, foPath, enPath] of PAIRS) {
    const foHtml = await readDist(foFile);
    const enHtml = await readDist(enFile);
    const foUrl = `https://treyst.fo${foPath}`;
    const enUrl = `https://treyst.fo${enPath}`;
    assert.ok(foHtml.includes(`hreflang="fo" href="${foUrl}"`), `${foFile}: missing fo hreflang`);
    assert.ok(foHtml.includes(`hreflang="en" href="${enUrl}"`), `${foFile}: missing en hreflang`);
    assert.ok(foHtml.includes(`hreflang="x-default" href="${foUrl}"`), `${foFile}: missing x-default`);
    assert.ok(enHtml.includes(`hreflang="fo" href="${foUrl}"`), `${enFile}: missing fo hreflang`);
    assert.ok(enHtml.includes(`hreflang="en" href="${enUrl}"`), `${enFile}: missing en hreflang`);
    assert.ok(enHtml.includes(`hreflang="x-default" href="${foUrl}"`), `${enFile}: missing x-default`);
  }
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — legal/404 pages missing.

- [ ] **Step 3: Create `site/src/components/LegalPage.astro`**

```astro
---
import { t } from '../i18n/utils.mjs';

const { lang, title, paragraphs } = Astro.props;
---
<section class="bg-fjord pt-20">
  <div class="mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 lg:px-8">
    <h1 class="text-4xl font-extrabold tracking-tight text-white md:text-5xl">{title}</h1>
  </div>
</section>
<section class="bg-white py-16">
  <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
    <p class="rounded-xl bg-fog p-4 text-sm text-ink/60">{t(lang, 'legal.stubNote')}</p>
    <div class="mt-8 space-y-6 text-lg leading-relaxed text-ink/80">
      {paragraphs.map((paragraph) => <p>{paragraph}</p>)}
    </div>
  </div>
</section>
```

- [ ] **Step 4: Create `site/src/components/NotFoundPage.astro`**

```astro
---
import Button from './Button.astro';
import Icon from './Icon.astro';
import { t, localizePath } from '../i18n/utils.mjs';

const { lang } = Astro.props;
const home = localizePath('/', lang);
---
<section class="flex min-h-[80vh] items-center bg-fjord pt-20">
  <div class="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6 lg:px-8">
    <p class="font-display text-7xl font-extrabold text-brand-bright">404</p>
    <h1 class="mt-6 text-4xl font-extrabold tracking-tight text-white md:text-5xl">{t(lang, 'notfound.title')}</h1>
    <p class="mt-5 text-lg font-light text-white/70">{t(lang, 'notfound.desc')}</p>
    <div class="mt-10 flex justify-center">
      <Button href={home} variant="primary">
        {t(lang, 'notfound.home')} <Icon name="arrow" class="h-5 w-5" />
      </Button>
    </div>
  </div>
</section>
```

- [ ] **Step 5: Create the six legal/404 route files**

`site/src/pages/treytir.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import LegalPage from '../components/LegalPage.astro';
import { t } from '../i18n/utils.mjs';

const lang = 'fo';
const paragraphs = [t(lang, 'legal.terms.p1'), t(lang, 'legal.terms.p2')];
---
<BaseLayout
  lang={lang}
  title={t(lang, 'meta.terms.title')}
  description={t(lang, 'meta.terms.description')}
  path="/treytir"
  altPath="/en/terms"
>
  <LegalPage lang={lang} title={t(lang, 'meta.terms.title')} paragraphs={paragraphs} />
</BaseLayout>
```

`site/src/pages/privatlivspolitikkur.astro`: same pattern with `meta.privacy.title` / `meta.privacy.description`, `paragraphs = [legal.privacy.p1, legal.privacy.p2]`, `path="/privatlivspolitikkur"`, `altPath="/en/privacy"`.

`site/src/pages/en/terms.astro`:
```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import LegalPage from '../../components/LegalPage.astro';
import { t } from '../../i18n/utils.mjs';

const lang = 'en';
const paragraphs = [t(lang, 'legal.terms.p1'), t(lang, 'legal.terms.p2')];
---
<BaseLayout
  lang={lang}
  title={t(lang, 'meta.terms.title')}
  description={t(lang, 'meta.terms.description')}
  path="/en/terms"
  altPath="/treytir"
>
  <LegalPage lang={lang} title={t(lang, 'meta.terms.title')} paragraphs={paragraphs} />
</BaseLayout>
```

`site/src/pages/en/privacy.astro`: same pattern, `legal.privacy.*`, `path="/en/privacy"`, `altPath="/privatlivspolitikkur"`.

`site/src/pages/404.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import NotFoundPage from '../components/NotFoundPage.astro';
import { t } from '../i18n/utils.mjs';

const lang = 'fo';
---
<BaseLayout
  lang={lang}
  title={t(lang, 'notfound.title')}
  description={t(lang, 'notfound.desc')}
  path="/404"
  altPath="/en/404"
>
  <NotFoundPage lang={lang} />
</BaseLayout>
```

`site/src/pages/en/404.astro`: same with `lang = 'en'`, `path="/en/404"`, `altPath="/404"`, import paths `../../`.

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add site/src site/tests
git commit -m "feat(site): legal pages, 404 and reciprocal hreflang on all routes"
```

---

### Task 14: SEO extras — OG image, robots, sitemap test, JSON-LD

**Files:**
- Create: `site/scripts/generate-og.mjs`, `site/public/robots.txt`, `site/public/og-image.png` (generated)
- Modify: `site/src/components/SeoHead.astro` (optional `jsonLd` prop), `site/src/layouts/BaseLayout.astro` (pass-through), `site/src/pages/index.astro`, `site/src/pages/en/index.astro`
- Test: `site/tests/build.test.mjs` (extend)

**Interfaces:**
- Consumes: Tasks 2, 7.
- Produces: `SeoHead`/`BaseLayout` optional prop `jsonLd: object`; `public/og-image.png`; `public/robots.txt`.

- [ ] **Step 1: Extend tests first (failing)**

Append to `site/tests/build.test.mjs`:

```js
test('sitemap, robots and JSON-LD are present', async () => {
  assert.equal(await exists('sitemap-index.xml'), true, 'sitemap-index.xml should exist');
  const robots = await readDist('robots.txt');
  assert.match(robots, /Sitemap: https:\/\/treyst\.fo\/sitemap-index\.xml/);
  const html = await readDist('index.html');
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /"@type":"LocalBusiness"/);
  assert.equal(await exists('og-image.png'), true, 'og-image.png should exist');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — no robots.txt, no JSON-LD, no og-image.png.

- [ ] **Step 3: Create `site/scripts/generate-og.mjs` and generate the image**

```js
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#0C1512"/>
  <rect x="80" y="452" width="120" height="6" fill="#2DD4BF"/>
  <text x="80" y="372" font-family="Helvetica, Arial, sans-serif" font-size="150" font-weight="700" fill="#FFFFFF" letter-spacing="8">TREYST</text>
  <text x="84" y="430" font-family="Helvetica, Arial, sans-serif" font-size="32" fill="rgba(255,255,255,0.75)">Ítróttarklæðir · Útgerð · Prenting · Club Shop</text>
  <text x="84" y="560" font-family="Helvetica, Arial, sans-serif" font-size="26" fill="rgba(255,255,255,0.5)">Hoyvík, Føroyar · treyst.fo</text>
</svg>`;

const out = fileURLToPath(new URL('../public/og-image.png', import.meta.url));
await sharp(Buffer.from(svg)).png().toFile(out);
console.log('wrote', out);
```

Run: `node scripts/generate-og.mjs`
Expected: `wrote …/site/public/og-image.png`. Verify: `file public/og-image.png` → PNG.

- [ ] **Step 4: Create `site/public/robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://treyst.fo/sitemap-index.xml
```

- [ ] **Step 5: Add `jsonLd` support to `SeoHead.astro`**

Change the frontmatter destructure to include `jsonLd`:

```js
const { lang, title, description, path, altPath, jsonLd } = Astro.props;
```

Append at the end of the template:

```astro
{jsonLd && <script type="application/ld+json" set:html={JSON.stringify(jsonLd)} />}
```

- [ ] **Step 6: Pass `jsonLd` through `BaseLayout.astro`**

Add `jsonLd` to the destructure:

```js
const { lang = 'fo', title, description, path, altPath, jsonLd } = Astro.props;
```

And pass it to SeoHead:

```astro
<SeoHead lang={lang} title={title} description={description} path={path} altPath={altPath} jsonLd={jsonLd} />
```

- [ ] **Step 7: Add LocalBusiness JSON-LD to the FO home page**

In `site/src/pages/index.astro` frontmatter, add:

```js
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'TREYST',
  description: t(lang, 'meta.home.description'),
  url: 'https://treyst.fo/',
  email: 'info@treyst.fo',
  telephone: '+298504082',
  address: { '@type': 'PostalAddress', addressLocality: 'Hoyvík', addressCountry: 'FO' },
  areaServed: { '@type': 'Country', name: 'Føroyar' },
  makesOffer: ['Klæðir', 'Útgerð', 'Prenting', 'Club Shop'].map((name) => ({
    '@type': 'Offer',
    itemOffered: { '@type': 'Service', name },
  })),
};
```

And add `jsonLd={jsonLd}` to the `<BaseLayout …>` props.

- [ ] **Step 8: Add LocalBusiness JSON-LD to the EN home page**

In `site/src/pages/en/index.astro` frontmatter, add the same object with `description: t(lang, 'meta.home.description')` and `areaServed: { '@type': 'Country', name: 'Faroe Islands' }`, then add `jsonLd={jsonLd}` to `<BaseLayout …>`.

- [ ] **Step 9: Run tests to verify they pass**

Run: `npm test`
Expected: all tests pass (sitemap-index.xml is emitted by `@astrojs/sitemap`; JSON-LD is serialized with no spaces — the test matches `"@type":"LocalBusiness"`).

- [ ] **Step 10: Commit**

```bash
git add site/scripts site/public site/src site/tests
git commit -m "feat(site): robots, sitemap, LocalBusiness JSON-LD and generated OG image"
```

---

### Task 15: Budget test + accessibility/performance QA pass

**Files:**
- Create: `site/tests/budget.test.mjs`
- Test: manual QA checklist below (record results in the commit message)

**Interfaces:**
- Consumes: full built site from Tasks 1–14.
- Produces: automated JS/CSS size gate + recorded QA evidence.

- [ ] **Step 1: Create `site/tests/budget.test.mjs`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const astroDir = new URL('../dist/_astro/', import.meta.url);

test('total JS is under 35 KB gzipped', async () => {
  const files = (await readdir(astroDir)).filter((f) => f.endsWith('.js'));
  let total = 0;
  for (const file of files) {
    total += gzipSync(await readFile(new URL(file, astroDir))).length;
  }
  assert.ok(total < 35 * 1024, `JS budget exceeded: ${(total / 1024).toFixed(1)} KB gzipped`);
});

test('total CSS is under 45 KB gzipped', async () => {
  const files = (await readdir(astroDir)).filter((f) => f.endsWith('.css'));
  let total = 0;
  for (const file of files) {
    total += gzipSync(await readFile(new URL(file, astroDir))).length;
  }
  assert.ok(total < 45 * 1024, `CSS budget exceeded: ${(total / 1024).toFixed(1)} KB gzipped`);
});

test('no placeholder text ships in any page', async () => {
  const dist = fileURLToPath(new URL('../dist/', import.meta.url));
  const walk = async (dir) => {
    const entries = await readdir(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      const full = `${dir}/${entry.name}`;
      if (entry.isDirectory()) files.push(...(await walk(full)));
      else if (entry.name.endsWith('.html')) files.push(full);
    }
    return files;
  };
  for (const file of await walk(dist)) {
    const html = await readFile(file, 'utf8');
    assert.ok(!/TODO|TBD|lorem ipsum/i.test(html), `placeholder text found in ${file}`);
  }
});
```

- [ ] **Step 2: Run the full suite**

Run: `npm test`
Expected: all tests pass; note the reported sizes.

- [ ] **Step 3: Start the preview server**

Run: `npm run build && npm run preview`
Expected: server on `http://localhost:4321`. Keep it running for Steps 4–6.

- [ ] **Step 4: Lighthouse audit (if Chrome is available)**

Run: `npx lighthouse http://localhost:4321/ --only-categories=performance,accessibility,best-practices,seo --chrome-flags="--headless" --output=json --output-path=/tmp/treyst-lh.json`
Then: `node -e "const r=require('/tmp/treyst-lh.json');for(const [k,v] of Object.entries(r.categories))console.log(k, Math.round(v.score*100))"`
Expected: performance ≥ 95, accessibility ≥ 95, best-practices 100, seo ≥ 95.
If `npx lighthouse` cannot find Chrome, open `http://localhost:4321/` in DevTools and record: LCP < 2.0s on Fast 4G throttling, CLS < 0.05. Record the numbers you get in the Task 15 commit message either way.

- [ ] **Step 5: Keyboard and reduced-motion audit (manual)**

In the browser at `http://localhost:4321/`:
1. Press Tab from page load → skip link appears first and focuses `#main` when activated.
2. Tab through the header → nav links, service dropdown items, language switcher and CTA are all reachable with visible focus rings; the dropdown stays open while focus is inside it.
3. Open the mobile menu at ≤ 768px width → focus moves into the dialog, Esc closes it, and focus returns to the menu button.
4. On `/prenting`, Tab to the color swatches → arrow keys change selection; typing in name/number updates the jersey.
5. On `/samband`, submit with empty fields → error message appears in the `aria-live` region; submit valid data with no endpoint configured → mail client opens with a prefilled message and the success text shows.
6. Enable OS "Reduce Motion" → reload → all content is visible immediately; no reveal transitions run.
Record any failures and fix before committing.

- [ ] **Step 6: Contrast spot-check (manual)**

Using DevTools on the running site, verify (AA): white on `#0F766E` (buttons), `#2DD4BF` on `#0C1512` (accents), `#101814` on `#F6F5F1` (body on fog), white/70 on `#0C1512` (footer text). Expected: all ≥ 4.5:1 for text.

- [ ] **Step 7: Commit**

```bash
git add site/tests/budget.test.mjs
git commit -m "test(site): JS/CSS budgets and placeholder scan; QA pass recorded"
```

---

### Task 16: README + final verification

**Files:**
- Create: `README.md` (repo root, i.e. `Treyst/README.md`)

**Interfaces:**
- Consumes: everything above.
- Produces: handover documentation.

- [ ] **Step 1: Write `Treyst/README.md`**

```md
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
```

- [ ] **Step 2: Run the full verification**

Run: `npm test`
Expected: build succeeds; every test passes; budget numbers printed in test output.

- [ ] **Step 3: Confirm the acceptance checklist from the spec**

Walk `docs/superpowers/specs/2026-10-03-treyst-website-design.md` §16 and tick each item against the built site. Fix anything not satisfied, re-run `npm test`, then commit the fix.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: project README with run, deploy, form and asset-swap instructions"
```

---

## Plan Self-Review

- **Spec coverage:** design system (Tasks 2, 4–7), routes & pages (Tasks 6–13), FO/EN i18n (Task 3), form (Task 12), customizer (Task 9), SEO/hreflang/JSON-LD/sitemap/OG (Tasks 2, 13, 14), performance budgets (Task 15), a11y (Tasks 2, 4, 9, 12, 15), assets (Task 5), README/handover (Task 16). Non-goals intentionally excluded.
- **Placeholder scan:** no TODO/TBD steps; every code step carries complete code; the only selection task (Task 5 photos) has explicit criteria, verification commands and a defined fallback loop.
- **Type consistency:** `t(lang, key)` used uniformly; `services[].{id,slugs,icon,image,key}` consistent between Tasks 3, 6, 8, 9, 10 and `RelatedServices`; `photos` keys match Task 5 file names; `SeoHead`/`BaseLayout` prop names (`lang,title,description,path,altPath,jsonLd`) consistent across Tasks 2 and 14; `CapabilityGrid` gains `numbered` in Task 10 and is consumed by `ServicePage` in the same task.

