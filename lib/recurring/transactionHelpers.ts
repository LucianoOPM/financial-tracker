import { and, eq, gte, lte, sum } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { db } from "@db/index";
import { financialAccount, monthlyAccountSnapshot, transaction } from "@db/schemas";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TransactionTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// ─── Balance helpers ──────────────────────────────────────────────────────────

/**
 * Returns the numeric delta to apply to an account's balance.
 * direction='apply'  → transaction is being created/activated.
 * direction='revert' → transaction is being cancelled/deleted.
 */
export function getBalanceDelta(
  type: "income" | "expense" | "transfer",
  transferSide: "in" | "out" | null | undefined,
  amount: number,
  direction: "apply" | "revert",
): number {
  let delta: number;

  if (type === "income") {
    delta = amount;
  } else if (type === "expense") {
    delta = -amount;
  } else {
    delta = transferSide === "out" ? -amount : amount;
  }

  return direction === "revert" ? -delta : delta;
}

/** Atomically shifts an account's `current_balance` using a SQL expression to avoid read/write races. */
export async function applyAccountBalanceDelta(
  tx: TransactionTx,
  accountId: string,
  delta: number,
): Promise<void> {
  await tx
    .update(financialAccount)
    .set({ currentBalance: sql`current_balance + ${delta}` })
    .where(eq(financialAccount.id, accountId));
}

/**
 * Recalculates and upserts the monthly snapshot for the given account/year/month.
 * Uses a full recalculation (not incremental) for correctness.
 * Must be called inside a db.transaction().
 */
export async function upsertMonthlySnapshot(
  tx: TransactionTx,
  userId: string,
  accountId: string,
  year: number,
  month: number,
): Promise<void> {
  const startOfMonth = new Date(year, month - 1, 1);
  const startOfNextMonth = new Date(year, month, 1);

  const baseWhere = and(
    eq(transaction.accountId, accountId),
    eq(transaction.userId, userId),
    eq(transaction.status, "completed"),
    gte(transaction.transactionDate, startOfMonth),
    lte(transaction.transactionDate, startOfNextMonth),
  );

  const incomeRow = await tx
    .select({ total: sum(transaction.amount) })
    .from(transaction)
    .where(and(baseWhere, eq(transaction.type, "income")));

  const expenseRow = await tx
    .select({ total: sum(transaction.amount) })
    .from(transaction)
    .where(and(baseWhere, eq(transaction.type, "expense")));

  const accountRow = await tx
    .select({ currentBalance: financialAccount.currentBalance })
    .from(financialAccount)
    .where(eq(financialAccount.id, accountId));

  const incomeTotal = incomeRow[0]?.total ?? "0";
  const expenseTotal = expenseRow[0]?.total ?? "0";
  const income = parseFloat(String(incomeTotal));
  const expense = parseFloat(String(expenseTotal));
  const savingsTotal = String(income - expense);
  const closingBalance = accountRow[0]?.currentBalance ?? "0";

  await tx
    .insert(monthlyAccountSnapshot)
    .values({
      userId,
      accountId,
      year,
      month,
      incomeTotal: String(income),
      expenseTotal: String(expense),
      savingsTotal,
      closingBalance,
    })
    .onConflictDoUpdate({
      target: [
        monthlyAccountSnapshot.userId,
        monthlyAccountSnapshot.year,
        monthlyAccountSnapshot.month,
        monthlyAccountSnapshot.accountId,
      ],
      set: {
        incomeTotal: String(income),
        expenseTotal: String(expense),
        savingsTotal,
        closingBalance,
      },
    });
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** Returns the { year, month } of a date for snapshot purposes. */
export function yearMonth(date: Date): { year: number; month: number } {
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

/** Deduplicates a list of {accountId, year, month} snapshot targets. */
export function uniqueSnapshots(
  entries: Array<{ accountId: string; year: number; month: number }>,
): Array<{ accountId: string; year: number; month: number }> {
  const seen = new Set<string>();
  return entries.filter(({ accountId, year, month }) => {
    const key = `${accountId}:${year}:${month}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
