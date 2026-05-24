"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { auth } from "@lib/auth";
import { db } from "@db/index";
import { transaction } from "@db/schemas";
import { createId } from "@paralleldrive/cuid2";
import { transactionSchema, type TransactionSchema } from "@lib/schemas/transaction";
import { getAccountById } from "@lib/data/accounts";
import { getTransactionByIdForEdit } from "@lib/data/transactions";
import {
  getBalanceDelta,
  applyAccountBalanceDelta,
  upsertMonthlySnapshot,
  yearMonth,
  uniqueSnapshots,
} from "@lib/recurring/transactionHelpers";

// ─── Error types ─────────────────────────────────────────────────────────────

type CreateTransactionResult =
  | { error: "INVALID_DATA"; message: string }
  | { error: "FINANCIAL_ACCOUNT_NOT_FOUND"; message: string }
  | { error: "DEST_FINANCIAL_ACCOUNT_NOT_FOUND"; message: string };

type UpdateTransactionResult =
  | { error: "NOT_FOUND"; message: string }
  | { error: "INVALID_DATA"; message: string }
  | { error: "FINANCIAL_ACCOUNT_NOT_FOUND"; message: string }
  | { error: "DEST_FINANCIAL_ACCOUNT_NOT_FOUND"; message: string };

type CancelTransactionResult =
  | { error: "NOT_FOUND"; message: string }
  | { error: "ALREADY_CANCELLED"; message: string };

type DeleteTransactionResult = { error: "NOT_FOUND"; message: string };

// ─── Server Actions ───────────────────────────────────────────────────────────

export async function createTransaction(
  data: TransactionSchema,
): Promise<CreateTransactionResult | undefined> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "FINANCIAL_ACCOUNT_NOT_FOUND", message: "No autenticado" };

  const parsed = transactionSchema.safeParse(data);
  if (!parsed.success) return { error: "INVALID_DATA", message: "Datos inválidos" };

  const { type, amount, description, transactionDate, status, accountId, categoryId, destinationAccountId } = parsed.data;
  const userId = session.user.id;

  const sourceAccount = await getAccountById(userId, accountId);
  if (!sourceAccount) {
    return { error: "FINANCIAL_ACCOUNT_NOT_FOUND", message: "Cuenta financiera no encontrada o inactiva" };
  }

  if (type === "transfer") {
    const destAccount = await getAccountById(userId, destinationAccountId!);
    if (!destAccount) {
      return { error: "DEST_FINANCIAL_ACCOUNT_NOT_FOUND", message: "Cuenta financiera destino no encontrada o inactiva" };
    }
  }

  const amountStr = String(amount);
  const isCompleted = status === "completed";
  const { year, month } = yearMonth(transactionDate);

  await db.transaction(async (tx) => {
    if (type !== "transfer") {
      await tx.insert(transaction).values({
        userId,
        accountId,
        categoryId: categoryId ?? null,
        type,
        amount: amountStr,
        description: description ?? null,
        transactionDate,
        status,
      });

      if (isCompleted) {
        const delta = getBalanceDelta(type, null, amount, "apply");
        await applyAccountBalanceDelta(tx, accountId, delta);
        await upsertMonthlySnapshot(tx, userId, accountId, year, month);
      }
    } else {
      const transferGroupId = createId();

      await tx.insert(transaction).values([
        {
          userId,
          accountId,
          categoryId: categoryId ?? null,
          type: "transfer",
          amount: amountStr,
          description: description ?? null,
          transactionDate,
          status,
          transferGroupId,
          transferSide: "out",
        },
        {
          userId,
          accountId: destinationAccountId!,
          categoryId: categoryId ?? null,
          type: "transfer",
          amount: amountStr,
          description: description ?? null,
          transactionDate,
          status,
          transferGroupId,
          transferSide: "in",
        },
      ]);

      if (isCompleted) {
        await applyAccountBalanceDelta(tx, accountId, getBalanceDelta("transfer", "out", amount, "apply"));
        await applyAccountBalanceDelta(tx, destinationAccountId!, getBalanceDelta("transfer", "in", amount, "apply"));
        await upsertMonthlySnapshot(tx, userId, accountId, year, month);
        await upsertMonthlySnapshot(tx, userId, destinationAccountId!, year, month);
      }
    }
  });

  revalidatePath("/transactions");
  revalidatePath("/accounts");
  redirect("/transactions");
}

