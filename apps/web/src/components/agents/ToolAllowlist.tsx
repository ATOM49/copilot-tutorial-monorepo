"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface ToolAllowlistProps {
  agentId: string;
  agentName: string;
  availableTools: Array<{ id: string; name: string }>;
  allowedTools?: Array<{ id: string; name: string }>;
  onAllowlistChange?: (toolIds: string[]) => void;
  isLoading?: boolean;
}

export function ToolAllowlist({
  agentId,
  agentName,
  availableTools,
  allowedTools = [],
  onAllowlistChange,
  isLoading = false,
}: ToolAllowlistProps) {
  const [selectedToolIds, setSelectedToolIds] = useState<Set<string>>(
    new Set(allowedTools.map((t) => t.id))
  );

  const handleToggleTool = useCallback(
    (toolId: string) => {
      const newSelected = new Set(selectedToolIds);
      if (newSelected.has(toolId)) {
        newSelected.delete(toolId);
      } else {
        newSelected.add(toolId);
      }
      setSelectedToolIds(newSelected);
      onAllowlistChange?.(Array.from(newSelected));
    },
    [selectedToolIds, onAllowlistChange]
  );

  const allowedCount = selectedToolIds.size;
  const totalCount = availableTools.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm">{agentName}</h4>
            <Badge variant="secondary" className="text-xs">
              {allowedCount}/{totalCount}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Select which tools this agent can use
          </p>
        </div>
      </div>

      <div
        className={cn(
          "space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/30",
          isLoading && "opacity-50 pointer-events-none"
        )}
      >
        {availableTools.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">
            No tools available
          </p>
        ) : (
          availableTools.map((tool) => (
            <div key={tool.id} className="flex items-center gap-3 py-1">
              <Checkbox
                id={`${agentId}-${tool.id}`}
                checked={selectedToolIds.has(tool.id)}
                onCheckedChange={() => handleToggleTool(tool.id)}
                disabled={isLoading}
              />
              <label
                htmlFor={`${agentId}-${tool.id}`}
                className="text-sm cursor-pointer flex-1 font-medium"
              >
                {tool.name}
              </label>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
