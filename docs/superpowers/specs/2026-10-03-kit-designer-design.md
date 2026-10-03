# TREYST Kit Designer — Design Spec

**Date:** 2026-10-03
**Feature:** Interactive jersey designer with design-link hand-off to the quote pipeline
**Status:** Approved by user (scope, hand-off, approach, route, palette confirmed)
**Builds on:** the approved site spec (`2026-10-03-treyst-website-design.md`) and shipped site on `main`

---

## 1. Context & Goal

Treyst's customers are sports clubs whose kit decisions happen in email threads. This feature gives clubs a self-service designer: pick colours, pattern, crest, sponsor and name/number, see the kit live, then send a design link into the quote flow.

**Primary KPI:** quote requests that arrive already specced (design attached), reducing the founder's design back-and-forth.
**Secondary:** a shareable, impressive tool that makes TREYST look like the professional option for Faroese clubs, and the visual foundation for the future AI try-on (phase 3).

## 2. Decisions Log

| Decision | Choice |
|---|---|
| Phase order | Kit Designer first; AI try-on later on the same foundation |
| Hand-off | Shareable design link + downloadable PNG spec sheet → quote form carries the link; fully static, no backend |
| Scope | Full jersey designer (front/back, 4 colours, 6 patterns, crest upload, sponsor texts, name/number, fonts/styles) |
| Route | FO `/kitedesign` · EN `/en/kit-designer` |
| Colours | ~24 curated club swatches + custom hex picker (per colour slot) |
| Technical approach | Custom vanilla island — layered SVG + small JS modules; zero new dependencies (rejected: SaaS embed, React island) |
| Crest in share link | No — crest travels in the PNG; UI states this plainly |

## 3. UX Flow

1. **Discover** — nav services dropdown ("Kit Designer"), Footer pages list, Klæðir page CTA band, Prenting mini-customizer link ("Opna fulla designarin →" / "Open the full designer →")
2. **Design** — front/back toggle; four colour slots (body/sleeves/collar/pattern) each with curated swatches + custom picker; pattern picker; club name + font; sponsor front/back; player name; number + style; crest upload; live SVG preview; all controls keyboard-operable
3. **Save/Share** — "Copy design link" (base64url design in `?d=`) and "Download PNG" (high-res spec sheet, both views + details footer)
4. **Quote** — "Send to TREYST" → `/samband?d=…` (`/en/contact?d=…`): the form shows a "design included" chip with view link, preselects the Klæðir topic, and includes the design URL in the payload/email

Re-opening a link hydrates the exact design from the URL. Invalid/edited URLs sanitize to defaults — the page never breaks.

## 4. Feature Specification

### 4.1 Design state (schema v1, compact keys)

```json
{
  "v": 1,
  "c": ["#0F766E", "#0C1512", "#FFFFFF", "#2DD4BF"],
  "p": "stripes",
  "cn": "KÍ",
  "cf": "block",
  "sp": "Sparikassin",
  "sb": "",
  "n": "Jógvan",
  "no": "10",
  "nf": "classic"
}
```

| Field | Meaning | Rules |
|---|---|---|
| `v` | schema version | must be 1, else invalid |
| `c[0..3]` | body, sleeves, collar, pattern colours | `#RRGGBB` uppercase; invalid → defaults |
| `p` | pattern id | one of `solid, stripes, hoops, halves, sash, band`; unknown → `solid` |
| `cn` | club name (front, top) | ≤ 16 chars |
| `cf` | text font for club/player name | `block \| wide \| classic` |
| `sp` | sponsor front (chest) | ≤ 18 chars, optional |
| `sb` | sponsor back (below number) | ≤ 18 chars, optional |
| `n` | player name (back, above number) | ≤ 12 chars, optional |
| `no` | squad number (back, centre) | 1–2 digits, optional |
| `nf` | number style | `classic \| outline \| shadow` |

### 4.2 Curated palette (24)

`#FFFFFF #F6F5F1 #101814 #0C1512 #6B7280 #0F766E` · `#2DD4BF #065F46 #16A34A #84CC16 #EAB308 #F59E0B` · `#EA580C #DC2626 #B91C1C #9F1239 #F472B6 #A855F7` · `#6D28D9 #4F46E5 #2563EB #0EA5E9 #0E7490 #78350F`
Plus a native `<input type="color">` for custom hex per slot.

### 4.3 Jersey SVG

