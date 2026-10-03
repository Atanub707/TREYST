# TREYST Website — Design Spec

**Date:** 2026-10-03
**Client:** TREYST — ítróttarklæðir, liðbúni & útgerð til føroysk ítróttarfeløg
**Location:** Hoyvík, Føroyar · info@treyst.fo · +298 504082
**Status:** Approved by client-side stakeholder (user), pending written-spec review

---

## 1. Context

TREYST is a Faroese B2B supplier of sportswear, equipment, printing and club-shop solutions for sports clubs across the Faroe Islands. The existing treyst.fo is a single-page React SPA (bolt.new) marked "TREYST er í løtuni í menning" (under development), with generic stock imagery and no sub-pages.

This project delivers a new, premium multi-page marketing website that:

- Uses best-in-class sportswear/teamwear patterns researched on Mobbin (adidas, lululemon, Square, Selfridges, YLLW, Expedia, Wise/Revolut customizers, Vercel/Notion trust strips) as the design language
- Keeps TREYST's brand identity (teal accent, Faroese-first copy, four services) and existing contact details
- Is bilingual: Faroese (default, at root) + English (under `/en/`)
- Is statically built for top-tier performance and SEO

**Business model to communicate:** TREYST equips clubs end-to-end — apparel, equipment, printing and online club shops — so volunteer-run clubs spend less time on admin and more time on sport. Brand line: *"TREYST er ikki bert ein veitari. TREYST er ein viðleikari."*

## 2. Goals & Success Criteria

| Goal | Success criterion |
|---|---|
| Premium brand perception | Design follows approved Mobbin-referenced system; no generic AI-template look |
| Lead generation | Every page funnels to Samband (contact) with a working quote-request form |
| Performance | Lighthouse mobile ≥ 95 Performance / ≥ 95 Accessibility / 100 Best Practices / ≥ 95 SEO on Home + one service page; total JS < 35 KB gzipped; CLS < 0.05 |
| Bilingual | FO at `/…`, EN at `/en/…`, reciprocal `hreflang`, language switcher preserves current page |
| Maintainability | Shared components; all copy in typed i18n dictionaries; single source of truth for services data |
| A11y | WCAG 2.2 AA: contrast-checked palette, keyboard-operable nav/accordion/form, visible focus, reduced-motion support |

## 3. Non-Goals (Out of Scope)

