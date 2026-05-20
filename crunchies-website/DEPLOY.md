# Fix Cloudflare deploy: "Could not detect static files"

That error means **`dist/` was never built** — usually because the project root is wrong or only `npx wrangler deploy` ran with no install/build.

## Option A — Repo is only `crunchies-website` (recommended)

In **Workers → your project → Settings → Builds**:

| Setting | Value |
|--------|--------|
| **Root directory** | `/` (empty) |
| **Node version** | 20 |
| **Install command** | `npm ci` |
| **Build command** | `npm run build` |
| **Deploy command** | `npx wrangler deploy` |

**Or** use a single deploy command (if install is skipped):

```bash
npm ci && npm run deploy
```

## Option B — Repo root is parent folder (e.g. `Training/`)

| Setting | Value |
|--------|--------|
| **Root directory** | `Website/crunchies-website` |
| **Deploy command** | `npm ci && npm run deploy` |

**Or** keep root at `Training/` and set **Deploy command** to:

```bash
npm run deploy:website
```

(uses `Training/package.json`.)

## Environment

- `VITE_API_BASE_URL` — e.g. `https://crunches-training.fly.dev`

## Verify locally

```bash
npm ci
npm run deploy
```

You should see Vite build output, then `Uploaded ... dist`.
