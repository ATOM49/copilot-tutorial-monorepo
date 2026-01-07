import { cn } from "@/lib/utils";

export interface TimelineEvent {
  id: string;
  event: string;
  time: string;
  detail?: string;
}

export const formatTimelineDetail = (data: unknown): string | undefined => {
  if (data == null || data === "") return undefined;
  if (typeof data === "string") return data;
  try {
    return JSON.stringify(data);
  } catch {
    return String(data);
  }
};

interface EventTimelineProps {
  events: TimelineEvent[];
  title?: string;
  emptyState?: string;
  className?: string;
  scrollAreaClassName?: string;
}

export function EventTimeline({
  events,
  title = "Event Timeline",
  emptyState = "No events yet.",
  className,
  scrollAreaClassName,
}: EventTimelineProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-slate-200/70 bg-slate-50 p-4 text-sm dark:border-slate-800/70 dark:bg-slate-900/30",
        className
      )}
    >
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </div>
      <div
        className={cn(
          "mt-3 space-y-2 overflow-auto",
          scrollAreaClassName ?? "max-h-64"
        )}
      >
        {events.length === 0 ? (
          <p className="text-xs text-muted-foreground">{emptyState}</p>
        ) : (
          events.map((item) => (
            <div
              key={item.id}
              className="rounded-md border border-slate-100 bg-white p-2 text-xs shadow-sm dark:border-slate-800/70 dark:bg-slate-950"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium capitalize">{item.event}</span>
                <span className="text-muted-foreground">{item.time}</span>
              </div>
              {item.detail && (
                <p className="mt-1 wrap-break-word text-[11px] text-muted-foreground">
                  {item.detail}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
