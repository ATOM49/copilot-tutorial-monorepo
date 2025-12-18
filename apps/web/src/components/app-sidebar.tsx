"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarGroupAction,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@radix-ui/react-collapsible";
import { ChevronsUpDown } from "lucide-react";
import { STUDY_WEEKS } from "@/lib/study-plan";
import { loadProgress, calculateOverallProgress } from "@/lib/progress";

export function AppSidebar() {
  const [progressPct, setProgressPct] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const state = loadProgress();
      setProgressPct(calculateOverallProgress(state));
    };

    // Initial load
    updateProgress();

    // Listen for changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "copilot.study.progress.v1") {
        updateProgress();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <Sidebar>
      <SidebarHeader className="px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Copilot Study Plan</div>
          <Badge variant="secondary">{progressPct}%</Badge>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Progress</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/dashboard">Overview</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {STUDY_WEEKS.map((w) => (
          <Collapsible key={w.week} defaultOpen className="group/collapsible">
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex w-full items-start justify-between h-13">
                  <div className="flex flex-col items-start text-left">
                    <h2 className="text-sm font-semibold">Week {w.week}</h2>
                    <h3 className="text-xs text-muted-foreground">{w.title}</h3>
                  </div>
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <SidebarGroupAction asChild>
                <CollapsibleTrigger aria-label="Toggle week">
                  <ChevronsUpDown className="size-4" />
                </CollapsibleTrigger>
              </SidebarGroupAction>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {w.days.map((d) => (
                      <SidebarMenuItem key={d.day}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SidebarMenuButton
                              asChild
                              className="items-start h-12"
                            >
                              <Link href={`/dashboard/day/${d.day}`}>
                                <div className="flex flex-col items-start gap-0.5 text-left">
                                  <span className="font-medium">
                                    Day {d.day}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {d.title}
                                  </span>
                                </div>
                              </Link>
                            </SidebarMenuButton>
                          </TooltipTrigger>
                          <TooltipContent
                            side="right"
                            align="start"
                            className="max-w-80"
                          >
                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground">
                                {d.focus}
                              </div>
                              <div className="text-xs">{d.deliverable}</div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
