"use client";

import { useState } from "react";
import {
  useForm,
  useWatch,
  Controller,
  type Resolver,
  type UseFormRegisterReturn,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@components/ui/input-group";
import { Field, FieldGroup, FieldLabel, FieldError, FieldDescription } from "@components/ui/field";
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
import { financialAccountSchema, type FinancialAccountSchema } from "@lib/schemas/financialAccount";
import { createAccount, updateAccount } from "@lib/actions/accounts";
import { AccountCardPreview } from "./AccountCardPreview";

const ACCOUNT_TYPE_LABELS: Record<FinancialAccountSchema["type"], string> = {
  debit: "Débito",
  credit: "Crédito",
  savings: "Ahorro",
  cash: "Efectivo",
  investment: "Inversión",
};

interface AccountFormProps {
  mode?: "create" | "edit";
  accountId?: string;
  defaultValues?: Partial<FinancialAccountSchema>;
}

const AccountForm = ({ mode = "create", accountId, defaultValues }: AccountFormProps) => {
  const [serverError, setServerError] = useState<string | null>(null);
  const isEdit = mode === "edit";

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FinancialAccountSchema>({
    resolver: zodResolver(financialAccountSchema) as Resolver<FinancialAccountSchema>,
    defaultValues: isEdit
      ? {
          name: defaultValues?.name ?? "",
          type: defaultValues?.type ?? "debit",
          institutionName: defaultValues?.institutionName ?? "",
          currentBalance: defaultValues?.currentBalance ?? 0,
          creditLimit: defaultValues?.creditLimit,
          closingDay: defaultValues?.closingDay,
          dueDay: defaultValues?.dueDay,
          color: defaultValues?.color ?? "",
          gradientFrom: defaultValues?.gradientFrom ?? "",
          gradientTo: defaultValues?.gradientTo ?? "",
          icon: defaultValues?.icon ?? "",
          lastFourDigits: defaultValues?.lastFourDigits ?? "",
        }
      : {
          name: "",
          type: "debit",
          institutionName: "",
          currentBalance: 0,
          creditLimit: undefined,
          closingDay: undefined,
          dueDay: undefined,
          color: "",
          gradientFrom: "",
          gradientTo: "",
          icon: "",
          lastFourDigits: "",
        },
  });

  const watched = useWatch({ control });
  const accountType = (watched.type ?? "debit") as FinancialAccountSchema["type"];
  const isCredit = accountType === "credit";
  const hasCardNumber =
    accountType === "debit" || accountType === "credit" || accountType === "savings";

  const getColorValue = (field: "color" | "gradientFrom" | "gradientTo") => watched[field] ?? "";

  const onSubmit = async (data: FinancialAccountSchema) => {
    setServerError(null);
    if (isEdit && accountId) {
      const result = await updateAccount(accountId, data);
      if (result?.error) setServerError(result.error);
    } else {
      const result = await createAccount(data);
      if (result?.error) setServerError(result.error);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]"
    >
      {isEdit && <input type="hidden" {...register("type")} />}

      {/* ── Left column: form sections ── */}
      <div className="flex flex-col gap-4">
        {serverError && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        {/* Sección 1: Información básica */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Información básica</CardTitle>
            <CardDescription>Los datos principales de tu cuenta</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <FieldGroup>
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="name">Nombre de la cuenta</FieldLabel>
                <Input
                  id="name"
                  {...register("name")}
                  type="text"
                  placeholder="Ej. Cuenta corriente BBVA"
                  aria-invalid={!!errors.name}
                />
                <FieldError errors={[errors.name]} />
              </Field>

              {isEdit ? (
                <Field>
                  <FieldLabel>Tipo de cuenta</FieldLabel>
                  <div className="flex h-9 items-center">
                    <Badge variant="secondary">{ACCOUNT_TYPE_LABELS[accountType]}</Badge>
                  </div>
                </Field>
              ) : (
                <Field data-invalid={!!errors.type}>
                  <FieldLabel>Tipo de cuenta</FieldLabel>
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
                            {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError errors={[errors.type]} />
                </Field>
              )}

              <Field data-invalid={!!errors.institutionName}>
                <FieldLabel htmlFor="institutionName">
                  Institución <span className="font-normal text-muted-foreground">(opcional)</span>
                </FieldLabel>
                <Input
                  id="institutionName"
                  {...register("institutionName")}
                  type="text"
                  placeholder="Ej. BBVA, Santander"
                  aria-invalid={!!errors.institutionName}
                />
                <FieldError errors={[errors.institutionName]} />
              </Field>

              <Field data-invalid={!!errors.currentBalance}>
                <FieldLabel htmlFor="currentBalance">Saldo actual</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>$</InputGroupAddon>
                  <InputGroupInput
                    id="currentBalance"
                    {...register("currentBalance")}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    aria-invalid={!!errors.currentBalance}
                  />
                </InputGroup>
                <FieldError errors={[errors.currentBalance]} />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        {/* Sección 2: Crédito (condicional) */}
        {isCredit && (
          <Card className="animate-in fade-in slide-in-from-top-2 duration-200">
            <CardHeader className="border-b">
              <CardTitle>Detalles de crédito</CardTitle>
              <CardDescription>Configuración de tu tarjeta de crédito</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <FieldGroup>
                <Field data-invalid={!!errors.creditLimit}>
                  <FieldLabel htmlFor="creditLimit">Límite de crédito</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>$</InputGroupAddon>
                    <InputGroupInput
                      id="creditLimit"
                      {...register("creditLimit")}
                      type="number"
                      step="0.01"
                      placeholder="Ej. 10000.00"
                      aria-invalid={!!errors.creditLimit}
                    />
                  </InputGroup>
                  <FieldError errors={[errors.creditLimit]} />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field data-invalid={!!errors.closingDay}>
                    <FieldLabel htmlFor="closingDay">Día de cierre</FieldLabel>
                    <Input
                      id="closingDay"
                      {...register("closingDay")}
                      type="number"
                      min="1"
                      max="31"
                      placeholder="Ej. 15"
                      aria-invalid={!!errors.closingDay}
                    />
                    <FieldError errors={[errors.closingDay]} />
                  </Field>

                  <Field data-invalid={!!errors.dueDay}>
                    <FieldLabel htmlFor="dueDay">Día de pago</FieldLabel>
                    <Input
                      id="dueDay"
                      {...register("dueDay")}
                      type="number"
                      min="1"
                      max="31"
                      placeholder="Ej. 20"
                      aria-invalid={!!errors.dueDay}
                    />
                    <FieldError errors={[errors.dueDay]} />
                  </Field>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>
        )}

        {/* Sección 3: Últimos 4 dígitos (condicional) */}
        {hasCardNumber && (
          <Card className="animate-in fade-in slide-in-from-top-2 duration-200">
            <CardHeader className="border-b">
              <CardTitle>Número de tarjeta</CardTitle>
              <CardDescription>Identifica tu tarjeta con sus últimos dígitos</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <FieldGroup>
                <Field data-invalid={!!errors.lastFourDigits}>
                  <FieldLabel htmlFor="lastFourDigits">
                    Últimos 4 dígitos{" "}
                    <span className="font-normal text-muted-foreground">(opcional)</span>
                  </FieldLabel>
                  <Input
                    id="lastFourDigits"
                    {...register("lastFourDigits")}
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="Ej. 1234"
                    aria-invalid={!!errors.lastFourDigits}
                  />
                  <FieldDescription>Se mostrará en la vista previa de tu tarjeta.</FieldDescription>
                  <FieldError errors={[errors.lastFourDigits]} />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>
        )}

        {/* Sección 4: Personalización */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Personalización</CardTitle>
            <CardDescription>Ajusta el aspecto visual de tu cuenta</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <FieldGroup>
              <ColorField
                id="color"
                label="Color"
                placeholder="#6366F1"
                registration={register("color")}
                error={errors.color}
                currentValue={getColorValue("color")}
                defaultPickerColor="#6366f1"
                onColorPick={(hex) => setValue("color", hex, { shouldValidate: true })}
              />

              <ColorField
                id="gradientFrom"
                label="Gradiente inicio"
                placeholder="#6366F1"
                registration={register("gradientFrom")}
                error={errors.gradientFrom}
                currentValue={getColorValue("gradientFrom")}
                defaultPickerColor="#6366f1"
                onColorPick={(hex) => setValue("gradientFrom", hex, { shouldValidate: true })}
              />

              <ColorField
                id="gradientTo"
                label="Gradiente fin"
                placeholder="#8B5CF6"
                registration={register("gradientTo")}
                error={errors.gradientTo}
                currentValue={getColorValue("gradientTo")}
                defaultPickerColor="#8b5cf6"
                onColorPick={(hex) => setValue("gradientTo", hex, { shouldValidate: true })}
              />

              <Field data-invalid={!!errors.icon}>
                <FieldLabel htmlFor="icon">
                  Icono <span className="font-normal text-muted-foreground">(opcional)</span>
                </FieldLabel>
                <Input
                  id="icon"
                  {...register("icon")}
                  type="text"
                  placeholder="wallet"
                  aria-invalid={!!errors.icon}
                />
                <FieldDescription>
                  Opciones: wallet, credit-card, piggy-bank, banknote, trending-up, bank, dollar,
                  star, coins
                </FieldDescription>
                <FieldError errors={[errors.icon]} />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting
            ? isEdit
              ? "Guardando..."
              : "Creando cuenta..."
            : isEdit
              ? "Guardar cambios"
              : "Crear cuenta"}
        </Button>
      </div>

      {/* ── Right column: sticky preview ── */}
      <div className="hidden lg:flex lg:flex-col">
        <div className="sticky top-6 flex flex-col gap-3">
          <p className="text-sm font-medium">Vista previa</p>
          <AccountCardPreview
            name={watched.name}
            type={accountType}
            institutionName={watched.institutionName}
            currentBalance={Number(watched.currentBalance) || 0}
            lastFourDigits={watched.lastFourDigits}
            color={watched.color}
            gradientFrom={watched.gradientFrom}
            gradientTo={watched.gradientTo}
            icon={watched.icon}
          />
          <p className="text-xs text-muted-foreground">
            La vista previa se actualiza en tiempo real mientras completas el formulario.
          </p>
        </div>
      </div>
    </form>
  );
};

/* ── ColorField: input with visual color picker swatch ── */
type ColorFieldProps = {
  id: string;
  label: string;
  placeholder: string;
  registration: UseFormRegisterReturn<string>;
  error: { message?: string } | undefined;
  currentValue: string;
  defaultPickerColor: string;
  onColorPick: (hex: string) => void;
};

function ColorField({
  id,
  label,
  placeholder,
  registration,
  error,
  currentValue,
  defaultPickerColor,
  onColorPick,
}: ColorFieldProps) {
  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={id}>
        {label} <span className="font-normal text-muted-foreground">(opcional)</span>
      </FieldLabel>
      <InputGroup>
        <InputGroupAddon>
          <label
            className="relative flex cursor-pointer items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="size-4 ring-1 ring-foreground/20"
              style={{ background: currentValue || "#e5e7eb" }}
            />
            <input
              type="color"
              className="sr-only"
              value={currentValue || defaultPickerColor}
              onChange={(e) => onColorPick(e.target.value)}
            />
          </label>
        </InputGroupAddon>
        <InputGroupInput
          id={id}
          {...registration}
          placeholder={placeholder}
          aria-invalid={!!error}
        />
      </InputGroup>
      <FieldError errors={[error]} />
    </Field>
  );
}

export default AccountForm;
