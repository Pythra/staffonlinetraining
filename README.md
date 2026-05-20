# Crunchies training website (React + Vite)

Learner-facing web app for courses, modules, quizzes, and profile.

## Local development

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

See **[DEPLOY.md](./DEPLOY.md)**. Use repo root (this folder) with **Root directory** empty, **Build** `npm run build`, **Deploy** `npx wrangler deploy` — or `npm ci && npm run deploy`.

### Environment variables (build time)

- `VITE_API_BASE_URL` — backend API URL (default: `https://crunches-training.fly.dev`)
"# staffonlinetraining" 
