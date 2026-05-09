import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { user } from "./user";
import { transactionTypeEnum } from "./enums";
import { transaction } from "./transactions";
import { recurringTransaction } from "./recurringTransactions";

export const transactionCategory = pgTable(
  "transaction_categories",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: transactionTypeEnum("type").notNull(),
    color: text("color"),
    icon: text("icon"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("transaction_categories_user_id_idx").on(table.userId),
    index("transaction_categories_type_idx").on(table.type),
  ],
);

export const transactionCategoryRelations = relations(
  transactionCategory,
  ({ one, many }) => ({
    user: one(user, {
      fields: [transactionCategory.userId],
      references: [user.id],
    }),
    transactions: many(transaction),
    recurringTransactions: many(recurringTransaction),
  }),
);

export type TransactionCategorySelect = InferSelectModel<
  typeof transactionCategory
>;
export type TransactionCategoryInsert = InferInsertModel<
  typeof transactionCategory
>;
