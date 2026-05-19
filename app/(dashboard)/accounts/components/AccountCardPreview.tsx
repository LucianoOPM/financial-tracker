import {
  type LucideIcon,
  Wallet,
  CreditCard,
  PiggyBank,
  Banknote,
  TrendingUp,
  Building2,
  DollarSign,
  Star,
  Coins,
} from "lucide-react";
import { type FinancialAccountSchema } from "@lib/schemas/financialAccount";

type AccountType = FinancialAccountSchema["type"];

const TYPE_ICONS: Record<AccountType, LucideIcon> = {
  debit: Wallet,
  credit: CreditCard,
  savings: PiggyBank,
  cash: Banknote,
  investment: TrendingUp,
};

const TYPE_GRADIENTS: Record<AccountType, [string, string]> = {
  debit: ["#3B82F6", "#1D4ED8"],
  credit: ["#1F2937", "#374151"],
  savings: ["#10B981", "#059669"],
  cash: ["#6B7280", "#374151"],
  investment: ["#8B5CF6", "#6D28D9"],
};

const TYPE_LABELS: Record<AccountType, string> = {
  debit: "Débito",
  credit: "Crédito",
  savings: "Ahorro",
  cash: "Efectivo",
  investment: "Inversión",
};

const ICON_MAP: Record<string, LucideIcon> = {
  wallet: Wallet,
  "credit-card": CreditCard,
  creditcard: CreditCard,
  "piggy-bank": PiggyBank,
  piggy: PiggyBank,
  cash: Banknote,
  banknote: Banknote,
  investment: TrendingUp,
  "trending-up": TrendingUp,
  trending: TrendingUp,
  bank: Building2,
  building: Building2,
  dollar: DollarSign,
  star: Star,
  coins: Coins,
};

const SHOW_CARD_NUMBER_TYPES: AccountType[] = ["debit", "credit", "savings"];

type AccountCardPreviewProps = {
  name?: string;
  type: AccountType;
  institutionName?: string;
  currentBalance?: number;
  lastFourDigits?: string;
  color?: string;
  gradientFrom?: string;
  gradientTo?: string;
  icon?: string;
};

export function AccountCardPreview({
  name,
  type,
  institutionName,
  currentBalance = 0,
  lastFourDigits,
  color,
  gradientFrom,
  gradientTo,
  icon,
}: AccountCardPreviewProps) {
  const [defaultFrom, defaultTo] = TYPE_GRADIENTS[type];
  const from = gradientFrom || color || defaultFrom;
  const to = gradientTo || color || defaultTo;

  const ResolvedIcon =
    (icon && ICON_MAP[icon.toLowerCase()]) || TYPE_ICONS[type];
  const showCardNumber = SHOW_CARD_NUMBER_TYPES.includes(type);
  const showChip = type === "credit" || type === "debit";

  const formattedBalance = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(Number(currentBalance) || 0);

  return (
    <div
      className="relative flex aspect-[1.586] w-full flex-col overflow-hidden rounded-2xl p-5 text-white shadow-xl"
      style={{
        background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
      }}
    >
      {/* Decorative circles */}
      <div className="absolute -right-10 -top-10 size-48 rounded-full bg-white/10" />
      <div className="absolute -bottom-14 -right-6 size-52 rounded-full bg-white/10" />

      {/* Header: Icon + Institution + Chip */}
      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-white/20">
            <ResolvedIcon className="size-4" />
          </div>
          {institutionName && (
            <span className="text-xs font-medium opacity-90">
              {institutionName}
            </span>
          )}
        </div>
        {showChip && (
          <div className="size-8 rounded-md bg-gradient-to-br from-yellow-200/80 to-yellow-500/60" />
        )}
      </div>

      {/* Account name */}
      <div className="relative mt-4">
        <p className="truncate text-sm font-semibold leading-tight">
          {name || (
            <span className="opacity-50">Nombre de la cuenta</span>
          )}
        </p>
      </div>

      {/* Card number */}
      {showCardNumber && (
        <div className="relative mt-2">
          <p className="font-mono text-xs tracking-widest opacity-70">
            {"●●●● ●●●● ●●●● "}
            <span className="opacity-100">
              {lastFourDigits || "••••"}
            </span>
          </p>
        </div>
      )}

      {/* Footer: Type + Balance */}
      <div className="relative mt-auto flex items-end justify-between">
        <span className="rounded bg-white/20 px-2 py-0.5 text-[10px] font-medium">
          {TYPE_LABELS[type]}
        </span>
        <div className="text-right">
          <p className="text-[10px] opacity-60">Saldo</p>
          <p className="text-sm font-bold leading-none">{formattedBalance}</p>
        </div>
      </div>
    </div>
  );
}
