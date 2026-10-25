# cero.ads — portfolio

Animated portfolio for cero.ads, performance ad creatives for Roblox marketplaces.

Static site, no build step: open `index.html`, or serve the folder with any static host (GitHub Pages, Netlify, Vercel).

```bash
python -m http.server 5173
```

## Adding your ads

Work reels live in `index.html` under `<!-- ADD YOUR OWN ADS HERE -->`. Copy the `reel--video` block and change:

- `data-yt`: the YouTube video ID
- `data-ratio`: `9/16` for Shorts/Reels/TikTok, `16/9` for regular YouTube
- the `<img>` thumbnail (put it in `assets/work/`)

Update the `/ 07` counter text if you like (it's recalculated automatically on load).

## Stack

- GSAP + ScrollTrigger, Lenis smooth scroll (vendored in `js/vendor/`)
- Custom WebGL aurora behind the hero (`js/hero-gl.js`)
- Fonts: Bricolage Grotesque, Instrument Serif, Geist (Google Fonts)
