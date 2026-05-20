# Fix Cloudflare deploy: "Could not detect static files"

That error means **`dist/` was never built** — usually because only `npx wrangler deploy` ran with no install/build.

In **Workers → your project → Settings → Builds**:

| Setting | Value |
|--------|--------|
| **Root directory** | `/` (empty — repo root is the app) |
| **Node version** | 20 |
| **Install command** | `npm ci` |
| **Build command** | `npm run build` |
| **Deploy command** | `npx wrangler deploy` |

**Or** one deploy command (if install is skipped):

```bash
npm ci && npm run deploy
```

## Environment

- `VITE_API_BASE_URL` — e.g. `https://crunches-training.fly.dev`

## Verify locally

```bash
npm ci
npm run deploy
```

You should see Vite build output, then `Uploaded ... dist`.
