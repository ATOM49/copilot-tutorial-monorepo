export type DayTask = {
  id: string; // stable per-day id (used for progress storage)
  label: string;
};

export type StudyDay = {
  day: number;
  title: string;
  focus: string;
  deliverable: string;
  callout?: string;
  tasks: DayTask[];
};

export type StudyWeek = {
  week: number;
  title: string;
  days: StudyDay[];
};

export const STUDY_WEEKS: StudyWeek[] = [
  {
    week: 1,
    title: "Copilot skeleton (UI ↔ API ↔ 1 agent)",
    days: [
      {
        day: 1,
        title: "Workspace + Web/API wiring",
        focus: "pnpm monorepo + basic request context",
        deliverable:
          "Next.js page calls Fastify /health and displays response (with auth stub).",
        tasks: [
          {
            id: "ws-structure",
            label:
              "pnpm workspace boots (apps/web + apps/api + packages/shared)",
          },
          {
            id: "health",
            label: "web fetches /health from api and displays JSON",
          },
          {
            id: "shared-zod",
            label:
              "@copilot/shared is imported by both apps (zod schema validation works)",
          },
          {
            id: "auth-stub",
            label:
              "auth context stub (userId/tenantId) is available per request (cookie or headers)",
          },
        ],
      },
      {
        day: 2,
        title: "ai-core foundations",
        focus: "provider wrapper + prompt helpers + structured JSON",
        deliverable: "POST /copilot/demo returns typed JSON from the model.",
        callout: "Remember that langchain + zod breaks with zod/v4 so use zod/v3",
        tasks: [
          {
            id: "provider",
            label:
              "OpenAI provider wrapper (LangChain ChatOpenAI) created in @copilot/ai-core",
          },
          {
            id: "prompts",
            label: "prompt helpers (system + user templates) added",
          },
          {
            id: "structured",
            label: "structured output via zod (every agent returns JSON)",
          },
          {
            id: "demo-route",
            label: "Fastify POST /copilot/demo wired and working end-to-end",
          },
          {
            id: "ui-demo",
            label: "Day 2 UI page calls /copilot/demo and renders response",
          },
        ],
      },
      {
        day: 3,
        title: "Agent definition + registry",
        focus: "productize use cases into a clean contract",
        deliverable:
          "AgentRegistry resolves agentId → runnable (with input/output schemas).",
        callout:"The registry is in memory for now. strict mode is disabled for ProductQA agent.",
        tasks: [
          {
            id: "agent-def",
            label:
              "Define AgentDefinition: id, name, inputSchema, outputSchema, run()",
          },
          {
            id: "registry",
            label: "Create AgentRegistry with get(agentId) + list()",
          },
          {
            id: "agent-1",
            label:
              "Implement Agent #1: 'Product Q&A' (no tools yet, structured JSON)",
          },
          {
            id: "api-agent-run",
            label: "POST /copilot/run loads agent by id and returns output",
          },
        ],
      },
      {
        day: 4,
        title: "Fastify runtime hardening",
        focus: "request context, validation, errors",
        deliverable:
          "A stable /copilot/run endpoint with good errors and logging.",
        tasks: [
          {
            id: "req-validate",
            label:
              "Request schema validation for /copilot/run (agentId + input)",
          },
          {
            id: "ctx-pass",
            label: "Pass auth context into the agent runner (userId/tenantId)",
          },
          {
            id: "errors",
            label: "Normalize errors (bad request vs model/tool failures)",
          },
          {
            id: "timeouts",
            label: "Add timeouts / abort handling around LLM calls",
          },
        ],
      },
      {
        day: 5,
        title: "Next.js copilot UI (MVP)",
        focus: "chat panel + agent selection + typed rendering",
        deliverable:
          "In-app copilot panel runs Agent #1 and shows JSON output.",
        tasks: [
          {
            id: "copilot-panel",
            label: "Create chat-like UI container (messages list + input)",
          },
          {
            id: "agent-select",
            label: "Agent selector (dropdown) fed from /copilot/agents",
          },
          {
            id: "render-json",
            label: "Render structured JSON response cleanly (pre/pretty view)",
          },
          { id: "empty-states", label: "Empty/loading/error states for calls" },
        ],
      },
      {
        day: 6,
        title: "Streaming (phase 1)",
        focus: "SSE plumbing and UI updates",
        deliverable:
          "UI receives streamed events (even if final JSON arrives at end).",
        tasks: [
          {
            id: "sse-endpoint",
            label: "Add SSE endpoint /copilot/stream that emits status events",
          },
          {
            id: "ui-sse",
            label:
              "UI subscribes to SSE and displays progress ('thinking', 'running', 'done')",
          },
          {
            id: "cancel",
            label: "Add cancel button (AbortController) for non-SSE calls",
          },
        ],
      },
      {
        day: 7,
        title: "Week 1 polish",
        focus: "clean structure + dev ergonomics",
        deliverable: "Week 1 feels like a real product skeleton.",
        tasks: [
          {
            id: "env",
            label: "Centralize env (API URL, model, keys) and document them",
          },
          {
            id: "refactor",
            label:
              "Move shared types/schemas into @copilot/shared where appropriate",
          },
          {
            id: "dashboard",
            label: "Dashboard overview + day pages wired correctly",
          },
        ],
      },
    ],
  },
  {
    week: 2,
    title: "Tools + RAG + multiple predefined agents",
    days: [
      {
        day: 8,
        title: "Tool registry (safe tools)",
        focus: "tool interfaces + schema + ctx",
        deliverable:
          "Tools can be invoked in a controlled way with validation.",
        tasks: [
          {
            id: "tool-interface",
            label: "Define Tool: name, inputSchema, run(ctx,input)",
          },
          {
            id: "tool-registry",
            label: "Create ToolRegistry with get/list + allowlisting",
          },
          {
            id: "tools-3",
            label: "Implement 3 tools: time, calculator, searchDocs (stub)",
          },
          {
            id: "tool-events",
            label: "Emit tool start/end events for UI timeline",
          },
        ],
      },
      {
        day: 9,
        title: "Tool safety boundaries",
        focus: "timeouts, retries, permissions",
        deliverable:
          "Per-agent tool allowlist with guardrails + stable error handling.",
        tasks: [
          {
            id: "allowlist",
            label: "Per-agent allowedTools enforced server-side",
          },
          {
            id: "tool-timeouts",
            label: "Tool timeouts + safe failure responses",
          },
          {
            id: "perm-check",
            label: "Permission gate by roles/tenant (stubbed is fine)",
          },
          {
            id: "audit-log",
            label:
              "Log tool invocations with userId/tenantId + trace id placeholder",
          },
        ],
      },
      {
        day: 10,
        title: "RAG ingestion (minimal but correct)",
        focus: "documents → chunks → embeddings → store",
        deliverable:
          "You can ingest a small doc set and retrieve relevant chunks.",
        tasks: [
          {
            id: "loader",
            label: "Decide doc source for now (local markdown folder) + loader",
          },
          {
            id: "chunking",
            label: "Chunk strategy + metadata (docId, section, url/path)",
          },
          {
            id: "embeddings",
            label: "Embeddings pipeline wired (provider choice OK)",
          },
          {
            id: "store",
            label: "Vector store wired (start local/dev-friendly)",
          },
        ],
      },
      {
        day: 11,
        title: "RAG retrieval + citations",
        focus: "retriever + grounded output",
        deliverable:
          "searchDocs tool returns top chunks + citations you can render.",
        tasks: [
          {
            id: "retriever",
            label: "Retriever returns top-k chunks with scores",
          },
          {
            id: "citations",
            label: "Return citations: docId + chunkId + snippet",
          },
          {
            id: "prompting",
            label:
              "Prompt ensures answer uses retrieved context (no fabrication)",
          },
        ],
      },
      {
        day: 12,
        title: "Agent #2: Docs assistant",
        focus: "RAG agent with structured output",
        deliverable: "A second predefined agent that answers with citations.",
        tasks: [
          {
            id: "agent2-schema",
            label: "Output schema includes answer + citations + confidence",
          },
          {
            id: "agent2-run",
            label: "Agent uses retrieval tool before answering",
          },
          {
            id: "ui-citations",
            label: "UI renders citations under the answer",
          },
        ],
      },
      {
        day: 13,
        title: "Agent #3: Action helper (tool gated)",
        focus: "safe “write” actions behind confirmation",
        deliverable:
          "Agent proposes actions; tool execution is gated (UI or server).",
        tasks: [
          {
            id: "action-schema",
            label: "Output schema: summary, nextSteps, proposedActions[]",
          },
          {
            id: "createTicket-stub",
            label: "Stub tool: createTicket (returns fake id)",
          },
          {
            id: "confirm",
            label: "Add confirmation flow before calling write tools",
          },
        ],
      },
      {
        day: 14,
        title: "Week 2 UX polish",
        focus: "tool timeline + better states",
        deliverable:
          "Copilot feels coherent: tool steps, citations, clear errors.",
        tasks: [
          {
            id: "timeline-ui",
            label: "Show tool timeline (start/end/error) in chat UI",
          },
          {
            id: "agent-cards",
            label: "Improve agent selection UX (descriptions, intended use)",
          },
          {
            id: "fallbacks",
            label: "Fallback responses when retrieval is weak or tools fail",
          },
        ],
      },
    ],
  },
  {
    week: 3,
    title: "Production hardening (tracing, evals, security, performance)",
    days: [
      {
        day: 15,
        title: "Observability basics",
        focus: "request ids, latency, token/cost hooks",
        deliverable: "Every run has consistent logs and timing metadata.",
        tasks: [
          {
            id: "req-id",
            label: "Add requestId/traceId on each request and return it to UI",
          },
          {
            id: "latency",
            label: "Capture LLM latency + tool latency + total runtime",
          },
          { id: "tags", label: "Tag by agentId + tenantId + app version" },
        ],
      },
      {
        day: 16,
        title: "LangSmith tracing (or tracing integration)",
        focus: "debuggable runs",
        deliverable: "Traces show prompts, tool calls, retrieval, outputs.",
        tasks: [
          { id: "langsmith", label: "Wire LangSmith tracing to the runtime" },
          {
            id: "projects",
            label: "Organize by environment/project (dev/stage/prod)",
          },
          {
            id: "trace-link",
            label: "Return trace link/id in API response (behind a flag)",
          },
        ],
      },
      {
        day: 17,
        title: "Eval harness (golden prompts)",
        focus: "measure quality, prevent regressions",
        deliverable: "Automated eval run that produces a report.",
        tasks: [
          {
            id: "dataset",
            label: "Create 20–30 golden prompts per agent (small but real)",
          },
          {
            id: "rubric",
            label:
              "Define scoring rubric: correctness, groundedness, tool correctness",
          },
          {
            id: "runner",
            label:
              "Build an eval runner script in packages/observability or ai-core",
          },
        ],
      },
      {
        day: 18,
        title: "CI gating on evals",
        focus: "professional release discipline",
        deliverable: "CI fails if eval quality regresses beyond threshold.",
        tasks: [
          {
            id: "thresholds",
            label: "Set thresholds (pass rate / average score)",
          },
          { id: "ci", label: "Add pnpm script + CI step (even local for now)" },
          { id: "regressions", label: "Store baseline results and compare" },
        ],
      },
      {
        day: 19,
        title: "Security + tenancy pass",
        focus: "prompt injection + isolation",
        deliverable:
          "Tenant isolation + basic prompt-injection defenses applied.",
        tasks: [
          {
            id: "tenant-scope",
            label: "Ensure all retrieval/tools are tenant-scoped",
          },
          {
            id: "rag-safety",
            label:
              "Separate system policy from retrieved text; strip instruction-like content",
          },
          {
            id: "sensitive",
            label: "Add refusal patterns for secrets/keys/unsafe ops",
          },
        ],
      },
      {
        day: 20,
        title: "Performance & reliability",
        focus: "caching + rate limiting + stability",
        deliverable: "Copilot runs reliably under repeated use.",
        tasks: [
          {
            id: "cache",
            label:
              "Cache retrieval results (and optionally embeddings for dev)",
          },
          {
            id: "limits",
            label: "Add rate limits / concurrency limits on /copilot/*",
          },
          { id: "sse-stability", label: "SSE keepalive + reconnect handling" },
        ],
      },
      {
        day: 21,
        title: "Ship checklist + docs",
        focus: "handoff-ready platform",
        deliverable:
          "Documented platform: adding a new agent is straightforward.",
        tasks: [
          {
            id: "docs",
            label:
              "Write “How to add an agent” guide (schemas, tools, registration)",
          },
          { id: "env-docs", label: "Document env vars and local dev steps" },
          {
            id: "smoke",
            label:
              "Smoke tests for /health, /copilot/run, /copilot/demo, RAG agent",
          },
        ],
      },
    ],
  },
];

// Convenience: a flat list of days for pages/components that want day lookup.
export const STUDY_DAYS: StudyDay[] = STUDY_WEEKS.flatMap((w) => w.days);

export function getStudyDay(day: number) {
  return STUDY_DAYS.find((d) => d.day === day);
}
