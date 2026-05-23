import Link from "next/link";
import { Badge } from "@components/ui/badge";
import type { TransactionWithRelations } from "@lib/data/transactions";

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

const TYPE_DOT: Record<string, string> = {
  income: "bg-emerald-500",
  expense: "bg-destructive",
  transfer: "bg-blue-500",
};

const TYPE_AMOUNT: Record<string, string> = {
  income: "text-emerald-600",
  expense: "text-destructive",
  transfer: "text-blue-600",
};

function formatMXN(value: number): string {
  return value.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function TransactionRow({ transaction: tx }: { transaction: TransactionWithRelations }) {
  const amount = parseFloat(String(tx.amount));

  return (
    <li>
      <Link
        href={`/transactions/${tx.id}`}
        className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50"
      >
        <div className={`size-2 shrink-0 rounded-full ${TYPE_DOT[tx.type] ?? "bg-muted-foreground"}`} />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{tx.description ?? "Sin descripción"}</p>
          <p className="text-xs text-muted-foreground">
            {formatDate(tx.transactionDate)} · {tx.financialAccount?.name ?? "—"}
          </p>
        </div>

        {tx.type !== "transfer" && (
          <div className="hidden items-center gap-1.5 sm:flex">
            <div
              className="size-2 rounded-full"
              style={{ background: tx.transactionCategory?.color ?? "#94a3b8" }}
            />
            <span className="text-xs text-muted-foreground">
              {tx.transactionCategory?.name ?? "Sin categoría"}
            </span>
          </div>
        )}

        <Badge variant="secondary" className="hidden shrink-0 md:inline-flex">
          {TYPE_LABELS[tx.type] ?? tx.type}
        </Badge>

        <Badge variant={STATUS_VARIANTS[tx.status] ?? "outline"} className="shrink-0">
          {STATUS_LABELS[tx.status] ?? tx.status}
        </Badge>

        <p
          className={`shrink-0 font-mono text-sm font-semibold tabular-nums ${TYPE_AMOUNT[tx.type] ?? ""}`}
        >
          {tx.type === "income" ? "+" : tx.type === "expense" ? "−" : ""}
          {formatMXN(amount)}
        </p>
      </Link>
    </li>
  );
}
