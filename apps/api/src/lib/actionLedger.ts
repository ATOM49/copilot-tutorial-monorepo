import { randomUUID } from "node:crypto";
import type { ProposedAction } from "@copilot/shared";
import {
  PendingActionExpiredError,
  PendingActionMismatchError,
  PendingActionNotFoundError,
  PendingActionStateError,
} from "./errors.js";

export type PendingActionStatus =
  | "proposed"
  | "executed"
  | "cancelled"
  | "expired";

export interface PendingActionRecord {
  actionId: string;
  agentId: string;
  toolId: string;
  args: Record<string, unknown>;
  userId: string;
  tenantId: string;
  traceId?: string;
  status: PendingActionStatus;
  createdAt: string;
  expiresAt: string;
  executedAt?: string;
  resultSummary?: string;
}

const ACTION_TTL_MS = 10 * 60 * 1000; // 10 minutes

const SENSITIVE_FIELD_PATTERN = /(token|secret|password|api[_-]?key)/i;

function summarizePayload(
  payload: Record<string, unknown>
): string | undefined {
  try {
    const clone = Object.entries(payload)
      .slice(0, 6)
      .reduce<Record<string, unknown>>((acc, [key, value]) => {
        if (SENSITIVE_FIELD_PATTERN.test(key)) {
          acc[key] = "[redacted]";
          return acc;
        }
        acc[key] = value;
        return acc;
      }, {});

    const serialized = JSON.stringify(clone);
    return serialized.length > 200
      ? `${serialized.slice(0, 200)}…`
      : serialized;
  } catch {
    return undefined;
  }
}

function computeExpiry(createdAt: number): string {
  return new Date(createdAt + ACTION_TTL_MS).toISOString();
}

function isExpired(record: PendingActionRecord): boolean {
  return Date.now() > Date.parse(record.expiresAt);
}

export class PendingActionLedger {
  private readonly ledger = new Map<string, PendingActionRecord>();

  registerMany(
    proposals: ProposedAction[] | undefined,
    meta: {
      agentId: string;
      userId: string;
      tenantId: string;
      traceId?: string;
    }
  ): ProposedAction[] {
    if (!proposals?.length) {
      return [];
    }

    return proposals.map((proposal) => this.registerOne(proposal, meta));
  }

  private registerOne(
    proposal: ProposedAction,
    meta: {
      agentId: string;
      userId: string;
      tenantId: string;
      traceId?: string;
    }
  ): ProposedAction {
    const createdAt = Date.now();
    const actionId = randomUUID();
    const record: PendingActionRecord = {
      actionId,
      agentId: meta.agentId,
      toolId: proposal.toolId,
      args: proposal.args ?? {},
      userId: meta.userId,
      tenantId: meta.tenantId,
      traceId: meta.traceId,
      status: "proposed",
      createdAt: new Date(createdAt).toISOString(),
      expiresAt: computeExpiry(createdAt),
    };

    this.ledger.set(actionId, record);

    return {
      ...proposal,
      actionId,
    };
  }

  claim(
    actionId: string,
    userId: string,
    tenantId: string
  ): PendingActionRecord {
    console.log({ ledger: this.ledger });
    const record = this.ledger.get(actionId);

    if (!record) {
      throw new PendingActionNotFoundError(actionId);
    }

    if (isExpired(record)) {
      record.status = "expired";
      this.ledger.set(actionId, record);
      throw new PendingActionExpiredError(actionId);
    }

    if (record.status !== "proposed") {
      throw new PendingActionStateError(record.status);
    }

    if (record.userId !== userId || record.tenantId !== tenantId) {
      throw new PendingActionMismatchError();
    }

    return record;
  }

  markExecuted(actionId: string, result?: unknown): PendingActionRecord {
    const record = this.ledger.get(actionId);
    if (!record) {
      throw new PendingActionNotFoundError(actionId);
    }

    record.status = "executed";
    record.executedAt = new Date().toISOString();

    if (result && typeof result === "object") {
      record.resultSummary = summarizePayload(
        result as Record<string, unknown>
      );
    } else if (typeof result === "string") {
      record.resultSummary =
        result.length > 200 ? `${result.slice(0, 200)}…` : result;
    }

    this.ledger.set(actionId, record);
    return record;
  }

  cancel(actionId: string): void {
    const record = this.ledger.get(actionId);
    if (!record) {
      throw new PendingActionNotFoundError(actionId);
    }
    record.status = "cancelled";
    this.ledger.set(actionId, record);
  }

  get(actionId: string): PendingActionRecord | undefined {
    const record = this.ledger.get(actionId);
    if (!record) return undefined;
    if (isExpired(record)) {
      record.status = "expired";
      this.ledger.set(actionId, record);
      return undefined;
    }
    return record;
  }

  /** Convenience for tests */
  clear(): void {
    this.ledger.clear();
  }
}

export const actionLedger = new PendingActionLedger();
