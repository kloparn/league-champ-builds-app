# League Champ Builds

Server-rendered League of Legends champion explorer. Always on the latest patch via Riot's [Data Dragon](https://developer.riotgames.com/docs/lol#data-dragon) — no redeploy needed when new champions ship.

Live: https://leaguechampions.org/

## Stack

- **SvelteKit 2** + **Svelte 5** with TypeScript
- **SSR** via `@sveltejs/adapter-netlify` (Netlify Functions)
- **Tailwind CSS** with a custom hextech-inspired theme
- **Vitest** for unit/component tests, **Playwright** for end-to-end tests
- **Node 22 LTS** (see `.nvmrc`)

## Develop

```bash
nvm use            # Node 22
npm install
npm run dev        # http://localhost:3000
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Production build (Netlify adapter) |
| `npm run preview` | Preview the production build locally |
| `npm run check` | `svelte-check` type-check |
| `npm run test:unit` | Vitest |
| `npm run test:e2e` | Playwright (builds + previews automatically) |
| `npm run test` | Unit + e2e |

## Deployment

Netlify picks up `netlify.toml` automatically. `npm run build` produces a Netlify Functions–ready bundle in `build/`.

## CI

`.github/workflows/test.yml` runs type-check → unit tests → build → Playwright on every push and PR.

## SEO

- Each route emits its own `<title>` and meta tags (`<svelte:head>` in `+page.svelte`).
- `/sitemap.xml` and `/robots.txt` are dynamically generated from the live champion list.
- All pages are server-rendered, so crawlers see real content (not an empty `#root`).
