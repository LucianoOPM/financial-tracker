"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftRight,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Eye,
  MoreHorizontal,
  PauseCircle,
  Pencil,
  Play,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { cn } from "@lib/utils";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import {
  deactivateRecurring,
  deleteRecurring,
  manualExecuteRecurring,
  reactivateRecurring,
} from "@lib/actions/recurring";
import type { RecurringWithRelations } from "@lib/data/recurring";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFrequency(frequency: string, intervalValue: number): string {
  if (intervalValue === 1) {
    const labels: Record<string, string> = {
      daily: "Diario",
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
  return `Cada ${intervalValue} ${units[frequency] ?? frequency}`;
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const currencyFmt = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 2,
});

// ─── Type config ──────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  income: {
    Icon: TrendingUp,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
    borderColor: "border-l-emerald-500",
    amountColor: "text-emerald-600",
    prefix: "+",
    label: "Ingreso",
  },
  expense: {
    Icon: TrendingDown,
    iconColor: "text-destructive",
    iconBg: "bg-destructive/10",
    borderColor: "border-l-destructive",
    amountColor: "text-destructive",
    prefix: "−",
    label: "Gasto",
  },
  transfer: {
    Icon: ArrowLeftRight,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
    borderColor: "border-l-blue-500",
    amountColor: "text-blue-600",
    prefix: "±",
    label: "Transferencia",
  },
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

interface RecurringCardProps {
  recurring: RecurringWithRelations;
}

export function RecurringCard({ recurring }: RecurringCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDelete, setShowDelete] = useState(false);

  const config = TYPE_CONFIG[recurring.type as keyof typeof TYPE_CONFIG];
  const { Icon } = config;
  const amount = parseFloat(recurring.amount);

  const accountLabel =
    recurring.type === "transfer" && recurring.destinationAccount
      ? `${recurring.financialAccount?.name ?? "—"} → ${recurring.destinationAccount.name}`
      : (recurring.financialAccount?.name ?? "—");

  function handleToggleActive() {
    startTransition(async () => {
      if (recurring.isActive) {
        await deactivateRecurring(recurring.id);
      } else {
        await reactivateRecurring(recurring.id);
      }
      router.refresh();
    });
  }

  function handleExecute() {
    startTransition(async () => {
      await manualExecuteRecurring(recurring.id);
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteRecurring(recurring.id);
    });
  }

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-3 rounded-md border border-l-4 bg-card p-4 transition-all duration-150",
          "hover:bg-muted/30",
          config.borderColor,
          !recurring.isActive && "opacity-60",
          isPending && "pointer-events-none opacity-50",
        )}
      >
        {/* Type icon */}
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full",
            config.iconBg,
          )}
        >
          <Icon className={cn("size-5", config.iconColor)} />
        </div>

        {/* Main info */}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="truncate text-sm font-medium">
            {recurring.description ?? config.label}
          </p>
          <p className="truncate text-xs text-muted-foreground">{accountLabel}</p>
          {/* Frequency visible only on mobile */}
          <div className="mt-0.5 flex items-center gap-1 sm:hidden">
            <CalendarClock className="size-3 shrink-0 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {formatFrequency(recurring.frequency, recurring.intervalValue)}
            </span>
          </div>
        </div>

        {/* Frequency + Next date (desktop) */}
        <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
          <div className="flex items-center gap-1">
            <CalendarClock className="size-3 text-muted-foreground" />
            <span className="text-xs font-medium">
              {formatFrequency(recurring.frequency, recurring.intervalValue)}
            </span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="size-3" />
            <span className="text-xs">
              Próx: {formatDate(recurring.nextExecutionDate)}
            </span>
          </div>
        </div>

        {/* Amount + Status badge */}
        <div className="shrink-0 text-right">
          <p
            className={cn(
              "font-mono text-sm font-semibold tabular-nums",
              config.amountColor,
            )}
          >
            {config.prefix}
            {currencyFmt.format(amount)}
          </p>
          <Badge
            variant="secondary"
            className={cn(
              "mt-1 text-xs",
              recurring.isActive
                ? "bg-emerald-50 text-emerald-700"
                : "text-muted-foreground",
            )}
          >
            {recurring.isActive ? "Activo" : "Inactivo"}
          </Badge>
        </div>

        {/* Actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              aria-label="Opciones de transacción recurrente"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem asChild>
              <Link href={`/recurring/${recurring.id}`}>
                <Eye className="size-4" />
                Ver detalles
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/recurring/${recurring.id}/edit`}>
                <Pencil className="size-4" />
                Editar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleExecute}
              disabled={isPending || !recurring.isActive}
            >
              <Play className="size-4" />
              Ejecutar ahora
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleToggleActive} disabled={isPending}>
              {recurring.isActive ? (
                <PauseCircle className="size-4" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              {recurring.isActive ? "Desactivar" : "Activar"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setShowDelete(true)}
              disabled={isPending}
            >
              <Trash2 className="size-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10">
              <Trash2 className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>¿Eliminar recurrente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es permanente. Se eliminará la regla y todo su historial de
              ejecuciones.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
