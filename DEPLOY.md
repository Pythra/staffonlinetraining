# Fix Cloudflare deploy: "Could not detect static files"

That error means **`dist/` was never built** — usually because only `npx wrangler deploy` ran with no install/build.

In **Workers → your project → Settings → Builds**:

| Setting | Value |
|--------|--------|
| **Root directory** | `/` (empty — repo root is the app) |
| **Node version** | **22** (required — Wrangler 4.93+ fails on Node 20) |
| **Install command** | `npm ci` |
| **Build command** | `npm run build:cloudflare` |
| **Deploy command** | `npm run deploy` |

**Or** (if install is skipped):

```bash
npm ci && npm run deploy
```

Cloudflare reads **`.nvmrc`** / **`engines.node`** in `package.json` when auto-detecting Node. If deploy still uses Node 20, set **Node.js version → 22** manually under Builds.

## Environment

- `VITE_API_BASE_URL` — e.g. `https://crunches-training.fly.dev`

## Surge.sh (SPA routing)

`npm run build` copies `public/_redirects` into `dist/` so deep links (e.g. `/app/c/SOP/topics?tab=tests`) work after refresh. Deploy with:

```bash
npm run surge
```

Cloudflare Workers uses `npm run build:cloudflare`, which removes `_redirects` (Workers handles SPA routing itself).

## Verify locally

```bash
npm ci
npm run deploy
```

You should see Vite build output, then `Uploaded ... dist`.
