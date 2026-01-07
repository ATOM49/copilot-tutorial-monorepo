Environment variables
====================

This project uses a small set of env vars shared across `apps/web`, `apps/api`, and `packages/ai-core`.

Required / common vars

- `NEXT_PUBLIC_API_URL` — Base URL the web app uses to contact the API (client-side; must start with http/https). Default: `http://localhost:3001`.
- `OPENAI_API_KEY` — Server-only API key for OpenAI. Keep this secret; do not expose to client code.
- `OPENAI_MODEL` — Which OpenAI model to use. Default: `gpt-4o-mini`.

Usage

- Server code can import the helper from `@copilot/shared`:

  import { getEnv } from "@copilot/shared";
  const env = getEnv();

- Client-side code (Next.js) should read `process.env.NEXT_PUBLIC_API_URL` at build time or use `NEXT_PUBLIC_` prefixed vars only.

Local .env example

```
NEXT_PUBLIC_API_URL=http://localhost:3001
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o-mini
```

Notes

- `@copilot/shared` exposes `EnvSchema`, `DEFAULTS`, and `getEnv()` to centralize validation and defaults.
- Do not commit secrets to VCS. Use a local `.env` file (gitignored) or environment management for CI/hosting.
