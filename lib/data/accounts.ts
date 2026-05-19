import { count, eq, and } from "drizzle-orm";
import { db } from "@db/index";
import { financialAccount, transaction } from "@db/schemas";
import type { FinancialAccountSelect } from "@db/schemas";

export async function getActiveAccounts(userId: string): Promise<FinancialAccountSelect[]> {
  return db.query.financialAccount.findMany({
    where: (t, { eq, and }) => and(eq(t.userId, userId), eq(t.isActive, true)),
    orderBy: (t, { asc }) => [asc(t.name)],
  });
}

export async function getAccountById(
  userId: string,
  accountId: string,
): Promise<FinancialAccountSelect | undefined> {
  return db.query.financialAccount.findFirst({
    where: (t, { eq, and }) =>
      and(eq(t.id, accountId), eq(t.userId, userId), eq(t.isActive, true)),
  });
}

export async function getAccountByIdAnyStatus(
  userId: string,
  accountId: string,
): Promise<FinancialAccountSelect | undefined> {
  return db.query.financialAccount.findFirst({
    where: (t, { eq, and }) => and(eq(t.id, accountId), eq(t.userId, userId)),
  });
}

export async function getPendingTransactionCount(accountId: string): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(transaction)
    .where(and(eq(transaction.accountId, accountId), eq(transaction.status, "pending")));
  return result[0]?.count ?? 0;
}

export async function getInactiveAccounts(userId: string): Promise<FinancialAccountSelect[]> {
  return db.query.financialAccount.findMany({
    where: (t, { eq, and }) => and(eq(t.userId, userId), eq(t.isActive, false)),
    orderBy: (t, { asc }) => [asc(t.name)],
  });
}

export async function findDuplicateAccount(
  userId: string,
  name: string,
  type: string,
  institutionName: string | null,
): Promise<Pick<FinancialAccountSelect, "id" | "isActive"> | undefined> {
  return db.query.financialAccount.findFirst({
    where: (t, { eq, and, ilike, isNull }) =>
      and(
        eq(t.userId, userId),
        ilike(t.name, name),
        eq(t.type, type as FinancialAccountSelect["type"]),
        !institutionName ? isNull(t.institutionName) : ilike(t.institutionName, institutionName),
      ),
    columns: { id: true, isActive: true },
  });
}
