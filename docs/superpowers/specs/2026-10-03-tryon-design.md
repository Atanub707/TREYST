# TREYST Try-On — Design Spec (Phase A)

**Date:** 2026-10-03
**Feature:** Bilingual try-on page with a predefined jersey gallery; Anywear/Decart widget wiring lands in Phase B once the client account/script exists.
**Status:** Approved (scope, jersey sourcing, phases confirmed). Supersedes the cancelled Kit Designer feature (branch `feat/kit-designer` parked at 0c6e055, upload-your-own deferred to a future API phase).

---

## 1. Context & Goal

Visitors (club people, players, fans) should see real jerseys and act on them. Phase A ships the gallery + lead capture; Phase B flips on live AI try-on per jersey (Anywear widget) with no rework.

**Primary KPI:** jersey-driven quote requests (`?kit=<slug>` prefills the contact form).
**Phase B KPI:** try-on sessions → quote requests.

## 2. Phases

| Phase | Ship | Depends on |
|---|---|---|
| **A (this spec)** | Try-on page (FO `/roynd`, EN `/en/try-on`), gallery of 10–12 license-free real jersey photos, "Fráspurning" CTA per jersey prefilling the quote form, discovery links, tests, QA | Nothing |
| **B (later spec)** | "Royn á tær" buttons on each card + camera try-on via the Anywear widget script; config-gated | Client's Anywear account + script line |

No dead code in Phase A: try-on buttons/adapter are NOT built until Phase B; jersey data (slug + image) is shaped for it.

## 3. Decisions Log

| Decision | Choice |
|---|---|
| Integration | Anywear widget (client account; free during beta) |
| Upload-your-own jersey | Deferred (would need Decart API + serverless token; revisit) |
| Jersey source | 10–12 license-free photos from the internet (Pexels/Unsplash/Wikimedia), locally optimized, credited |
| Jersey creation | None — no designer, no rendering |
| Branding rule | Do not use photos with prominent trademarked club/brand logos |
| Routes | FO `/roynd` · EN `/en/try-on` |

## 4. Page Specification (Phase A)

### 4.1 Try-on page

1. **Hero** — dark (`fjord`), eyebrow "Try-On", H1 "Royn búnan á tær" / "Try the kit on you", intro: pick a jersey; try-on experience launches here soon; every jersey can be requested today
2. **Gallery** — responsive grid (2 cols mobile → 3–4 desktop) of jersey cards: image (4:5 aspect, lazy, optimized), name, "Fráspurning" link → `${contactPath}?kit=<slug>`
3. **How it works** — 3 steps (Choose a jersey → Try it on *(coming with the widget)* / ask questions → Get your club's kit)
4. **CTA band** — standard `CtaBand`

### 4.2 Jersey data

`src/data/jerseys.mjs`:
```js
export const jerseys = [
  { slug: 'jersey-01', image: 'jersey-01', nameKey: 'jersey.n1' },
  … 12 entries …
];
export const jerseyBySlug = (slug) => jerseys.find((jersey) => jersey.slug === slug);
```
Images: `src/assets/jerseys/jersey-01.jpg … jersey-12.jpg` (+ `CREDITS.md` with source URLs).

**Image acceptance criteria:** real jersey/kit product photograph; front-facing; plain/neutral background preferred; no prominent trademarked logos; ≥ 1200 px on the long edge; JPEG. Target 12, **minimum 10** — never pad with unusable/copyrighted images.

### 4.3 Names

Placeholder-honest, swappable: `jersey.n1`…`n12` → FO "Búni 1"…"Búni 12" / EN "Jersey 1"…"Jersey 12". README notes how to swap images + names when real Treyst kits exist.

### 4.4 Quote prefill (`?kit=`)

`ContactForm.astro` reads `kit` on load; if it matches `jerseyBySlug`:
- shows a chip: "Áhugi á: <localized name>" / "Interested in: <name>"
- adds hidden `kit` field (slug), includes `kit` in the JSON payload and a `Kit: <name> (<slug>)` line in the mailto body
- invalid/unknown slug → ignored silently (same pattern as the design-chip implementation parked on the other branch)

### 4.5 Discovery

- Nav desktop dropdown + mobile drawer: "Royn búnan" / "Try on" (icon: `sparkles` — new Icon entry) after the services list
- Footer pages list
- Klæðir service page: `DesignerCta`-style band (new `TryOnCta.astro`) → try-on page

## 5. Files

```
site/src/data/jerseys.mjs                    (new)
site/src/assets/jerseys/*.jpg + CREDITS.md   (new)
site/src/components/TryOnPage.astro          (new: hero + gallery + how-it-works + CTA)
site/src/components/JerseyCard.astro         (new)
site/src/components/TryOnCta.astro           (new: Klæðir band)
site/src/pages/roynd.astro, en/try-on.astro  (new)
site/src/i18n/ui.mjs                         (copy keys)
site/src/i18n/utils.mjs                      (ROUTE_PAIRS pair)
site/src/components/{Icon,Nav,Footer,ContactForm,ServicePage}.astro (modify)
site/tests/build.test.mjs                    (pages, gallery, discovery, hreflang, kit-chip)
README.md                                    (assets + phase note)
```

## 6. Quality Gates

- Images: all files valid JPEG ≥1200 px long edge; CREDITS.md complete; no branded-logo images
- Build: both pages, correct lang/hreflang/canonical; 12 gallery cards + images rendered with widths/sizes; discovery links; kit chip markup on contact page
- A11y: Lighthouse a11y 100 both pages; cards keyboard-operable; images have meaningful `alt` (jersey name)
- Budgets: image additions only; JS unchanged (no new scripts in Phase A); existing JS/CSS budget tests still pass
- Browser QA: gallery renders (images loaded), Fráspurning → contact shows chip + payload field, invalid `?kit=` ignored, both languages

## 7. Out of Scope

Try-on buttons/adapter + Anywear script (Phase B), upload-your-own (future API phase), designer (cancelled), checkout, accounts.

## 8. Acceptance Checklist (Phase A)

- [ ] `/roynd` + `/en/try-on` build, hreflang-linked, Lighthouse a11y 100
- [ ] 10–12 license-free jersey images, credited, swappable via `jerseys.mjs`
- [ ] Every card's "Fráspurning" prefills the contact form with the jersey name
- [ ] Discovery: nav dropdown, drawer, footer, Klæðir band
- [ ] All copy FO/EN from `ui.mjs`; i18n parity passes
- [ ] Full suite + budgets pass; browser QA recorded
