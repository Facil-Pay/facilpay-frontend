"use client";

import { createLocalStore } from "./local-store";
import type { AssetType } from "./types";

export type ScheduleFrequency = "daily" | "weekly" | "monthly";
export type ScheduleStatus = "active" | "paused";

export interface PayoutSchedule {
  id: string;
  destinationId: string;
  destinationLabel: string;
  asset: AssetType;
  frequency: ScheduleFrequency;
  /** 0 (Sunday) – 6 (Saturday); only used when frequency is "weekly". */
  dayOfWeek?: number;
  /** 1–28; only used when frequency is "monthly". */
  dayOfMonth?: number;
  /** The payout skips a run rather than drop the balance below this amount. */
  minBalanceToKeep: number;
  status: ScheduleStatus;
  nextRunAt: string;
  createdAt: string;
}

export const WEEKDAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const scheduleStore = createLocalStore<PayoutSchedule[]>("facilpay_payout_schedules", []);
export const usePayoutSchedules = scheduleStore.useStore;

/** Computes the next occurrence strictly after `from`. */
export function computeNextRun(
  frequency: ScheduleFrequency,
  dayOfWeek: number | undefined,
  dayOfMonth: number | undefined,
  from: Date = new Date(),
): string {
  const next = new Date(from);
  next.setHours(9, 0, 0, 0);

  if (frequency === "daily") {
    if (next <= from) next.setDate(next.getDate() + 1);
    return next.toISOString();
  }

  if (frequency === "weekly") {
    const target = dayOfWeek ?? 1;
    let diff = (target - next.getDay() + 7) % 7;
    if (diff === 0 && next <= from) diff = 7;
    next.setDate(next.getDate() + diff);
    return next.toISOString();
  }

  // monthly
  const target = Math.min(Math.max(dayOfMonth ?? 1, 1), 28);
  next.setDate(target);
  if (next <= from) {
    next.setMonth(next.getMonth() + 1);
    next.setDate(target);
  }
  return next.toISOString();
}

export function addSchedule(input: {
  destinationId: string;
  destinationLabel: string;
  asset: AssetType;
  frequency: ScheduleFrequency;
  dayOfWeek?: number;
  dayOfMonth?: number;
  minBalanceToKeep: number;
}): PayoutSchedule {
  const schedule: PayoutSchedule = {
    id: `sched_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    ...input,
    status: "active",
    nextRunAt: computeNextRun(input.frequency, input.dayOfWeek, input.dayOfMonth),
    createdAt: new Date().toISOString(),
  };
  scheduleStore.set((prev) => [schedule, ...prev]);
  return schedule;
}

export function pauseSchedule(id: string) {
  scheduleStore.set((prev) => prev.map((s) => (s.id === id ? { ...s, status: "paused" } : s)));
}

export function resumeSchedule(id: string) {
  scheduleStore.set((prev) =>
    prev.map((s) =>
      s.id === id
        ? { ...s, status: "active", nextRunAt: computeNextRun(s.frequency, s.dayOfWeek, s.dayOfMonth) }
        : s,
    ),
  );
}

export function deleteSchedule(id: string) {
  scheduleStore.set((prev) => prev.filter((s) => s.id !== id));
}
