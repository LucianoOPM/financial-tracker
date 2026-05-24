import Link from "next/link";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { ChevronLeft, Pencil } from "lucide-react";
import { auth } from "@lib/auth";
import { getAccountById } from "@lib/data/accounts";
import { getAccountTransactions, getCurrentMonthSnapshot } from "@lib/data/transactions";
import { AccountCardPreview } from "../components/AccountCardPreview";
import { DeactivateAccountButton } from "../components/DeactivateAccountButton";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { Separator } from "@components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@components/ui/card";

function formatMXN(value: string | number | null | undefined): string {
  return parseFloat(String(value ?? "0")).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const TYPE_LABELS: Record<string, string> = {
  income: "Ingreso",
  expense: "Gasto",
  transfer: "Transferencia",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  completed: "Completada",
  cancelled: "Cancelada",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  completed: "default",
  cancelled: "destructive",
};

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const userId = session.user.id;

  const [account, transactions, snapshot] = await Promise.all([
    getAccountById(userId, id),
    getAccountTransactions(userId, id),
    getCurrentMonthSnapshot(userId, id),
  ]);

  if (!account) notFound();

  const isCredit = account.type === "credit";
  const creditLimit = parseFloat(account.creditLimit ?? "0");
  const currentBalance = parseFloat(account.currentBalance);
  const availableCredit = creditLimit - currentBalance;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <Button
          variant="ghost"
          size="xs"
          asChild
          className="-ml-1.5 mb-1 w-fit text-muted-foreground"
        >
          <Link href="/accounts">
            <ChevronLeft data-icon="inline-start" />
            Volver a cuentas
          </Link>
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{account.name}</h1>
            <p className="text-sm text-muted-foreground">
              {account.institutionName ?? "Cuenta personal"}
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href={`/accounts/${id}/edit`}>
              <Pencil className="size-4" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      {/* Card preview */}
      <div className="max-w-sm">
        <AccountCardPreview
          name={account.name}
          type={account.type}
          institutionName={account.institutionName ?? undefined}
          currentBalance={currentBalance}
          lastFourDigits={account.lastFourDigits ?? undefined}
          color={account.color ?? undefined}
          gradientFrom={account.gradientFrom ?? undefined}
          gradientTo={account.gradientTo ?? undefined}
          icon={account.icon ?? undefined}
        />
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Saldo actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-semibold tracking-tight">
              {formatMXN(account.currentBalance)}
            </p>
          </CardContent>
        </Card>

        {isCredit && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Límite de crédito
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-2xl font-semibold tracking-tight">
                  {formatMXN(account.creditLimit)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Crédito disponible
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-2xl font-semibold tracking-tight">
                  {formatMXN(availableCredit)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Fechas de crédito
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1">
                <p className="text-sm">
                  Cierre: <span className="font-semibold">día {account.closingDay}</span>
                </p>
                <p className="text-sm">
                  Pago: <span className="font-semibold">día {account.dueDay}</span>
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Monthly snapshot */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Resumen del mes</CardTitle>
          <CardDescription>
            {snapshot
              ? new Date().toLocaleString("es-MX", { month: "long", year: "numeric" })
              : "No hay datos para este mes aún"}
          </CardDescription>
        </CardHeader>
        {snapshot && (
          <CardContent className="pt-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Ingresos</p>
                <p className="font-mono text-lg font-semibold text-emerald-600">
                  {formatMXN(snapshot.incomeTotal)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Gastos</p>
                <p className="font-mono text-lg font-semibold text-destructive">
                  {formatMXN(snapshot.expenseTotal)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo de cierre</p>
                <p className="font-mono text-lg font-semibold">
                  {formatMXN(snapshot.closingBalance)}
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Transactions */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Transacciones recientes</CardTitle>
          <CardDescription>Últimas {transactions.length} transacciones</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No hay transacciones registradas en esta cuenta.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {transactions.map((tx) => (
                <li key={tx.id} className="flex items-center gap-4 px-4 py-3">
                  <div
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: tx.transactionCategory?.color ?? "#94a3b8" }}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {tx.description ?? "Sin descripción"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(tx.transactionDate)} ·{" "}
                      {tx.transactionCategory?.name ?? "Sin categoría"}
                    </p>
                  </div>

                  <Badge variant="secondary" className="hidden shrink-0 sm:inline-flex">
                    {TYPE_LABELS[tx.type] ?? tx.type}
                  </Badge>

                  <Badge
                    variant={STATUS_VARIANTS[tx.status] ?? "outline"}
                    className="shrink-0"
                  >
                    {STATUS_LABELS[tx.status] ?? tx.status}
                  </Badge>

                  <p
                    className={`shrink-0 font-mono text-sm font-semibold tabular-nums ${
                      tx.type === "income"
                        ? "text-emerald-600"
                        : tx.type === "expense"
                          ? "text-destructive"
                          : "text-foreground"
                    }`}
                  >
                    {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : ""}
                    {formatMXN(tx.amount)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      {/* Danger zone */}
      <Separator />
      <div className="flex flex-col gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-destructive">Zona de riesgo</p>
          <p className="text-sm text-muted-foreground">
            Desactivar oculta la cuenta y pausa sus transacciones recurrentes. Podrás reactivarla cuando quieras.
          </p>
        </div>
        <DeactivateAccountButton accountId={account.id} accountName={account.name} />
      </div>
    </div>
  );
}
