"use client";

import type { ChatMessage } from "@/components/chat/ChatList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ActionHelperOutput, ProposedAction } from "@copilot/shared";

export type ActionPlanMessage = ChatMessage & {
  plan?: ActionHelperOutput;
};

interface ActionPlanBubbleProps {
  message: ActionPlanMessage;
  onConfirmAction?: (action: ProposedAction) => void;
  onDismissAction?: (actionId: string) => void;
}

function ActionArgs({ args }: { args: Record<string, unknown> }) {
  if (!args || Object.keys(args).length === 0) {
    return (
      <p className="text-xs text-muted-foreground">No structured arguments provided.</p>
    );
  }

  return (
    <pre className="max-h-40 overflow-auto rounded-md bg-slate-950/90 p-2 text-[11px] text-white dark:bg-slate-900">
      <code>{JSON.stringify(args, null, 2)}</code>
    </pre>
  );
}

export function ActionPlanBubble({
  message,
  onConfirmAction,
  onDismissAction,
}: ActionPlanBubbleProps) {
  const isUser = message.from === "user";
  const plan = message.plan;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border px-4 py-3 text-sm leading-relaxed shadow-sm transition",
        isUser
          ? "self-end border-transparent bg-primary text-primary-foreground"
          : "self-start border-slate-200 bg-card text-card-foreground",
        "dark:border-slate-800 dark:bg-slate-900"
      )}
    >
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        <span>{message.label}</span>
        <span className="text-[0.5rem] uppercase tracking-[0.7em] text-muted-foreground/70">
          {message.time}
        </span>
      </div>

      {(message.text || isUser) && (
        <p className={cn(isUser && "text-primary-foreground")}>{message.text}</p>
      )}

      {!isUser && plan && (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-900/50">
            <p className="text-sm font-semibold">Summary</p>
            <p className="text-sm text-muted-foreground">{plan.summary}</p>
          </div>

          {plan.nextSteps && plan.nextSteps.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Next Steps
              </p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {plan.nextSteps.map((step, index) => (
                  <li key={`${step}-${index}`} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Proposed Actions
              </p>
              <Badge variant="outline" className="h-5 text-[10px]">
                {plan.proposedActions?.length ?? 0}
              </Badge>
            </div>

            {plan.proposedActions && plan.proposedActions.length > 0 ? (
              <div className="space-y-3">
                {plan.proposedActions.map((action) => (
                  <div
                    key={action.actionId}
                    className="space-y-3 rounded-xl border border-slate-200 bg-background/70 p-3 dark:border-slate-800"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-base font-semibold">{action.title}</p>
                        <Badge
                          variant={
                            action.risk === "high"
                              ? "destructive"
                              : action.risk === "medium"
                                ? "secondary"
                                : "outline"
                          }
                          className="text-[10px] uppercase"
                        >
                          {action.risk} risk
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{action.preview}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <Badge variant="secondary" className="text-[10px]">
                          Tool: {action.toolId}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          Confirmation required
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Tool Arguments
                      </p>
                      <ActionArgs args={(action.args as Record<string, unknown>) ?? {}} />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => onConfirmAction?.(action)}
                        className="text-xs"
                      >
                        Confirm action
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDismissAction?.(action.actionId)}
                        className="text-xs"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No actions proposed yet. Provide more context so the agent can decide whether any tools are necessary.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
