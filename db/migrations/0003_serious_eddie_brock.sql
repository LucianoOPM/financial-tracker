ALTER TABLE "financial_accounts" ALTER COLUMN "name" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "financial_accounts" ALTER COLUMN "institution_name" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "financial_accounts" ALTER COLUMN "color" SET DATA TYPE varchar(7);--> statement-breakpoint
ALTER TABLE "financial_accounts" ALTER COLUMN "gradient_from" SET DATA TYPE varchar(7);--> statement-breakpoint
ALTER TABLE "financial_accounts" ALTER COLUMN "gradient_to" SET DATA TYPE varchar(7);--> statement-breakpoint
ALTER TABLE "financial_accounts" ALTER COLUMN "icon" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "transaction_categories" ALTER COLUMN "name" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "transaction_categories" ALTER COLUMN "color" SET DATA TYPE varchar(7);--> statement-breakpoint
ALTER TABLE "transaction_categories" ALTER COLUMN "icon" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "financial_accounts" ADD COLUMN "last_four_digits" varchar(4);--> statement-breakpoint
CREATE INDEX "snapshots_account_id_idx" ON "monthly_account_snapshots" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "transactions_category_id_idx" ON "transactions" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "transactions_status_idx" ON "transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "transactions_recurring_id_idx" ON "transactions" USING btree ("recurring_transaction_id");