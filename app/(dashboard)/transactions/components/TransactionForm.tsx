"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, useWatch, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@components/ui/input-group";
import { Textarea } from "@components/ui/textarea";
import { Field, FieldGroup, FieldLabel, FieldError } from "@components/ui/field";
import { Alert, AlertDescription } from "@components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@components/ui/card";
import { Badge } from "@components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { transactionSchema, type TransactionSchema } from "@lib/schemas/transaction";
import { createTransaction, updateTransaction } from "@lib/actions/transactions";
import type { FinancialAccountSelect, TransactionCategorySelect } from "@db/schemas";

const TYPE_LABELS: Record<string, string> = {
  income: "Ingreso",
  expense: "Gasto",
  transfer: "Transferencia",
};

interface TransactionFormProps {
  mode: "create" | "edit";
  transactionId?: string;
  accounts: FinancialAccountSelect[];
  categories: TransactionCategorySelect[];
  defaultValues?: Partial<TransactionSchema>;
}

export function TransactionForm({
  mode,
  transactionId,
  accounts,
  categories,
  defaultValues,
}: TransactionFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const isEdit = mode === "edit";
  const isFirstRender = useRef(true);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TransactionSchema>({
    resolver: zodResolver(transactionSchema) as Resolver<TransactionSchema>,
    defaultValues: isEdit
      ? {
          type: defaultValues?.type ?? "expense",
          amount: defaultValues?.amount ?? 0,
          description: defaultValues?.description ?? "",
          transactionDate: defaultValues?.transactionDate ?? new Date(),
          status: defaultValues?.status ?? "completed",
          accountId: defaultValues?.accountId ?? "",
          categoryId: defaultValues?.categoryId ?? "",
          destinationAccountId: defaultValues?.destinationAccountId ?? "",
        }
      : {
          type: "expense",
          amount: 0,
          description: "",
          transactionDate: new Date(),
          status: "completed",
          accountId: "",
          categoryId: "",
          destinationAccountId: "",
        },
  });

  const watchedType = useWatch({ control, name: "type" });
  const watchedAccountId = useWatch({ control, name: "accountId" });
  const isTransfer = watchedType === "transfer";

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (isTransfer) {
      setValue("categoryId", "");
    } else {
      setValue("destinationAccountId", "");
    }
  }, [isTransfer, setValue]);

  const filteredCategories = categories.filter((c) => c.type === watchedType);
  const destinationOptions = accounts.filter((a) => a.id !== watchedAccountId);

  const onSubmit = async (data: TransactionSchema) => {
    setServerError(null);
    if (isEdit && transactionId) {
      const result = await updateTransaction(transactionId, data);
      if (result?.error) setServerError(result.message);
    } else {
      const result = await createTransaction(data);
      if (result?.error) setServerError(result.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {isEdit && <input type="hidden" {...register("type")} />}

      {serverError && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      {/* Card 1: Detalles */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Detalles</CardTitle>
          <CardDescription>Tipo, monto y fecha de la transacción</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <FieldGroup>
            <Field data-invalid={!!errors.type}>
              <FieldLabel>Tipo de transacción</FieldLabel>
              {isEdit ? (
                <div className="flex h-9 items-center">
                  <Badge variant="secondary">{TYPE_LABELS[watchedType] ?? watchedType}</Badge>
                </div>
              ) : (
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full" aria-invalid={!!errors.type}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="income">Ingreso</SelectItem>
                          <SelectItem value="expense">Gasto</SelectItem>
                          <SelectItem value="transfer">Transferencia</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
              <FieldError errors={[errors.type]} />
            </Field>

            <Field data-invalid={!!errors.amount}>
              <FieldLabel htmlFor="amount">Monto</FieldLabel>
              <InputGroup>
                <InputGroupAddon>$</InputGroupAddon>
                <InputGroupInput
                  id="amount"
                  {...register("amount")}
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  aria-invalid={!!errors.amount}
                />
              </InputGroup>
              <FieldError errors={[errors.amount]} />
            </Field>

            <Field data-invalid={!!errors.transactionDate}>
              <FieldLabel htmlFor="transactionDate">Fecha</FieldLabel>
              <Controller
                control={control}
                name="transactionDate"
                render={({ field }) => (
                  <Input
                    id="transactionDate"
                    type="date"
                    aria-invalid={!!errors.transactionDate}
                    value={
                      field.value instanceof Date
                        ? field.value.toISOString().slice(0, 10)
                        : String(field.value ?? "")
                    }
                    onChange={(e) => field.onChange(new Date(e.target.value + "T12:00:00"))}
                  />
                )}
              />
              <FieldError errors={[errors.transactionDate]} />
            </Field>

            <Field data-invalid={!!errors.status}>
              <FieldLabel>Estado</FieldLabel>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full" aria-invalid={!!errors.status}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="completed">Completada</SelectItem>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="cancelled">Cancelada</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.status]} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Card 2: Cuentas */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Cuentas</CardTitle>
          <CardDescription>
            {isTransfer
              ? "Cuenta origen y destino de la transferencia"
              : "Cuenta financiera de esta transacción"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <FieldGroup>
            <Field data-invalid={!!errors.accountId}>
              <FieldLabel>{isTransfer ? "Cuenta origen" : "Cuenta"}</FieldLabel>
              <Controller
                control={control}
                name="accountId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full" aria-invalid={!!errors.accountId}>
                      <SelectValue placeholder="Selecciona una cuenta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.accountId]} />
            </Field>

            {isTransfer && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <Field data-invalid={!!errors.destinationAccountId}>
                  <FieldLabel>Cuenta destino</FieldLabel>
                  <Controller
                    control={control}
                    name="destinationAccountId"
                    render={({ field }) => (
                      <Select value={field.value ?? ""} onValueChange={field.onChange}>
                        <SelectTrigger
                          className="w-full"
                          aria-invalid={!!errors.destinationAccountId}
                        >
                          <SelectValue placeholder="Selecciona una cuenta destino" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {destinationOptions.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError errors={[errors.destinationAccountId]} />
                </Field>
              </div>
            )}
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Card 3: Categoría (oculta para transferencias) */}
      {!isTransfer && (
        <Card className="animate-in fade-in slide-in-from-top-2 duration-200">
          <CardHeader className="border-b">
            <CardTitle>Categoría</CardTitle>
            <CardDescription>Clasifica esta transacción</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <FieldGroup>
              <Field data-invalid={!!errors.categoryId}>
                <FieldLabel>
                  Categoría{" "}
                  <span className="font-normal text-muted-foreground">(opcional)</span>
                </FieldLabel>
                <Controller
                  control={control}
                  name="categoryId"
                  render={({ field }) => (
                    <Select
                      value={field.value || "__none__"}
                      onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}
                    >
                      <SelectTrigger className="w-full" aria-invalid={!!errors.categoryId}>
                        <SelectValue placeholder="Sin categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="__none__">Sin categoría</SelectItem>
                          {filteredCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.categoryId]} />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
      )}

      {/* Card 4: Notas */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Notas</CardTitle>
          <CardDescription>Descripción opcional de la transacción</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <FieldGroup>
            <Field data-invalid={!!errors.description}>
              <FieldLabel htmlFor="description">
                Descripción{" "}
                <span className="font-normal text-muted-foreground">(opcional)</span>
              </FieldLabel>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Ej. Supermercado del mes, Pago de nómina..."
                rows={3}
                aria-invalid={!!errors.description}
              />
              <FieldError errors={[errors.description]} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting
          ? isEdit
            ? "Guardando..."
            : "Creando transacción..."
          : isEdit
            ? "Guardar cambios"
            : "Crear transacción"}
      </Button>
    </form>
  );
}