export async function updateTransaction(
  transactionId: string,
  data: TransactionSchema,
): Promise<UpdateTransactionResult | undefined> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "NOT_FOUND", message: "No autenticado" };

  const parsed = transactionSchema.safeParse(data);
  if (!parsed.success) return { error: "INVALID_DATA", message: "Datos inválidos" };

  const { type, amount, description, transactionDate, status, accountId, categoryId, destinationAccountId } = parsed.data;
  const userId = session.user.id;

  const existing = await getTransactionByIdForEdit(userId, transactionId);
  if (!existing) return { error: "NOT_FOUND", message: "Transacción no encontrada" };

  const sourceAccount = await getAccountById(userId, accountId);
  if (!sourceAccount) {
    return { error: "FINANCIAL_ACCOUNT_NOT_FOUND", message: "Cuenta financiera no encontrada o inactiva" };
  }

  if (type === "transfer") {
    const destAccount = await getAccountById(userId, destinationAccountId!);
    if (!destAccount) {
      return { error: "DEST_FINANCIAL_ACCOUNT_NOT_FOUND", message: "Cuenta financiera destino no encontrada o inactiva" };
    }
  }

  const amountStr = String(amount);
  const oldWasCompleted = existing.status === "completed";
  const newIsCompleted = status === "completed";
  const oldDate = new Date(existing.transactionDate);
  const oldYM = yearMonth(oldDate);
  const newYM = yearMonth(transactionDate);
  const pair = "pair" in existing ? existing.pair : undefined;

  await db.transaction(async (tx) => {
    // 1. Revert old balance effect
    if (oldWasCompleted) {
      const oldDelta = getBalanceDelta(existing.type, existing.transferSide, parseFloat(String(existing.amount)), "revert");
      await applyAccountBalanceDelta(tx, existing.accountId, oldDelta);

      if (existing.type === "transfer" && pair) {
        const pairDelta = getBalanceDelta("transfer", pair.transferSide, parseFloat(String(pair.amount)), "revert");
        await applyAccountBalanceDelta(tx, pair.accountId, pairDelta);
      }
    }

    // 2. Handle type transition: transfer → non-transfer (delete the pair leg)
    if (existing.type === "transfer" && type !== "transfer" && pair) {
      await tx.delete(transaction).where(eq(transaction.id, pair.id));
    }

    // 3. Update main transaction
    await tx
      .update(transaction)
      .set({
        type,
        amount: amountStr,
        description: description ?? null,
        transactionDate,
        status,
        accountId,
        categoryId: categoryId ?? null,
        transferGroupId: type === "transfer" ? (existing.transferGroupId ?? createId()) : null,
        transferSide: type === "transfer" ? "out" : null,
      })
      .where(and(eq(transaction.id, transactionId), eq(transaction.userId, userId)));

    // 4. Handle transfer pair
    if (type === "transfer") {
      const groupId = existing.transferGroupId ?? createId();

      if (pair) {
        // Update existing pair leg
        await tx
          .update(transaction)
          .set({
            amount: amountStr,
            description: description ?? null,
            transactionDate,
            status,
            accountId: destinationAccountId!,
            categoryId: categoryId ?? null,
            transferGroupId: groupId,
            transferSide: "in",
          })
          .where(eq(transaction.id, pair.id));
      } else {
        // Create new pair leg (transition from non-transfer to transfer)
        await tx.insert(transaction).values({
          userId,
          accountId: destinationAccountId!,
          categoryId: categoryId ?? null,
          type: "transfer",
          amount: amountStr,
          description: description ?? null,
          transactionDate,
          status,
          transferGroupId: groupId,
          transferSide: "in",
        });

        // Also ensure main transaction has consistent groupId
        await tx
          .update(transaction)
          .set({ transferGroupId: groupId })
          .where(eq(transaction.id, transactionId));
      }
    }

    // 5. Apply new balance effect
    if (newIsCompleted) {
      const newDelta = getBalanceDelta(type, "out", amount, "apply");
      await applyAccountBalanceDelta(tx, accountId, newDelta);

      if (type === "transfer") {
        await applyAccountBalanceDelta(tx, destinationAccountId!, getBalanceDelta("transfer", "in", amount, "apply"));
      }
    }

    // 6. Upsert snapshots for all affected account/month combinations
    const snapshotTargets = uniqueSnapshots([
      { accountId: existing.accountId, ...oldYM },
      { accountId, ...newYM },
      ...(existing.type === "transfer" && pair ? [{ accountId: pair.accountId, ...oldYM }] : []),
      ...(type === "transfer" ? [{ accountId: destinationAccountId!, ...newYM }] : []),
    ]);

    for (const target of snapshotTargets) {
      await upsertMonthlySnapshot(tx, userId, target.accountId, target.year, target.month);
    }
  });

  revalidatePath("/transactions");
  revalidatePath(`/transactions/${transactionId}`);
  revalidatePath("/accounts");
  redirect(`/transactions/${transactionId}`);
}

