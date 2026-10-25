# cero.ads — portfolio

Animated portfolio for cero.ads, performance ad creatives for Roblox marketplaces.

Static site, no build step: open `index.html`, or serve the folder with any static host (GitHub Pages, Netlify, Vercel).

```bash
python -m http.server 5173
```

## Adding your ads

Work reels live in `index.html` under `<!-- ADD YOUR OWN ADS HERE -->`. That comment holds a ready-made `reel--video` block: paste it above the first card and change:

- `data-yt`: the YouTube video ID
- `data-ratio`: `9/16` for Shorts/Reels/TikTok, `16/9` for regular YouTube
- the `<img>` thumbnail (put it in `assets/work/`)

Renumber the cards after it. The `01 / 06` counter is recalculated automatically on load.

Self-hosted clips (the organic section) use `data-video` for the full file and a `data-src` muted loop on the `<video>`.

## Stack

- GSAP + ScrollTrigger, Lenis smooth scroll (vendored in `js/vendor/`)
- Custom WebGL aurora behind the hero (`js/hero-gl.js`)
- Fonts: Bricolage Grotesque, Instrument Serif, Geist (Google Fonts)
