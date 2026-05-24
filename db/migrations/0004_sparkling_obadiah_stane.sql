CREATE TYPE "public"."transfer_side" AS ENUM('in', 'out');--> statement-breakpoint
ALTER TABLE "recurring_transactions" ADD COLUMN "destination_account_id" text;--> statement-breakpoint
ALTER TABLE "recurring_transactions" ADD COLUMN "last_executed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "transfer_side" "transfer_side";--> statement-breakpoint
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_destination_account_id_financial_accounts_id_fk" FOREIGN KEY ("destination_account_id") REFERENCES "public"."financial_accounts"("id") ON DELETE set null ON UPDATE no action;