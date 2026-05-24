"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, useWatch, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@components/ui/input-group";
import { Textarea } from "@components/ui/textarea";
import { Field, FieldGroup, FieldLabel, FieldError, FieldDescription } from "@components/ui/field";
import { Alert, AlertDescription } from "@components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@components/ui/card";
import { Badge } from "@components/ui/badge";
import { Switch } from "@components/ui/switch";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { recurringSchema, type RecurringSchema } from "@lib/schemas/recurring";
import { createRecurring, updateRecurring } from "@lib/actions/recurring";
import { DatePickerField } from "./DatePickerField";
import type { FinancialAccountSelect, TransactionCategorySelect } from "@db/schemas";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  income: "Ingreso",
  expense: "Gasto",
  transfer: "Transferencia",
};

function frequencyPreview(frequency: string, interval: number): string {
  if (interval === 1) {
    const labels: Record<string, string> = {
      daily: "Cada día",
      weekly: "Cada semana",
      monthly: "Cada mes",
      yearly: "Cada año",
    };
    return labels[frequency] ?? "";
  }
  const units: Record<string, string> = {
    daily: "días",
    weekly: "semanas",
    monthly: "meses",
    yearly: "años",
  };
  return `Cada ${interval} ${units[frequency] ?? ""}`;
}

function todayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface RecurringFormProps {
  mode: "create" | "edit";
  recurringId?: string;
  accounts: FinancialAccountSelect[];
  categories: TransactionCategorySelect[];
  defaultValues?: Partial<RecurringSchema>;
}

export function RecurringForm({
  mode,
  recurringId,
  accounts,
  categories,
  defaultValues,
}: RecurringFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const isEdit = mode === "edit";
  const isFirstRender = useRef(true);
  const today = todayString();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RecurringSchema>({
    resolver: zodResolver(recurringSchema) as Resolver<RecurringSchema>,
    defaultValues: isEdit
      ? {
          type: defaultValues?.type ?? "expense",
          amount: defaultValues?.amount ?? 0,
          description: defaultValues?.description ?? "",
          accountId: defaultValues?.accountId ?? "",
          destinationAccountId: defaultValues?.destinationAccountId ?? "",
          categoryId: defaultValues?.categoryId ?? "",
          frequency: defaultValues?.frequency ?? "monthly",
          intervalValue: defaultValues?.intervalValue ?? 1,
          startDate: defaultValues?.startDate ?? today,
          endDate: defaultValues?.endDate ?? "",
          nextExecutionDate: defaultValues?.nextExecutionDate ?? today,
          isActive: defaultValues?.isActive ?? true,
          autoCreate: defaultValues?.autoCreate ?? true,
        }
      : {
          type: "expense",
          amount: 0,
          description: "",
          accountId: "",
          destinationAccountId: "",
          categoryId: "",
          frequency: "monthly",
          intervalValue: 1,
          startDate: today,
          endDate: "",
          nextExecutionDate: today,
          isActive: true,
          autoCreate: true,
        },
  });

  const watchedType = useWatch({ control, name: "type" });
  const watchedAccountId = useWatch({ control, name: "accountId" });
  const watchedFrequency = useWatch({ control, name: "frequency" });
  const watchedInterval = useWatch({ control, name: "intervalValue" });
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

  const onSubmit = async (data: RecurringSchema) => {
    setServerError(null);
    if (isEdit && recurringId) {
      const result = await updateRecurring(recurringId, data);
      if (result?.error) setServerError(result.message);
    } else {
      const result = await createRecurring(data);
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

      {/* Card 1: Tipo y monto */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Tipo y monto</CardTitle>
          <CardDescription>Tipo de movimiento y cantidad</CardDescription>
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

      {/* Card 4: Descripción */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Descripción</CardTitle>
          <CardDescription>Nombre o nota para identificar esta recurrente</CardDescription>
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
                placeholder="Ej. Renta mensual, Suscripción Netflix..."
                rows={2}
                aria-invalid={!!errors.description}
              />
              <FieldError errors={[errors.description]} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Card 5: Programación */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Programación</CardTitle>
          <CardDescription>Frecuencia y fechas de ejecución</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Field data-invalid={!!errors.frequency}>
                <FieldLabel>Frecuencia</FieldLabel>
                <Controller
                  control={control}
                  name="frequency"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full" aria-invalid={!!errors.frequency}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="daily">Diaria</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="monthly">Mensual</SelectItem>
                          <SelectItem value="yearly">Anual</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.frequency]} />
              </Field>

              <Field data-invalid={!!errors.intervalValue}>
                <FieldLabel htmlFor="intervalValue">Cada</FieldLabel>
                <Input
                  id="intervalValue"
                  {...register("intervalValue")}
                  type="number"
                  min="1"
                  max="365"
                  aria-invalid={!!errors.intervalValue}
                />
                <FieldError errors={[errors.intervalValue]} />
              </Field>
            </div>

            {watchedFrequency && watchedInterval > 0 && (
              <p className="text-xs text-muted-foreground">
                {frequencyPreview(watchedFrequency, watchedInterval)}
              </p>
            )}

            <Field data-invalid={!!errors.startDate}>
              <FieldLabel>Fecha de inicio</FieldLabel>
              <Controller
                control={control}
                name="startDate"
                render={({ field }) => (
                  <DatePickerField
                    value={field.value}
                    onChange={field.onChange}
                    aria-invalid={!!errors.startDate}
                  />
                )}
              />
              <FieldError errors={[errors.startDate]} />
            </Field>

            <Field data-invalid={!!errors.nextExecutionDate}>
              <FieldLabel>
                Próxima ejecución
              </FieldLabel>
              <Controller
                control={control}
                name="nextExecutionDate"
                render={({ field }) => (
                  <DatePickerField
                    value={field.value}
                    onChange={field.onChange}
                    aria-invalid={!!errors.nextExecutionDate}
                  />
                )}
              />
              <FieldError errors={[errors.nextExecutionDate]} />
            </Field>

            <Field data-invalid={!!errors.endDate}>
              <FieldLabel>
                Fecha de fin{" "}
                <span className="font-normal text-muted-foreground">(opcional)</span>
              </FieldLabel>
              <Controller
                control={control}
                name="endDate"
                render={({ field }) => (
                  <DatePickerField
                    value={field.value || undefined}
                    onChange={field.onChange}
                    placeholder="Sin fecha límite"
                    aria-invalid={!!errors.endDate}
                  />
                )}
              />
              <FieldError errors={[errors.endDate]} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Card 6: Configuración */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Configuración</CardTitle>
          <CardDescription>Comportamiento de la transacción recurrente</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <FieldGroup>
            <Field orientation="horizontal">
              <FieldLabel>Estado activo</FieldLabel>
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-label="Estado activo"
                  />
                )}
              />
            </Field>

            <Field orientation="horizontal">
              <FieldLabel>Crear automáticamente</FieldLabel>
              <Controller
                control={control}
                name="autoCreate"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-label="Crear automáticamente"
                  />
                )}
              />
              <FieldDescription>
                Genera transacciones automáticamente al llegar la fecha programada
              </FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting
          ? "Guardando..."
          : isEdit
            ? "Guardar cambios"
            : "Crear recurrente"}
      </Button>
    </form>
  );
}
