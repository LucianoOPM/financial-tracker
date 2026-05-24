import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { recurringTransaction, recurringTransactionExecution, transaction } from "@db/schemas";
import {
  type TransactionTx,
  getBalanceDelta,
  applyAccountBalanceDelta,
  upsertMonthlySnapshot,
  yearMonth,
  uniqueSnapshots,
} from "@lib/recurring/transactionHelpers";
import {
  calculateNextExecutionDate,
  formatDateForDB,
  isPastEndDate,
  parseDateFromDB,
} from "@lib/recurring/scheduler";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ExecutionResult =
  | { success: true; transactionId: string; pairTransactionId?: string }
  | { success: false; error: string };

// ─── Executor ─────────────────────────────────────────────────────────────────

/**
 * Executes a single recurring transaction within a caller-provided DB transaction.
 * Does NOT start its own transaction — composable by both the batch job and manualExecuteRecurring.
 *
 * Caller is responsible for:
 *   1. Acquiring a FOR UPDATE SKIP LOCKED lock on the row before calling.
 *   2. Inserting a failed execution record when this function returns { success: false }
 *      or throws, since any balance changes are rolled back with the caller's transaction.
 */
export async function executeRecurringTransaction(
  recurringId: string,
  tx: TransactionTx,
  executionDate: Date,
): Promise<ExecutionResult> {
  // ── 1. Fetch recurring record with accounts ──────────────────────────────
  const rec = await tx.query.recurringTransaction.findFirst({
    where: eq(recurringTransaction.id, recurringId),
    with: {
      financialAccount: true,
      destinationAccount: true,
    },
  });

  if (!rec) {
    return { success: false, error: "Transacción recurrente no encontrada" };
  }

  // ── 2. Validate source account ───────────────────────────────────────────
  if (!rec.financialAccount || !rec.financialAccount.isActive) {
    return {
      success: false,
      error: "La cuenta financiera origen está inactiva o no existe",
    };
  }

  // ── 3. Validate destination account (transfers only) ─────────────────────
  if (rec.type === "transfer") {
    if (!rec.destinationAccountId || !rec.destinationAccount) {
      return {
        success: false,
        error: "La transacción recurrente de tipo transferencia no tiene cuenta destino",
      };
    }
    if (!rec.destinationAccount.isActive) {
      return {
        success: false,
        error: "La cuenta financiera destino está inactiva",
      };
    }
  }

  // ── 4. Validate end date ─────────────────────────────────────────────────
  if (isPastEndDate(rec.endDate, executionDate)) {
    await tx
      .update(recurringTransaction)
      .set({ isActive: false })
      .where(eq(recurringTransaction.id, recurringId));
    return {
      success: false,
      error: "La transacción recurrente ha superado su fecha de fin y fue desactivada",
    };
  }

  const amount = parseFloat(String(rec.amount));
  const amountStr = String(rec.amount);
  const { year, month } = yearMonth(executionDate);

  // ── 5. Insert transaction(s) ─────────────────────────────────────────────
  let mainTransactionId: string;
  let pairTransactionId: string | undefined;

  if (rec.type !== "transfer") {
    mainTransactionId = createId();

    await tx.insert(transaction).values({
      id: mainTransactionId,
      userId: rec.userId,
      accountId: rec.accountId,
      categoryId: rec.categoryId ?? null,
      type: rec.type,
      amount: amountStr,
      description: rec.description ?? null,
      transactionDate: executionDate,
      status: "completed",
      recurringTransactionId: rec.id,
    });

    // ── 6. Apply balance delta ───────────────────────────────────────────
    const delta = getBalanceDelta(rec.type, null, amount, "apply");
    await applyAccountBalanceDelta(tx, rec.accountId, delta);

    // ── 7. Upsert monthly snapshot ───────────────────────────────────────
    await upsertMonthlySnapshot(tx, rec.userId, rec.accountId, year, month);
  } else {
    // Transfer: two linked transactions
    mainTransactionId = createId();
    pairTransactionId = createId();
    const transferGroupId = createId();

    await tx.insert(transaction).values([
      {
        id: mainTransactionId,
        userId: rec.userId,
        accountId: rec.accountId,
        categoryId: rec.categoryId ?? null,
        type: "transfer",
        amount: amountStr,
        description: rec.description ?? null,
        transactionDate: executionDate,
        status: "completed",
        recurringTransactionId: rec.id,
        transferGroupId,
        transferSide: "out",
      },
      {
        id: pairTransactionId,
        userId: rec.userId,
        accountId: rec.destinationAccountId!,
        categoryId: rec.categoryId ?? null,
        type: "transfer",
        amount: amountStr,
        description: rec.description ?? null,
        transactionDate: executionDate,
        status: "completed",
        recurringTransactionId: rec.id,
        transferGroupId,
        transferSide: "in",
      },
    ]);

    // ── 6. Apply balance deltas ──────────────────────────────────────────
    await applyAccountBalanceDelta(
      tx,
      rec.accountId,
      getBalanceDelta("transfer", "out", amount, "apply"),
    );
    await applyAccountBalanceDelta(
      tx,
      rec.destinationAccountId!,
      getBalanceDelta("transfer", "in", amount, "apply"),
    );

    // ── 7. Upsert monthly snapshots ──────────────────────────────────────
    const snapshotTargets = uniqueSnapshots([
      { accountId: rec.accountId, year, month },
      { accountId: rec.destinationAccountId!, year, month },
    ]);
    for (const target of snapshotTargets) {
      await upsertMonthlySnapshot(tx, rec.userId, target.accountId, target.year, target.month);
    }
  }

  // ── 8. Advance nextExecutionDate and set lastExecutedAt ──────────────────
  const currentDateForCalc = parseDateFromDB(rec.nextExecutionDate);
  const nextDate = calculateNextExecutionDate(
    currentDateForCalc,
    rec.frequency,
    rec.intervalValue,
  );
  const shouldDeactivate = isPastEndDate(rec.endDate, nextDate);

  await tx
    .update(recurringTransaction)
    .set({
      nextExecutionDate: formatDateForDB(nextDate),
      lastExecutedAt: new Date(),
      ...(shouldDeactivate ? { isActive: false } : {}),
    })
    .where(eq(recurringTransaction.id, recurringId));

  // ── 9. Record successful execution ───────────────────────────────────────
  await tx.insert(recurringTransactionExecution).values({
    recurringTransactionId: rec.id,
    transactionId: mainTransactionId,
    status: "success",
  });

  return {
    success: true,
    transactionId: mainTransactionId,
    pairTransactionId,
  };
}
