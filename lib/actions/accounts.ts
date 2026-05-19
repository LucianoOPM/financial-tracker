"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { auth } from "@lib/auth";
import { db } from "@db/index";
import { financialAccount, recurringTransaction } from "@db/schemas";
import { financialAccountSchema, type FinancialAccountSchema } from "@lib/schemas/financialAccount";
import {
  getAccountByIdAnyStatus,
  getPendingTransactionCount,
  findDuplicateAccount,
} from "@lib/data/accounts";

type DeactivateAccountResult =
  | { error: "NOT_FOUND"; message: string }
  | { error: "ALREADY_INACTIVE"; message: string }
  | { error: "HAS_PENDING_TRANSACTIONS"; message: string; pendingCount: number };

type ReactivateAccountResult =
  | { error: "NOT_FOUND"; message: string }
  | { error: "ALREADY_ACTIVE"; message: string };

export async function createAccount(data: FinancialAccountSchema) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "No autenticado" };

  const parsed = financialAccountSchema.safeParse(data);
  if (!parsed.success) return { error: "Datos inválidos" };

  const { name, type, institutionName, currentBalance, creditLimit, closingDay, dueDay, color, gradientFrom, gradientTo, icon, lastFourDigits } = parsed.data;

  const normalisedInstitution = institutionName || null;

  const duplicate = await findDuplicateAccount(session.user.id, name, type, normalisedInstitution);
  if (duplicate) {
    if (duplicate.isActive) {
      return {
        error: "DUPLICATE_ACTIVE",
        message: "Ya tienes una cuenta activa con ese nombre, tipo e institución.",
      };
    }
    return {
      error: "DUPLICATE_INACTIVE",
      message: "Tienes una cuenta inactiva con los mismos datos. ¿Deseas reactivarla?",
      accountId: duplicate.id,
    };
  }

  await db.insert(financialAccount).values({
    userId: session.user.id,
    name,
    type,
    institutionName: normalisedInstitution,
    currentBalance: String(currentBalance),
    creditLimit: creditLimit !== undefined ? String(creditLimit) : null,
    closingDay: closingDay ?? null,
    dueDay: dueDay ?? null,
    color: color ?? null,
    gradientFrom: gradientFrom ?? null,
    gradientTo: gradientTo ?? null,
    icon: icon ?? null,
    lastFourDigits: lastFourDigits ?? null,
  });

  redirect("/accounts");
}

export async function updateAccount(accountId: string, data: FinancialAccountSchema) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "No autenticado" };

  const parsed = financialAccountSchema.safeParse(data);
  if (!parsed.success) return { error: "Datos inválidos" };

  const existingAccount = await db.query.financialAccount.findFirst({
    where: (t, { eq, and }) => and(eq(t.id, accountId), eq(t.userId, session.user.id)),
    columns: { id: true, type: true },
  });
  if (!existingAccount) return { error: "Cuenta no encontrada" };

  const { name, institutionName, currentBalance, creditLimit, closingDay, dueDay, color, gradientFrom, gradientTo, icon, lastFourDigits } = parsed.data;

  if (existingAccount.type === "credit") {
    if (creditLimit === undefined) return { error: "El límite de crédito es requerido" };
    if (closingDay === undefined) return { error: "El día de cierre es requerido" };
    if (dueDay === undefined) return { error: "El día de pago es requerido" };
  }

  await db
    .update(financialAccount)
    .set({
      name,
      institutionName: institutionName || null,
      currentBalance: String(currentBalance),
      creditLimit: creditLimit !== undefined ? String(creditLimit) : null,
      closingDay: closingDay ?? null,
      dueDay: dueDay ?? null,
      color: color ?? null,
      gradientFrom: gradientFrom ?? null,
      gradientTo: gradientTo ?? null,
      icon: icon ?? null,
      lastFourDigits: lastFourDigits ?? null,
    })
    .where(and(eq(financialAccount.id, accountId), eq(financialAccount.userId, session.user.id)));

  revalidatePath(`/accounts/${accountId}`);
  redirect(`/accounts/${accountId}`);
}

export async function deactivateAccount(
  accountId: string,
): Promise<DeactivateAccountResult | undefined> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "NOT_FOUND", message: "No autenticado" };

  const account = await getAccountByIdAnyStatus(session.user.id, accountId);
  if (!account) return { error: "NOT_FOUND", message: "Cuenta no encontrada" };
  if (!account.isActive) return { error: "ALREADY_INACTIVE", message: "La cuenta ya está inactiva" };

  const pendingCount = await getPendingTransactionCount(accountId);
  if (pendingCount > 0) {
    return {
      error: "HAS_PENDING_TRANSACTIONS",
      message: `La cuenta tiene ${pendingCount} transacción${pendingCount > 1 ? "es" : ""} pendiente${pendingCount > 1 ? "s" : ""}. Resuélvelas antes de desactivar la cuenta.`,
      pendingCount,
    };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(recurringTransaction)
      .set({ isActive: false })
      .where(eq(recurringTransaction.accountId, accountId));

    await tx
      .update(financialAccount)
      .set({ isActive: false })
      .where(and(eq(financialAccount.id, accountId), eq(financialAccount.userId, session.user.id)));
  });

  revalidatePath("/accounts");
  revalidatePath(`/accounts/${accountId}`);
  redirect("/accounts");
}

export async function reactivateAccount(
  accountId: string,
): Promise<ReactivateAccountResult | undefined> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "NOT_FOUND", message: "No autenticado" };

  const account = await getAccountByIdAnyStatus(session.user.id, accountId);
  if (!account) return { error: "NOT_FOUND", message: "Cuenta no encontrada" };
  if (account.isActive) return { error: "ALREADY_ACTIVE", message: "La cuenta ya está activa" };

  await db
    .update(financialAccount)
    .set({ isActive: true })
    .where(and(eq(financialAccount.id, accountId), eq(financialAccount.userId, session.user.id)));

  revalidatePath("/accounts");
  redirect("/accounts");
}
