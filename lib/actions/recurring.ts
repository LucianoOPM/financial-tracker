"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { auth } from "@lib/auth";
import { db } from "@db/index";
import { recurringTransaction, recurringTransactionExecution } from "@db/schemas";
import { recurringSchema, type RecurringSchema } from "@lib/schemas/recurring";
import { getAccountById } from "@lib/data/accounts";
import { getRecurringById } from "@lib/data/recurring";
import { executeRecurringTransaction } from "@lib/recurring/executor";

// ─── Error types ──────────────────────────────────────────────────────────────

type CreateRecurringResult =
  | { error: "INVALID_DATA"; message: string }
  | { error: "FINANCIAL_ACCOUNT_NOT_FOUND"; message: string }
  | { error: "DEST_FINANCIAL_ACCOUNT_NOT_FOUND"; message: string };

type UpdateRecurringResult =
  | { error: "NOT_FOUND"; message: string }
  | { error: "INVALID_DATA"; message: string }
  | { error: "FINANCIAL_ACCOUNT_NOT_FOUND"; message: string }
  | { error: "DEST_FINANCIAL_ACCOUNT_NOT_FOUND"; message: string };

type DeactivateRecurringResult = { error: "NOT_FOUND"; message: string };
type ReactivateRecurringResult = { error: "NOT_FOUND"; message: string };
type DeleteRecurringResult = { error: "NOT_FOUND"; message: string };

type ManualExecuteResult =
  | { error: "NOT_FOUND"; message: string }
  | { error: "EXECUTION_FAILED"; message: string };

// ─── CRUD actions ─────────────────────────────────────────────────────────────

export async function createRecurring(
  data: RecurringSchema,
): Promise<CreateRecurringResult | undefined> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "FINANCIAL_ACCOUNT_NOT_FOUND", message: "No autenticado" };
  }

  const parsed = recurringSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "INVALID_DATA", message: "Datos inválidos" };
  }

  const {
    type,
    amount,
    description,
    accountId,
    destinationAccountId,
    categoryId,
    frequency,
    intervalValue,
    startDate,
    endDate,
    nextExecutionDate,
    isActive,
    autoCreate,
  } = parsed.data;
  const userId = session.user.id;

  const sourceAccount = await getAccountById(userId, accountId);
  if (!sourceAccount) {
    return {
      error: "FINANCIAL_ACCOUNT_NOT_FOUND",
      message: "Cuenta financiera no encontrada o inactiva",
    };
  }

  if (type === "transfer") {
    const destAccount = await getAccountById(userId, destinationAccountId!);
    if (!destAccount) {
      return {
        error: "DEST_FINANCIAL_ACCOUNT_NOT_FOUND",
        message: "Cuenta financiera destino no encontrada o inactiva",
      };
    }
  }

  await db.insert(recurringTransaction).values({
    userId,
    accountId,
    destinationAccountId: destinationAccountId ?? null,
    categoryId: categoryId ?? null,
    type,
    amount: String(amount),
    description: description ?? null,
    frequency,
    intervalValue,
    startDate,
    endDate: endDate ?? null,
    nextExecutionDate,
    isActive,
    autoCreate,
  });

  revalidatePath("/recurring");
  redirect("/recurring");
}

