"use client";

import { useCallback, useMemo, useState } from "react";
import type { ChatMessage } from "@/components/chat/ChatList";
import { StreamingToolChat } from "@/components/chat/StreamingToolChat";
import {
  ActionPlanBubble,
  type ActionPlanMessage,
} from "@/components/chat/ActionPlanBubble";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  ActionHelperOutputSchema,
  type ActionHelperOutput,
  type ProposedAction,
} from "@copilot/shared";
import { confirmPendingAction } from "@/lib/api/agents";

const AGENT_ID = "ticket-handler";
type UrgencyLevel = "low" | "medium" | "high" | "urgent";

const parsePlan = (data: unknown): ActionHelperOutput | undefined => {
  const parsed = ActionHelperOutputSchema.safeParse(data);
  return parsed.success ? parsed.data : undefined;
};

const toActionPlanMessage = (message: ChatMessage): ActionPlanMessage => ({
  ...message,
  plan: parsePlan(message.jsonData),
});

export function DayCard() {
  const [urgency, setUrgency] = useState<UrgencyLevel>("medium");
  const [contextNotes, setContextNotes] = useState("");
  const [queuedAction, setQueuedAction] = useState<ProposedAction | null>(null);
  const [executionStatus, setExecutionStatus] = useState<
    "idle" | "executing" | "executed" | "error"
  >("idle");
  const [executionNote, setExecutionNote] = useState<string | null>(null);

  const payloadBuilder = useCallback(
    (text: string) => ({
      request: text,
      context: contextNotes.trim() || undefined,
      urgency,
    }),
    [contextNotes, urgency]
  );

  const executeAction = useCallback(async (action: ProposedAction) => {
    setExecutionStatus("executing");
    setExecutionNote("Confirming action with the API...");

    try {
      const response = await confirmPendingAction(action.actionId);
      setExecutionStatus("executed");
      const result = response.result;
      if (result && typeof result === "object") {
        const preview = (result as Record<string, unknown>).preview;
        if (typeof preview === "string") {
          setExecutionNote(preview);
          return;
        }
        const ticketId = (result as Record<string, unknown>).ticketId;
        if (typeof ticketId === "string") {
          setExecutionNote(`Action succeeded. Ticket ${ticketId}`);
          return;
        }
      }
      if (typeof result === "string") {
        setExecutionNote(result);
        return;
      }
      setExecutionNote(`Action ${action.toolId} executed successfully.`);
    } catch (error) {
      setExecutionStatus("error");
      setExecutionNote(
        error instanceof Error ? error.message : "Failed to confirm action"
      );
    }
  }, []);

  const handleConfirmAction = useCallback(
    (action: ProposedAction) => {
      setQueuedAction(action);
      void executeAction(action);
    },
    [executeAction]
  );

  const handleDismissAction = useCallback(
    (actionId: string) => {
      if (queuedAction?.actionId === actionId) {
        setQueuedAction(null);
        setExecutionStatus("idle");
        setExecutionNote(null);
      }
    },
    [queuedAction]
  );

  const confirmationStatusLabel = useMemo(() => {
    switch (executionStatus) {
      case "executing":
        return "Confirming";
      case "executed":
        return "Executed";
      case "error":
        return "Execution failed";
      default:
        return "No pending action";
    }
  }, [executionStatus]);

  return (
    <Card className="overflow-hidden border border-slate-200/70 dark:border-slate-800/70">
      <CardHeader className="px-6 pb-4 pt-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg">Day 13 · Ticket Handler</CardTitle>
          <Badge variant="secondary" className="text-xs">
            Action Helper
          </Badge>
        </div>
        <CardDescription>
          The Ticket Handler proposes write actions like “create a ticket” but
          blocks actual execution behind an explicit confirmation step.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 px-6 pb-6 pt-0">
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm dark:border-slate-800 dark:bg-slate-900/40">
          <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Urgency
              </label>
              <Select
                value={urgency}
                onValueChange={(value) => setUrgency(value as UrgencyLevel)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue aria-label="Urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Additional context
              </label>
              <textarea
                value={contextNotes}
                onChange={(event) => setContextNotes(event.target.value)}
                placeholder="Systems impacted, customer, environment, etc."
                className="min-h-[72px] w-full rounded-lg border border-slate-200 bg-white/80 p-3 text-sm shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-950"
              />
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Metadata here never triggers tools automatically—it only informs the
            agent when drafting action proposals.
          </p>
        </div>

        <StreamingToolChat
          title="Action Helper Agent"
          selectedAgent={AGENT_ID}
          placeholder="Describe the work that might need a ticket..."
          inputBuilder={payloadBuilder}
          renderMessage={(message) => (
            <ActionPlanBubble
              message={toActionPlanMessage(message)}
              onConfirmAction={handleConfirmAction}
              onDismissAction={handleDismissAction}
            />
          )}
        />

        <Separator />

        <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Confirmation Queue</p>
              <p className="text-xs text-muted-foreground">
                Confirmed actions execute on the server immediately; this panel
                shows the latest result.
              </p>
            </div>
            <Badge variant="outline" className="text-[10px] uppercase">
              {confirmationStatusLabel}
            </Badge>
          </div>

          {queuedAction ? (
            <div className="space-y-3 rounded-lg border border-slate-200 bg-white/80 p-3 dark:border-slate-800 dark:bg-slate-950/50">
              <div>
                <p className="text-base font-semibold">{queuedAction.title}</p>
                <p className="text-xs text-muted-foreground">
                  {queuedAction.preview}
                </p>
              </div>
              <div className="rounded-md bg-slate-950/90 p-3 text-[11px] text-white dark:bg-slate-900">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-300">
                  Payload for {queuedAction.toolId}
                </p>
                <pre className="mt-1 overflow-auto">
                  <code>
                    {JSON.stringify(queuedAction.args ?? {}, null, 2)}
                  </code>
                </pre>
              </div>
              <div className="flex flex-wrap gap-2">
                {executionStatus === "error" && (
                  <Button
                    size="sm"
                    onClick={() => void executeAction(queuedAction)}
                    // disabled={executionStatus === "executing"}
                  >
                    Retry confirmation
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setQueuedAction(null);
                    setExecutionStatus("idle");
                    setExecutionNote(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
              {executionNote && (
                <p
                  className={cn(
                    "text-xs",
                    executionStatus === "error"
                      ? "text-red-600 dark:text-red-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  {executionNote}
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Confirm an action from the chat above to run it with the
              server-side tools.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
