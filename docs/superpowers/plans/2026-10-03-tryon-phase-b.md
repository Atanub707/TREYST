# TREYST Try-On Phase B (Anywear Widget) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 24 jersey detail pages (FO `/roynd/<slug>` ↔ EN `/en/try-on/<slug>`) with Product JSON-LD + per-page og:image, an Anywear widget script loaded only there, a styled "Royn á tær" trigger calling `window.DecartWidget.open()`, gallery try-links, and live verification on `treyst.vercel.app`.

**Architecture:** `getStaticPaths` from `jerseys.mjs` → `JerseyDetailPage.astro` (image, copy, CTAs, related strip, JSON-LD, widget script + trigger). `SeoHead`/`BaseLayout` gain an optional `ogImage`. `switchLocalePath` gains detail-route prefix rules.

**Tech Stack:** existing. The Anywear script is the only third-party asset, page-scoped.

## Global Constraints

- Copy from `ui.mjs` (FO+EN both); no hardcoded UI strings (the widget script URL/domain is config, allowed).
- Script tag ONLY on detail pages: `<script is:inline src="https://anywear.decart.ai/widget/latest/anywear.js?domain=treyst.vercel.app" async></script>` — exact URL string, asserted by tests; README documents the `treyst.fo` swap.
- Detail pages: dark-free content page (nav is solid-scrolled pattern as on other light pages? — follow existing detail-like pages: use a `bg-white pt-20` top section like ContactForm areas; keep nav usable).
- Product JSON-LD: `@type: Product`, `name`, `image` (absolute), `brand`, `category`; **no `offers`**.
- Budgets unchanged on all pages; `npm test` green per task; commit per task.

---

### Task 1: Detail-page foundations — copy, route mapping, ogImage, pages, tests

**Files:**
- Modify: `site/src/i18n/ui.mjs`, `site/src/i18n/utils.mjs`, `site/src/components/SeoHead.astro`, `site/src/layouts/BaseLayout.astro`
- Create: `site/src/components/JerseyDetailPage.astro`
- Create: `site/src/pages/roynd/[slug].astro`, `site/src/pages/en/try-on/[slug].astro`
- Test: `site/tests/build.test.mjs`, `site/tests/i18n.test.mjs`

**Interfaces:**
- Produces: detail routes for all 12 slugs; `[data-tryon-open]` button (Task 2 wires behavior); `switchLocalePath` prefix handling; `ogImage` prop on BaseLayout/SeoHead.

- [ ] **Step 1: Extend tests first (failing)**

Append to `site/tests/i18n.test.mjs`:

```js
test('switchLocalePath maps jersey detail routes by prefix', () => {
  assert.equal(switchLocalePath('/roynd/jersey-03', 'en'), '/en/try-on/jersey-03');
  assert.equal(switchLocalePath('/en/try-on/jersey-11', 'fo'), '/roynd/jersey-11');
  assert.equal(switchLocalePath('/roynd/jersey-03', 'fo'), '/roynd/jersey-03');
});
```

Append to `site/tests/build.test.mjs`:

```js
test('jersey detail pages build with product data (FO + EN)', async () => {
  for (const slug of ['jersey-01', 'jersey-06', 'jersey-12']) {
    const fo = await readDist(`roynd/${slug}/index.html`);
    const en = await readDist(`en/try-on/${slug}/index.html`);
    assert.match(fo, /<html lang="fo"/);
    assert.match(en, /<html lang="en"/);
    assert.match(fo, /"@type":"Product"/);
    assert.match(fo, /anywear\.decart\.ai\/widget\/latest\/anywear\.js\?domain=treyst\.vercel\.app/);
    assert.match(fo, /data-tryon-open/);
    assert.match(fo, new RegExp(`hreflang="en" href="https://treyst\\.fo/en/try-on/${slug}"`));
    assert.match(en, new RegExp(`hreflang="fo" href="https://treyst\\.fo/roynd/${slug}"`));
  }
});

test('widget script stays off non-detail pages', async () => {
  const home = await readDist('index.html');
  assert.doesNotMatch(home, /anywear\.decart\.ai/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL (missing pages; missing prefix mapping).

- [ ] **Step 3: Add copy keys to `site/src/i18n/ui.mjs`**

Insert into the try-on block:

```js
  'tryon.tryButton': { fo: 'Royn á tær', en: 'Try it on' },
  'tryon.related': { fo: 'Aðrir búnar', en: 'More jerseys' },
  'tryon.back': { fo: '← Aftur til savnið', en: '← Back to the collection' },
  'tryon.detailNote': {
    fo: 'Trýst á “Royn á tær” og sí búnan á tær við kamera. Try-on verður veitt av okkara try-on-partnara.',
    en: 'Tap “Try it on” and see the jersey on you with your camera. Try-on is provided by our try-on partner.',
  },
  'tryon.loading': { fo: 'Try-on setur í gongd…', en: 'Starting try-on…' },
  'tryon.failed': { fo: 'Try-on er ikki tøkt nú — royn aftur seinni.', en: 'Try-on isn’t available right now — try again later.' },
  'tryon.detailIntro': {
    fo: 'Klassiskur ítróttarbúni í sterkum litum. Klæðir, prenting og levering verða løgd til rættis saman við tykkum.',
    en: 'A classic sports jersey in strong colours. Apparel, printing and delivery are arranged together with you.',
  },
  'meta.detail.title': { fo: 'Búni', en: 'Jersey' },
