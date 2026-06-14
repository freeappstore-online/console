# Creator Console — FreeAppStore

Unified creator portal for FreeAppStore. Build apps with AI (VibeCode), manage roles/secrets/webhooks, publish to the store — all in one place.

**Live:** [console.freeappstore.online](https://console.freeappstore.online)

## Quick start

```bash
pnpm install
pnpm dev       # http://localhost:5173
pnpm build     # production build
pnpm typecheck # TypeScript check
pnpm test      # unit + compliance tests
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Dashboard — app list, stats |
| `/create` | VibeCode — AI app builder |
| `/create/:id` | VibeCode chat for a specific app |
| `/manage/:id` | App management — roles, secrets, webhooks, logs |
| `/publish` | Publish to store |
| `/profile` | AI provider settings, voice, notifications |
| `/admin` | Platform monitoring |

## Stack

React 19, Vite 6, TypeScript, Tailwind CSS 4, React Router 7.

## Deploy

Push to `main` auto-deploys to R2 via GitHub Actions.

## License

MIT
