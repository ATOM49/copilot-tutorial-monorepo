"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useStudyProgress } from "@/lib/progress";
import { getStudyDay } from "@/lib/study-plan";
import { ChevronDown, Info } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@radix-ui/react-collapsible";

export function DayProgress({ day }: { day: number }) {
  const { dayTasks, dayState, toggle, stats } = useStudyProgress(day);
  const studyDay = getStudyDay(day);

  return (
    <Collapsible defaultOpen>
      <Card>
        <CardHeader>
          <CollapsibleTrigger className="flex w-full cursor-pointer select-none items-start justify-between group">
            <CardTitle>
              Day {day}: {dayTasks?.title ?? "Unknown day"}
            </CardTitle>
            <ChevronDown className="h-5 w-5 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-3 pt-2">
              {studyDay?.focus && (
                <p className="text-sm text-muted-foreground">
                  {studyDay.focus}
                </p>
              )}
              {studyDay?.deliverable && (
                <p className="text-sm">{studyDay.deliverable}</p>
              )}
              {studyDay?.callout && (
                <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
                  <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{studyDay.callout}</span>
                </div>
              )}
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  {stats.done}/{stats.total} completed
                </div>
                <Progress value={stats.pct} />
              </div>
            </div>
          </CollapsibleContent>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-3">
            {(dayTasks?.tasks ?? []).map((t) => (
              <label key={t.id} className="flex items-center gap-3">
                <Checkbox
                  checked={!!dayState[t.id]}
                  onCheckedChange={() => toggle(t.id)}
                />
                <span className="text-sm">{t.label}</span>
              </label>
            ))}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
