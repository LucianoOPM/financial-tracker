import Link from "next/link";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";
import { auth } from "@lib/auth";
import { getTransactionByIdForEdit } from "@lib/data/transactions";
import { getActiveAccounts } from "@lib/data/accounts";
import { getActiveCategories } from "@lib/data/categories";
import { Button } from "@components/ui/button";
import { TransactionForm } from "../../components/TransactionForm";
import type { TransactionSchema } from "@lib/schemas/transaction";

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const [txResult, accounts, categories] = await Promise.all([
    getTransactionByIdForEdit(session.user.id, id),
    getActiveAccounts(session.user.id),
    getActiveCategories(session.user.id),
  ]);

  if (!txResult) notFound();
  if (txResult.status === "cancelled") redirect(`/transactions/${id}`);

  const pair = "pair" in txResult ? txResult.pair : undefined;

  const defaultValues: Partial<TransactionSchema> = {
    type: txResult.type,
    amount: parseFloat(String(txResult.amount)),
    description: txResult.description ?? undefined,
    transactionDate: new Date(txResult.transactionDate),
    status: txResult.status,
    accountId: txResult.accountId,
    categoryId: txResult.categoryId ?? undefined,
    destinationAccountId:
      txResult.type === "transfer" && pair ? pair.accountId : undefined,
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Button
          variant="ghost"
          size="xs"
          asChild
          className="-ml-1.5 mb-1 w-fit text-muted-foreground"
        >
          <Link href={`/transactions/${id}`}>
            <ChevronLeftIcon data-icon="inline-start" />
            Volver a la transacción
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Editar transacción</h1>
        <p className="text-sm text-muted-foreground">Modifica los datos de esta transacción</p>
      </div>
      <TransactionForm
        mode="edit"
        transactionId={id}
        accounts={accounts}
        categories={categories}
        defaultValues={defaultValues}
      />
    </div>
  );
}
