import { RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import type { RecurringWithRelations } from "@lib/data/recurring";

function toMonthlyAmount(
  amount: number,
  frequency: string,
  intervalValue: number,
): number {
  switch (frequency) {
    case "daily":
      return (amount / intervalValue) * 30;
    case "weekly":
      return (amount / intervalValue) * (52 / 12);
    case "monthly":
      return amount / intervalValue;
    case "yearly":
      return (amount / intervalValue) / 12;
    default:
      return 0;
  }
}

const currencyFmt = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

interface RecurringStatsProps {
  recurring: RecurringWithRelations[];
}

export function RecurringStats({ recurring }: RecurringStatsProps) {
  const active = recurring.filter((r) => r.isActive);

  const monthlyIncome = active
    .filter((r) => r.type === "income")
    .reduce(
      (sum, r) =>
        sum + toMonthlyAmount(parseFloat(r.amount), r.frequency, r.intervalValue),
      0,
    );

  const monthlyExpense = active
    .filter((r) => r.type === "expense")
    .reduce(
      (sum, r) =>
        sum + toMonthlyAmount(parseFloat(r.amount), r.frequency, r.intervalValue),
      0,
    );

  const stats = [
    {
      label: "Recurrentes activas",
      value: String(active.length),
      description: `${recurring.length} registrada${recurring.length === 1 ? "" : "s"} en total`,
      icon: RefreshCw,
      iconColor: "text-primary",
      iconBg: "bg-primary/10",
    },
    {
      label: "Ingreso mensual",
      value: currencyFmt.format(monthlyIncome),
      description: "Proyección de ingresos",
      icon: TrendingUp,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50",
    },
    {
      label: "Gasto mensual",
      value: currencyFmt.format(monthlyExpense),
      description: "Proyección de gastos",
      icon: TrendingDown,
      iconColor: "text-destructive",
      iconBg: "bg-destructive/10",
    },
  ] as const;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {stats.map(({ label, value, description, icon: Icon, iconColor, iconBg }) => (
        <Card key={label}>
          <CardHeader>
            <CardTitle className="font-sans text-xs font-medium text-muted-foreground">
              {label}
            </CardTitle>
            <CardAction>
              <div
                className={`flex size-8 items-center justify-center rounded ${iconBg}`}
              >
                <Icon className={`size-4 ${iconColor}`} />
              </div>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-semibold tracking-tight">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
