import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowLeftRight } from "lucide-react";
import { auth } from "@lib/auth";
import { getTransactions, type TransactionFilters } from "@lib/data/transactions";
import { Button } from "@components/ui/button";
import { TransactionRow } from "./components/TransactionRow";
import { TransactionFilters as TransactionFiltersBar } from "./components/TransactionFilters";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { type, status } = await searchParams;

  const filters: TransactionFilters = {
    ...(type && { type: type as TransactionFilters["type"] }),
    ...(status && { status: status as TransactionFilters["status"] }),
  };

  const transactions = await getTransactions(session.user.id, filters);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Transacciones</h1>
          <p className="text-sm text-muted-foreground">Historial de movimientos financieros</p>
        </div>
        <Button asChild>
          <Link href="/transactions/create">Nueva transacción</Link>
        </Button>
      </div>

      <TransactionFiltersBar activeType={type} activeStatus={status} />

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <ArrowLeftRight className="size-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">No hay transacciones aún</p>
            <p className="text-sm text-muted-foreground">
              Registra tu primer ingreso, gasto o transferencia
            </p>
          </div>
          <Button asChild>
            <Link href="/transactions/create">Nueva transacción</Link>
          </Button>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-md border">
          {transactions.map((tx) => (
            <TransactionRow key={tx.id} transaction={tx} />
          ))}
        </ul>
      )}
    </div>
  );
}
