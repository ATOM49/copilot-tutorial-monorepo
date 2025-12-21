# Copilot API

Copilot API is the Fastify 5 backend that powers `/health` diagnostics, the structured `/copilot/demo` route, the typed agent runner (`/copilot/run`), and the agent metadata endpoints used by the dashboard.

## Outline

- **Entrypoint**: `apps/api/src/server.ts` boots Fastify with the Zod type provider, global CORS/cookie support, the auth context and error plugins, and registers `copilotDemoRoutes` + `copilotAgentRoutes`.
- **Routes**:
  - `GET /health` returns `{ ok: true, service: 'api', ts, auth }` so the UI can prove the stack is alive and view the current auth stub.
  - `POST /copilot/demo` (see `routes/copilotDemo.ts`) runs `runStructured` with `@copilot/shared`'s `DemoOutputSchema` for quick experimentation.
  - `POST /copilot/run` enforces `RunAgentRequestSchema`, resolves agents from `@copilot/ai-core`'s `agentRegistry`, injects auth context, applies timeouts via `runAgentWithTimeout`, and returns `RunAgentSuccessResponse` or normalized `RunAgentErrorResponse`.
  - `GET /copilot/agents` and `GET /copilot/agents/:agentId` expose the available agents' metadata.
- **Plugins**:
  - `plugins/authContext.cookie.ts` parses the `copilot_auth` cookie, falls back to `dev-user/dev-tenant`, and augments `req.auth`.
  - `plugins/errorHandler.ts` turns Zod errors, custom `CopilotError` subclasses (`ValidationError`, `AgentNotFoundError`, `TimeoutError`, `ModelError`) and generic failures into the shared error response shape.
- **Shared logic**:
  - `@copilot/ai-core` provides `agentRegistry`, `productQAAgent`, `AgentContext`, and the OpenAI model wrappers, so the API focuses on request handling.
  - `@copilot/shared` exports the Zod schemas/types that both the API and web UI consume.

## Getting started

1. Run `pnpm install` from the repo root.
2. Copy `.env.example` (if available) or create `.env.local` adjacent to the repo root: the API resolves env vars relative to `apps/api/src/server.ts` via `../.env.local`.
3. Set `OPENAI_API_KEY` (required) and `OPENAI_MODEL` (defaults to `gpt-4o-mini`).
4. Run `pnpm dev --filter @copilot/api` (or `pnpm dev` from the root to start every workspace app in parallel).

## Scripts

- `pnpm dev --filter @copilot/api` starts `tsx watch src/server.ts` for fast iterations.
- `pnpm build --filter @copilot/api` and `pnpm typecheck --filter @copilot/api` run `tsc -p tsconfig.json --noEmit`.
- `pnpm lint --filter @copilot/api` prints `"(optional)"` but keeps the script available for future linting.

## Environment

- `OPENAI_API_KEY` – required for the Structured OpenAI calls in both `/copilot/demo` and `/copilot/run`.
- `OPENAI_MODEL` – defaults to `gpt-4o-mini` if unset.
- The server binds to `0.0.0.0:3001` and is consumed by `NEXT_PUBLIC_API_URL` inside `apps/web`.
- Cookies named `copilot_auth` seed the auth context; in dev, the plugin falls back to `dev-user/dev-tenant` when the cookie is missing or malformed.

## Observability & safety

- Every request logs context via Fastify's built-in logger (see `server.ts`).
- `runAgentWithTimeout` rejects after 30 s by default (or the caller can send `timeout` in the request).
- Errors flow through `errorHandler.ts`, using the custom `CopilotError` tree in `src/lib/errors.ts` so the UI always receives `{ ok: false, code, error, details? }`.

## Integration pointers

- Agents register themselves on load through `agentRegistry.register(productQAAgent)` (see `packages/ai-core/src/agents/productQA.agent.ts`). Any new agent should be registered in the same way and expose `inputSchema`, `outputSchema`, and a `run` function that accepts `AgentContext` plus an `AbortSignal`.
- The API enumerates agents via `agentRegistry.listMetadata()` so the UI can render a dropdown without importing the actual agent.

## References

- Frontend dashboard: [apps/web/README.md](../web/README.md)
- Shared schemas/types: `packages/shared/src/index.ts`
- Agent runtime: `packages/ai-core/src/index.ts`