export async function updateRecurring(
  id: string,
  data: RecurringSchema,
): Promise<UpdateRecurringResult | undefined> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "NOT_FOUND", message: "No autenticado" };
  }

  const userId = session.user.id;

  const existing = await getRecurringById(userId, id);
  if (!existing) {
    return { error: "NOT_FOUND", message: "Transacción recurrente no encontrada" };
  }

  const parsed = recurringSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "INVALID_DATA", message: "Datos inválidos" };
  }

  const {
    type,
    amount,
    description,
    accountId,
    destinationAccountId,
    categoryId,
    frequency,
    intervalValue,
    startDate,
    endDate,
    nextExecutionDate,
    isActive,
    autoCreate,
  } = parsed.data;

  const sourceAccount = await getAccountById(userId, accountId);
  if (!sourceAccount) {
    return {
      error: "FINANCIAL_ACCOUNT_NOT_FOUND",
      message: "Cuenta financiera no encontrada o inactiva",
    };
  }

  if (type === "transfer") {
    const destAccount = await getAccountById(userId, destinationAccountId!);
    if (!destAccount) {
      return {
        error: "DEST_FINANCIAL_ACCOUNT_NOT_FOUND",
        message: "Cuenta financiera destino no encontrada o inactiva",
      };
    }
  }

  await db
    .update(recurringTransaction)
    .set({
      accountId,
      destinationAccountId: type === "transfer" ? (destinationAccountId ?? null) : null,
      categoryId: categoryId ?? null,
      type,
      amount: String(amount),
      description: description ?? null,
      frequency,
      intervalValue,
      startDate,
      endDate: endDate ?? null,
      nextExecutionDate,
      isActive,
      autoCreate,
    })
    .where(and(eq(recurringTransaction.id, id), eq(recurringTransaction.userId, userId)));

  revalidatePath("/recurring");
  revalidatePath(`/recurring/${id}`);
  redirect("/recurring");
}

export async function deactivateRecurring(
  id: string,
): Promise<DeactivateRecurringResult | undefined> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "NOT_FOUND", message: "No autenticado" };

  const userId = session.user.id;
  const existing = await getRecurringById(userId, id);
  if (!existing) return { error: "NOT_FOUND", message: "Transacción recurrente no encontrada" };

  await db
    .update(recurringTransaction)
    .set({ isActive: false })
    .where(and(eq(recurringTransaction.id, id), eq(recurringTransaction.userId, userId)));

  revalidatePath("/recurring");
}

export async function reactivateRecurring(
  id: string,
): Promise<ReactivateRecurringResult | undefined> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "NOT_FOUND", message: "No autenticado" };

  const userId = session.user.id;
  const existing = await getRecurringById(userId, id);
  if (!existing) return { error: "NOT_FOUND", message: "Transacción recurrente no encontrada" };

  await db
    .update(recurringTransaction)
    .set({ isActive: true })
    .where(and(eq(recurringTransaction.id, id), eq(recurringTransaction.userId, userId)));

  revalidatePath("/recurring");
}

export async function deleteRecurring(
  id: string,
): Promise<DeleteRecurringResult | undefined> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "NOT_FOUND", message: "No autenticado" };

  const userId = session.user.id;
  const existing = await getRecurringById(userId, id);
  if (!existing) return { error: "NOT_FOUND", message: "Transacción recurrente no encontrada" };

  await db
    .delete(recurringTransaction)
    .where(and(eq(recurringTransaction.id, id), eq(recurringTransaction.userId, userId)));

  revalidatePath("/recurring");
  redirect("/recurring");
}

// ─── Manual execution ─────────────────────────────────────────────────────────

/**
 * Triggers an immediate execution of a recurring transaction.
 * Returns undefined on success (caller shows a success notification in-place).
 * Does NOT redirect — lets the UI decide navigation after the operation.
 */
export async function manualExecuteRecurring(
  id: string,
): Promise<ManualExecuteResult | undefined> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "NOT_FOUND", message: "No autenticado" };

  const userId = session.user.id;
  const rec = await getRecurringById(userId, id);
  if (!rec) return { error: "NOT_FOUND", message: "Transacción recurrente no encontrada" };

  let errorMessage: string | undefined;

  try {
    await db.transaction(async (tx) => {
      const execResult = await executeRecurringTransaction(id, tx, new Date());

      if (!execResult.success) {
        errorMessage = execResult.error;
        throw new Error(execResult.error);
      }
    });
  } catch {
    // Transaction rolled back. Insert failure record in a clean transaction.
    await db.insert(recurringTransactionExecution).values({
      recurringTransactionId: id,
      status: "failed",
      errorMessage: errorMessage ?? "Error desconocido",
    });
    return {
      error: "EXECUTION_FAILED",
      message: errorMessage ?? "La ejecución falló",
    };
  }

  revalidatePath("/recurring");
  revalidatePath("/transactions");
  revalidatePath("/accounts");
}
