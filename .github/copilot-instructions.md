# Copilot Monorepo - AI Agent Instructions

## Project Architecture

This is a **pnpm workspace monorepo** with two apps and two shared packages:
- **apps/web**: Next.js 16 frontend (App Router, React 19, Tailwind 4, shadcn/ui)
- **apps/api**: Fastify backend (ESM-only, cookie-based auth context)
- **packages/ai-core**: LangChain + OpenAI integration layer
- **packages/shared**: Shared Zod schemas and types

### Key Constraint: ESM-Only Codebase
- All packages use `"type": "module"` — **no CommonJS**
- Import statements **must** include `.js` extensions: `from "./foo.js"` (even for `.ts` files)
- TypeScript `moduleResolution: "Bundler"` with `module: "ESNext"`

## Development Workflow

### Running the Project
```bash
pnpm dev              # Runs all apps in parallel (web + api)
pnpm build            # Builds all packages
pnpm typecheck        # Type-checks all workspaces
```

Individual services:
```bash
cd apps/web && pnpm dev     # Next.js on :3000
cd apps/api && pnpm dev     # Fastify on :3001 (tsx watch)
```

### Adding Dependencies
```bash
pnpm add <pkg> -w                    # Root workspace
pnpm add <pkg> --filter @copilot/api # Specific app
```

## Code Patterns & Conventions

### 1. Workspace Package References
Cross-package imports use workspace protocol:
```json
"dependencies": {
  "@copilot/shared": "workspace:*",
  "@copilot/ai-core": "workspace:*"
}
```

### 2. Auth Context Pattern
See [apps/api/src/plugins/authContext.cookie.ts](apps/api/src/plugins/authContext.cookie.ts):
- Every request gets `req.auth: { userId, tenantId, roles? }`
- Cookie-based in production; dev fallback to `"dev-user"/"dev-tenant"`
- Parsed via Zod schema with Fastify module augmentation

### 3. Structured AI Output Pattern
All AI calls use the structured runner in [packages/ai-core/src/runners/runStructured.ts](packages/ai-core/src/runners/runStructured.ts):
```typescript
const result = await runStructured({
  model: createOpenAIChatModel({ model: "gpt-4o-mini" }),
  system: copilotSystemPrompt({ appName: "Copilot Web" }),
  input: userQuery,
  schema: DemoOutputSchema, // Zod schema from @copilot/shared
});
```

### 4. Shared Type Definitions
All request/response schemas live in [packages/shared/src/index.ts](packages/shared/src/index.ts) as Zod schemas.  
Export both schema and inferred TypeScript type:
```typescript
export const FooSchema = z.object({ ... });
export type Foo = z.infer<typeof FooSchema>;
```

### 5. UI Component Library
Follows shadcn/ui conventions:
- Components in `apps/web/src/components/ui/`
- Use `cn()` utility for Tailwind class merging
- Radix primitives for accessible, unstyled foundations

### 6. Fastify Route Registration
Routes are Fastify plugins exported as `FastifyPluginAsync`:
```typescript
export const myRoutes: FastifyPluginAsync = async (app) => {
  app.post("/my/route", async (req) => { ... });
};
```

Register in [apps/api/src/server.ts](apps/api/src/server.ts) with `await app.register(myRoutes)`.

## Integration Points

- **Web → API**: `process.env.NEXT_PUBLIC_API_URL` (default `http://localhost:3001`)
- **API → LangChain**: Uses `@copilot/ai-core` to abstract LangChain boilerplate
- **API → OpenAI**: Configured via `OPENAI_API_KEY` and `OPENAI_MODEL` env vars
- **CORS**: API allows `http://localhost:3000` with credentials

## Common Pitfalls

1. **Missing `.js` extensions in imports** → Module resolution errors
2. **Using CommonJS** (`require`, `module.exports`) → Runtime crash (ESM-only)
3. **Forgetting `workspace:*` protocol** → pnpm won't link local packages
4. **Not exporting Zod schemas from `@copilot/shared`** → Type/validation mismatch

## Study Plan Context
This repo follows a structured study plan tracked in [apps/web/src/lib/study-plan.ts](apps/web/src/lib/study-plan.ts). The dashboard at `/dashboard` shows day-by-day tasks with local progress tracking.
