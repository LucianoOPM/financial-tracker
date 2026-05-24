import type { FinancialAccountSelect } from "@db/schemas";
import { AccountCardPreview } from "./AccountCardPreview";
import { ReactivateAccountButton } from "./ReactivateAccountButton";
import { Badge } from "@components/ui/badge";

export function AccountCardInactive({ account }: { account: FinancialAccountSelect }) {
  return (
    <div className="group relative grayscale transition-all duration-300 hover:grayscale-0 hover:opacity-100 opacity-60 hover:opacity-90">
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

      {/* Badge "Inactiva" siempre visible */}
      <Badge
        variant="destructive"
        className="absolute right-3 top-3 pointer-events-none z-10"
      >
        Inactiva
      </Badge>

      {/* Backdrop en hover */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl bg-black/40 opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-hover:opacity-100"
      />

      {/* Botón Reactivar en hover */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <ReactivateAccountButton accountId={account.id} />
      </div>
    </div>
  );
}
