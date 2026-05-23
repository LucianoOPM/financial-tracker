import { relations } from "drizzle-orm";
import {
  index,
  numeric,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { user } from "./user";
import {
  transactionTypeEnum,
  transactionStatusEnum,
  transferSideEnum,
} from "./enums";
import { financialAccount } from "./financialAccounts";
import { transactionCategory } from "./transactionCategories";
import { recurringTransaction } from "./recurringTransactions";

export const transaction = pgTable(
  "transactions",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accountId: text("account_id")
      .notNull()
      .references(() => financialAccount.id, { onDelete: "cascade" }),
    categoryId: text("category_id").references(
      () => transactionCategory.id,
      { onDelete: "set null" },
    ),
    type: transactionTypeEnum("type").notNull(),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    description: text("description"),
    transactionDate: timestamp("transaction_date", {
      withTimezone: true,
    }).notNull(),
    status: transactionStatusEnum("status").default("completed").notNull(),
    recurringTransactionId: text("recurring_transaction_id").references(
      () => recurringTransaction.id,
      { onDelete: "set null" },
    ),
    transferGroupId: text("transfer_group_id"),
    transferSide: transferSideEnum("transfer_side"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("transactions_user_date_idx").on(table.userId, table.transactionDate),
    index("transactions_account_date_idx").on(
      table.accountId,
      table.transactionDate,
    ),
    index("transactions_transfer_group_idx").on(table.transferGroupId),
    index("transactions_category_id_idx").on(table.categoryId),
    index("transactions_status_idx").on(table.status),
    index("transactions_recurring_id_idx").on(table.recurringTransactionId),
  ],
);

export const transactionRelations = relations(transaction, ({ one }) => ({
  user: one(user, {
    fields: [transaction.userId],
    references: [user.id],
  }),
  financialAccount: one(financialAccount, {
    fields: [transaction.accountId],
    references: [financialAccount.id],
  }),
  transactionCategory: one(transactionCategory, {
    fields: [transaction.categoryId],
    references: [transactionCategory.id],
  }),
  recurringTransaction: one(recurringTransaction, {
    fields: [transaction.recurringTransactionId],
    references: [recurringTransaction.id],
  }),
}));

export type TransactionSelect = InferSelectModel<typeof transaction>;
export type TransactionInsert = InferInsertModel<typeof transaction>;
