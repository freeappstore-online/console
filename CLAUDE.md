# Creator Console

Unified creator portal for FreeAppStore — consolidated from the former `create/` and `console/` repos.

- URL: `console.freeappstore.online`
- Dev: `pnpm install && pnpm dev`
- Build: `pnpm build`
- Typecheck: `pnpm typecheck`
- Deploy: `git push origin main` (auto-deploys to R2 via GitHub Actions)

## Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | App list, stats, quick links |
| `/create` | VibeCode | AI app builder — My Apps console view |
| `/create/:id` | VibeCode Chat | AI chat for a specific app |
| `/manage/:id` | App Management | Roles, secrets, webhooks, logs, code health |
| `/manage/:id/keys` | App API Keys | Per-app third-party API key management |
| `/publish` | Publish | Self-service publish to store |
| `/profile` | Profile | AI provider settings, voice, notifications |
| `/admin` | Admin | Platform monitoring dashboard |
| `/admin/data` | Platform Data | Cross-app data browser (KV, collections, counters, users) |

## Structure

```
console/
├── web/
│   ├── src/
│   │   ├── App.tsx                       Router (all routes)
│   │   ├── main.tsx
│   │   ├── index.css                     Design tokens + Tailwind
│   │   ├── components/
│   │   │   ├── Nav.tsx                   Unified header nav
│   │   │   ├── ChatMessage.tsx           VibeCode chat bubble
│   │   │   ├── DeployLog.tsx             Deploy progress UI
│   │   │   ├── Markdown.tsx              Lightweight markdown renderer
│   │   │   ├── MyAppsConsole.tsx          VibeCode app list
│   │   │   ├── ProjectPicker.tsx          Project selector modal
│   │   │   ├── AISettings.tsx             AI key vault UI
│   │   │   ├── studio/                    VibeCode studio components
│   │   │   └── manage/                    App management components
│   │   │       ├── AppDetail.tsx           Full app detail view
│   │   │       ├── ContentAdmin.tsx        Cross-app data admin
│   │   │       ├── LogsViewer.tsx          App log viewer
│   │   │       ├── RolesManager.tsx        Role assignment UI
│   │   │       ├── SecretsManager.tsx      Secret + proxy allowlist UI
│   │   │       └── WebhooksManager.tsx     Webhook CRUD + test
│   │   ├── hooks/                         useAuth, useAgent, useSpeech, etc.
│   │   ├── lib/                           api, ai-keys, theme, push, appSecrets
│   │   └── pages/                         Dashboard, Create, Manage, Profile, etc.
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── package.json
└── CLAUDE.md
```

## Auth

Custom OAuth via `api.freeappstore.online/v1/auth/github/start`. Token stored in localStorage (`fas:session`). No SDK dependency — auth is self-contained in `lib/api.ts` and `hooks/useAuth.ts`.

## External APIs

- `api.freeappstore.online` — auth, app CRUD, roles, secrets, webhooks, logs, analytics
- `agent.freeappstore.online` — AI chat sessions (SSE streaming)
- `publish.freeappstore.online` — self-service publish
- `admin.freeappstore.online` — platform monitoring + unpublish

## History

Consolidated from `create/` (VibeCode AI builder) + `console/` (creator dashboard) into a single app. The `create/` repo should redirect to `console.freeappstore.online`.