```

(Detail page frontmatter composes the title as `${name} | TREYST` — no per-jersey meta keys needed.)

- [ ] **Step 4: Prefix rules in `site/src/i18n/utils.mjs`**

In `switchLocalePath`, before the `ROUTE_PAIRS.find` line, add:

```js
  const FO_DETAIL = '/roynd/';
  const EN_DETAIL = '/en/try-on/';
  if (current.startsWith(FO_DETAIL) || current.startsWith(EN_DETAIL)) {
    if (targetLang === 'en') {
      return current.startsWith(EN_DETAIL) ? current : `${EN_DETAIL}${current.slice(FO_DETAIL.length)}`;
    }
    return current.startsWith(FO_DETAIL) ? current : `${FO_DETAIL}${current.slice(EN_DETAIL.length)}`;
  }
```

- [ ] **Step 5: Add optional `ogImage` to `SeoHead.astro` + `BaseLayout.astro`**

`SeoHead.astro` — destructure `ogImage` and compute once:

```js
const { lang, title, description, path, altPath, jsonLd, ogImage } = Astro.props;
const ogImageUrl = ogImage ? new URL(ogImage, site).href : new URL('/og-image.png', site).href;
```

Replace both `new URL('/og-image.png', site).href` usages with `ogImageUrl`.
`BaseLayout.astro` — destructure `ogImage` and pass `ogImage={ogImage}` to `<SeoHead …>`.

- [ ] **Step 6: Create `site/src/components/JerseyDetailPage.astro`**

```astro
---
import { Image } from 'astro:assets';
import Button from './Button.astro';
import Icon from './Icon.astro';
import JerseyCard from './JerseyCard.astro';
import { jerseys } from '../data/jerseys.mjs';
import { t, localizePath } from '../i18n/utils.mjs';

const { lang, slug } = Astro.props;
const jersey = jerseys.find((item) => item.slug === slug);
const name = t(lang, jersey.nameKey);
const collectionPath = localizePath('/roynd', lang);
const contactPath = localizePath('/samband', lang);
const related = jerseys.filter((item) => item.slug !== slug).slice(0, 4);
---
<article class="bg-white pb-20 pt-28">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <a href={collectionPath} class="text-sm font-semibold text-brand transition-colors hover:text-brand/80">{t(lang, 'tryon.back')}</a>
    <div class="mt-8 grid gap-12 lg:grid-cols-2">
      <div class="overflow-hidden rounded-3xl border border-ink/5 bg-fog">
        <Image
          src={jersey.image}
          alt={name}
          widths={[640, 960, 1280]}
          sizes="(min-width: 1024px) 50vw, 100vw"
          loading="eager"
          fetchpriority="high"
          class="h-full w-full object-cover"
        />
      </div>
      <div class="flex flex-col justify-center">
        <h1 class="text-4xl font-extrabold tracking-tight text-ink md:text-5xl">{name}</h1>
        <p class="mt-6 text-lg leading-relaxed text-ink/70">{t(lang, 'tryon.detailIntro')}</p>
        <div class="mt-8 flex flex-wrap items-center gap-4">
          <button
            type="button"
            data-tryon-open
            data-failed={t(lang, 'tryon.failed')}
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-brand/90"
          >
            <Icon name="sparkles" class="h-5 w-5" />
            {t(lang, 'tryon.tryButton')}
          </button>
          <Button href={`${contactPath}?kit=${jersey.slug}`} variant="ghost-dark">
            {t(lang, 'tryon.inquiry')} <Icon name="arrow" class="h-5 w-5" />
          </Button>
        </div>
        <p data-tryon-status class="mt-4 hidden text-sm font-medium text-ink/60"></p>
        <p class="mt-4 text-sm text-ink/60">{t(lang, 'tryon.detailNote')}</p>
      </div>
    </div>
  </div>
</article>

