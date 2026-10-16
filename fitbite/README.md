# FitBite — logo, executive deck and strategy document

Three deliverables built from one source: the four-page course strategy
[`source/FitBite_Marketing_Strategy.pdf`](source/FitBite_Marketing_Strategy.pdf).
Every fact, figure and name comes from that file. Nothing is added from outside it.

| Deliverable | File |
|---|---|
| Logo (full colour, white, stacked, icon) | [`logo/`](logo) — SVG and PNG |
| Executive presentation, fade transition on every slide | [`out/FitBite_Marketing_Strategy_Deck.pptx`](out/FitBite_Marketing_Strategy_Deck.pptx) |
| The same presentation as a PDF | [`out/FitBite_Marketing_Strategy_Deck.pdf`](out/FitBite_Marketing_Strategy_Deck.pdf) |
| Designed A4 marketing strategy document (11 pages) | [`out/FitBite_Marketing_Strategy.pdf`](out/FitBite_Marketing_Strategy.pdf) |

## Logo

An energy ball (dates, peanuts, oats, sesame) with a bite taken out of it and
three crunch lines, next to the "FitBite" wordmark in Nunito Black: "Fit" in
deep green, "Bite" in orange. The wordmark is converted to outlines, so the
SVGs look the same on any machine. Use `fitbite-logo-white` on dark backgrounds
and `fitbite-icon` where space is tight (favicons, the slide footer).

## Brand palette

| Role | Hex |
|---|---|
| Deep green (dominant, dark slides, text) | `#0E3B2E` |
| Energy orange (logo, highlights) | `#FF7A1A` |
| Leaf green | `#2E9E5B` |
| Sun yellow | `#FFC23C` |
| Berry | `#E94F6E` |
| Teal | `#1A9A93` |
| Muted text | `#5E6E66` |

Each strategy section has its own colour (01 orange, 02 green, 03 yellow,
04 berry, 05 teal, 06 deep green), used the same way in the deck and the document.

## Presentation (16 slides)

Cover · At a glance · Agenda · Product · The exchange · Marketing Concept ·
Competitors · Competitive advantage (price chart) · Segmentation · Target market ·
Persona: Ahmed · Product & Price · Place & Promotion · Customer relationships
(loyalty punch card) · Five moves to launch · Close.

The deck uses a real PowerPoint theme and named layouts, so colours and fonts can
be changed in one place. Every slide has speaker notes. Text is Calibri, so it
renders the same on any Office install.

## Two things to know before presenting

- **The 40% market-share figure is an assumption.** The source says it must be
  verified with market research before it is presented as fact. The deck and the
  document both mark it that way.
- **The competitor price of 1,500 SDG is an estimate**, as the source states. The
  "≈ 33% lower" figure is simple arithmetic on 1,000 vs 1,500.

## Rebuilding

```bash
npm install            # pptxgenjs, react-icons, sharp
npm run fonts          # downloads Nunito and Inter (SIL OFL) into fonts/
npm run build          # logo SVG+PNG, deck .pptx, document PDF
```

The document is printed with Playwright's Chromium (`require("playwright")`
must resolve). Export the deck to PDF with PowerPoint (*File → Export → PDF*) or
`soffice --headless --convert-to pdf out/FitBite_Marketing_Strategy_Deck.pptx`.

| Script | Does |
|---|---|
| `build/logo.py` | Draws the mark and sets the wordmark as outlines → `logo/*.svg` |
| `tools/rasterize.mjs` | `logo/*.svg` → `logo/*.png` (4×) |
| `build/deck.js` | Builds the deck, writes the brand theme and adds a fade transition to each slide |
| `build/document.js` + `document.css` | Lays out the A4 document in HTML and prints it to PDF |
