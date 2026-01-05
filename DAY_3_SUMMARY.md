# Day 3: Agent Definition + Registry - Complete ✅

## Overview
Successfully implemented the agent architecture that productizes use cases into clean contracts with input/output schemas and a registry system.

## What Was Built

### 1. AgentDefinition Interface
**File:** [packages/ai-core/src/agents/AgentDefinition.ts](packages/ai-core/src/agents/AgentDefinition.ts)

```typescript
interface AgentDefinition<TInput, TOutput> {
  id: string;              // Unique identifier (e.g., "product-qa")
  name: string;            // Human-readable display name
  inputSchema: ZodSchema;  // Zod validation for inputs
  outputSchema: ZodSchema; // Zod validation for outputs
  run(input, context?): Promise<output>;
}

interface AgentContext {
  userId: string;
  tenantId: string;
  roles?: string[];
}
```

**Purpose:** Clean contract for any agent implementation with type-safe inputs and outputs.

### 2. AgentRegistry Class
**File:** [packages/ai-core/src/agents/AgentRegistry.ts](packages/ai-core/src/agents/AgentRegistry.ts)

```typescript
class AgentRegistry {
  register(agent: AgentDefinition): void
  get(agentId: string): AgentDefinition
  list(): AgentDefinition[]
  listMetadata(): Array<{id, name}>
  has(agentId: string): boolean
}
```

**Features:**
- Central registry for all agents
- Type-safe lookup by ID
- Metadata listing for UI components
- Error handling for missing agents
- Singleton instance exported as `agentRegistry`

### 3. Product Q&A Agent
**File:** [packages/ai-core/src/agents/productQA.agent.ts](packages/ai-core/src/agents/productQA.agent.ts)

**Input Schema:**
```typescript
{
  question: string (required)
  productContext?: string (optional)
}
```

**Output Schema:**
```typescript
{
  answer: string
  confidence: "high" | "medium" | "low"
  sources?: string[]
  suggestedFollowUps?: string[]
}
```

**Features:**
- Uses OpenAI via LangChain
- Structured JSON output via Zod
- Context-aware (userId, tenantId)
- Configurable system prompts

### 4. API Endpoints
**File:** [apps/api/src/routes/copilotAgent.ts](apps/api/src/routes/copilotAgent.ts)

#### POST /copilot/run
Execute any registered agent by ID:
```bash
curl -X POST http://localhost:3001/copilot/run \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "product-qa",
    "input": {
      "question": "What are the key features of this product?"
    }
  }'
```

**Response:**
```json
{
  "ok": true,
  "agentId": "product-qa",
  "result": {
    "answer": "...",
    "confidence": "high",
    "suggestedFollowUps": ["..."]
  }
}
```

#### GET /copilot/agents
List all available agents:
```json
{
  "ok": true,
  "agents": [
    { "id": "product-qa", "name": "Product Q&A" }
  ]
}
```

#### GET /copilot/agents/:agentId
Get specific agent metadata.

### 5. Day 3 UI Component
**File:** [apps/web/src/components/day-3/DayCard.tsx](apps/web/src/components/day-3/DayCard.tsx)

**Features:**
- Progress tracker showing all tasks complete ✓
- Architecture overview
- Interactive Product Q&A demo
- Live testing interface
- Response visualization

## Architecture Benefits

### 1. **Type Safety**
- Zod schemas provide runtime validation
- TypeScript types inferred from schemas
- Catches errors at build time and runtime

### 2. **Extensibility**
- Easy to add new agents
- Just implement `AgentDefinition` interface
- Register with `agentRegistry.register()`

### 3. **Context Awareness**
- Every agent receives auth context
- Tenant isolation built-in
- User tracking for all operations

### 4. **Separation of Concerns**
- Agent logic in `@copilot/ai-core`
- HTTP handling in `apps/api`
- UI components in `apps/web`

### 5. **Testability**
- Agents can be tested in isolation
- Mock inputs/outputs via Zod schemas
- Registry can be swapped for testing

## File Structure
```
packages/ai-core/src/
├── agents/
│   ├── AgentDefinition.ts    # Core interface
│   ├── AgentRegistry.ts       # Registry class
│   └── productQA.agent.ts     # First agent implementation
├── prompts/
│   └── copilotPrompts.ts      # Reusable prompts
├── providers/
│   └── openai.ts              # LangChain wrapper
└── runners/
    └── runStructured.ts       # Structured output helper

apps/api/src/
└── routes/
    ├── copilotAgent.ts        # New: /copilot/run endpoints
    └── copilotDemo.ts         # Day 2: /copilot/demo

apps/web/src/
└── components/
    └── day-3/
        └── DayCard.tsx        # UI + demo interface
```

## How to Add a New Agent

1. **Define schemas** (in agent file or `@copilot/shared`):
```typescript
const MyInputSchema = z.object({ ... });
const MyOutputSchema = z.object({ ... });
```

2. **Implement agent**:
```typescript
export const myAgent: AgentDefinition = {
  id: "my-agent",
  name: "My Agent",
  inputSchema: MyInputSchema,
  outputSchema: MyOutputSchema,
  async run(input, context) {
    // Your logic here
    return result;
  }
};
```

3. **Register in API**:
```typescript
import { myAgent } from "@copilot/ai-core";
agentRegistry.register(myAgent);
```

4. **Use from frontend**:
```typescript
const response = await fetch("/copilot/run", {
  method: "POST",
  body: JSON.stringify({
    agentId: "my-agent",
    input: { ... }
  })
});
```

## Testing

### Type Check
```bash
pnpm typecheck  # ✅ All passing
```

### Build
```bash
pnpm build      # ✅ All packages build successfully
```

### Runtime Test
```bash
# Terminal 1: Start API
cd apps/api && pnpm dev

# Terminal 2: Test endpoint
curl -X POST http://localhost:3001/copilot/run \
  -H "Content-Type: application/json" \
  -H "Cookie: copilot-user=test-user; copilot-tenant=test-tenant" \
  -d '{"agentId":"product-qa","input":{"question":"How does this work?"}}'
```

## Day 3 Deliverable ✅

**Goal:** AgentRegistry resolves agentId → runnable (with input/output schemas)

**Result:** 
- ✅ AgentDefinition interface with full type safety
- ✅ AgentRegistry with get/list/register methods
- ✅ Product Q&A agent with structured JSON output
- ✅ POST /copilot/run endpoint wired and tested
- ✅ All type checks passing
- ✅ Working UI demo component

## Latest Changes (post-delivery)

- **Export:** `agentRegistry` is now exported as a singleton from `@copilot/ai-core` and used during API startup.
- **Validation & Errors:** `/copilot/run` now performs Zod request validation and returns normalized error responses for invalid input.
- **ESM Fixes:** Internal imports updated to include `.js` extensions where required to avoid runtime ESM resolution issues.
- **Docs & UI:** Minor documentation edits and UI refinements to the Product Q&A demo (improved live testing flow and visualization).

## Next Steps (Day 4)

Focus on **Fastify runtime hardening**:
1. Request validation improvements
2. Better error normalization
3. Timeout handling for LLM calls
4. Auth context propagation refinement

---

**Status:** Day 3 Complete 🎉