<script is:inline src="https://anywear.decart.ai/widget/latest/anywear.js?domain=treyst.vercel.app" async></script>
<script is:inline>
  (function () {
    var button = document.querySelector('[data-tryon-open]');
    var status = document.querySelector('[data-tryon-status]');
    if (!button) return;
    function openWidget() {
      if (window.DecartWidget && typeof window.DecartWidget.open === 'function') {
        window.DecartWidget.open();
        return true;
      }
      return false;
    }
    button.addEventListener('click', function () {
      if (openWidget()) return;
      var tries = 0;
      var timer = setInterval(function () {
        tries += 1;
        if (openWidget() || tries > 10) {
          clearInterval(timer);
          if (tries > 10 && status) {
            status.textContent = button.getAttribute('data-failed') || '';
            status.classList.remove('hidden');
          }
        }
      }, 300);
    });
  })();
</script>

<section class="bg-fog py-16">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <h2 class="text-2xl font-bold tracking-tight text-ink md:text-3xl">{t(lang, 'tryon.related')}</h2>
    <div class="mt-8 grid grid-cols-2 gap-6 lg:grid-cols-4">
      {related.map((item) => (
        <JerseyCard lang={lang} jersey={item} contactPath={contactPath} />
      ))}
    </div>
  </div>
</section>
```

Note for the implementer: the localized loading/failure strings are injected via `data-loading`/`data-failed` attributes on the button in the **route wrappers** (see Step 7) so no strings are hardcoded in the inline script. Adjust the markup accordingly: `<button data-tryon-open data-loading={t(lang,'tryon.loading')} data-failed={t(lang,'tryon.failed')} …>` and set `status.textContent = button.getAttribute('data-loading') || ''` when opening begins. Keep it simple and correct — exact attribute names are the implementer's to finalize as long as no hardcoded copy ships and behavior matches this description.

- [ ] **Step 7: Create the two route wrappers**

`site/src/pages/roynd/[slug].astro`:
```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import JerseyDetailPage from '../../components/JerseyDetailPage.astro';
import { jerseys } from '../../data/jerseys.mjs';
import { t } from '../../i18n/utils.mjs';

export function getStaticPaths() {
  return jerseys.map((jersey) => ({ params: { slug: jersey.slug } }));
}

const lang = 'fo';
const { slug } = Astro.params;
const jersey = jerseys.find((item) => item.slug === slug);
const name = t(lang, jersey.nameKey);
const ogImage = new URL(jersey.image.src, Astro.site).href;
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name,
  image: [ogImage],
  brand: { '@type': 'Brand', name: 'TREYST' },
  category: 'Sports jersey',
};
---
<BaseLayout
  lang={lang}
  title={`${name} | TREYST`}
  description={t(lang, 'meta.tryon.description')}
  path={`/roynd/${slug}`}
  altPath={`/en/try-on/${slug}`}
  jsonLd={jsonLd}
  ogImage={ogImage}
>
  <JerseyDetailPage lang={lang} slug={slug} />
