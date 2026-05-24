import Link from "next/link";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";
import { auth } from "@lib/auth";
import { getRecurringById } from "@lib/data/recurring";
import { getActiveAccounts } from "@lib/data/accounts";
import { getActiveCategories } from "@lib/data/categories";
import { Button } from "@components/ui/button";
import { RecurringForm } from "../../components/RecurringForm";
import type { RecurringSchema } from "@lib/schemas/recurring";

interface EditRecurringPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRecurringPage({ params }: EditRecurringPageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { id } = await params;

  const [rec, accounts, categories] = await Promise.all([
    getRecurringById(session.user.id, id),
    getActiveAccounts(session.user.id),
    getActiveCategories(session.user.id),
  ]);

  if (!rec) notFound();

  const defaultValues: Partial<RecurringSchema> = {
    type: rec.type as RecurringSchema["type"],
    amount: parseFloat(rec.amount),
    description: rec.description ?? undefined,
    accountId: rec.accountId,
    destinationAccountId: rec.destinationAccountId ?? undefined,
    categoryId: rec.categoryId ?? undefined,
    frequency: rec.frequency as RecurringSchema["frequency"],
    intervalValue: rec.intervalValue,
    startDate: rec.startDate,
    endDate: rec.endDate ?? undefined,
    nextExecutionDate: rec.nextExecutionDate,
    isActive: rec.isActive,
    autoCreate: rec.autoCreate,
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
          <Link href={`/recurring/${id}`}>
            <ChevronLeftIcon data-icon="inline-start" />
            Volver a detalles
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Editar recurrente</h1>
        <p className="text-sm text-muted-foreground">
          Modifica la configuración de esta transacción periódica
        </p>
      </div>
      <RecurringForm
        mode="edit"
        recurringId={id}
        accounts={accounts}
        categories={categories}
        defaultValues={defaultValues}
      />
    </div>
  );
}
