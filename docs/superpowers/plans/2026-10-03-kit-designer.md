# TREYST Kit Designer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the bilingual interactive Kit Designer (`/kitedesign`, `/en/kit-designer`) to the shipped TREYST site: live SVG jersey preview, colour/pattern/crest/sponsor/name-number controls, base64url design links, PNG spec-sheet export, and a design-aware quote form — all vanilla, no new dependencies.

**Architecture:** A pure core module (`kit-designer-core.mjs`: defaults, sanitize, base64url codec) unit-tested with `node:test`; a DOM module (`kit-designer.mjs`: state → render → events → share/export) imported by the `KitDesigner.astro` island. The island server-renders the **default design** so the page is meaningful without JS. Export reuses the live preview SVGs (clone → compose → rasterise), so jersey geometry exists once. Quote integration extends the existing `ContactForm` to read `?d=` and attach the design URL.

**Tech Stack:** existing site stack (Astro 5, Tailwind v4, vanilla JS, node:test). No new dependencies.

## Global Constraints

- No new dependencies; no third-party JS. Designer module adds ~4–7 KB gz — total JS stays < 35 KB gz (budget test enforces).
- All user-visible copy from `src/i18n/ui.mjs` (FO + EN, every key both languages). No hardcoded UI strings in markup or script.
- Token palette/styling unchanged; reuse the two-tone `:focus-visible` styles; native controls only.
- State schema v1 exactly as the spec (`docs/superpowers/specs/2026-10-03-kit-designer-design.md` §4.1): `{ v, c[4], p, cn, cf, sp, sb, n, no, nf }`.
- Share code: base64url (no `+` `/` `=`), JSON sanitized before encoding; decode sanitizes field-by-field; malformed → invalid, never throws.
- Crest: local-only (memory), included in PNG, excluded from share code (UI note required).
- Routes: FO `/kitedesign`, EN `/en/kit-designer`; added to `ROUTE_PAIRS`; all pages dark hero + existing nav/footer; reduce-motion-safe (no new motion).
- Tests run `node --test tests/*.test.mjs` after `astro build` via `npm test`; commit per task.

## File Structure

```
Treyst/site/
├── src/scripts/kit-designer-core.mjs      # Task 1
├── src/scripts/kit-designer.mjs           # Tasks 4–5
├── src/components/KitDesigner.astro       # Task 3 (markup), extended in 4
├── src/components/KitDesignerPage.astro   # Task 3
├── src/components/DesignerCta.astro       # Task 6
├── src/pages/kitedesign.astro             # Task 3
├── src/pages/en/kit-designer.astro        # Task 3
├── src/i18n/ui.mjs                        # Task 2
├── src/i18n/utils.mjs                     # Task 2
├── src/components/Icon.astro              # Task 2
├── src/components/Nav.astro               # Task 2
├── src/components/Footer.astro            # Task 2
├── src/components/ContactForm.astro       # Task 6
├── src/components/JerseyCustomizer.astro  # Task 6
├── src/components/ServicePage.astro       # Task 6
└── tests/kit-designer.test.mjs            # Task 1
    tests/build.test.mjs                   # Tasks 2,3,6 extend
```

Commands run with workdir `Treyst/site` unless stated. Parent path contains spaces — quote absolute paths.

---

### Task 1: Core module — state, sanitize, base64url codec + unit tests

**Files:**
- Create: `site/src/scripts/kit-designer-core.mjs`
- Create: `site/tests/kit-designer.test.mjs`

**Interfaces:**
- Consumes: nothing (pure, no DOM).
- Produces: `PALETTE` (24 hex strings, order fixed), `PATTERNS` (`['solid','stripes','hoops','halves','sash','band']`), `TEXT_FONTS` (`['block','wide','classic']`), `NUMBER_STYLES` (`['classic','outline','shadow']`), `DEFAULT_DESIGN`, `LIMITS` (`{ cn:16, sp:18, sb:18, n:12 }`), `sanitizeDesign(raw) -> state`, `encodeDesign(state) -> string`, `decodeDesign(str) -> { ok:true, state } | { ok:false, error }`.

- [ ] **Step 1: Write the failing tests — `site/tests/kit-designer.test.mjs`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_DESIGN,
  LIMITS,
  PALETTE,
  PATTERNS,
  encodeDesign,
  decodeDesign,
  sanitizeDesign,
} from '../src/scripts/kit-designer-core.mjs';

const sample = {
  ...DEFAULT_DESIGN,
  c: ['#DC2626', '#FFFFFF', '#101814', '#EAB308'],
  p: 'halves',
  cn: 'KÍ Klaksvík',
  cf: 'wide',
  sp: 'Sparikassin',
  sb: 'Norðoya',
  n: 'Jógvan',
  no: '10',
  nf: 'outline',
};

test('encode/decode roundtrip keeps every field', () => {
  const result = decodeDesign(encodeDesign(sample));
  assert.equal(result.ok, true);
  assert.deepEqual(result.state, sample);
});

test('Faroese characters survive the roundtrip', () => {
  const design = { ...DEFAULT_DESIGN, cn: 'Tvøroyri', n: 'Árni ð', sp: 'Rógving' };
  const result = decodeDesign(encodeDesign(design));
  assert.equal(result.ok, true);
  assert.equal(result.state.cn, 'Tvøroyri');
  assert.equal(result.state.n, 'Árni ð');
  assert.equal(result.state.sp, 'Rógving');
});

test('share code uses url-safe charset only', () => {
  for (const design of [DEFAULT_DESIGN, sample]) {
    assert.match(encodeDesign(design), /^[A-Za-z0-9_-]+$/);
  }
});

test('invalid inputs return ok:false without throwing', () => {
  for (const bad of ['', 'not base64!!', 'x'.repeat(2000), null, undefined, 42]) {
    const result = decodeDesign(bad);
    assert.equal(result.ok, false);
  }
});

test('unknown version is rejected', () => {
  const json = JSON.stringify({ ...DEFAULT_DESIGN, v: 2 });
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const code = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  assert.equal(decodeDesign(code).ok, false);
});

test('sanitize fixes colours, pattern, number and clamps text', () => {
  const dirty = {
    v: 99,
    c: ['nope', '#dc2626', 123, '#ffffff'],
    p: 'totally-unknown',
    cn: 'x'.repeat(80),
    cf: 'comic-sans',
    sp: 'y'.repeat(80),
    sb: 'z'.repeat(80),
    n: 'w'.repeat(80),
    no: '1a2b3',
    nf: 'fancy',
  };
  const clean = sanitizeDesign(dirty);
  assert.deepEqual(clean.c, [DEFAULT_DESIGN.c[0], '#DC2626', DEFAULT_DESIGN.c[2], '#FFFFFF']);
  assert.equal(clean.p, 'solid');
  assert.equal(clean.cn.length, LIMITS.cn);
  assert.equal(clean.cf, 'block');
  assert.equal(clean.sp.length, LIMITS.sp);
  assert.equal(clean.sb.length, LIMITS.sb);
  assert.equal(clean.n.length, LIMITS.n);
  assert.equal(clean.no, '12');
  assert.equal(clean.nf, 'classic');
  assert.equal(clean.v, 1);
});

