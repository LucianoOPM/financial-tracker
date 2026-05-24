"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Button } from "@components/ui/button";

interface RecurringFiltersProps {
  activeType?: string;
  activeStatus?: string;
}

export function RecurringFilters({ activeType, activeStatus }: RecurringFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setFilter(key: "type" | "status", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  const hasFilters = !!activeType || !!activeStatus;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={activeType ?? "all"} onValueChange={(v) => setFilter("type", v)}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Todos los tipos" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="income">Ingreso</SelectItem>
            <SelectItem value="expense">Gasto</SelectItem>
            <SelectItem value="transfer">Transferencia</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select value={activeStatus ?? "all"} onValueChange={(v) => setFilter("status", v)}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Todos los estados" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="active">Activo</SelectItem>
            <SelectItem value="inactive">Inactivo</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={() => router.push(pathname)}>
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}
