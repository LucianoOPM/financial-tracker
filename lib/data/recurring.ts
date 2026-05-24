import { and, desc, eq, lte } from "drizzle-orm";
import { db } from "@db/index";
import { recurringTransaction, recurringTransactionExecution } from "@db/schemas";
import type {
  RecurringTransactionSelect,
  RecurringTransactionExecutionSelect,
} from "@db/schemas";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RecurringWithRelations = RecurringTransactionSelect & {
  financialAccount: { id: string; name: string; type: string } | null;
  destinationAccount: { id: string; name: string; type: string } | null;
  transactionCategory: {
    id: string;
    name: string;
    color: string | null;
    icon: string | null;
  } | null;
};

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getActiveRecurring(
  userId: string,
): Promise<RecurringWithRelations[]> {
  return db.query.recurringTransaction.findMany({
    where: (t, { eq, and }) => and(eq(t.userId, userId), eq(t.isActive, true)),
    orderBy: (t, { asc }) => [asc(t.createdAt)],
    with: {
      financialAccount: { columns: { id: true, name: true, type: true } },
      destinationAccount: { columns: { id: true, name: true, type: true } },
      transactionCategory: {
        columns: { id: true, name: true, color: true, icon: true },
      },
    },
  }) as Promise<RecurringWithRelations[]>;
}

export async function getAllRecurring(
  userId: string,
): Promise<RecurringWithRelations[]> {
  return db.query.recurringTransaction.findMany({
    where: (t, { eq }) => eq(t.userId, userId),
    orderBy: (t, { asc }) => [asc(t.createdAt)],
    with: {
      financialAccount: { columns: { id: true, name: true, type: true } },
      destinationAccount: { columns: { id: true, name: true, type: true } },
      transactionCategory: {
        columns: { id: true, name: true, color: true, icon: true },
      },
    },
  }) as Promise<RecurringWithRelations[]>;
}

export async function getRecurringById(
  userId: string,
  id: string,
): Promise<RecurringWithRelations | undefined> {
  return db.query.recurringTransaction.findFirst({
    where: (t, { eq, and }) => and(eq(t.id, id), eq(t.userId, userId)),
    with: {
      financialAccount: { columns: { id: true, name: true, type: true } },
      destinationAccount: { columns: { id: true, name: true, type: true } },
      transactionCategory: {
        columns: { id: true, name: true, color: true, icon: true },
      },
    },
  }) as Promise<RecurringWithRelations | undefined>;
}

/**
 * Returns IDs of all recurring transactions due for execution.
 * Non-locking read — the lock happens inside the job's per-record transaction.
 * asOfDate must be in "YYYY-MM-DD" format.
 */
export async function getDueRecurring(asOfDate: string): Promise<string[]> {
  const rows = await db
    .select({ id: recurringTransaction.id })
    .from(recurringTransaction)
    .where(
      and(
        lte(recurringTransaction.nextExecutionDate, asOfDate),
        eq(recurringTransaction.isActive, true),
        eq(recurringTransaction.autoCreate, true),
      ),
    );

  return rows.map((r) => r.id);
}

export async function getRecurringExecutions(
  recurringId: string,
  limit = 20,
): Promise<RecurringTransactionExecutionSelect[]> {
  return db.query.recurringTransactionExecution.findMany({
    where: (t, { eq }) => eq(t.recurringTransactionId, recurringId),
    orderBy: (t, { desc }) => [desc(t.executedAt)],
    limit,
  });
}
