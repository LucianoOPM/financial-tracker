"use client";

import Link from "next/link";
import { Eye, Pencil } from "lucide-react";
import type { FinancialAccountSelect } from "@db/schemas";
import { AccountCardPreview } from "./AccountCardPreview";

export function AccountCard({ account }: { account: FinancialAccountSelect }) {
  return (
    <div className="group relative">
      <AccountCardPreview
        name={account.name}
        type={account.type}
        institutionName={account.institutionName ?? undefined}
        currentBalance={Number(account.currentBalance)}
        lastFourDigits={account.lastFourDigits ?? undefined}
        color={account.color ?? undefined}
        gradientFrom={account.gradientFrom ?? undefined}
        gradientTo={account.gradientTo ?? undefined}
        icon={account.icon ?? undefined}
      />
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl bg-black/40 opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100"
      />
      {/* Actions */}
      <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100">
        <Link
          href={`/accounts/${account.id}`}
          aria-label={`Ver detalles de ${account.name}`}
          className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/30 transition-all duration-150 hover:bg-white/25 active:scale-95"
        >
          <Eye className="size-4" />
          Ver detalles
        </Link>
        <Link
          href={`/accounts/${account.id}/edit`}
          aria-label={`Editar ${account.name}`}
          className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/30 transition-all duration-150 hover:bg-white/25 active:scale-95"
        >
          <Pencil className="size-4" />
          Editar
        </Link>
      </div>
    </div>
  );
}
