# zack-maps-prototype

Public deployment of the Verkada Maps 2.0 IA prototype by Zack Baumel.

**Live:** https://ankush-rustagi.github.io/zack-maps-prototype/

Featured on the [PM prototype hub](https://ankush-rustagi.github.io/).

## What this is

A long-lived design exploration for the next-gen Verkada Maps experience. Vite + React + TypeScript SPA, real Mapbox basemap, in-memory mock data, an 18-state state machine (press `S` to jump between states), homegrown polygon drawer for perimeters and layout crops, and a DOM-projected floorplan overlay.

See [CLAUDE.md](./CLAUDE.md) for the full architecture walk-through.

## Source of truth

Canonical working copy lives in the docs-vibes repo at `documentation/80-workspaces/zack.baumel/maps prototype/`. This repo exists only to serve a public build via GitHub Pages.

## Run locally

```sh
npm install
cp .env.example .env   # paste a public Mapbox pk.* token + optional style URLs
npm run dev            # http://localhost:5173
```

Without a token the map falls back to a CSS-grid placeholder; the rest of the prototype still works.

## Deploy

Every push to `main` triggers `.github/workflows/deploy.yml`, which builds with Vite and publishes `dist/` to GitHub Pages.

The workflow reads three secrets from the repo (Settings -> Secrets and variables -> Actions):

- `VITE_MAPBOX_TOKEN` - public Mapbox `pk.*` token (URL-allowlist to `ankush-rustagi.github.io`)
- `VITE_MAPBOX_STYLE_LIGHT` - optional `mapbox://styles/...` for light theme
- `VITE_MAPBOX_STYLE_DARK` - optional `mapbox://styles/...` for dark theme

If any secret is unset, the deploy still succeeds; the affected feature falls back to the stock Mapbox style or the CSS-grid placeholder.
