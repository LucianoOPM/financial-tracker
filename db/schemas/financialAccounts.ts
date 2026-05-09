import { relations } from "drizzle-orm";
import {
  boolean,
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
import { accountTypeEnum } from "./enums";
import { transaction } from "./transactions";
import { recurringTransaction } from "./recurringTransactions";
import { monthlyAccountSnapshot } from "./monthlyAccountSnapshots";

export const financialAccount = pgTable(
  "financial_accounts",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: accountTypeEnum("type").notNull(),
    institutionName: text("institution_name"),
    currentBalance: numeric("current_balance", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    creditLimit: numeric("credit_limit", { precision: 14, scale: 2 }),
    closingDay: integer("closing_day"),
    dueDay: integer("due_day"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("financial_accounts_user_id_idx").on(table.userId)],
);

export const financialAccountRelations = relations(
  financialAccount,
  ({ one, many }) => ({
    user: one(user, {
      fields: [financialAccount.userId],
      references: [user.id],
    }),
    transactions: many(transaction),
    recurringTransactions: many(recurringTransaction),
    monthlyAccountSnapshots: many(monthlyAccountSnapshot),
  }),
);

export type FinancialAccountSelect = InferSelectModel<typeof financialAccount>;
export type FinancialAccountInsert = InferInsertModel<typeof financialAccount>;
