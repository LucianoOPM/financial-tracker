import Link from "next/link";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { ChevronLeft, Pencil } from "lucide-react";
import { auth } from "@lib/auth";
import { getTransactionByIdForEdit } from "@lib/data/transactions";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { Separator } from "@components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { CancelTransactionButton } from "./components/CancelTransactionButton";
import { DeleteTransactionButton } from "./components/DeleteTransactionButton";

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

const TYPE_AMOUNT: Record<string, string> = {
  income: "text-emerald-600",
  expense: "text-destructive",
  transfer: "text-blue-600",
};

function formatMXN(value: string | number): string {
  return parseFloat(String(value ?? "0")).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const result = await getTransactionByIdForEdit(session.user.id, id);
  if (!result) notFound();

  const pair = "pair" in result ? result.pair : undefined;
  const isCancelled = result.status === "cancelled";

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
          <Link href="/transactions">
            <ChevronLeft data-icon="inline-start" />
            Volver a transacciones
          </Link>
        </Button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p
              className={`font-mono text-3xl font-semibold tabular-nums ${TYPE_AMOUNT[result.type] ?? ""}`}
            >
              {result.type === "income" ? "+" : result.type === "expense" ? "−" : ""}
              {formatMXN(result.amount)}
            </p>
            <p className="text-sm text-muted-foreground">
              {result.description ?? "Sin descripción"}
            </p>
          </div>
          {!isCancelled && (
            <Button variant="outline" asChild>
              <Link href={`/transactions/${id}/edit`}>
                <Pencil className="size-4" />
                Editar
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Info grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-medium text-muted-foreground">Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">{TYPE_LABELS[result.type] ?? result.type}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-medium text-muted-foreground">Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={STATUS_VARIANTS[result.status] ?? "outline"}>
              {STATUS_LABELS[result.status] ?? result.status}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-medium text-muted-foreground">Fecha</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{formatDate(result.transactionDate)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {result.type === "transfer" ? "Cuenta origen" : "Cuenta"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{result.financialAccount?.name ?? "—"}</p>
          </CardContent>
        </Card>

        {result.type !== "transfer" && result.transactionCategory && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Categoría
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div
                  className="size-3 rounded-full"
                  style={{ background: result.transactionCategory.color ?? "#94a3b8" }}
                />
                <p className="text-sm font-medium">{result.transactionCategory.name}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Transfer pair card */}
      {result.type === "transfer" && pair && (
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Par de transferencia</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  {result.transferSide === "out" ? "Salida de" : "Entrada a"}
                </p>
                <p className="font-medium">{result.financialAccount?.name ?? "—"}</p>
              </div>
              <span className="text-muted-foreground">→</span>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  {pair.transferSide === "in" ? "Entrada a" : "Salida de"}
                </p>
                <p className="font-medium">{pair.financialAccount?.name ?? "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Danger zone */}
      <Separator />
      <div className="flex flex-col gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-destructive">Zona de riesgo</p>
          <p className="text-sm text-muted-foreground">
            {isCancelled
              ? "Esta transacción ya fue cancelada. Puedes eliminarla permanentemente."
              : "Cancelar revierte el efecto en el saldo. Eliminar borra el registro definitivamente."}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {!isCancelled && <CancelTransactionButton transactionId={id} />}
          <DeleteTransactionButton transactionId={id} />
        </div>
      </div>
    </div>
  );
}
