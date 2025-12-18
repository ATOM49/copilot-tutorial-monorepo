"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DayCard() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [agents, setAgents] = useState<Array<{ id: string; name: string }>>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [agentInfo, setAgentInfo] = useState<any>(null);
  const [agentInfoLoading, setAgentInfoLoading] = useState(false);
  const [agentError, setAgentError] = useState<string | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch(`${apiBase}/copilot/agents`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.ok) {
          setAgents(data.agents);
        } else {
          setAgentError(data.error ?? "Failed to load agents");
        }
      } catch (err) {
        setAgentError(String(err));
      } finally {
        setAgentsLoading(false);
      }
    };

    fetchAgents();
  }, [apiBase]);

  const handleSelectAgent = async (agentId: string) => {
    setSelectedAgent(agentId);
    setAgentInfo(null);
    setAgentInfoLoading(true);
    try {
      const res = await fetch(`${apiBase}/copilot/agents/${agentId}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.ok) {
        setAgentInfo(data.agent);
      } else {
        setAgentInfo({ error: data.error ?? "Unable to load agent" });
      }
    } catch (err) {
      setAgentInfo({ error: String(err) });
    } finally {
      setAgentInfoLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
        }/copilot/run`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            agentId: "product-qa",
            input: { question },
          }),
        }
      );

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ ok: false, error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Agents Registry</CardTitle>
        </CardHeader>
        <CardContent>
          {agentsLoading ? (
            <div className="text-sm text-muted-foreground">Loading agents…</div>
          ) : agentError ? (
            <div className="text-sm text-destructive">{agentError}</div>
          ) : (
            <div className="space-y-2">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => handleSelectAgent(agent.id)}
                  className={`w-full text-left rounded border px-3 py-2 text-sm transition hover:bg-muted ${
                    selectedAgent === agent.id
                      ? "border-primary bg-primary/10"
                      : "border-border"
                  }`}
                >
                  <div className="font-medium">{agent.name}</div>
                  <div className="text-xs text-muted-foreground">{agent.id}</div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Agent Info</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedAgent === null ? (
              <div className="text-sm text-muted-foreground">
                Select an agent to view details.
              </div>
            ) : agentInfoLoading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : agentInfo?.error ? (
              <div className="text-sm text-destructive">{agentInfo.error}</div>
            ) : (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Name:</span> {agentInfo?.name}
                </div>
                <div>
                  <span className="font-medium">ID:</span> {agentInfo?.id}
                </div>
                <div className="text-muted-foreground text-xs">
                  (More metadata can be added as agents evolve.)
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Try Product Q&A Agent</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  placeholder="Ask a question about a product..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button type="submit" disabled={loading || !question}>
                {loading ? "Processing..." : "Ask Agent"}
              </Button>
            </form>

            {result && (
              <div className="mt-4 p-4 bg-muted rounded space-y-2">
                <div className="text-sm font-medium">Response:</div>
                <pre className="text-xs overflow-x-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
