"use client";

import { useEffect, useMemo, useState } from "react";
import { STUDY_DAYS, STUDY_WEEKS } from "./study-plan";

export type ProgressState = Record<number, Record<string, boolean>>; // day -> taskId -> done
export const PROGRESS_STORAGE_KEY = "copilot.study.progress.v1";

export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProgressState) : {};
  } catch {
    return {};
  }
}

function save(state: ProgressState) {
  localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(state));
  // Dispatch storage event for cross-component sync asynchronously
  // to avoid setState during render
  queueMicrotask(() => {
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: PROGRESS_STORAGE_KEY,
        newValue: JSON.stringify(state),
      })
    );
  });
}

/**
 * Calculate overall progress percentage across all study weeks
 */
export function calculateOverallProgress(state: ProgressState): number {
  let done = 0;
  let total = 0;

  for (const week of STUDY_WEEKS) {
    for (const day of week.days) {
      total += day.tasks.length;
      done += day.tasks.filter((t) => state?.[day.day]?.[t.id]).length;
    }
  }

  return total ? Math.round((done / total) * 100) : 0;
}

export function useStudyProgress(day: number) {
  const [state, setState] = useState<ProgressState>(() => loadProgress());

  // Sync state when localStorage changes (from other components)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === PROGRESS_STORAGE_KEY) {
        setState(loadProgress());
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const dayTasks = useMemo(() => STUDY_DAYS.find((d) => d.day === day), [day]);
  const dayState = state[day] ?? {};

  const toggle = (taskId: string) => {
    setState((prev) => {
      const next: ProgressState = {
        ...prev,
        [day]: {
          ...(prev[day] ?? {}),
          [taskId]: !(prev[day]?.[taskId] ?? false),
        },
      };
      save(next);
      return next;
    });
  };

  const stats = useMemo(() => {
    const tasks = dayTasks?.tasks ?? [];
    const done = tasks.filter((t) => dayState[t.id]).length;
    return {
      total: tasks.length,
      done,
      pct: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
    };
  }, [dayTasks, dayState]);

  return { dayTasks, dayState, toggle, stats };
}