- E-commerce checkout (Club Shop page is marketing only; real club shops are operated per-club by TREYST)
- CMS / admin UI (content lives in the repo; edit + redeploy to change)
- Real product photography or logo files (placeholders now; swap-in planned)
- Analytics/tracking scripts (can be added later via one snippet)
- Legal-grade terms/privacy text (simple stubs shipped; legal review is the client's responsibility)

## 4. Decisions Log

| Decision | Choice | Rationale |
|---|---|---|
| Design direction | New premium design using Mobbin sports/B2B references; keep Treyst teal + Faroese copy | User decision |
| Scope | Multi-page: Home + 4 service pages + About + Contact (+ legal stubs) | User decision; SEO + room for detail |
| Languages | Faroese default, English secondary | User decision |
| Assets | None exist → typographic wordmark, curated stock photography, self-defined palette; all swappable | User decision |
| Stack | Astro 5 + Tailwind CSS, static output | Best performance, built-in i18n, component reuse; user approved recommendation |
| Hosting | Static host (Netlify or Cloudflare Pages); form endpoint configurable | Free tier, global CDN, zero server maintenance |

## 5. Brand & Design System

### 5.1 Wordmark
Typographic: **TREYST** set in Archivo (800, expanded tracking, uppercase). Letterhead-style, no symbol. Favicon: teal square with white "T". Tagline lockup: *"Ikki bert ein veitari — ein viðleikari."*

### 5.2 Color Tokens

| Token | Hex | Use |
|---|---|---|
| `fjord` | `#0C1512` | Dark sections, hero overlays, footer |
| `fjord-800` | `#16211D` | Dark card surfaces |
| `teal-600` | `#0F766E` | Primary actions, links on light (AA 5.5:1 on white) |
| `teal-400` | `#2DD4BF` | Accent on dark backgrounds, eyebrows, highlights |
| `fog` | `#F6F5F1` | Light section background (warm off-white) |
| `white` / `ink` | `#FFFFFF` / `#101814` | Surfaces / body text on light |

Rules: no additional accent hues; photography supplies warmth. All text/background pairs must pass WCAG AA (verified during QA).

### 5.3 Typography
- Display: **Archivo** variable (weights 500–900) — headlines, numerals, wordmark
- Body: **Inter** variable (400–600) — body, UI
- Self-hosted `.woff2`, latin + latin-ext subsets (Faroese glyphs áðíóúýæø), `font-display: swap`, preloaded
- Scale (desktop): H1 clamp(2.5rem→4.5rem), H2 clamp(2rem→3rem), H3 1.5rem, body 1.0625rem/1.7, eyebrow 0.8125rem uppercase tracked

### 5.4 Motion
- Scroll-reveal: 12px rise + fade, 400–600ms, stagger ≤ 100ms, IntersectionObserver, once
- Hover: image scale 1.03 (700ms ease-out), arrow nudge on links, card lift on service cards
- All motion wrapped in `@media (prefers-reduced-motion: no-preference)` or disabled via reduced-motion query
- No animation libraries; CSS transitions + small vanilla observers

### 5.5 Iconography
Thin-stroke line icons (Shirt, Dumbbell, Printer, ShoppingCart, Users, ShieldCheck, etc.) — inline SVG, 1.5px stroke, currentColor.

## 6. Information Architecture

FO at root (`prefixDefaultLocale: false`), EN under `/en/`. All routes listed with EN equivalents:

| FO route | EN route | Page |
|---|---|---|
| `/` | `/en/` | Home |
| `/klaedir` | `/en/apparel` | Klæðir (apparel) |
| `/utgerd` | `/en/equipment` | Útgerð (equipment) |
| `/prenting` | `/en/printing` | Prenting (printing) |
| `/club-shop` | `/en/club-shop` | Club Shop |
| `/um-okkum` | `/en/about` | About |
| `/samband` | `/en/contact` | Contact |
| `/treytir` | `/en/terms` | Terms (stub) |
| `/privatlivspolitikkur` | `/en/privacy` | Privacy (stub) |
| `/404` | `/en/404` | Not found |

Nav: Heim · Tænastur ▾ (4 services) · Um okkum · Samband + FO·EN switcher + CTA button "Set teg í samband".
Footer: brand + tagline + contact block; Tænastur links; Síður (Um okkum, Samband, legal); language switcher; copyright bar.

## 7. Page Designs

### 7.1 Shared Shell
- **Header:** transparent over dark heroes → solid `fjord` with subtle border after 24px scroll; wordmark left; centered/right nav; CTA button; language switcher; mobile: hamburger → full-screen `fjord` drawer (focus-trapped, Esc closes)
- **Footer:** 4-column on desktop, stacked mobile; newsletter none; bottom bar "© 2026 TREYST · Hoyvík, Føroyar"
- **CTA band** (reused above footer on content pages): *"Ger gerandisdagin lættari"* + primary button → Samband

### 7.2 Home (`/`)
1. **Hero** — full-bleed athlete photograph, dark gradient overlay; eyebrow badge *"Minni umsiting. Meira ítrótt."*; H1 *"Klæðir, útgerð og loysnir til føroyskan ítrótt."* (last two words in teal gradient on dark); subcopy; CTAs: primary *"Set teg í samband"* → Samband, ghost *"Kanna tænastur"* → #taenastur
2. **Sports strip** — *"Vit hjálpa øllum ítróttagreinum"*: Fótbóltur · Handbóltur · Badminton · Rógving · Svimjing · Frælsur ítrótt as muted wordmark-style text row (NOT club logos — avoids unverifiable partner claims)
3. **Services** — *"Hvat gera vit?"* 2×2 editorial cards (photo, title, description, "Kanna nærri →") linking to the 4 service pages; Selfridges service-card pattern
4. **Values** — *"Alt á einum stað."* on `fog`: Persónlig tænasta / Lætt samskifti / Einfalt (3 icon cards)
5. **Philosophy** — dark split: statement *"TREYST er ikki bert ein veitari. TREYST er ein viðleikari."*, quote card *"Alt rundan um klæðir og útgerð skal vera lættari."*, supporting photo
6. **Process** — *"Hvussu vit arbeiða"*: 4 numbered steps — Samband → Tilboð & design → Prenting & framleiðsla → Levering & stuðning
7. **CTA band** → Samband

### 7.3 Service Pages (shared template)
Structure: breadcrumb + service hero (photo, H1, intro, CTA) → capability cards (3–4) → typographic accordion list (`<details>`, zero-JS) → benefits/process block → related services (other 3) → CTA band.

- **Klæðir** — offers: Liðbúni · Venjingarbúni · Felagsbúni · Gerandisklæðir; quality/supplier note ("frá álítandi veitarum")
- **Útgerð** — sport-category grid (fótbóltur, handbóltur, badminton, rógving, svimjing, frælsur ítrótt, ymiskt); "laga til tykkara ítróttagrein"
- **Prenting** — interactive kit preview (SVG jersey + color swatches + name/number inputs, live text render, ~1 KB vanilla JS island) then capabilities: Nøvn · Nummur · Logo · Stuðlar · hágóðska prent
- **Club Shop** — 4-step walkthrough (Uppseting → Vørulýsing → Bíleggingar → Levering) + benefits for members/parents/players

### 7.4 Um okkum (`/um-okkum`)
Story section (*"Ikki bert ein veitari"*), mission paragraph, 3 value blocks, quote, contact strip (email/phone/location), CTA.

### 7.5 Samband (`/samband`)
Split layout: left = heading + contact cards (Teldupostur info@treyst.fo, Telefon +298 504082, Staðseting Hoyvík) + "Vit svara skjótt" note; right = form card. Fields: Navn*, Felag, Teldupostur*, Telefonnummar, service select (Klæðir/Útgerð/Prenting/Club Shop/Annað), Boð*. Inline validation (FO/EN messages), states: idle → submitting → success ("Takk fyri tína fráboðan…") / error ("Onkur feilur hendi…"). Submission: JS `fetch` POST (JSON) to `PUBLIC_FORM_ENDPOINT` — Formspree-compatible URL is the primary documented provider (works on any host); Netlify Forms variant documented as a config alternative in README. If the env var is unset, fall back to `mailto:info@treyst.fo` with prefilled subject/body. Honeypot spam field.

### 7.6 Legal stubs
`/treytir`, `/privatlivspolitikkur` (+ EN): simple typographic pages with short generic content and a README note that they require client legal review.

### 7.7 404
Fjord full-screen, wordmark, *"Síðan varð ikki funnin."*, button home.

## 8. Component Inventory

| Component | Notes |
|---|---|
| `BaseLayout.astro` | `<head>` (meta, hreflang, JSON-LD, fonts, OG), header, slot, footer |
| `Nav.astro` + `nav.client.ts` | Scroll state, mobile drawer, dropdown, focus trap |
| `Footer.astro` | — |
| `Button.astro` | variants: primary, ghost-light, ghost-dark, link-arrow |
| `SectionHeading.astro` | eyebrow + title + optional lede, alignment variants |
| `Hero.astro` / `PageHero.astro` | home hero vs service hero |
| `ServiceCard.astro`, `ServicesGrid.astro` | 2×2 home grid |
| `SportStrip.astro` | text wordmarks row |
| `ValueCard.astro` | — |
| `PhilosophySection.astro` | dark split |
| `ProcessSteps.astro` | numbered 4-step |
| `AccordionItem.astro` | native `<details>/<summary>` |
| `ContactForm.astro` + `form.client.ts` | validation, states, honeypot |
| `JerseyCustomizer.astro` + `customizer.client.ts` | Prenting island |
| `CtaBand.astro` | — |
| `LanguageSwitcher.astro` | path-preserving FO/EN |
| `SeoHead.astro` | per-page meta + JSON-LD builder |
| `Reveal.astro` | scroll-reveal wrapper (IO, reduced-motion safe) |

## 9. Content Plan

- **Faroese:** native-quality copy drafted from the current site's established tone and expanded per page (reusing approved lines: *"Minni umsiting. Meira ítrótt."*, *"Alt á einum stað."*, *"Ger gerandisdagin lættari"*, service descriptions). Follow-up: recommend native-speaker review before launch (noted in README).
- **English:** direct functional translation, same structure.
- **Copy source of truth:** `src/i18n/ui.ts` (typed dictionaries) + `src/data/services.ts` (service metadata: slug, icon, image, order).
- **Contact details:** info@treyst.fo, +298 504082, Hoyvík, Føroyar (from current site's structured data).
- **SEO keywords** (from current site, reused in meta): ítróttarklæðir Føroyum, liðbúni, klæðir til ítróttafeløg, útgerð til ítróttafeløg, club shop Føroyar, prenting.

## 10. Technical Architecture

```
Treyst/
├── docs/superpowers/specs/2026-10-03-treyst-website-design.md
├── README.md                     # client overview, run/deploy instructions
└── site/                         # Astro project
    ├── astro.config.mjs          # i18n config, Tailwind, sitemap
    ├── package.json
    ├── public/                   # favicon.svg, og-image.png, robots.txt
    └── src/
        ├── assets/photos/        # curated stock images (local, optimized)
        ├── assets/fonts/         # Archivo + Inter woff2
        ├── components/           # per inventory above
        ├── layouts/BaseLayout.astro
        ├── data/services.ts
        ├── i18n/ui.ts            # FO/EN dictionaries
        ├── i18n/utils.ts         # t(), locale helpers, path mapping
        ├── styles/global.css     # tokens, base, utilities
        └── pages/
            ├── index.astro, klaedir.astro, utgerd.astro, prenting.astro,
            │   club-shop.astro, um-okkum.astro, samband.astro,
            │   treytir.astro, privatlivspolitikkur.astro, 404.astro
            └── en/ (same, EN slugs)
```

- **Astro 5** static output; `@astrojs/sitemap`; Tailwind CSS v4 via Vite plugin
- **i18n:** `defaultLocale: 'fo'`, `locales: ['fo','en']`, `prefixDefaultLocale: false`; thin page wrappers per locale render shared section components with a `lang` prop
- **Images:** `astro:assets` — local originals (photo JPEGs), AVIF/WebP responsive `srcset`, explicit width/height to prevent CLS, `loading="lazy"` below the fold, hero `fetchpriority="high"`
- **JS budget:** nav/footer/reveal inlined vanilla (~3 KB), form + customizer as small islands (~5–8 KB); total < 35 KB gz
- **Forms:** `PUBLIC_FORM_ENDPOINT` env var (Formspree-compatible POST; Netlify Forms documented as config alternative); mailto fallback when unset
- **Deployment:** Netlify/Cloudflare Pages, `npm run build` → `dist`; README documents both

## 11. SEO & Metadata

- Per-page `<title>`/description in both languages; canonical + `hreflang` (fo, en, x-default) on all pairs
- JSON-LD: `LocalBusiness` (name, email, phone, Hoyvík FO, areaServed FO, makesOffer = 4 services) on Home; `BreadcrumbList` on service pages
- OG/Twitter cards with generated `og-image.png` (1200×630, Fjord + wordmark + teal rule)
- `sitemap.xml` via integration; `robots.txt` allowing all

## 12. Accessibility Requirements

- Landmarks: header/nav/main/footer; skip-to-content link
- Nav dropdown + mobile drawer: keyboard operable, Esc closes, focus trapped in drawer, `aria-expanded`
- Accordions: native `<details>/<summary>` (free a11y)
- Form: labels, `aria-describedby` for errors, error summary focus, `aria-live` status
- Customizer: color swatches are radio-group semantics; inputs labeled
- Focus: `:focus-visible` 2px teal-400 offset ring; never removed
- Motion: reduced-motion disables reveals/scales; no autoplay media
- Contrast: all token pairs pre-verified ≥ 4.5:1 text / ≥ 3:1 UI

## 13. Performance Requirements

- Fonts: 2 families × (latin, latin-ext) woff2, preloaded, swap
- Hero image: AVIF ≤ 200 KB desktop, `fetchpriority="high"`; LCP < 2.0s on Fast 4G
- No render-blocking third parties; zero third-party JS
- CSS: single bundled stylesheet (Tailwind), < 30 KB gz
- Verify with Lighthouse mobile + DevTools performance trace before handoff

## 14. Assets & Placeholders

- **Photography:** ~10 curated, license-free images (Unsplash/Pexels) of Nordic team sports — football, handball, badminton, rowing, swimming, athletics, kit/printing detail shots; downloaded into repo, optimized at build; source URLs logged in `site/src/assets/photos/CREDITS.md`
- **Wordmark/favicon/OG:** produced in-repo (SVG + generated PNG)
- **Swap-in plan:** README documents how to replace photos (drop file, update `services.ts`/page import) and wordmark

## 15. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Faroese copy quality (non-native draft) | Built from client's own published copy; README flags native review before launch |
| Unverifiable partner claims | Sports strip replaces club-logo claims; no customer names used |
| Stock photos vs real product shots | Placeholder system designed for 1-line swaps; hero/card imagery chosen to fit sports context |
| Form endpoint not configured | Graceful mailto fallback; README documents both providers |
| Legal page content | Clearly-marked generic stubs; legal review flagged as client responsibility |

## 16. Acceptance Checklist

- [ ] 9 FO + 9 EN route pages + shared 404 build with no errors (`npm run build`)
- [ ] All internal links + language switcher preserve page context
- [ ] Contact form validates, submits (endpoint or mailto fallback), shows success/error states
- [ ] Prenting customizer updates live, keyboard accessible
- [ ] Lighthouse mobile on Home + Klæðir: ≥95/≥95/100/≥95, JS < 35 KB gz, CLS < 0.05
- [ ] Lighthouse a11y checks pass; keyboard audit of nav/drawer/accordion/form
- [ ] sitemap.xml + robots.txt + hreflang pairs verified
- [ ] README covers: run, build, deploy (Netlify/Cloudflare), form endpoint setup, asset swap, copy edit locations
- [ ] No placeholder text (lorem/TBD) anywhere in shipped pages