- Silhouette (shared front/back), layered fills: body (clip source) → pattern layer (clipped) → sleeves → collar; front adds crest zone + club name + sponsor; back adds player name, number, back sponsor.
- Patterns clipped to the torso: `stripes` (vertical), `hoops` (horizontal), `halves` (left/right), `sash` (diagonal), `band` (chest band), `solid` (none) — all drawn in the pattern colour.
- Crest: uploaded image downscaled to max 512 px, placed in a clipped 28×28 zone at left chest (front only); placeholder outline shown when absent.
- Number styles: `classic` (filled), `outline` (stroke, no fill), `shadow` (offset duplicate behind).
- Text fonts: `block` (Archivo 900, tight), `wide` (Archivo 800, +0.12em, uppercase), `classic` (Archivo 700).
- Preview updates live; state changes are also announced via a short `aria-live` status for screen-reader users.

### 4.4 Share codec

`encodeDesign(state)`: JSON → UTF-8 bytes → base64url (no padding). `decodeDesign(str)`: reverse; malformed → `{ ok: false }`; well-formed but invalid fields are sanitized field-by-field. Faroese characters (áðíóúýæø) round-trip exactly.

### 4.5 PNG export

Off-screen export SVG (2 views side by side, ~1600×1100): crest included, footer block with club name, pattern, four hex values, player name + number, date, `treyst.fo/kitedesign`. Rasterised via `Image` + `<canvas>` at 2×, downloaded as `treyst-kit-<club|design>.png`. Waits for `document.fonts.ready` before rasterising.

### 4.6 Quote integration

- `ContactForm.astro` reads `d` on load; valid → renders a chip (design summary + "View design" link), adds hidden `design` field (full designer URL), includes a `Design: <url>` line in the mailto body, preselects `topic=apparel`.
- Invalid `d` → ignored silently.
- "Send to TREYST" navigates with the current design code.

## 5. Discovery & Integration

- `Icon.astro`: new `palette` icon.
- `Nav.astro`: services dropdown gains a divider + Kit Designer entry (after the four services).
- `Footer.astro`: Kit Designer added to the pages list.
- `ServicePage.astro` / apparel: new `DesignerCta` band between capabilities and details (title, description, button).
- `JerseyCustomizer.astro` (Prenting): link below the mini customizer to the full designer.

## 6. Files

```
site/src/scripts/kit-designer-core.mjs        (new: state, defaults, sanitize, codec)
site/src/scripts/kit-designer.mjs             (new: DOM wiring, render, crest, export, copy link)
site/src/components/KitDesigner.astro         (new: island markup + inline SVG)
site/src/components/KitDesignerPage.astro     (new: hero + how-it-works + CTA)
site/src/components/DesignerCta.astro         (new: apparel-page band)
site/src/pages/kitedesign.astro               (new)
site/src/pages/en/kit-designer.astro          (new)
site/src/i18n/ui.mjs                          (modify: designer copy, quote chip copy)
site/src/i18n/utils.mjs                       (modify: ROUTE_PAIRS)
site/src/components/{Icon,Nav,Footer,ContactForm,JerseyCustomizer,ServicePage}.astro (modify)
site/tests/kit-designer.test.mjs              (new: unit tests)
site/tests/build.test.mjs                     (modify: pages, nav, hreflang pair, form markup)
```

## 7. Quality Gates

- Unit: codec roundtrip with Faroese chars; invalid base64; field sanitization (bad hex, unknown pattern, overlong text, unknown version); defaults completeness.
- Build: both pages exist with correct lang/canonical/hreflang; designer island present; nav + footer links; quote form design chip markup.
- Budget: only inline JS added (~4–7 KB gz designer module); total JS still < 35 KB gz.
- A11y: every control labelled; swatch radios keyboard-operable with visible focus (existing two-tone ring); lighthouse a11y 100 on both new pages.
- Browser QA: change colour/pattern/name → SVG updates; copy link → fresh context hydrates identical design; PNG downloads; "Send to TREYST" opens contact with chip + topic preselected; invalid `?d=` falls back safely.

## 8. Out of Scope (this phase)

AI try-on integration (phase 3), club presets + squad size collection (phase 2), accounts, server-side design storage, garment types beyond the jersey, pricing calculator, checkout.

## 9. Acceptance Checklist

- [ ] `/kitedesign` and `/en/kit-designer` build, hreflang-linked, Lighthouse a11y 100
- [ ] All six patterns render and update live; four colour slots + custom picker work
- [ ] Crest upload previews and appears in the exported PNG (and is excluded from share links, as labelled)
- [ ] Design link round-trips exactly (unit + browser); edited URLs sanitize
- [ ] PNG export downloads with both views and the details footer
- [ ] Quote form: chip + view link + `design` payload + Klæðir preselected; mailto body includes the link
- [ ] Discovery: nav dropdown, footer, Klæðir CTA band, Prenting link
- [ ] All copy FO/EN from `ui.mjs`; i18n parity test passes
- [ ] Full test suite + JS/CSS budgets pass; interactive browser QA recorded
