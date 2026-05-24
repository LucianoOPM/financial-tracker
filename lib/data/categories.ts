import { db } from "@db/index";
import { transactionCategory } from "@db/schemas";
import type { TransactionCategorySelect } from "@db/schemas";

export async function getActiveCategories(userId: string): Promise<TransactionCategorySelect[]> {
  return db.query.transactionCategory.findMany({
    where: (t, { or, isNull, eq }) => or(eq(t.userId, userId), isNull(t.userId)),
    orderBy: (t, { asc }) => [asc(t.name)],
  }) as Promise<TransactionCategorySelect[]>;
}
