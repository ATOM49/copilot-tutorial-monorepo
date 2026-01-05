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

export async function runAgent(
  agentId: string,
  input: Record<string, any>,
  apiBase?: string,
  signal?: AbortSignal
): Promise<any> {
  const base = apiBase || defaultBase;
  const res = await fetch(`${base}/copilot/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ agentId, input }),
    signal,
  });

  // If request was aborted, rethrow so callers can detect
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`);
  }

  const json = await res.json();

  if (json?.ok === true) {
    return json;
  }

  throw new Error(json?.error ?? "Failed to run agent");
}

// Streaming runner: POST to /copilot/stream and parse incoming SSE-style events from the response body.
export async function runAgentStream(
  agentId: string,
  input: Record<string, any>,
  onEvent: (event: string, data: any) => void,
  apiBase?: string
): Promise<() => void> {
  const base = apiBase || defaultBase;
  const controller = new AbortController();

  const res = await fetch(`${base}/copilot/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ agentId, input }),
    signal: controller.signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`);
  }

  if (!res.body) {
    throw new Error("Streaming not supported by the server response");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  const parseChunk = (chunk: string) => {
    buffer += chunk;
    let index;
    while ((index = buffer.indexOf("\n\n")) !== -1) {
      const raw = buffer.slice(0, index).trim();
      buffer = buffer.slice(index + 2);

      if (!raw) continue;

      const lines = raw.split(/\r?\n/);
      let event = "message";
      let data = "";
      for (const line of lines) {
        // SSE comments/heartbeats start with ':'
        if (line.startsWith(":")) continue;

        if (line.startsWith("event:")) {
          event = line.replace(/^event:\s*/, "").trim();
        } else if (line.startsWith("data:")) {
          data += line.replace(/^data:\s*/, "") + "\n";
        }
      }

      data = data.trim();
      let parsed: any = data;
      try {
        parsed = data ? JSON.parse(data) : undefined;
      } catch (err) {
        // leave as raw string if not JSON
      }

      onEvent(event, parsed);
    }
  };

  // Consume stream
  (async () => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        parseChunk(chunk);
      }

      // flush decoder
      const tail = decoder.decode();
      if (tail) parseChunk(tail);

      // flush any remaining buffer
      if (buffer) parseChunk("\n\n");
    } catch (err) {
      // propagate as error event
      onEvent("error", { error: String(err) });
    }
  })();

  return () => {
    controller.abort();
    try {
      reader.cancel();
    } catch {}
  };
}

export default fetchAgents;