</BaseLayout>
```

`site/src/pages/en/try-on/[slug].astro`: same shape with `lang = 'en'`, `path={`/en/try-on/${slug}`}`, `altPath={`/roynd/${slug}`}`, import paths `../../../`.

- [ ] **Step 8: Run tests to verify they pass**

Run: `npm test`
Expected: build succeeds (45 pages); all tests pass.

- [ ] **Step 9: Commit**

```bash
git add site/src site/tests
git commit -m "feat(site): jersey detail pages with product data and anywear widget"
```

---

### Task 2: Gallery try-links + refreshed how-it-works copy

**Files:**
- Modify: `site/src/components/JerseyCard.astro` (try-on link)
- Modify: `site/src/i18n/ui.mjs` (`tryon.intro`, `tryon.step2.desc` now that try-on is real)
- Test: `site/tests/build.test.mjs` (extend)

**Interfaces:**
- Consumes: Task 1 detail routes.
- Produces: gallery cards link to detail pages; copy reflects live try-on.

- [ ] **Step 1: Extend tests first (failing)**

Append to `site/tests/build.test.mjs`:

```js
test('gallery cards link to jersey detail pages (FO + EN)', async () => {
  const fo = await readDist('roynd/index.html');
  const en = await readDist('en/try-on/index.html');
  assert.match(fo, /href="\/roynd\/jersey-01"/);
  assert.match(fo, /Royn á tær/);
  assert.match(en, /href="\/en\/try-on\/jersey-01"/);
  assert.match(en, /Try it on/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL.

- [ ] **Step 3: Update `site/src/components/JerseyCard.astro`**

Imports: add `localizePath` to the utils import. Frontmatter: add:

```js
const tryHref = `${localizePath('/roynd', lang)}/${jersey.slug}`;
```

Replace the inquiry-link block with two actions:

```astro
    <div class="mt-3 flex flex-wrap items-center gap-4">
      <a href={tryHref} class="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand/90">
        <Icon name="sparkles" class="h-4 w-4" />
        {t(lang, 'tryon.tryButton')}
      </a>
      <a href={href} aria-label={`${t(lang, 'tryon.inquiry')}: ${name}`} class="inline-flex items-center gap-2 text-sm font-semibold text-brand transition-colors hover:text-brand/80">
        {t(lang, 'tryon.inquiry')}
        <Icon name="arrow" class="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </a>
    </div>
```

(Keep the existing `href = ${contactPath}?kit=${jersey.slug}` variable and the `aria-label` added in the Phase A fix — preserve it on the inquiry link.)

- [ ] **Step 4: Refresh copy in `site/src/i18n/ui.mjs`**

Replace the values of the two existing keys:

```js
  'tryon.intro': {
    fo: 'Vel ein bún úr savninum, royn hann á tær og set teg í samband um hann.',
    en: 'Pick a jersey from the collection, try it on you, and get in touch about it.',
  },
  'tryon.step2.desc': {
    fo: 'Trýst á “Royn á tær” á einum búni og sí hann á tær við kamera.',
    en: 'Tap “Try it on” on a jersey and see it on you with your camera.',
  },
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: build succeeds; all tests pass.

- [ ] **Step 6: Commit**

```bash
git add site/src site/tests/build.test.mjs
git commit -m "feat(site): gallery try-on links and refreshed try-on copy"
```

---

### Task 3: Privacy note, README, deploy + live verification

**Files:**
- Modify: `site/src/i18n/ui.mjs` (`legal.privacy.p3`), `site/src/pages/privatlivspolitikkur.astro`, `site/src/pages/en/privacy.astro`
- Modify: `README.md`
- Test: `site/tests/build.test.mjs` (extend)

- [ ] **Step 1: Extend tests first (failing)**

Append to `site/tests/build.test.mjs`:

```js
test('privacy pages mention the try-on partner', async () => {
  const fo = await readDist('privatlivspolitikkur/index.html');
  const en = await readDist('en/privacy/index.html');
  assert.match(fo, /Anywear/);
  assert.match(en, /Anywear/);
});
```

- [ ] **Step 2: Add the key + render it**

`ui.mjs` (legal block):

```js
  'legal.privacy.p3': {
    fo: 'Try-on: tá ið tú brúkar try-on-loysnina, verður kameramyndin viðgjørd av try-on-partnara okkara (Anywear/Decart) fyri at vísa búnan á tær. Vit goyma ikki myndina hjá okkum.',
    en: 'Try-on: when you use the try-on feature, the camera image is processed by our try-on partner (Anywear/Decart) to show the jersey on you. We do not store the image ourselves.',
  },
```

`privatlivspolitikkur.astro`: extend the paragraphs array to `[p1, p2, p3]` (import/t access already present). `en/privacy.astro`: same.

- [ ] **Step 3: Update `README.md`**

Add to the try-on section:

```md
- Jersey detail pages (`/roynd/jersey-01` … `/en/try-on/jersey-01`) carry Product JSON-LD and per-page og:image,
  which activates the Anywear try-on widget on those pages only. The "Royn á tær" button opens it via
  `window.DecartWidget.open()`.
- The widget script URL is domain-bound: it currently reads `?domain=treyst.vercel.app`. When treyst.fo goes live,
  update the URL in `site/src/components/JerseyDetailPage.astro` AND the domain in the Anywear dashboard.
```

- [ ] **Step 4: Run tests + build verification**

Run: `npm test`
Expected: build succeeds (45 pages); all tests pass.

- [ ] **Step 5: Commit**

```bash
git add site/src README.md site/tests/build.test.mjs
git commit -m "docs: try-on partner privacy note and phase B handover notes"
```

- [ ] **Step 6: Hand off to controller for deploy verification**

Stop here. The controller merges to `main`, pushes (triggering the Vercel deploy), then runs the live verification (detail page 200, widget element present in headless Chrome, no console errors) and records the results.

---

## Plan Self-Review

- **Spec coverage:** §2 detail pages (Task 1), gallery trigger links + copy (Task 2), domain binding + README + privacy (Task 3), live verification (Task 3 Step 6 / controller).
- **Placeholder scan:** no TODO/TBD; all code steps complete; the only page-count claims (45 pages) will be corrected on contact if stale.
- **Consistency:** `[data-tryon-open]`/`[data-tryon-status]` hooks defined and consumed in Task 1; `tryon.tryButton` reused by Task 2 cards; slug routes match `jerseys.mjs`; `ogImage` prop threaded `BaseLayout → SeoHead`; prefix rules in `switchLocalePath` match the detail route shape asserted by the i18n + hreflang tests.
