"use client";

import React, { useEffect, useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { fetchAgents } from "@/lib/api/agents";

type Agent = {
  id: string;
  name: string;
  description?: string;
};

export function AgentSelector({
  onSelect,
}: {
  onSelect?: (agentId: string) => void;
}) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    let mounted = true;
    fetchAgents()
      .then((data) => {
        if (!mounted) return;
        // API may return { ok, agents } or plain array
        const list: Agent[] = Array.isArray(data) ? data : data?.agents ?? [];
        setAgents(
          list.map((a) => ({
            id: a.id ?? a.name ?? String(a),
            name: a.name ?? a.id ?? String(a),
          }))
        );
        setError(null);
      })
      .catch((err) => {
        setAgents([]);
        setError("Failed to load agents");
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  const options = agents.map((a) => ({ value: a.id, label: a.name }));

  return (
    <div className="flex w-full items-center gap-3">
      <div className="flex-1">
        {error ? (
          <div className="text-sm text-destructive">{error}</div>
        ) : (
          <Select
            value={selected}
            onValueChange={(v: string) => {
              setSelected(v);
              onSelect?.(v);
            }}
            disabled={loading}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  loading
                    ? "Loading agents..."
                    : options.length
                    ? "Select an agent"
                    : "No agents available"
                }
              />
            </SelectTrigger>

            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}

export default AgentSelector;
