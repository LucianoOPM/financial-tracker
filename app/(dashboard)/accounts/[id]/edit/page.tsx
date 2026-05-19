import Link from "next/link";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";
import { auth } from "@lib/auth";
import { getAccountById } from "@lib/data/accounts";
import { Button } from "@components/ui/button";
import AccountForm from "../../components/AccountForm";
import type { FinancialAccountSchema } from "@lib/schemas/financialAccount";

export default async function EditAccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const account = await getAccountById(session.user.id, id);
  if (!account) notFound();

  const defaultValues: Partial<FinancialAccountSchema> = {
    name: account.name,
    type: account.type,
    institutionName: account.institutionName ?? undefined,
    currentBalance: parseFloat(account.currentBalance),
    creditLimit: account.creditLimit ? parseFloat(account.creditLimit) : undefined,
    closingDay: account.closingDay ?? undefined,
    dueDay: account.dueDay ?? undefined,
    color: account.color ?? undefined,
    gradientFrom: account.gradientFrom ?? undefined,
    gradientTo: account.gradientTo ?? undefined,
    icon: account.icon ?? undefined,
    lastFourDigits: account.lastFourDigits ?? undefined,
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Button
          variant="ghost"
          size="xs"
          asChild
          className="-ml-1.5 mb-1 w-fit text-muted-foreground"
        >
          <Link href={`/accounts/${id}`}>
            <ChevronLeftIcon data-icon="inline-start" />
            Volver a la cuenta
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Editar cuenta</h1>
        <p className="text-sm text-muted-foreground">Modifica los datos de {account.name}</p>
      </div>
      <AccountForm mode="edit" accountId={id} defaultValues={defaultValues} />
    </div>
  );
}
