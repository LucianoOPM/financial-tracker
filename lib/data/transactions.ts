import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@db/index";
import { transaction } from "@db/schemas";
import type { TransactionSelect } from "@db/schemas";

export type TransactionFilters = {
  accountId?: string;
  type?: "income" | "expense" | "transfer";
  status?: "pending" | "completed" | "cancelled";
  categoryId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
};

export type TransactionWithRelations = TransactionSelect & {
  transactionCategory: { id: string; name: string; color: string | null; icon: string | null } | null;
  financialAccount: { id: string; name: string; type: string } | null;
};

export async function getTransactions(
  userId: string,
  filters?: TransactionFilters,
): Promise<TransactionWithRelations[]> {
  const conditions = [eq(transaction.userId, userId)];

  if (filters?.accountId) conditions.push(eq(transaction.accountId, filters.accountId));
  if (filters?.type) conditions.push(eq(transaction.type, filters.type));
  if (filters?.status) conditions.push(eq(transaction.status, filters.status));
  if (filters?.categoryId) conditions.push(eq(transaction.categoryId, filters.categoryId));
  if (filters?.dateFrom) conditions.push(gte(transaction.transactionDate, filters.dateFrom));
  if (filters?.dateTo) conditions.push(lte(transaction.transactionDate, filters.dateTo));

  return db.query.transaction.findMany({
    where: and(...conditions),
    with: {
      transactionCategory: {
        columns: { id: true, name: true, color: true, icon: true },
      },
      financialAccount: {
        columns: { id: true, name: true, type: true },
      },
    },
    orderBy: [desc(transaction.transactionDate)],
    limit: filters?.limit ?? 50,
    offset: filters?.offset ?? 0,
  }) as Promise<TransactionWithRelations[]>;
}

export async function getTransactionById(
  userId: string,
  transactionId: string,
): Promise<TransactionWithRelations | undefined> {
  return db.query.transaction.findFirst({
    where: (t, { eq, and }) => and(eq(t.id, transactionId), eq(t.userId, userId)),
    with: {
      transactionCategory: {
        columns: { id: true, name: true, color: true, icon: true },
      },
      financialAccount: {
        columns: { id: true, name: true, type: true },
      },
    },
  }) as Promise<TransactionWithRelations | undefined>;
}

export async function getTransferPair(
  userId: string,
  transferGroupId: string,
  excludeId: string,
): Promise<TransactionWithRelations | undefined> {
  return db.query.transaction.findFirst({
    where: (t, { eq, and, ne: neOp }) =>
      and(
        eq(t.transferGroupId, transferGroupId),
        eq(t.userId, userId),
        neOp(t.id, excludeId),
      ),
    with: {
      transactionCategory: {
        columns: { id: true, name: true, color: true, icon: true },
      },
      financialAccount: {
        columns: { id: true, name: true, type: true },
      },
    },
  }) as Promise<TransactionWithRelations | undefined>;
}

export async function getTransactionByIdForEdit(
  userId: string,
  transactionId: string,
): Promise<(TransactionWithRelations & { pair?: TransactionWithRelations }) | undefined> {
  const tx = await getTransactionById(userId, transactionId);
  if (!tx) return undefined;

  if (tx.type === "transfer" && tx.transferGroupId) {
    const pair = await getTransferPair(userId, tx.transferGroupId, tx.id);
    return { ...tx, pair };
  }

  return tx;
}

export async function getAccountTransactions(
  userId: string,
  accountId: string,
  limit = 50,
) {
  return db.query.transaction.findMany({
    where: (t, { eq, and }) =>
      and(eq(t.accountId, accountId), eq(t.userId, userId)),
    with: { transactionCategory: true },
    orderBy: (t, { desc: descOp }) => [descOp(t.transactionDate)],
    limit,
  });
}

export async function getCurrentMonthSnapshot(
  userId: string,
  accountId: string,
) {
  const now = new Date();
  return db.query.monthlyAccountSnapshot.findFirst({
    where: (t, { eq, and }) =>
      and(
        eq(t.userId, userId),
        eq(t.accountId, accountId),
        eq(t.year, now.getFullYear()),
        eq(t.month, now.getMonth() + 1),
      ),
  });
}

export async function getMonthSnapshot(
  userId: string,
  accountId: string,
  year: number,
  month: number,
) {
  return db.query.monthlyAccountSnapshot.findFirst({
    where: (t, { eq, and }) =>
      and(
        eq(t.userId, userId),
        eq(t.accountId, accountId),
        eq(t.year, year),
        eq(t.month, month),
      ),
  });
}

export async function getTransactionsByUser(userId: string): Promise<TransactionSelect[]> {
  return db.query.transaction.findMany({
    where: (t, { eq }) => eq(t.userId, userId),
  });
}
