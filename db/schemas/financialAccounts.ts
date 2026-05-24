import { relations } from "drizzle-orm";
import { boolean, index, integer, numeric, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { user } from "./user";
import { accountTypeEnum } from "./enums";
import { transaction } from "./transactions";
import { recurringTransaction } from "./recurringTransactions";
import { monthlyAccountSnapshot } from "./monthlyAccountSnapshots";

export const financialAccount = pgTable(
  "financial_accounts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    type: accountTypeEnum("type").notNull(),
    institutionName: varchar("institution_name", { length: 100 }),
    currentBalance: numeric("current_balance", { precision: 14, scale: 2 }).notNull().default("0"),
    creditLimit: numeric("credit_limit", { precision: 14, scale: 2 }),
    closingDay: integer("closing_day"),
    dueDay: integer("due_day"),
    color: varchar("color", { length: 7 }),
    gradientFrom: varchar("gradient_from", { length: 7 }),
    gradientTo: varchar("gradient_to", { length: 7 }),
    icon: varchar("icon", { length: 100 }),
    lastFourDigits: varchar("last_four_digits", { length: 4 }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("financial_accounts_user_id_idx").on(table.userId)],
);

export const financialAccountRelations = relations(financialAccount, ({ one, many }) => ({
  user: one(user, {
    fields: [financialAccount.userId],
    references: [user.id],
  }),
  transactions: many(transaction),
  recurringTransactions: many(recurringTransaction, {
    relationName: "recurringTransactionAccount",
  }),
  destinationRecurringTransactions: many(recurringTransaction, {
    relationName: "recurringTransactionDestinationAccount",
  }),
  monthlyAccountSnapshots: many(monthlyAccountSnapshot),
}));

export type FinancialAccountSelect = InferSelectModel<typeof financialAccount>;
export type FinancialAccountInsert = InferInsertModel<typeof financialAccount>;
