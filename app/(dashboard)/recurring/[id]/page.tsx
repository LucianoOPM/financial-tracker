import Link from "next/link";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import {
  ArrowLeftRight,
  Calendar,
  CalendarClock,
  ChevronLeftIcon,
  Pencil,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { auth } from "@lib/auth";
import { getRecurringById, getRecurringExecutions } from "@lib/data/recurring";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { cn } from "@lib/utils";
import { DeleteRecurringButton } from "./components/DeleteRecurringButton";
import { ToggleActiveButton } from "./components/ToggleActiveButton";
import { ExecuteRecurringButton } from "./components/ExecuteRecurringButton";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  income: {
    Icon: TrendingUp,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
    amountColor: "text-emerald-600",
    prefix: "+",
    label: "Ingreso",
    badgeClass: "bg-emerald-50 text-emerald-700",
  },
  expense: {
    Icon: TrendingDown,
    iconColor: "text-destructive",
    iconBg: "bg-destructive/10",
    amountColor: "text-destructive",
    prefix: "−",
    label: "Gasto",
    badgeClass: "bg-destructive/10 text-destructive",
  },
  transfer: {
    Icon: ArrowLeftRight,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
    amountColor: "text-blue-600",
    prefix: "±",
    label: "Transferencia",
    badgeClass: "bg-blue-50 text-blue-700",
  },
} as const;

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatFrequency(frequency: string, intervalValue: number): string {
  if (intervalValue === 1) {
    const labels: Record<string, string> = {
      daily: "Diaria",
      weekly: "Semanal",
      monthly: "Mensual",
      yearly: "Anual",
    };
    return labels[frequency] ?? frequency;
  }
  const units: Record<string, string> = {
    daily: "días",
    weekly: "semanas",
    monthly: "meses",
    yearly: "años",
  };
  return `Cada ${intervalValue} ${units[frequency] ?? ""}`;
}

const currencyFmt = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 2,
});

// ─── Page ─────────────────────────────────────────────────────────────────────

interface RecurringDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function RecurringDetailPage({ params }: RecurringDetailPageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { id } = await params;

  const [rec, executions] = await Promise.all([
    getRecurringById(session.user.id, id),
    getRecurringExecutions(id),
  ]);

  if (!rec) notFound();

  const config = TYPE_CONFIG[rec.type as keyof typeof TYPE_CONFIG];
  const { Icon } = config;
  const amount = parseFloat(rec.amount);

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="xs"
          asChild
          className="-ml-1.5 w-fit text-muted-foreground"
        >
          <Link href="/recurring">
            <ChevronLeftIcon data-icon="inline-start" />
            Volver a recurrentes
          </Link>
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Amount + description */}
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-full",
                config.iconBg,
              )}
            >
              <Icon className={cn("size-6", config.iconColor)} />
            </div>
            <div>
              <p
                className={cn(
                  "font-mono text-2xl font-bold tabular-nums",
                  config.amountColor,
                )}
              >
                {config.prefix}
                {currencyFmt.format(amount)}
              </p>
              <p className="text-sm text-muted-foreground">
                {rec.description ?? config.label}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/recurring/${id}/edit`}>
                <Pencil className="size-4" />
                Editar
              </Link>
            </Button>
            <ExecuteRecurringButton recurringId={id} isActive={rec.isActive} />
            <ToggleActiveButton recurringId={id} isActive={rec.isActive} />
            <DeleteRecurringButton recurringId={id} />
          </div>
        </div>
      </div>

      {/* Info grid */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Información</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">Tipo</dt>
              <dd>
                <Badge variant="secondary" className={config.badgeClass}>
                  {config.label}
                </Badge>
              </dd>
            </div>

            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">Estado</dt>
              <dd>
                <Badge
                  variant="secondary"
                  className={
                    rec.isActive
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-muted-foreground"
                  }
                >
                  {rec.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </dd>
            </div>

            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">Frecuencia</dt>
              <dd className="flex items-center gap-1.5 text-sm font-medium">
                <CalendarClock className="size-4 text-muted-foreground" />
                {formatFrequency(rec.frequency, rec.intervalValue)}
              </dd>
            </div>

            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">
                {rec.type === "transfer" ? "Cuenta origen" : "Cuenta"}
              </dt>
              <dd className="text-sm font-medium">
                {rec.financialAccount?.name ?? "—"}
              </dd>
            </div>

            {rec.type === "transfer" && (
              <div className="flex flex-col gap-1">
                <dt className="text-xs text-muted-foreground">Cuenta destino</dt>
                <dd className="text-sm font-medium">
                  {rec.destinationAccount?.name ?? "—"}
                </dd>
              </div>
            )}

            {rec.type !== "transfer" && rec.transactionCategory && (
              <div className="flex flex-col gap-1">
                <dt className="text-xs text-muted-foreground">Categoría</dt>
                <dd className="flex items-center gap-1.5 text-sm font-medium">
                  {rec.transactionCategory.color && (
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: rec.transactionCategory.color }}
                    />
                  )}
                  {rec.transactionCategory.name}
                </dd>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">Fecha de inicio</dt>
              <dd className="flex items-center gap-1.5 text-sm font-medium">
                <Calendar className="size-4 text-muted-foreground" />
                {formatDate(rec.startDate)}
              </dd>
            </div>

            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">Próxima ejecución</dt>
              <dd className="flex items-center gap-1.5 text-sm font-medium">
                <Calendar className="size-4 text-muted-foreground" />
                {formatDate(rec.nextExecutionDate)}
              </dd>
            </div>

            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">Fecha de fin</dt>
              <dd className="text-sm font-medium">
                {rec.endDate ? formatDate(rec.endDate) : "Sin fecha límite"}
              </dd>
            </div>

            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">Creación automática</dt>
              <dd className="text-sm font-medium">
                {rec.autoCreate ? "Activada" : "Desactivada"}
              </dd>
            </div>

            {rec.lastExecutedAt && (
              <div className="flex flex-col gap-1">
                <dt className="text-xs text-muted-foreground">Última ejecución</dt>
                <dd className="text-sm font-medium">
                  {rec.lastExecutedAt.toLocaleString("es-MX")}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Execution history */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Historial de ejecuciones</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {executions.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Sin ejecuciones registradas
            </p>
          ) : (
            <ul className="flex flex-col divide-y">
              {executions.map((exec) => (
                <li key={exec.id} className="flex items-start justify-between gap-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">
                      {exec.executedAt.toLocaleString("es-MX")}
                    </span>
                    {exec.errorMessage && (
                      <span className="text-xs text-destructive">{exec.errorMessage}</span>
                    )}
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn(
                      exec.status === "success"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-destructive/10 text-destructive",
                    )}
                  >
                    {exec.status === "success" ? "Exitosa" : "Fallida"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
