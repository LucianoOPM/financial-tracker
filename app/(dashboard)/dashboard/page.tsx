import { DollarSign, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@components/ui/card";

const statCards = [
  {
    label: "Saldo total",
    value: "—",
    description: "En todas tus cuentas",
    icon: DollarSign,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
  },
  {
    label: "Ingresos",
    value: "—",
    description: "Este mes",
    icon: TrendingUp,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
  },
  {
    label: "Gastos",
    value: "—",
    description: "Este mes",
    icon: TrendingDown,
    iconColor: "text-destructive",
    iconBg: "bg-destructive/10",
  },
  {
    label: "Ahorros",
    value: "—",
    description: "Acumulado",
    icon: PiggyBank,
    iconColor: "text-accent-foreground",
    iconBg: "bg-accent",
  },
] as const;

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">
          Resumen financiero
        </h1>
        <p className="text-sm text-muted-foreground">
          Vista general de tus finanzas personales
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(
          ({ label, value, description, icon: Icon, iconColor, iconBg }) => (
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
                <p className="font-mono text-2xl font-semibold tracking-tight">
                  {value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {description}
                </p>
              </CardContent>
            </Card>
          ),
        )}
      </div>
    </div>
  );
}
