import { db } from "@db/index";

export async function getAccountTransactions(
  userId: string,
  accountId: string,
  limit = 50,
) {
  return db.query.transaction.findMany({
    where: (t, { eq, and }) =>
      and(eq(t.accountId, accountId), eq(t.userId, userId)),
    with: { transactionCategory: true },
    orderBy: (t, { desc }) => [desc(t.transactionDate)],
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
