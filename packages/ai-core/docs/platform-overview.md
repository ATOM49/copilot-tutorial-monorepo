# Copilot Platform Overview

The Copilot monorepo includes a Next.js web app, a Fastify API, and shared TypeScript packages that expose schemas and AI utilities. The API exposes /copilot/* endpoints that call predefined agents and optionally invoke tools. Both apps rely on @copilot/shared for Zod schemas and env validation to keep request and response contracts aligned.

### Key concepts
- Agents: typed runnables with input/output Zod schemas and an id registered in AgentRegistry.
- Tools: reusable utilities exposed to agents through ToolRegistry and allowlists.
- Auth context: each request carries userId, tenantId, and roles (stubbed in dev via cookies).
- AI runner: structured outputs are produced via runStructured with OpenAI chat models.

### Local development
- Start everything with `pnpm dev` from the repo root.
- The web app calls the API at http://localhost:3001 by default through NEXT_PUBLIC_API_URL.
- Keep OPENAI_API_KEY and OPENAI_MODEL configured in your .env for API calls.
