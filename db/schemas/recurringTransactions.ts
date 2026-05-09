import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { user } from "./user";
import { transactionTypeEnum, recurringFrequencyEnum } from "./enums";
import { financialAccount } from "./financialAccounts";
import { transactionCategory } from "./transactionCategories";
import { recurringTransactionExecution } from "./recurringTransactionExecutions";
import { transaction } from "./transactions";

export const recurringTransaction = pgTable(
  "recurring_transactions",
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
    frequency: recurringFrequencyEnum("frequency").notNull(),
    intervalValue: integer("interval_value").notNull().default(1),
    startDate: date("start_date").notNull(),
    endDate: date("end_date"),
    nextExecutionDate: date("next_execution_date").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    autoCreate: boolean("auto_create").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("recurring_transactions_user_id_idx").on(table.userId),
    index("recurring_transactions_next_exec_idx").on(table.nextExecutionDate),
  ],
);

export const recurringTransactionRelations = relations(
  recurringTransaction,
  ({ one, many }) => ({
    user: one(user, {
      fields: [recurringTransaction.userId],
      references: [user.id],
    }),
    financialAccount: one(financialAccount, {
      fields: [recurringTransaction.accountId],
      references: [financialAccount.id],
    }),
    transactionCategory: one(transactionCategory, {
      fields: [recurringTransaction.categoryId],
      references: [transactionCategory.id],
    }),
    executions: many(recurringTransactionExecution),
    transactions: many(transaction),
  }),
);

export type RecurringTransactionSelect = InferSelectModel<
  typeof recurringTransaction
>;
export type RecurringTransactionInsert = InferInsertModel<
  typeof recurringTransaction
>;
