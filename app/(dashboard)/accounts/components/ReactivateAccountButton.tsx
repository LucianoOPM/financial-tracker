"use client";

import { useTransition } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { reactivateAccount } from "@lib/actions/accounts";

export function ReactivateAccountButton({ accountId }: { accountId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await reactivateAccount(accountId);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/30 transition-all duration-150 hover:bg-white/25 active:scale-95 disabled:pointer-events-none disabled:opacity-60"
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <RefreshCw className="size-4" />
      )}
      {isPending ? "Reactivando..." : "Reactivar cuenta"}
    </button>
  );
}
