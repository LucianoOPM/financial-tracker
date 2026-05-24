import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";
import { auth } from "@lib/auth";
import { getActiveAccounts } from "@lib/data/accounts";
import { getActiveCategories } from "@lib/data/categories";
import { Button } from "@components/ui/button";
import { RecurringForm } from "../components/RecurringForm";

export default async function CreateRecurringPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const [accounts, categories] = await Promise.all([
    getActiveAccounts(session.user.id),
    getActiveCategories(session.user.id),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Button
          variant="ghost"
          size="xs"
          asChild
          className="-ml-1.5 mb-1 w-fit text-muted-foreground"
        >
          <Link href="/recurring">
            <ChevronLeftIcon data-icon="inline-start" />
            Volver a recurrentes
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Nueva recurrente</h1>
        <p className="text-sm text-muted-foreground">
          Configura un pago o ingreso periódico
        </p>
      </div>
      <RecurringForm mode="create" accounts={accounts} categories={categories} />
    </div>
  );
}