test('defaults are complete and well-formed', () => {
  assert.equal(DEFAULT_DESIGN.v, 1);
  assert.equal(DEFAULT_DESIGN.c.length, 4);
  assert.ok(DEFAULT_DESIGN.c.every((hex) => /^#[0-9A-F]{6}$/.test(hex)));
  assert.ok(PATTERNS.includes(DEFAULT_DESIGN.p));
  assert.equal(PALETTE.length, 24);
  assert.ok(PALETTE.every((hex) => /^#[0-9A-F]{6}$/.test(hex)));
  assert.deepEqual(sanitizeDesign(undefined), DEFAULT_DESIGN);
  assert.deepEqual(sanitizeDesign(null), DEFAULT_DESIGN);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/kit-designer.test.mjs`
Expected: FAIL — cannot find module `../src/scripts/kit-designer-core.mjs`.

- [ ] **Step 3: Create `site/src/scripts/kit-designer-core.mjs`**

```js
export const PALETTE = [
  '#FFFFFF', '#F6F5F1', '#101814', '#0C1512', '#6B7280', '#0F766E',
  '#2DD4BF', '#065F46', '#16A34A', '#84CC16', '#EAB308', '#F59E0B',
  '#EA580C', '#DC2626', '#B91C1C', '#9F1239', '#F472B6', '#A855F7',
  '#6D28D9', '#4F46E5', '#2563EB', '#0EA5E9', '#0E7490', '#78350F',
];

export const PATTERNS = ['solid', 'stripes', 'hoops', 'halves', 'sash', 'band'];
export const TEXT_FONTS = ['block', 'wide', 'classic'];
export const NUMBER_STYLES = ['classic', 'outline', 'shadow'];

export const LIMITS = { cn: 16, sp: 18, sb: 18, n: 12 };

export const DEFAULT_DESIGN = {
  v: 1,
  c: ['#0F766E', '#0C1512', '#FFFFFF', '#2DD4BF'],
  p: 'stripes',
  cn: 'TREYST',
  cf: 'block',
  sp: '',
  sb: '',
  n: '',
  no: '',
  nf: 'classic',
};

const HEX = /^#[0-9A-F]{6}$/;

const asHex = (value, fallback) =>
  typeof value === 'string' && HEX.test(value.toUpperCase()) ? value.toUpperCase() : fallback;

const pick = (value, list, fallback) => (list.includes(value) ? value : fallback);

const text = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

export function sanitizeDesign(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const colors = Array.isArray(source.c) ? source.c : [];
  const no = typeof source.no === 'string' ? source.no.replace(/\D/g, '').slice(0, 2) : '';
  return {
    v: 1,
    c: [
      asHex(colors[0], DEFAULT_DESIGN.c[0]),
      asHex(colors[1], DEFAULT_DESIGN.c[1]),
      asHex(colors[2], DEFAULT_DESIGN.c[2]),
      asHex(colors[3], DEFAULT_DESIGN.c[3]),
    ],
    p: pick(source.p, PATTERNS, DEFAULT_DESIGN.p),
    cn: text(source.cn, LIMITS.cn),
    cf: pick(source.cf, TEXT_FONTS, DEFAULT_DESIGN.cf),
    sp: text(source.sp, LIMITS.sp),
    sb: text(source.sb, LIMITS.sb),
    n: text(source.n, LIMITS.n),
    no,
    nf: pick(source.nf, NUMBER_STYLES, DEFAULT_DESIGN.nf),
  };
}

export function encodeDesign(state) {
  const json = JSON.stringify(sanitizeDesign(state));
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeDesign(code) {
  if (typeof code !== 'string' || code.length === 0 || code.length > 1024) {
    return { ok: false, error: 'length' };
  }
  if (!/^[A-Za-z0-9_-]+$/.test(code)) return { ok: false, error: 'charset' };
  try {
    const base = code.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base + '='.repeat((4 - (base.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    if (!parsed || typeof parsed !== 'object' || parsed.v !== 1) {
      return { ok: false, error: 'version' };
    }
    return { ok: true, state: sanitizeDesign(parsed) };
  } catch {
    return { ok: false, error: 'malformed' };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/kit-designer.test.mjs`
Expected: all 7 tests pass.

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: build succeeds; all tests pass (36 existing + 7 new).

- [ ] **Step 6: Commit**

```bash
git add site/src/scripts/kit-designer-core.mjs site/tests/kit-designer.test.mjs
git commit -m "feat(site): kit designer core — state, sanitize and share codec"
```

---

### Task 2: Copy, route pair, and discovery (nav, footer, icon)

**Files:**
- Modify: `site/src/i18n/ui.mjs` (designer + quote copy blocks)
- Modify: `site/src/i18n/utils.mjs` (`ROUTE_PAIRS`)
- Modify: `site/src/components/Icon.astro` (`palette` icon)
- Modify: `site/src/components/Nav.astro` (dropdown + drawer entries)
- Modify: `site/src/components/Footer.astro` (pages list)
- Test: `site/tests/build.test.mjs` (extend)

**Interfaces:**
- Consumes: Task 1 (none at runtime; the route pair is used by the switcher and later tests).
- Produces: i18n keys listed below (used by Tasks 3–6); `localizePath('/kitedesign', lang)` resolves; nav dropdown shows a divider + palette-iconed entry after the four services; footer pages list includes it.

- [ ] **Step 1: Extend tests first (failing)**

Append to `site/tests/build.test.mjs`:

```js
test('kit designer is discoverable from nav and footer (FO)', async () => {
  const html = await readDist('index.html');
  assert.match(html, /href="\/kitedesign"/);
  assert.match(html, /Designa búnan/);
});

test('kit designer is discoverable from nav and footer (EN)', async () => {
  const html = await readDist('en/index.html');
  assert.match(html, /href="\/en\/kit-designer"/);
  assert.match(html, /Kit Designer/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — no `/kitedesign` links.

- [ ] **Step 3: Add the designer + quote copy to `site/src/i18n/ui.mjs`**

Insert this block immediately before the `// ---- about ----` section marker:

```js
  // ---- kit designer ----
  'nav.designer': { fo: 'Designa búnan', en: 'Kit Designer' },
  'meta.designer.title': { fo: 'Designa búnan', en: 'Kit Designer' },
  'meta.designer.description': {
    fo: 'Set saman búnan hjá tínum felag — litir, mynstur, logo og nøvn. Send designið beint til TREYST.',
    en: 'Design your club’s kit — colours, pattern, crest and names. Send the design straight to TREYST.',
  },
  'designer.eyebrow': { fo: 'Kit Designer', en: 'Kit Designer' },
  'designer.h1': { fo: 'Designa búnan hjá tykkum', en: 'Design your kit' },
  'designer.intro': { fo: 'Vel litir, mynstur, logo og nøvn — og send síðani designið beint til okkum í tilboðsforminum.', en: 'Pick colours, pattern, crest and names — then send the design straight to us in the quote form.' },
  'designer.view': { fo: 'Sýn', en: 'View' },
  'designer.front': { fo: 'Fram', en: 'Front' },
  'designer.back': { fo: 'Bak', en: 'Back' },
  'designer.previewAlt': { fo: 'Design av búna', en: 'Kit design preview' },
  'designer.slot': { fo: 'Litir', en: 'Colours' },
  'designer.slot.body': { fo: 'Búkur', en: 'Body' },
  'designer.slot.sleeves': { fo: 'Ermar', en: 'Sleeves' },
  'designer.slot.collar': { fo: 'Kragi', en: 'Collar' },
  'designer.slot.pattern': { fo: 'Mynstur', en: 'Pattern' },
  'designer.custom': { fo: 'Egin litur', en: 'Custom colour' },
  'designer.pattern': { fo: 'Mynstur', en: 'Pattern' },
  'designer.pattern.solid': { fo: 'Einfaldur', en: 'Solid' },
  'designer.pattern.stripes': { fo: 'Rendar', en: 'Stripes' },
  'designer.pattern.hoops': { fo: 'Tvørrendur', en: 'Hoops' },
  'designer.pattern.halves': { fo: 'Hálvar', en: 'Halves' },
  'designer.pattern.sash': { fo: 'Skákband', en: 'Sash' },
  'designer.pattern.band': { fo: 'Bringuband', en: 'Chest band' },
  'designer.clubName': { fo: 'Navn á felag (fram)', en: 'Club name (front)' },
  'designer.font': { fo: 'Skrift', en: 'Font' },
  'designer.font.block': { fo: 'Blokkur', en: 'Block' },
  'designer.font.wide': { fo: 'Víð', en: 'Wide' },
  'designer.font.classic': { fo: 'Klassiskur', en: 'Classic' },
  'designer.sponsorFront': { fo: 'Stuðli (fram)', en: 'Sponsor (front)' },
  'designer.sponsorBack': { fo: 'Stuðli (bak)', en: 'Sponsor (back)' },
  'designer.playerName': { fo: 'Navn á leikara', en: 'Player name' },
  'designer.number': { fo: 'Nummar', en: 'Number' },
  'designer.numberStyle': { fo: 'Stílur', en: 'Number style' },
  'designer.numberStyle.classic': { fo: 'Klassiskur', en: 'Classic' },
  'designer.numberStyle.outline': { fo: 'Útlínur', en: 'Outline' },
  'designer.numberStyle.shadow': { fo: 'Skuggi', en: 'Shadow' },
  'designer.crest': { fo: 'Logo / brennimark', en: 'Crest / logo' },
  'designer.crestNote': { fo: 'Logo verður bara við í niðurheinta myndini — ikki í designlinkinum.', en: 'The crest is only included in the downloaded PNG — not in the design link.' },
  'designer.copy': { fo: 'Avrita designlink', en: 'Copy design link' },
  'designer.copied': { fo: 'Link avritað!', en: 'Link copied!' },
  'designer.download': { fo: 'Heinta mynd (PNG)', en: 'Download PNG' },
  'designer.send': { fo: 'Send til TREYST', en: 'Send to TREYST' },
  'designer.exportError': { fo: 'Fekk ikki gjørt myndina. Royn aftur.', en: 'Could not create the image. Try again.' },
  'designer.how': { fo: 'Hvussu tað virkar', en: 'How it works' },
  'designer.step1.title': { fo: '1. Designa', en: '1. Design' },
  'designer.step1.desc': { fo: 'Vel litir, mynstur, logo og nøvn.', en: 'Pick colours, pattern, crest and names.' },
  'designer.step2.title': { fo: '2. Deil', en: '2. Share' },
  'designer.step2.desc': { fo: 'Avrita designlinkin ella heinta myndina.', en: 'Copy the design link or download the PNG.' },
  'designer.step3.title': { fo: '3. Send', en: '3. Send' },
  'designer.step3.desc': { fo: 'Send til TREYST og fá eitt tilboð.', en: 'Send to TREYST and get a quote.' },
  'designer.cta.title': { fo: 'Designa búnan hjá tínum felag', en: 'Design your club’s kit' },
  'designer.cta.desc': { fo: 'Tað tekur bert fáar minuttir.', en: 'It only takes a couple of minutes.' },
  'designer.cta.button': { fo: 'Byrja at designa', en: 'Start designing' },
  'designer.openFull': { fo: 'Opna fulla designarin →', en: 'Open the full designer →' },
```

And insert after the `'form.mailtoNote'` entry:

```js
  'quote.designIncluded': { fo: 'Design við í fyrispuringi', en: 'Design included in your request' },
  'quote.viewDesign': { fo: 'Sí designið', en: 'View design' },
```

- [ ] **Step 4: Add the route pair to `ROUTE_PAIRS` in `site/src/i18n/utils.mjs`**

After the `...services.map(...)` line insert:

```js
  { fo: '/kitedesign', en: '/en/kit-designer' },
```

- [ ] **Step 5: Add the `palette` icon to `site/src/components/Icon.astro`**

Add to the `icons` map:

```js
  palette: '<circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
```

- [ ] **Step 6: Add the designer entry to `site/src/components/Nav.astro`**

In the frontmatter, after `const contact = localizePath('/samband', lang);` add:

```js
const designer = localizePath('/kitedesign', lang);
```

In the desktop dropdown, directly after the `{items.map(...)}` block ends, insert:

```astro
            <div class="mx-2 my-1 h-px bg-white/10"></div>
            <a href={designer} class="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/5 hover:text-white">
              <Icon name="palette" class="h-4 w-4 text-brand-bright" />
              {t(lang, 'nav.designer')}
            </a>
```

In the mobile drawer services group, directly after the `{items.map(...)}` block ends, insert:

```astro
          <a href={designer} class="flex items-center gap-2 hover:text-brand-bright">
            <Icon name="palette" class="h-5 w-5 text-brand-bright" />
            {t(lang, 'nav.designer')}
          </a>
```

- [ ] **Step 7: Add the designer to the footer pages list in `site/src/components/Footer.astro`**

In the `pages` array, after the about entry, add:

```js
  { href: localizePath('/kitedesign', lang), label: t(lang, 'nav.designer') },
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `npm test`
Expected: build succeeds; all tests pass.

- [ ] **Step 9: Commit**

```bash
git add site/src/i18n site/src/components site/tests/build.test.mjs
git commit -m "feat(site): kit designer copy, route pair and discovery links"
```

---

### Task 3: Pages + designer island markup (static, no JS yet)

**Files:**
- Create: `site/src/components/KitDesigner.astro`
- Create: `site/src/components/KitDesignerPage.astro`
- Create: `site/src/pages/kitedesign.astro`, `site/src/pages/en/kit-designer.astro`
- Test: `site/tests/build.test.mjs` (extend, incl. hreflang matrix)

**Interfaces:**
- Consumes: Task 1 constants (`PALETTE`, `PATTERNS`, `TEXT_FONTS`, `NUMBER_STYLES`, `DEFAULT_DESIGN`), Task 2 keys.
- Produces: island root `[data-kit-designer]` with `data-contact-path`/`data-lang`; preview SVGs `[data-kd-preview][data-kd-view=front|back]`; control hooks consumed by Task 4: `[data-kd-slot]` (4 radios), `[data-kd-swatch]` (24 buttons), `[data-kd-color-picker]`, `[data-kd-pattern-input]` (6 radios), `[data-kd-clubname-input]`, `[data-kd-font-input]`, `[data-kd-sponsorf-input]`, `[data-kd-sponsorb-input]`, `[data-kd-name-input]`, `[data-kd-number-input]`, `[data-kd-numberstyle-input]`, `[data-kd-crest-input]`, `[data-kd-copy]`, `[data-kd-download]`, `[data-kd-send]`, `[data-kd-status]`; SVG targets `[data-kd-body]`, `[data-kd-sleeve]`, `[data-kd-collar]`, `[data-kd-pattern="<id>"]` (6 groups), `[data-kd-crest-img]`, `[data-kd-clubname]`, `[data-kd-sponsorf]`, `[data-kd-name]`, `[data-kd-number]`, `[data-kd-number-duplicate]`, `[data-kd-sponsorb]`.

- [ ] **Step 1: Extend tests first (failing)**

Append to `site/tests/build.test.mjs`:

```js
test('kit designer pages build with markup (FO)', async () => {
  const html = await readDist('kitedesign/index.html');
  assert.match(html, /<html lang="fo"/);
  assert.match(html, /Designa búnan hjá tykkum/);
  assert.match(html, /data-kit-designer/);
  assert.match(html, /data-kd-view="front"/);
  assert.match(html, /data-kd-view="back"/);
  assert.equal((html.match(/data-kd-pattern="/g) || []).length, 12, 'six pattern groups per view');
  assert.equal((html.match(/data-kd-swatch/g) || []).length, 24, '24 curated swatches');
});

test('kit designer pages build with markup (EN)', async () => {
  const html = await readDist('en/kit-designer/index.html');
  assert.match(html, /<html lang="en"/);
  assert.match(html, /Design your kit/);
  assert.match(html, /data-kit-designer/);
});
```

And add this pair to the `PAIRS` array in the hreflang test:

```js
  ['kitedesign/index.html', 'en/kit-designer/index.html', '/kitedesign', '/en/kit-designer'],
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `dist/kitedesign/index.html` missing.

- [ ] **Step 3: Create `site/src/components/KitDesigner.astro`**

```astro
---
import Button from './Button.astro';
import { t } from '../i18n/utils.mjs';
import { DEFAULT_DESIGN, PALETTE, PATTERNS, TEXT_FONTS, NUMBER_STYLES } from '../scripts/kit-designer-core.mjs';

const { lang, contactPath } = Astro.props;

const JERSEY = 'M70 24c0 0 8 10 30 10s30-10 30-10l32 14 20 36-30 14-10-16v124H58V72l-10 16-30-14 20-36z';
const SLEEVE_L = 'M70 24 38 38 18 74 48 88 58 72z';
const SLEEVE_R = 'M130 24 162 38 182 74 152 88 142 72z';
const COLLAR = 'M70 24c8 10 22 10 30 10s22-10 30-10l-4 14c-6 8-16 12-26 12s-20-4-26-12z';

const slots = [
  { id: 'body', key: 'designer.slot.body', index: 0 },
  { id: 'sleeves', key: 'designer.slot.sleeves', index: 1 },
  { id: 'collar', key: 'designer.slot.collar', index: 2 },
  { id: 'pattern', key: 'designer.slot.pattern', index: 3 },
];
const field = 'mt-2 w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-ink';
const label = 'block text-sm font-semibold text-ink/70';
const chip = 'cursor-pointer rounded-full border-2 border-ink/10 px-4 py-2 text-sm font-semibold text-ink/70 transition peer-checked:border-brand peer-checked:text-brand peer-focus-visible:ring-2 peer-focus-visible:ring-ink peer-focus-visible:ring-offset-2';
const textColor = '#101814';
---
<div data-kit-designer data-contact-path={contactPath} data-lang={lang}>
  <div class="grid gap-12 lg:grid-cols-2">
    <div>
      <div class="mb-6 flex justify-center">
        <div class="inline-flex rounded-full bg-fog p-1" role="radiogroup" aria-label={t(lang, 'designer.view')}>
          <label class="cursor-pointer">
            <input type="radio" name="kd-view" value="front" class="peer sr-only" checked />
            <span class="block rounded-full px-6 py-2 text-sm font-semibold text-ink/70 peer-checked:bg-white peer-checked:text-ink">{t(lang, 'designer.front')}</span>
          </label>
          <label class="cursor-pointer">
            <input type="radio" name="kd-view" value="back" class="peer sr-only" />
            <span class="block rounded-full px-6 py-2 text-sm font-semibold text-ink/70 peer-checked:bg-white peer-checked:text-ink">{t(lang, 'designer.back')}</span>
          </label>
        </div>
      </div>

      <svg data-kd-preview data-kd-view="front" viewBox="0 0 200 220" role="img" aria-label={t(lang, 'designer.previewAlt')} class="mx-auto w-full max-w-sm">
        <defs><clipPath id="kd-clip-front"><path d={JERSEY} /></clipPath></defs>
        <path data-kd-body d={JERSEY} fill={DEFAULT_DESIGN.c[0]} stroke="rgba(16,24,20,0.15)" stroke-width="2" />
        <g clip-path="url(#kd-clip-front)">
          <g data-kd-pattern="solid" fill={DEFAULT_DESIGN.c[3]}></g>
          <g data-kd-pattern="stripes" fill={DEFAULT_DESIGN.c[3]} hidden>
            <rect x="52" y="0" width="14" height="220" /><rect x="80" y="0" width="14" height="220" /><rect x="108" y="0" width="14" height="220" /><rect x="136" y="0" width="14" height="220" />
          </g>
          <g data-kd-pattern="hoops" fill={DEFAULT_DESIGN.c[3]} hidden>
            <rect x="0" y="64" width="200" height="14" /><rect x="0" y="92" width="200" height="14" /><rect x="0" y="120" width="200" height="14" /><rect x="0" y="148" width="200" height="14" /><rect x="0" y="176" width="200" height="14" />
          </g>
          <g data-kd-pattern="halves" fill={DEFAULT_DESIGN.c[3]} hidden>
            <rect x="58" y="0" width="42" height="220" />
          </g>
          <g data-kd-pattern="sash" fill={DEFAULT_DESIGN.c[3]} hidden>
            <rect x="-20" y="96" width="240" height="30" transform="rotate(-25 100 110)" />
          </g>
          <g data-kd-pattern="band" fill={DEFAULT_DESIGN.c[3]} hidden>
            <rect x="0" y="98" width="200" height="26" />
          </g>
        </g>
        <path data-kd-sleeve d={SLEEVE_L} fill={DEFAULT_DESIGN.c[1]} />
        <path data-kd-sleeve d={SLEEVE_R} fill={DEFAULT_DESIGN.c[1]} />
        <path data-kd-collar d={COLLAR} fill={DEFAULT_DESIGN.c[2]} />
        <g data-kd-crest>
          <rect data-kd-crest-placeholder x="62" y="78" width="28" height="28" fill="none" stroke="rgba(16,24,20,0.25)" stroke-dasharray="3 3" />
          <image data-kd-crest-img x="62" y="78" width="28" height="28" preserveAspectRatio="xMidYMid meet" hidden />
        </g>
        <text data-kd-clubname x="100" y="64" text-anchor="middle" font-size="12" font-weight="700" letter-spacing="1" fill={textColor}>{DEFAULT_DESIGN.cn}</text>
        <text data-kd-sponsorf x="100" y="132" text-anchor="middle" font-size="10" font-weight="600" fill={textColor}></text>
      </svg>

      <svg data-kd-preview data-kd-view="back" viewBox="0 0 200 220" role="img" aria-label={t(lang, 'designer.previewAlt')} class="mx-auto w-full max-w-sm" hidden>
        <defs><clipPath id="kd-clip-back"><path d={JERSEY} /></clipPath></defs>
        <path data-kd-body d={JERSEY} fill={DEFAULT_DESIGN.c[0]} stroke="rgba(16,24,20,0.15)" stroke-width="2" />
        <g clip-path="url(#kd-clip-back)">
          <g data-kd-pattern="solid" fill={DEFAULT_DESIGN.c[3]}></g>
          <g data-kd-pattern="stripes" fill={DEFAULT_DESIGN.c[3]} hidden>
            <rect x="52" y="0" width="14" height="220" /><rect x="80" y="0" width="14" height="220" /><rect x="108" y="0" width="14" height="220" /><rect x="136" y="0" width="14" height="220" />
          </g>
          <g data-kd-pattern="hoops" fill={DEFAULT_DESIGN.c[3]} hidden>
            <rect x="0" y="64" width="200" height="14" /><rect x="0" y="92" width="200" height="14" /><rect x="0" y="120" width="200" height="14" /><rect x="0" y="148" width="200" height="14" /><rect x="0" y="176" width="200" height="14" />
          </g>
          <g data-kd-pattern="halves" fill={DEFAULT_DESIGN.c[3]} hidden>
            <rect x="58" y="0" width="42" height="220" />
          </g>
          <g data-kd-pattern="sash" fill={DEFAULT_DESIGN.c[3]} hidden>
            <rect x="-20" y="96" width="240" height="30" transform="rotate(-25 100 110)" />
          </g>
          <g data-kd-pattern="band" fill={DEFAULT_DESIGN.c[3]} hidden>
            <rect x="0" y="98" width="200" height="26" />
          </g>
        </g>
        <path data-kd-sleeve d={SLEEVE_L} fill={DEFAULT_DESIGN.c[1]} />
        <path data-kd-sleeve d={SLEEVE_R} fill={DEFAULT_DESIGN.c[1]} />
        <path data-kd-collar d={COLLAR} fill={DEFAULT_DESIGN.c[2]} />
        <text data-kd-name x="100" y="76" text-anchor="middle" font-size="11" font-weight="700" letter-spacing="1" fill={textColor}></text>
        <text data-kd-number-duplicate x="100" y="152" text-anchor="middle" font-size="56" font-weight="800" fill="rgba(16,24,20,0.25)" hidden>10</text>
        <text data-kd-number x="100" y="150" text-anchor="middle" font-size="56" font-weight="800" fill={textColor}>10</text>
        <text data-kd-sponsorb x="100" y="192" text-anchor="middle" font-size="9" font-weight="600" fill={textColor}></text>
      </svg>
    </div>

    <div class="space-y-8">
      <fieldset>
        <legend class={label}>{t(lang, 'designer.slot')}</legend>
        <div class="mt-3 flex flex-wrap gap-2" role="radiogroup">
          {slots.map((slot, i) => (
            <label class="cursor-pointer">
              <input type="radio" name="kd-slot" value={slot.id} data-kd-slot class="peer sr-only" checked={i === 0} />
              <span class={chip}>{t(lang, slot.key)}</span>
            </label>
          ))}
        </div>
        <div class="mt-4 flex flex-wrap gap-2">
          {PALETTE.map((hex) => (
            <button type="button" data-kd-swatch data-color={hex} aria-label={hex} class="h-9 w-9 rounded-full border-2 border-ink/10 transition focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2" style={`background:${hex}`}></button>
          ))}
        </div>
        <label class="mt-4 flex items-center gap-3">
          <span class="text-sm font-semibold text-ink/70">{t(lang, 'designer.custom')}</span>
          <input type="color" data-kd-color-picker value={DEFAULT_DESIGN.c[0]} class="h-9 w-14 cursor-pointer rounded-lg border border-ink/15 bg-white" />
        </label>
      </fieldset>

      <fieldset>
        <legend class={label}>{t(lang, 'designer.pattern')}</legend>
        <div class="mt-3 flex flex-wrap gap-2">
          {PATTERNS.map((pattern, i) => (
            <label class="cursor-pointer">
              <input type="radio" name="kd-pattern" value={pattern} data-kd-pattern-input class="peer sr-only" checked={pattern === DEFAULT_DESIGN.p} />
              <span class={chip}>{t(lang, `designer.pattern.${pattern}`)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div class="grid gap-5 sm:grid-cols-2">
        <div>
          <label class={label} for="kd-clubname">{t(lang, 'designer.clubName')}</label>
          <input class={field} id="kd-clubname" type="text" maxlength="16" value={DEFAULT_DESIGN.cn} data-kd-clubname-input />
        </div>
        <div>
          <label class={label} for="kd-font">{t(lang, 'designer.font')}</label>
          <select class={field} id="kd-font" data-kd-font-input>
            {TEXT_FONTS.map((font) => <option value={font} selected={font === DEFAULT_DESIGN.cf}>{t(lang, `designer.font.${font}`)}</option>)}
          </select>
        </div>
        <div>
          <label class={label} for="kd-sponsorf">{t(lang, 'designer.sponsorFront')}</label>
          <input class={field} id="kd-sponsorf" type="text" maxlength="18" value={DEFAULT_DESIGN.sp} data-kd-sponsorf-input />
        </div>
        <div>
          <label class={label} for="kd-sponsorb">{t(lang, 'designer.sponsorBack')}</label>
          <input class={field} id="kd-sponsorb" type="text" maxlength="18" value={DEFAULT_DESIGN.sb} data-kd-sponsorb-input />
        </div>
        <div>
          <label class={label} for="kd-name">{t(lang, 'designer.playerName')}</label>
          <input class={field} id="kd-name" type="text" maxlength="12" value={DEFAULT_DESIGN.n} data-kd-name-input />
        </div>
        <div>
          <label class={label} for="kd-number">{t(lang, 'designer.number')}</label>
          <input class={field} id="kd-number" type="text" inputmode="numeric" maxlength="2" value={DEFAULT_DESIGN.no} data-kd-number-input />
        </div>
        <div>
          <label class={label} for="kd-numberstyle">{t(lang, 'designer.numberStyle')}</label>
          <select class={field} id="kd-numberstyle" data-kd-numberstyle-input>
            {NUMBER_STYLES.map((style) => <option value={style} selected={style === DEFAULT_DESIGN.nf}>{t(lang, `designer.numberStyle.${style}`)}</option>)}
          </select>
        </div>
        <div>
          <label class={label} for="kd-crest">{t(lang, 'designer.crest')}</label>
          <input class="mt-2 block w-full text-sm text-ink/70" id="kd-crest" type="file" accept="image/*" data-kd-crest-input />
        </div>
      </div>
      <p class="text-xs text-ink/60">{t(lang, 'designer.crestNote')}</p>

      <div class="flex flex-wrap gap-3">
        <Button type="button" variant="ghost-dark" data-kd-copy>{t(lang, 'designer.copy')}</Button>
        <Button type="button" variant="ghost-dark" data-kd-download>{t(lang, 'designer.download')}</Button>
        <Button href={contactPath} variant="primary" data-kd-send>{t(lang, 'designer.send')}</Button>
      </div>
      <p data-kd-status role="status" aria-live="polite" class="text-sm font-medium text-ink/60"></p>
    </div>
  </div>
</div>
```

- [ ] **Step 4: Create `site/src/components/KitDesignerPage.astro`**

```astro
---
import KitDesigner from './KitDesigner.astro';
import SectionHeading from './SectionHeading.astro';
import CtaBand from './CtaBand.astro';
import { t, localizePath } from '../i18n/utils.mjs';

const { lang } = Astro.props;
const contactPath = localizePath('/samband', lang);
const steps = [1, 2, 3].map((n) => ({
  title: t(lang, `designer.step${n}.title`),
  desc: t(lang, `designer.step${n}.desc`),
}));
---
<section class="bg-fjord pt-20">
  <div class="mx-auto max-w-7xl px-4 pb-20 pt-14 sm:px-6 lg:px-8">
    <p class="text-sm font-semibold uppercase tracking-wider text-brand-bright">{t(lang, 'designer.eyebrow')}</p>
    <h1 class="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-white md:text-5xl">{t(lang, 'designer.h1')}</h1>
    <p class="mt-6 max-w-2xl text-lg font-light leading-relaxed text-white/75">{t(lang, 'designer.intro')}</p>
  </div>
</section>

<section class="bg-white py-16 lg:py-20">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <KitDesigner lang={lang} contactPath={contactPath} />
  </div>
</section>

<section class="bg-fog py-20">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <SectionHeading align="center" title={t(lang, 'designer.how')} />
    <ol class="mt-14 grid gap-10 sm:grid-cols-3">
      {steps.map((step, i) => (
        <li class="border-t border-ink/10 pt-6">
          <h2 class="text-xl font-bold text-ink">{step.title}</h2>
          <p class="mt-2 leading-relaxed text-ink/70">{step.desc}</p>
        </li>
      ))}
    </ol>
  </div>
</section>

<CtaBand lang={lang} />
```

- [ ] **Step 5: Create the two route wrappers**

`site/src/pages/kitedesign.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import KitDesignerPage from '../components/KitDesignerPage.astro';
import { t } from '../i18n/utils.mjs';

const lang = 'fo';
---
<BaseLayout
  lang={lang}
  title={t(lang, 'meta.designer.title')}
  description={t(lang, 'meta.designer.description')}
  path="/kitedesign"
  altPath="/en/kit-designer"
>
  <KitDesignerPage lang={lang} />
</BaseLayout>
```

`site/src/pages/en/kit-designer.astro`:
```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import KitDesignerPage from '../../components/KitDesignerPage.astro';
import { t } from '../../i18n/utils.mjs';

const lang = 'en';
---
<BaseLayout
  lang={lang}
  title={t(lang, 'meta.designer.title')}
  description={t(lang, 'meta.designer.description')}
  path="/en/kit-designer"
  altPath="/kitedesign"
>
  <KitDesignerPage lang={lang} />
</BaseLayout>
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm test`
Expected: build succeeds (21 pages); all tests pass, including the hreflang matrix now covering 10 pairs.

- [ ] **Step 7: Commit**

```bash
git add site/src site/tests/build.test.mjs
git commit -m "feat(site): kit designer pages and static island markup"
```

---

### Task 4: Designer interactivity — state, render, controls, crest, view toggle

**Files:**
- Create: `site/src/scripts/kit-designer.mjs`
- Modify: `site/src/components/KitDesigner.astro` (root data attributes + script import)
- Test: `site/tests/build.test.mjs` (extend)

**Interfaces:**
- Consumes: Task 1 core, Task 3 markup hooks.
- Produces: fully interactive island; module self-initialises on `[data-kit-designer]`. Accepted limitation (documented here): the exported PNG rasterises through an isolated SVG image, where web fonts are unavailable, so export text falls back to Arial — intentional, keeps export dependency-free.

- [ ] **Step 1: Extend tests first (failing)**

Append to `site/tests/build.test.mjs`:

```js
test('designer module is bundled into the page', async () => {
  const html = await readDist('kitedesign/index.html');
  assert.match(html, /image\/png/, 'crest downscale + rasteriser code should be inlined');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — no module yet.

- [ ] **Step 3: Update the designer root in `site/src/components/KitDesigner.astro`**

Replace the opening `<div data-kit-designer …>` tag with:

```astro
<div
  data-kit-designer
  data-contact-path={contactPath}
  data-lang={lang}
  data-msg-copied={t(lang, 'designer.copied')}
  data-msg-export-error={t(lang, 'designer.exportError')}
  data-filename="treyst-kit"
>
```

And append at the end of the file:

```astro
<script>
  import '../scripts/kit-designer.mjs';
</script>
```

- [ ] **Step 4: Create `site/src/scripts/kit-designer.mjs`**

```js
import {
  DEFAULT_DESIGN,
  decodeDesign,
  encodeDesign,
  sanitizeDesign,
} from './kit-designer-core.mjs';

const SLOT_INDEX = { body: 0, sleeves: 1, collar: 2, pattern: 3 };

const CONTRAST_LIGHT = '#101814';
const CONTRAST_DARK = '#FFFFFF';

const FONT_ATTRS = {
  block: { 'font-weight': '900', 'letter-spacing': '0' },
  wide: { 'font-weight': '800', 'letter-spacing': '2' },
  classic: { 'font-weight': '700', 'letter-spacing': '0.5' },
};

const contrastColor = (hex) => {
  const value = parseInt(hex.slice(1), 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.6 ? CONTRAST_LIGHT : CONTRAST_DARK;
};

const downscaleImage = (file, max) =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, max / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL('image/png'));
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('image'));
    };
    image.src = objectUrl;
  });

const initKitDesigner = (root) => {
  const $ = (selector) => root.querySelector(selector);
  const $$ = (selector) => [...root.querySelectorAll(selector)];

  const contactPath = root.getAttribute('data-contact-path') || '/samband';
  const status = $('[data-kd-status]');

  let state = DEFAULT_DESIGN;
  let crestDataUrl = '';

  const initial = decodeDesign(new URLSearchParams(window.location.search).get('d') || '');
  if (initial.ok) state = initial.state;

  const setStatus = (message) => {
    if (status) status.textContent = message;
  };

  const designerUrl = () => {
    const url = new URL(window.location.href);
    url.search = `?d=${encodeDesign(state)}`;
    return url.toString();
  };

  const activeSlot = () => $$('[data-kd-slot]').find((input) => input.checked)?.value || 'body';

  const setText = (node, value) => {
    if (!node) return;
    node.textContent = value;
    node.toggleAttribute('hidden', value.length === 0);
  };

  const render = () => {
    const [body, sleeves, collar, pattern] = state.c;
    const textOnBody = contrastColor(body);

    for (const node of $$('[data-kd-body]')) node.setAttribute('fill', body);
    for (const node of $$('[data-kd-sleeve]')) node.setAttribute('fill', sleeves);
    for (const node of $$('[data-kd-collar]')) node.setAttribute('fill', collar);
    for (const node of $$('[data-kd-pattern]')) {
      node.setAttribute('fill', pattern);
      node.toggleAttribute('hidden', node.getAttribute('data-kd-pattern') !== state.p);
    }

    const textNodes = $$('[data-kd-clubname], [data-kd-name], [data-kd-sponsorf], [data-kd-sponsorb], [data-kd-number]');
    for (const node of textNodes) node.setAttribute('fill', textOnBody);

    const fontAttrs = FONT_ATTRS[state.cf] || FONT_ATTRS.block;
    for (const node of $$('[data-kd-clubname], [data-kd-name]')) {
      for (const [key, value] of Object.entries(fontAttrs)) node.setAttribute(key, value);
    }

    setText($('[data-kd-clubname]'), state.cn);
    setText($('[data-kd-sponsorf]'), state.sp);
    setText($('[data-kd-name]'), state.n);
    setText($('[data-kd-sponsorb]'), state.sb);

    const number = $('[data-kd-number]');
    const duplicate = $('[data-kd-number-duplicate]');
    if (number) {
      number.textContent = state.no || '10';
      const outline = state.nf === 'outline';
      number.setAttribute('fill', outline ? 'none' : textOnBody);
      number.setAttribute('stroke', outline ? textOnBody : 'none');
      number.setAttribute('stroke-width', outline ? '2' : '0');
    }
    if (duplicate) {
      duplicate.textContent = number ? number.textContent : '';
      duplicate.toggleAttribute('hidden', state.nf !== 'shadow');
    }

    const crestImage = $('[data-kd-crest-img]');
    const crestPlaceholder = $('[data-kd-crest-placeholder]');
    if (crestImage && crestPlaceholder) {
      crestImage.toggleAttribute('hidden', !crestDataUrl);
      crestPlaceholder.toggleAttribute('hidden', !!crestDataUrl);
      if (crestDataUrl) crestImage.setAttribute('href', crestDataUrl);
    }

    for (const input of $$('[data-kd-pattern-input]')) input.checked = input.value === state.p;
    const clubInput = $('[data-kd-clubname-input]');
    if (clubInput) clubInput.value = state.cn;
    const fontInput = $('[data-kd-font-input]');
    if (fontInput) fontInput.value = state.cf;
    const sponsorFrontInput = $('[data-kd-sponsorf-input]');
    if (sponsorFrontInput) sponsorFrontInput.value = state.sp;
    const sponsorBackInput = $('[data-kd-sponsorb-input]');
    if (sponsorBackInput) sponsorBackInput.value = state.sb;
    const nameInput = $('[data-kd-name-input]');
    if (nameInput) nameInput.value = state.n;
    const numberInput = $('[data-kd-number-input]');
    if (numberInput) numberInput.value = state.no;
    const styleInput = $('[data-kd-numberstyle-input]');
    if (styleInput) styleInput.value = state.nf;

    const picker = $('[data-kd-color-picker]');
    if (picker) picker.value = state.c[SLOT_INDEX[activeSlot()]];

    const send = $('[data-kd-send]');
    if (send) send.setAttribute('href', `${contactPath}?d=${encodeDesign(state)}`);

    window.history.replaceState(null, '', designerUrl());
  };

  const syncView = () => {
    const checked = $$('input[name="kd-view"]').find((input) => input.checked)?.value || 'front';
    for (const svg of $$('[data-kd-preview]')) {
      svg.toggleAttribute('hidden', svg.getAttribute('data-kd-view') !== checked);
    }
  };

  const setColor = (hex) => {
    const index = SLOT_INDEX[activeSlot()];
    state = sanitizeDesign({ ...state, c: state.c.map((value, i) => (i === index ? hex : value)) });
    render();
  };

  for (const button of $$('[data-kd-swatch]')) {
    button.addEventListener('click', () => setColor(button.getAttribute('data-color')));
  }

  const picker = $('[data-kd-color-picker]');
  picker?.addEventListener('input', () => setColor(picker.value));
  for (const input of $$('[data-kd-slot]')) {
    input.addEventListener('change', () => {
      if (picker) picker.value = state.c[SLOT_INDEX[activeSlot()]];
    });
  }

  for (const input of $$('[data-kd-pattern-input]')) {
    input.addEventListener('change', () => {
      if (!input.checked) return;
      state = sanitizeDesign({ ...state, p: input.value });
      render();
    });
  }

  const bindText = (selector, key) => {
    const input = $(selector);
    input?.addEventListener('input', () => {
      state = sanitizeDesign({ ...state, [key]: input.value });
      render();
    });
  };
  bindText('[data-kd-clubname-input]', 'cn');
  bindText('[data-kd-sponsorf-input]', 'sp');
  bindText('[data-kd-sponsorb-input]', 'sb');
  bindText('[data-kd-name-input]', 'n');
  bindText('[data-kd-number-input]', 'no');

  $('[data-kd-font-input]')?.addEventListener('change', (event) => {
    state = sanitizeDesign({ ...state, cf: event.target.value });
    render();
  });
  $('[data-kd-numberstyle-input]')?.addEventListener('change', (event) => {
    state = sanitizeDesign({ ...state, nf: event.target.value });
    render();
  });

  for (const input of $$('input[name="kd-view"]')) input.addEventListener('change', syncView);

  const crestInput = $('[data-kd-crest-input]');
  crestInput?.addEventListener('change', async () => {
    const file = crestInput.files?.[0];
    if (!file) return;
    try {
      crestDataUrl = await downscaleImage(file, 512);
      render();
    } catch {
      setStatus(root.getAttribute('data-msg-export-error') || '');
    }
  });

  syncView();
  render();
};

const root = document.querySelector('[data-kit-designer]');
if (root) initKitDesigner(root);
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: build succeeds; all tests pass.

- [ ] **Step 6: Commit**

```bash
git add site/src/scripts/kit-designer.mjs site/src/components/KitDesigner.astro site/tests/build.test.mjs
git commit -m "feat(site): kit designer interactivity — live render, controls and crest"
```

---

### Task 5: Share link, URL hydration and PNG export

**Files:**
- Modify: `site/src/scripts/kit-designer.mjs` (copy + export)
- Test: `site/tests/build.test.mjs` (extend)

**Interfaces:**
- Consumes: Task 4 module, existing `[data-kd-copy]`, `[data-kd-download]`, `data-msg-copied`, `data-msg-export-error`, `data-filename`.
- Produces: "Copy design link" (clipboard + `execCommand` fallback) and "Download PNG" (2× rasterised spec sheet with both views + details footer). `render()` already keeps the URL and the "Send to TREYST" href in sync, so hydration works via the existing `decodeDesign` path.

- [ ] **Step 1: Extend tests first (failing)**

Append to `site/tests/build.test.mjs`:

```js
test('designer bundle includes share and export logic', async () => {
  const html = await readDist('kitedesign/index.html');
  assert.match(html, /navigator\.clipboard/);
  assert.match(html, /toBlob/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — copy/export code not bundled yet.

- [ ] **Step 3: Extend `site/src/scripts/kit-designer.mjs`**

Insert these helpers after `downscaleImage` (module scope):

```js
const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '') || 'design';
```

Inside `initKitDesigner`, add before `syncView(); render();`:

```js
  const copyLink = async () => {
    const url = designerUrl();
    const copied = root.getAttribute('data-msg-copied') || '';
    try {
      await navigator.clipboard.writeText(url);
      setStatus(copied);
    } catch {
      const area = document.createElement('textarea');
      area.value = url;
      area.setAttribute('readonly', '');
      area.style.position = 'absolute';
      area.style.left = '-9999px';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
      setStatus(copied);
    }
  };

  const exportPng = async () => {
    await document.fonts.ready;
    const front = $('[data-kd-view="front"]');
    const back = $('[data-kd-view="back"]');
    if (!front || !back) return;

    const NS = 'http://www.w3.org/2000/svg';
    const exportSvg = document.createElementNS(NS, 'svg');
    exportSvg.setAttribute('xmlns', NS);
    exportSvg.setAttribute('width', '1600');
    exportSvg.setAttribute('height', '1100');
    exportSvg.setAttribute('viewBox', '0 0 1600 1100');

    const background = document.createElementNS(NS, 'rect');
    background.setAttribute('width', '1600');
    background.setAttribute('height', '1100');
    background.setAttribute('fill', '#FFFFFF');
    exportSvg.appendChild(background);

    const frame = (source, x) => {
      const copy = source.cloneNode(true);
      copy.removeAttribute('class');
      copy.removeAttribute('hidden');
      copy.setAttribute('x', String(x));
      copy.setAttribute('y', '40');
      copy.setAttribute('width', '620');
      copy.setAttribute('height', '682');
      exportSvg.appendChild(copy);
    };
    frame(front, 140);
    frame(back, 840);

    const addText = (x, y, size, weight, fill, content) => {
      if (!content) return;
      const node = document.createElementNS(NS, 'text');
      node.setAttribute('x', String(x));
      node.setAttribute('y', String(y));
      node.setAttribute('font-size', String(size));
      node.setAttribute('font-weight', String(weight));
      node.setAttribute('fill', fill);
      node.setAttribute('font-family', 'Archivo Variable, Arial, sans-serif');
      node.textContent = content;
      exportSvg.appendChild(node);
    };

    const rule = document.createElementNS(NS, 'rect');
    rule.setAttribute('x', '80');
    rule.setAttribute('y', '852');
    rule.setAttribute('width', '120');
    rule.setAttribute('height', '6');
    rule.setAttribute('fill', '#2DD4BF');
    exportSvg.appendChild(rule);

    const patternLabel =
      $('[data-kd-pattern-input]:checked')?.closest('label')?.textContent?.trim() || state.p;
    addText(80, 906, 44, 800, '#101814', state.cn || 'TREYST');
    addText(80, 948, 24, 400, '#101814', [patternLabel, ...state.c].join(' · '));
    addText(80, 990, 22, 400, '#6B7280', [state.n, state.no].filter(Boolean).join(' · '));
    addText(80, 1040, 20, 400, '#6B7280', 'treyst.fo/kitedesign');

    const serialized = new XMLSerializer().serializeToString(exportSvg);
    const svgBlob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const image = new Image();
    const loaded = new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });
    image.src = svgUrl;
    await loaded;

    const canvas = document.createElement('canvas');
    canvas.width = 3200;
    canvas.height = 2200;
    canvas.getContext('2d').drawImage(image, 0, 0, 3200, 2200);
    URL.revokeObjectURL(svgUrl);

    const png = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!png) throw new Error('png');
    const link = document.createElement('a');
    link.download = `${root.getAttribute('data-filename') || 'treyst-kit'}-${slugify(state.cn || 'design')}.png`;
    link.href = URL.createObjectURL(png);
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };

  $('[data-kd-copy]')?.addEventListener('click', copyLink);
  $('[data-kd-download]')?.addEventListener('click', async () => {
    try {
      await exportPng();
    } catch {
      setStatus(root.getAttribute('data-msg-export-error') || '');
    }
  });
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: build succeeds; all tests pass.

- [ ] **Step 5: Commit**

```bash
git add site/src/scripts/kit-designer.mjs site/tests/build.test.mjs
git commit -m "feat(site): kit designer share link and PNG spec-sheet export"
```

---

### Task 6: Quote integration + discovery links (Klæðir CTA, Prenting link)

**Files:**
- Modify: `site/src/components/ContactForm.astro` (design chip, hidden field, payload, mailto)
- Create: `site/src/components/DesignerCta.astro`
- Modify: `site/src/components/ServicePage.astro` (apparel CTA)
- Modify: `site/src/components/JerseyCustomizer.astro` (full-designer link)
- Test: `site/tests/build.test.mjs` (extend)

**Interfaces:**
- Consumes: Task 1 `decodeDesign`, Task 2 copy, Task 3/4 designer URL.
- Produces: contact form reads `?d=`, shows the chip, preselects `topic=apparel`, posts `design` (full designer URL) in the payload and mailto body.

- [ ] **Step 1: Extend tests first (failing)**

Append to `site/tests/build.test.mjs`:

```js
test('contact page renders the design chip markup', async () => {
  const html = await readDist('samband/index.html');
  assert.match(html, /data-design-chip/);
  assert.match(html, /name="design"/);
  assert.match(html, /data-designer-path="\/kitedesign"/);
});

test('apparel page links to the designer (FO)', async () => {
  const html = await readDist('klaedir/index.html');
  assert.match(html, /href="\/kitedesign"/);
  assert.match(html, /Byrja at designa/);
});

test('printing page links to the full designer (EN)', async () => {
  const html = await readDist('en/printing/index.html');
  assert.match(html, /href="\/en\/kit-designer"/);
  assert.match(html, /Open the full designer/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL.

- [ ] **Step 3: Update `site/src/components/ContactForm.astro`**

Frontmatter — add to the existing imports:

```js
import { localizePath } from '../i18n/utils.mjs';
```

and add:

```js
const designerPath = localizePath('/kitedesign', lang);
```

Form tag — add `data-designer-path={designerPath}` to the `<form data-contact-form …>` attributes (before `novalidate`).

Inside the form, immediately after the opening `<form …>` tag, insert:

```astro
  <div data-design-chip hidden class="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand/20 bg-brand/5 px-4 py-3">
    <span class="text-sm font-semibold text-brand">{t(lang, 'quote.designIncluded')}</span>
    <a data-design-link href="#" class="text-sm font-semibold text-brand underline">{t(lang, 'quote.viewDesign')}</a>
  </div>
  <input type="hidden" name="design" value="" data-design-input />
```

Script — add the import at the very top of the `<script>` block:

```js
  import { decodeDesign } from '../scripts/kit-designer-core.mjs';
```

In the setup section (after `const msg = …`), add:

```js
    const designInput = form.querySelector('[data-design-input]');
    const designChip = form.querySelector('[data-design-chip]');
    const designLink = form.querySelector('[data-design-link]');
    const designerPath = form.getAttribute('data-designer-path') || '/kitedesign';
    const designCode = new URLSearchParams(window.location.search).get('d') || '';
    const decodedDesign = decodeDesign(designCode);
    const designUrl = decodedDesign.ok
      ? new URL(`${designerPath}?d=${encodeDesignLite(decodedDesign.state)}`, window.location.origin).toString()
      : '';
    if (decodedDesign.ok) {
      if (designInput) designInput.value = designUrl;
      if (designChip) designChip.removeAttribute('hidden');
      if (designLink) designLink.setAttribute('href', designUrl);
      const topicSelect = form.querySelector('#cf-topic');
      if (topicSelect) topicSelect.value = 'apparel';
    }
```

with a tiny local helper next to the imports (module scope of the script, before the `const form = …` block):

```js
  const encodeDesignLite = (state) => {
    const json = JSON.stringify(state);
    const bytes = new TextEncoder().encode(json);
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
```

(Re-encoding the sanitized state guarantees a canonical, safe link.)

In the payload object, add:

```js
        design: designUrl || undefined,
```

In the mailto fallback, replace the `body` construction (currently the single template with `label('…')` lines) with:

```js
        const body = encodeURIComponent(
          `${label('name')}: ${name}\n${label('club')}: ${payload.club}\n${label('email')}: ${email}\n${label('phone')}: ${payload.phone}\n${label('topic')}: ${payload.topic}\n${payload.design ? `Design: ${payload.design}\n` : ''}\n${message}`
        );
```

- [ ] **Step 4: Create `site/src/components/DesignerCta.astro`**

```astro
---
import Button from './Button.astro';
import Icon from './Icon.astro';
import { t, localizePath } from '../i18n/utils.mjs';

const { lang } = Astro.props;
const href = localizePath('/kitedesign', lang);
---
<section class="bg-fog py-20">
  <div class="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-4 sm:px-6 md:flex-row md:items-center lg:px-8">
    <div>
      <h2 class="text-3xl font-bold tracking-tight text-ink md:text-4xl">{t(lang, 'designer.cta.title')}</h2>
      <p class="mt-3 text-lg text-ink/70">{t(lang, 'designer.cta.desc')}</p>
    </div>
    <Button href={href} variant="primary">
      {t(lang, 'designer.cta.button')} <Icon name="arrow" class="h-5 w-5" />
    </Button>
  </div>
</section>
```

- [ ] **Step 5: Render the CTA on the apparel service page**

In `site/src/components/ServicePage.astro`, add to the frontmatter:

```js
import DesignerCta from './DesignerCta.astro';
```

Directly after the `<CapabilityGrid … />` line, insert:

```astro
{id === 'apparel' && <DesignerCta lang={lang} />}
```

- [ ] **Step 6: Add the full-designer link to `site/src/components/JerseyCustomizer.astro`**

Update the existing import to include `localizePath`:

```js
import { t, localizePath } from '../i18n/utils.mjs';
```

After the closing `</div>` of the customizer grid (the `grid items-center gap-12 lg:grid-cols-2` container, inside the same section), insert:

```astro
      <div class="mt-10 text-center">
        <a href={localizePath('/kitedesign', lang)} class="inline-flex items-center gap-2 font-semibold text-brand transition-colors hover:text-brand/80">
          {t(lang, 'designer.openFull')}
        </a>
      </div>
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm test`
Expected: build succeeds; all tests pass.

- [ ] **Step 8: Commit**

```bash
git add site/src site/tests/build.test.mjs
git commit -m "feat(site): design-aware quote form and designer discovery links"
```

---

### Task 7: QA pass, budgets, README

**Files:**
- Modify: `README.md` (Kit Designer section)
- Test: manual + automated QA below (record results)

**Interfaces:**
- Consumes: everything above.
- Produces: recorded QA evidence; updated handover docs.

- [ ] **Step 1: Full suite + budgets**

Run: `npm test` (from `site/`)
Expected: build succeeds (21 pages); all tests pass; note the inline-JS budget number printed by the budget test.

- [ ] **Step 2: Lighthouse on both designer pages**

Start the built preview, then audit:

```bash
(nohup npx astro preview --port 4321 > /tmp/kd-preview.log 2>&1 &)
sleep 3
for p in "kitedesign/" "en/kit-designer/"; do
  npx --yes lighthouse "http://localhost:4321/$p" --only-categories=performance,accessibility,best-practices,seo \
    --chrome-flags="--headless=new --no-sandbox --disable-gpu" --output=json \
    --output-path="/tmp/kd-lh-$(echo $p | tr -d '/').json" --quiet
done
node -e "for (const f of ['/tmp/kd-lh-kitedesign.json','/tmp/kd-lh-enkit-designer.json']) { const r = require(f); console.log(f, Object.fromEntries(Object.entries(r.categories).map(([k, v]) => [k, Math.round(v.score * 100)]))); }"
```

Expected: accessibility 100 on both; performance ≥ 95; BP 100; SEO ≥ 95.

- [ ] **Step 3: Interactive browser QA (Playwright harness, outside the repo)**

In `/tmp/kd-qa/`: `npm init -y && npm i playwright-core@1.47.0`, then a script using `chromium.launch({ channel: 'chrome', headless: true })` against the preview server, verifying:

1. Clicking a palette swatch changes `[data-kd-body]` fill (and the slot tabs target body/sleeves/collar/pattern correctly).
2. Selecting the `halves` pattern radio makes only `[data-kd-pattern="halves"]` visible.
3. Typing a club name updates `[data-kd-clubname]`; a number-only input strips letters.
4. Selecting number style `outline` sets `stroke` and `fill="none"` on `[data-kd-number]`.
5. Uploading a small PNG (generate a 2×2 png in the script) unhides `[data-kd-crest-img]`.
6. "Copy design link" (grant clipboard permissions) yields a URL containing `?d=`; opening that URL in a fresh page hydrates the same club name and colours.
7. "Download PNG" triggers a download whose suggested filename starts with `treyst-kit-`.
8. Opening `/kitedesign?d=%%%` loads with defaults and no page errors.
9. Clicking "Send to TREYST" navigates to `/samband?d=…`; the chip is visible, the link contains the design URL, and the topic select is `apparel`.
10. Reduced motion: no animation-driven layout changes on the page (reveals visible immediately).

Record each as PASS/FAIL in the report; fix any FAIL (small focused fix → re-run) before committing.

- [ ] **Step 4: Update `README.md`**

Add a section after the form section:

```md
## Kit Designer

The interactive kit designer lives at `/kitedesign` (EN: `/en/kit-designer`).

- Designs are encoded in the URL (`?d=…`) — copy the link to share a design; nothing is stored on a server.
- Uploaded crests are local-only: they appear in the downloaded PNG but not in the share link.
- "Send to TREYST" opens the contact form with the design attached (`design` field) and preselects the apparel topic.
- Code: `site/src/scripts/kit-designer-core.mjs` (state + codec, unit-tested) and `site/src/scripts/kit-designer.mjs` (UI + export).
```

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: kit designer handover notes; QA pass recorded"
```

---

## Plan Self-Review

- **Spec coverage:** §4.1–4.3 state/SVG (Tasks 1, 3, 4), §4.2 palette (1, 3), §4.4 codec (1), §4.5 export (5), §4.6 quote (6), §5 discovery (2, 6), §6 files all created/modified, §7 gates (1–7), §9 checklist mapped 1:1 to tasks.
- **Placeholder scan:** no TODO/TBD steps; every code step carries complete code; two accepted limitations are documented inline (web fonts in PNG export; crest excluded from links — both intentional per spec).
- **Type/name consistency:** hooks `data-kd-*` defined in Task 3 are the exact selectors used in Tasks 4–6; `encodeDesign`/`decodeDesign`/`sanitizeDesign` signatures consistent across Tasks 1, 4, 6; `contactPath` prop threaded from Task 3 page → island; `data-msg-*`/`data-filename` attributes added in Task 4 match their Task 5 readers; `ROUTE_PAIRS` key added in Task 2 is the pair asserted by the Task 3 hreflang test.




