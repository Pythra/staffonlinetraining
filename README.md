# Crunchies training website (React + Vite)

Learner-facing web app for courses, modules, quizzes, and profile.

## Local development

Requires **Node.js 22+** (Wrangler 4.93+).

```bash
npm ci
npm run dev
npm run build
```

## Surge

```bash
npm run build
surge dist crunches-training.surge.sh
```

## Cloudflare deploy

See **[DEPLOY.md](./DEPLOY.md)**. Repo root, **Node 22**, deploy: `npm ci && npm run deploy`.

### Environment variables (build time)

- `VITE_API_BASE_URL` — backend API URL (default: `https://crunches-training.fly.dev`)
