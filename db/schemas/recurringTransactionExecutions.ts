import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { executionStatusEnum } from "./enums";
import { recurringTransaction } from "./recurringTransactions";
import { transaction } from "./transactions";

export const recurringTransactionExecution = pgTable(
  "recurring_transaction_executions",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    recurringTransactionId: text("recurring_transaction_id")
      .notNull()
      .references(() => recurringTransaction.id, { onDelete: "cascade" }),
    transactionId: text("transaction_id").references(() => transaction.id, {
      onDelete: "set null",
    }),
    executedAt: timestamp("executed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    status: executionStatusEnum("status").notNull(),
    errorMessage: text("error_message"),
  },
  (table) => [
    index("rte_recurring_transaction_id_idx").on(
      table.recurringTransactionId,
    ),
    index("rte_executed_at_idx").on(table.executedAt),
  ],
);

export const recurringTransactionExecutionRelations = relations(
  recurringTransactionExecution,
  ({ one }) => ({
    recurringTransaction: one(recurringTransaction, {
      fields: [recurringTransactionExecution.recurringTransactionId],
      references: [recurringTransaction.id],
    }),
    transaction: one(transaction, {
      fields: [recurringTransactionExecution.transactionId],
      references: [transaction.id],
    }),
  }),
);

export type RecurringTransactionExecutionSelect = InferSelectModel<
  typeof recurringTransactionExecution
>;
export type RecurringTransactionExecutionInsert = InferInsertModel<
  typeof recurringTransactionExecution
>;
