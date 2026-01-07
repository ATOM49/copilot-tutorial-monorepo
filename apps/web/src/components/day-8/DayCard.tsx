"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ToolAllowlist } from "@/components/agents/ToolAllowlist";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import AgentSelector from "@/components/agents/AgentSelector";
import { StreamingToolChat } from "../chat/StreamingToolChat";

interface ToolMetadata {
  id: string;
  name: string;
}

interface AgentInfo {
  id: string;
  name: string;
}

export function DayCard() {
  const [tools, setTools] = useState<ToolMetadata[]>([]);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [agentToolAllowlists, setAgentToolAllowlists] = useState<
    Record<string, string[]>
  >({});
  const [selectedChatAgent, setSelectedChatAgent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load available tools and agents
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch available tools
        const toolsRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/copilot/tools`
        );
        if (!toolsRes.ok) {
          throw new Error("Failed to fetch tools");
        }
        const toolsData = await toolsRes.json();
        setTools(toolsData.tools);

        // Fetch available agents
        const agentsRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/copilot/agents`
        );
        if (!agentsRes.ok) {
          throw new Error("Failed to fetch agents");
        }
        const agentsData = await agentsRes.json();
        setAgents(
          agentsData.agents.map((a: { id: string; name: string }) => ({
            id: a.id,
            name: a.name,
          }))
        );

        // Load allowlists for each agent
        const allowlists: Record<string, string[]> = {};
        for (const agent of agentsData.agents) {
          const allowlistRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/copilot/agents/${agent.id}/tools`
          );
          if (allowlistRes.ok) {
            const allowlistData = await allowlistRes.json();
            allowlists[agent.id] = allowlistData.allowedTools.map(
              (t: ToolMetadata) => t.id
            );
          }
        }
        setAgentToolAllowlists(allowlists);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An error occurred while loading data"
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleAllowlistChange = async (
    agentId: string,
    toolIds: string[]
  ) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/copilot/agents/${agentId}/tools`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toolIds }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update tool allowlist");
      }

      setAgentToolAllowlists((prev) => ({
        ...prev,
        [agentId]: toolIds,
      }));
    } catch (err) {
      console.error("Error updating allowlist:", err);
    }
  };

  return (
    <Card className="overflow-hidden border border-slate-200/70 dark:border-slate-800/70">
      <CardHeader className="px-6 pb-4 pt-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg">Day 8 · Tool Registry</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {tools.length} tools
          </Badge>
        </div>
        <CardDescription>
          Manage tool definitions and configure per-agent allowlists for safe,
          controlled tool access.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 px-6 pb-6 pt-0">
        {/* Available Tools Section */}
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-sm">Available Tools</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Tools that can be used by agents
            </p>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
              <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {tools.map((tool) => (
                <div
                  key={tool.id}
                  className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950"
                >
                  <p className="font-medium text-sm">{tool.name}</p>
                  <p className="text-xs text-muted-foreground">{tool.id}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Agent Tool Allowlists Section */}
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-sm">Agent Tool Allowlists</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Configure which tools each agent can invoke
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          ) : agents.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-900/30">
              <p className="text-sm text-muted-foreground">No agents registered</p>
            </div>
          ) : (
            <div className="space-y-6">
              {agents.map((agent) => (
                <ToolAllowlist
                  key={agent.id}
                  agentId={agent.id}
                  agentName={agent.name}
                  availableTools={tools}
                  allowedTools={
                    tools.filter((t) =>
                      (agentToolAllowlists[agent.id] || []).includes(t.id)
                    ) || []
                  }
                  onAllowlistChange={(toolIds) =>
                    handleAllowlistChange(agent.id, toolIds)
                  }
                  isLoading={isLoading}
                />
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/30">
          <p className="text-xs text-muted-foreground">
            <strong>Tool Safety:</strong> Each tool has an id, name, input schema,
            and run function. Agents can only invoke tools in their allowlist,
            enforced server-side.
          </p>
        </div>

        <Separator />

        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-sm">Streaming Agent Preview</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Pick an agent to test live tool execution.
            </p>
          </div>

          <AgentSelector onSelect={setSelectedChatAgent} />
        </div>

        <StreamingToolChat
          selectedAgent={selectedChatAgent || undefined}
        />
      </CardContent>
    </Card>
  );
}

