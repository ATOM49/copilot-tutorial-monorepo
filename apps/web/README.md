Copilot Web is the Next.js 16 + React 19 dashboard that surfaces the study-plan experience, the per-day walkthrough, and the live API integrations.

## Architecture
- App Router frames live routes in `src/app/` with a shared globals layout, a `/dashboard` overview, and `/dashboard/day/[day]` detail pages.
- Design tokens and building blocks live under `src/components/ui`, while day-specific cards and widgets live under their own directories so each module can evolve independently.
- Tailwind 4 and `shadcn/ui` primitives keep styles consistent, and the `cn()` helper merges Tailwind families across variants.
- The UI pulls status and copilot responses from the Fastify API outlined in [apps/api/README.md](../api/README.md).

## Getting started
1. Run `pnpm install` from the repo root to install every workspace package.
2. From the root directory run `pnpm dev` to start both the Next.js frontend and the Fastify API in parallel (via `pnpm -r --parallel dev`).
3. To focus only on the web app, use `pnpm dev --filter @copilot/web`; the API can be started separately with `pnpm dev --filter @copilot/api`.

## Available commands
- `pnpm build --filter @copilot/web` builds the Next.js app for production.
- `pnpm typecheck --filter @copilot/web` and `pnpm lint --filter @copilot/web` keep the front end aligned with the workspace tooling.
- `pnpm dev --filter @copilot/web` is the fastest way to iterate on UI changes without restarting the API.

## Environment
- The frontend reads `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:3001`) to find the Fastify server. Update the value in `.env.local` at the repo root if the API lives elsewhere.
- Keep the API-aware env vars (e.g., `OPENAI_API_KEY`, `OPENAI_MODEL`) synced between `.env.local` and the running services so both apps share the same configuration.

## Study plan & page structure
- The roadmap is defined in `src/lib/study-plan.ts`, which powers the dashboard cards, day focus text, and deliverables for every day.
- Day pages use incremental routes (`/dashboard/day/1`, `/dashboard/day/2`, etc.) to demonstrate progressive milestones with dedicated components under `src/components/day-*`.
- `src/components/app-sidebar.tsx` and `src/components/day-progress.tsx` keep navigation and progress visuals consistent across screens.

## Backend integration
- All API calls run through the `/copilot/*` and `/health` endpoints documented in [apps/api/README.md](../api/README.md). The UI consumes the Zod-powered responses shared via `@copilot/shared`.
- When you need strongly typed payloads, import the shared schemas from `@copilot/shared` so both apps validate the same contracts.
- Additional helpers such as `src/components/health-client.tsx` demonstrate how to render `/health` responses in the UI.

## Resources
- API outline: [apps/api/README.md](../api/README.md)
- Shared schemas: `packages/shared/src/index.ts`