# TREYST Try-On — Phase B (Anywear widget) Design

**Date:** 2026-10-03
**Adds to:** `2026-10-03-tryon-design.md` (Phase A, shipped on `main`)
**Status:** Approved (approach: per-jersey pages). Widget script provided by client: `https://anywear.decart.ai/widget/latest/anywear.js?domain=treyst.vercel.app`.

---

## 1. How the widget works (reverse-engineered from their code)

- `anywear.js` (loader) → `crash_reports.js` → `button-detector.js` → `widget-core.js` (~59 KB) → `DecartWidget.init({ shouldInject: () => true, isProductPage, getCameraGranted, … })`
- **`isProductPage()` is only true when the page contains JSON-LD with `@type: Product` (or `ProductGroup`).** Without it, the widget does nothing.
- The garment image comes from **page metadata**: `og:image`, Product JSON-LD `image` / the main product `<img>`.
- It renders its own floating **try-on pill** and exposes `window.DecartWidget.open()` (same call the pill makes).

## 2. Integration design

**Per-jersey detail pages** (widget-native):

| Route FO | Route EN | Content |
|---|---|---|
| `/roynd/<slug>` | `/en/try-on/<slug>` | Big jersey image, name, description, CTAs, related strip, Product JSON-LD, per-page `og:image`, Anywear script |

- 12 slugs × 2 languages = 24 static pages via `getStaticPaths` from `jerseys.mjs`.
- Each page ships: `Product` JSON-LD (`name`, `image` absolute URL, `brand: TREYST`, `category: Sports jersey` — no `offers`, we don't sell online) and `og:image` = that jersey's image → widget pill tries on that jersey.
- Our styled **"Royn á tær"** button calls `window.DecartWidget.open()` with a short retry loop (widget is async) and a localized failure note if it never loads. The widget's own pill remains as-is.
- Gallery cards: add **"Royn á tær"** primary link → detail page; keep **"Fráspurning"** quote link.
- Script is loaded **only on detail pages** (not site-wide): keeps every other page third-party-free and within budgets.
- Domain binding: the `?domain=treyst.vercel.app` param is bound to the Vercel domain; when `treyst.fo` goes live, update the constant + the Anywear dashboard (README note).

**Route pairing:** `switchLocalePath` gains prefix rules `/roynd/<slug>` ↔ `/en/try-on/<slug>`; hreflang matrix test loops all 12 slugs programmatically.

**Privacy:** the privacy stubs gain a short paragraph: try-on uses the camera and is processed by our try-on partner (Anywear/Decart) — still flagged for legal review.

## 3. Quality gates

- Build tests: 24 detail pages exist; Product JSON-LD + per-page `og:image`; widget script tag present on detail pages with the exact domain param and **absent on home**; gallery try-links; hreflang loop; `switchLocalePath` prefix unit tests.
- No change to JS/CSS budgets on non-detail pages (script is external + page-scoped; budget tests scan dist assets/inline scripts and stay green).
- Live verification after deploy (domain-bound): detail page 200; `#__decart-tryon-widget` element appears in headless Chrome; no console errors; screenshot. Camera flow itself = manual client test.

## 4. Out of scope

Upload-your-own jersey (Decart API + serverless), pricing/checkout, per-card in-gallery try-on (widget is page-scoped), site-wide widget script.
