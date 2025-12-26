import { ListAgentsResponseSchema } from "@copilot/shared";
import type { ListAgentsResponse, AgentMetadata } from "@copilot/shared";

const defaultBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function fetchAgents(apiBase?: string): Promise<ListAgentsResponse> {
  const base = apiBase || defaultBase;
  const res = await fetch(`${base}/copilot/agents`, { credentials: "include" });

  const json = await res.json();

  // Validate/parse against the shared schema. If it fails, throw to surface the problem.
  try {
    const parsed = ListAgentsResponseSchema.parse(json);
    return parsed;
  } catch (err) {
    throw new Error("Invalid agents response from API");
  }
}

export async function fetchAgent(agentId: string, apiBase?: string): Promise<{ ok: true; agent: AgentMetadata }> {
  const base = apiBase || defaultBase;
  const res = await fetch(`${base}/copilot/agents/${agentId}`, { credentials: "include" });
  const json = await res.json();

  if (json?.ok === true && json.agent) {
    return json as { ok: true; agent: AgentMetadata };
  }

  // Normalize unexpected responses into an error
  throw new Error(json?.error ?? "Failed to fetch agent");
}

export async function runAgent(agentId: string, input: Record<string, any>, apiBase?: string): Promise<any> {
  const base = apiBase || defaultBase;
  const res = await fetch(`${base}/copilot/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ agentId, input }),
  });

  const json = await res.json();

  if (json?.ok === true) {
    return json;
  }

  throw new Error(json?.error ?? "Failed to run agent");
}

export default fetchAgents;
