# Crunchies training website (React + Vite)

Learner-facing web app for courses, modules, quizzes, and profile.

## Cloudflare deploy

This app is a **static Vite build** (`dist/`). Do **not** use deploy command `npx wrangler deploy` alone — you must install dependencies and build first.

See **[DEPLOY.md](./DEPLOY.md)** if deploy fails with *"Could not detect static files"* or *"No dependencies detected"*.

### If the repo root is this folder (`crunchies-website`)

In **Cloudflare Workers → Settings → Builds**:

| Setting | Value |
|--------|--------|
| **Root directory** | `/` (empty) |
| **Install command** | `npm ci` |
| **Build command** | `npm run build` |
| **Deploy command** | `npx wrangler deploy` |

**Safer single command** (when install step is skipped):

```bash
npm ci && npm run deploy
```

### If the repo root is a parent folder (e.g. `Training/`)

Set **Root directory** to `Website/crunchies-website`, **or** keep root at `Training/` and set **Deploy command** to `npm run deploy:website`.

If you see *"No dependencies detected"*, the root directory is wrong.

### Environment variables (build time)

- `VITE_API_BASE_URL` — backend API URL (default: `https://crunches-training.fly.dev`)

### Alternative: Cloudflare Pages

Create a **Pages** project instead of Workers:

- **Framework preset:** Vite  
- **Build command:** `npm run build`  
- **Build output directory:** `dist`  
- No `wrangler deploy` needed.

SPA routing is handled by `not_found_handling` in `wrangler.toml` — do not add a `public/_redirects` file (it conflicts with Workers static assets).

If deploy still fails with an `_redirects` infinite-loop error, **clear the Cloudflare build cache** (Workers → your project → Settings → Builds → clear cache) and redeploy.
