import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Wallet } from "lucide-react";
import { auth } from "@lib/auth";
import { getActiveAccounts, getInactiveAccounts } from "@lib/data/accounts";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { Separator } from "@components/ui/separator";
import { AccountCard } from "./components/AccountCard";
import { AccountCardInactive } from "./components/AccountCardInactive";

export default async function AccountsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const [accounts, inactiveAccounts] = await Promise.all([
    getActiveAccounts(session.user.id),
    getInactiveAccounts(session.user.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Cuentas</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona tus cuentas financieras
          </p>
        </div>
        <Button asChild>
          <Link href="/accounts/create">Nueva cuenta</Link>
        </Button>
      </div>

      {accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Wallet className="size-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">No tienes cuentas aún</p>
            <p className="text-sm text-muted-foreground">
              Crea tu primera cuenta financiera para comenzar
            </p>
          </div>
          <Button asChild>
            <Link href="/accounts/create">Nueva cuenta</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      )}

      {inactiveAccounts.length > 0 && (
        <>
          <Separator />
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-medium text-muted-foreground">Cuentas inactivas</h2>
              <Badge variant="secondary">{inactiveAccounts.length}</Badge>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {inactiveAccounts.map((account) => (
                <AccountCardInactive key={account.id} account={account} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