export async function cancelTransaction(
  transactionId: string,
): Promise<CancelTransactionResult | undefined> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "NOT_FOUND", message: "No autenticado" };

  const userId = session.user.id;
  const existing = await getTransactionByIdForEdit(userId, transactionId);
  if (!existing) return { error: "NOT_FOUND", message: "Transacción no encontrada" };
  if (existing.status === "cancelled") return { error: "ALREADY_CANCELLED", message: "La transacción ya está cancelada" };

  const wasCompleted = existing.status === "completed";
  const pair = "pair" in existing ? existing.pair : undefined;
  const { year, month } = yearMonth(new Date(existing.transactionDate));

  await db.transaction(async (tx) => {
    // Revert balance if it was completed
    if (wasCompleted) {
      const delta = getBalanceDelta(existing.type, existing.transferSide, parseFloat(String(existing.amount)), "revert");
      await applyAccountBalanceDelta(tx, existing.accountId, delta);

      if (existing.type === "transfer" && pair) {
        const pairDelta = getBalanceDelta("transfer", pair.transferSide, parseFloat(String(pair.amount)), "revert");
        await applyAccountBalanceDelta(tx, pair.accountId, pairDelta);
      }
    }

    await tx
      .update(transaction)
      .set({ status: "cancelled" })
      .where(and(eq(transaction.id, transactionId), eq(transaction.userId, userId)));

    if (existing.type === "transfer" && pair) {
      await tx
        .update(transaction)
        .set({ status: "cancelled" })
        .where(eq(transaction.id, pair.id));
    }

    if (wasCompleted) {
      const snapshotTargets = uniqueSnapshots([
        { accountId: existing.accountId, year, month },
        ...(existing.type === "transfer" && pair ? [{ accountId: pair.accountId, year, month }] : []),
      ]);

      for (const target of snapshotTargets) {
        await upsertMonthlySnapshot(tx, userId, target.accountId, target.year, target.month);
      }
    }
  });

  revalidatePath("/transactions");
  revalidatePath(`/transactions/${transactionId}`);
  revalidatePath("/accounts");
}

export async function deleteTransaction(
  transactionId: string,
): Promise<DeleteTransactionResult | undefined> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "NOT_FOUND", message: "No autenticado" };

  const userId = session.user.id;
  const existing = await getTransactionByIdForEdit(userId, transactionId);
  if (!existing) return { error: "NOT_FOUND", message: "Transacción no encontrada" };

  const wasCompleted = existing.status === "completed";
  const pair = "pair" in existing ? existing.pair : undefined;
  const { year, month } = yearMonth(new Date(existing.transactionDate));

  await db.transaction(async (tx) => {
    // Revert balance before deleting
    if (wasCompleted) {
      const delta = getBalanceDelta(existing.type, existing.transferSide, parseFloat(String(existing.amount)), "revert");
      await applyAccountBalanceDelta(tx, existing.accountId, delta);

      if (existing.type === "transfer" && pair) {
        const pairDelta = getBalanceDelta("transfer", pair.transferSide, parseFloat(String(pair.amount)), "revert");
        await applyAccountBalanceDelta(tx, pair.accountId, pairDelta);
      }
    }

    if (existing.type === "transfer" && pair) {
      await tx.delete(transaction).where(eq(transaction.id, pair.id));
    }

    await tx
      .delete(transaction)
      .where(and(eq(transaction.id, transactionId), eq(transaction.userId, userId)));

    if (wasCompleted) {
      const snapshotTargets = uniqueSnapshots([
        { accountId: existing.accountId, year, month },
        ...(existing.type === "transfer" && pair ? [{ accountId: pair.accountId, year, month }] : []),
      ]);

      for (const target of snapshotTargets) {
        await upsertMonthlySnapshot(tx, userId, target.accountId, target.year, target.month);
      }
    }
  });

  revalidatePath("/transactions");
  revalidatePath("/accounts");
  redirect("/transactions");
}
