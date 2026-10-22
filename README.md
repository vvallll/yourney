# Yourney

**Travel made around you.** A landing page for Yourney, a made-up travel service that turns your answers into a trip designed around you.

Plain HTML, CSS and a bit of vanilla JS. No build step.

## Structure

```
yourney/
├── index.html        page markup
├── css/style.css     all styles (palette, type scale, sections, responsive rules)
├── js/main.js        interactions: header, scroll reveals, title jitter,
│                     destinations constellation, parallax, sign-up form
└── images/           photos, button paper texture, favicon
```

## Run locally

```bash
python3 -m http.server 8080 --directory yourney
```

Then open http://localhost:8080.

## Design

- Palette: `#3C352F` · `#EBE8DD` · `#F0E2A4` · `#C5CEAE`
- Fonts: Instrument Serif (headings), Instrument Sans (text), Source Sans 3 (UI: navigation, buttons, cards, reviews)
- Laid out for a 1512px wide screen. On bigger screens it scales up a little, and on smaller ones the grids collapse. A dedicated mobile design is planned.
