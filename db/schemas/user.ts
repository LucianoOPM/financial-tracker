import { relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { session } from "./session";
import { account } from "./account";
import { financialAccount } from "./financialAccounts";
import { transactionCategory } from "./transactionCategories";
import { transaction } from "./transactions";
import { recurringTransaction } from "./recurringTransactions";
import { monthlyAccountSnapshot } from "./monthlyAccountSnapshots";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  currencyCode: text("currency_code").default("MXN").notNull(),
  timezone: text("timezone").default("America/Mexico_City").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  financialAccounts: many(financialAccount),
  transactionCategories: many(transactionCategory),
  transactions: many(transaction),
  recurringTransactions: many(recurringTransaction),
  monthlyAccountSnapshots: many(monthlyAccountSnapshot),
}));
