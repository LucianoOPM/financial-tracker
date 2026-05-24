import { sql } from "drizzle-orm";
import { db } from "@db/index";
import { recurringTransactionExecution } from "@db/schemas";
import { executeRecurringTransaction } from "@lib/recurring/executor";
import { formatDateForDB } from "@lib/recurring/scheduler";
import { getDueRecurring } from "@lib/data/recurring";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BatchResult = {
  processed: number;
  skipped: number;
  failed: number;
  errors: string[];
};

// ─── Batch processor ──────────────────────────────────────────────────────────

/**
 * Processes all recurring transactions that are due as of now.
 * Safe to run concurrently — uses FOR UPDATE SKIP LOCKED to prevent
 * duplicate processing across multiple workers or cron invocations.
 */
export async function processAllDueRecurring(): Promise<BatchResult> {
  const todayStr = formatDateForDB(new Date());
  const dueIds = await getDueRecurring(todayStr);

  const result: BatchResult = { processed: 0, skipped: 0, failed: 0, errors: [] };

  for (const id of dueIds) {
    const outcome = await processSingleRecurring(id, todayStr);

    if (outcome.outcome === "processed") {
      result.processed++;
    } else if (outcome.outcome === "skipped") {
      result.skipped++;
    } else {
      result.failed++;
      if (outcome.error) result.errors.push(`[${id}] ${outcome.error}`);
    }
  }

  return result;
}

// ─── Single record processor ──────────────────────────────────────────────────

type SingleOutcome =
  | { outcome: "processed" }
  | { outcome: "skipped" }
  | { outcome: "failed"; error?: string };

async function processSingleRecurring(
  id: string,
  todayStr: string,
): Promise<SingleOutcome> {
  try {
    let outcome: "processed" | "skipped" = "skipped";

    await db.transaction(async (tx) => {
      // Acquire a row-level lock; SKIP LOCKED means: if another worker already
      // holds this row, skip it entirely instead of waiting.
      const locked = await tx.execute(
        sql`SELECT id, next_execution_date, is_active, auto_create
            FROM recurring_transactions
            WHERE id = ${id}
            FOR UPDATE SKIP LOCKED`,
      );

      if (locked.rows.length === 0) {
        // Another worker is processing this record right now — skip
        return;
      }

      // Re-validate conditions inside the lock to guard against races between
      // the initial getDueRecurring read and now
      const row = locked.rows[0] as {
        id: string;
        next_execution_date: string;
        is_active: boolean;
        auto_create: boolean;
      };

      if (!row.is_active || !row.auto_create || row.next_execution_date > todayStr) {
        return;
      }

      const execResult = await executeRecurringTransaction(id, tx, new Date());

      if (!execResult.success) {
        // Insert failure record inside this tx so it commits regardless of
        // whether the executor made any writes (executor validates before writes)
        await tx.insert(recurringTransactionExecution).values({
          recurringTransactionId: id,
          status: "failed",
          errorMessage: execResult.error,
        });
        return;
      }

      outcome = "processed";
    });

    return { outcome };
  } catch (error) {
    // The transaction was rolled back due to a DB or application error.
    // Insert a failure record in a separate transaction so it commits.
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    try {
      await db.insert(recurringTransactionExecution).values({
        recurringTransactionId: id,
        status: "failed",
        errorMessage,
      });
    } catch {
      // If even the failure insert fails (e.g., DB is down), continue the batch
    }

    return { outcome: "failed", error: errorMessage };
  }
}
