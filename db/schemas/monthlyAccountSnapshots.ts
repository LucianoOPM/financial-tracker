import { relations } from "drizzle-orm";
import {
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { user } from "./user";
import { financialAccount } from "./financialAccounts";

export const monthlyAccountSnapshot = pgTable(
  "monthly_account_snapshots",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accountId: text("account_id")
      .notNull()
      .references(() => financialAccount.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    incomeTotal: numeric("income_total", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    expenseTotal: numeric("expense_total", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    savingsTotal: numeric("savings_total", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    closingBalance: numeric("closing_balance", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("snapshots_user_year_month_account_uq").on(
      table.userId,
      table.year,
      table.month,
      table.accountId,
    ),
    index("snapshots_user_year_month_idx").on(
      table.userId,
      table.year,
      table.month,
    ),
    index("snapshots_account_id_idx").on(table.accountId),
  ],
);

export const monthlyAccountSnapshotRelations = relations(
  monthlyAccountSnapshot,
  ({ one }) => ({
    user: one(user, {
      fields: [monthlyAccountSnapshot.userId],
      references: [user.id],
    }),
    financialAccount: one(financialAccount, {
      fields: [monthlyAccountSnapshot.accountId],
      references: [financialAccount.id],
    }),
  }),
);

export type MonthlyAccountSnapshotSelect = InferSelectModel<
  typeof monthlyAccountSnapshot
>;
export type MonthlyAccountSnapshotInsert = InferInsertModel<
  typeof monthlyAccountSnapshot
>;
