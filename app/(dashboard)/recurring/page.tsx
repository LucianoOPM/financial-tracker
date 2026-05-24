import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { auth } from "@lib/auth";
import { getAllRecurring } from "@lib/data/recurring";
import { Button } from "@components/ui/button";
import { RecurringCard } from "./components/RecurringCard";
import { RecurringFilters } from "./components/RecurringFilters";
import { RecurringStats } from "./components/RecurringStats";

type FilterType = "income" | "expense" | "transfer";

export default async function RecurringPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { type, status } = await searchParams;

  const all = await getAllRecurring(session.user.id);

  const filtered = all.filter((r) => {
    if (type && type !== "all") {
      if (r.type !== (type as FilterType)) return false;
    }
    if (status && status !== "all") {
      const wantActive = status === "active";
      if (r.isActive !== wantActive) return false;
    }
    return true;
  });

  const hasFilters = !!(type && type !== "all") || !!(status && status !== "all");

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Recurrentes</h1>
          <p className="text-sm text-muted-foreground">
            Administra tus transacciones periódicas
          </p>
        </div>
        <Button asChild>
          <Link href="/recurring/create">Nueva recurrente</Link>
        </Button>
      </div>

      {/* Stats — always based on all records, not filtered */}
      <RecurringStats recurring={all} />

      {/* Filters */}
      <RecurringFilters activeType={type} activeStatus={status} />

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <RefreshCw className="size-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">
              {hasFilters
                ? "Sin resultados para los filtros aplicados"
                : "No hay transacciones recurrentes"}
            </p>
            <p className="text-sm text-muted-foreground">
              {hasFilters
                ? "Prueba ajustando o limpiando los filtros"
                : "Configura pagos periódicos para automatizar tus finanzas"}
            </p>
          </div>
          {!hasFilters && (
            <Button asChild>
              <Link href="/recurring/create">Nueva recurrente</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((r) => (
            <RecurringCard key={r.id} recurring={r} />
          ))}
        </div>
      )}
    </div>
  );
}
