import { z } from "zod";

// ─── Schema ───────────────────────────────────────────────────────────────────

export const recurringSchema = z
  .object({
    type: z.enum(["income", "expense", "transfer"]),
    amount: z.coerce
      .number({ error: "Ingresa un monto válido" })
      .positive({ error: "El monto debe ser mayor a 0" }),
    description: z.preprocess(
      (v) => (v === "" || v === null ? undefined : v),
      z.string().max(255, { error: "Máximo 255 caracteres" }).optional(),
    ),
    accountId: z.string().min(1, { error: "Selecciona una cuenta financiera" }),
    destinationAccountId: z.preprocess(
      (v) => (v === "" || v === null ? undefined : v),
      z.string().optional(),
    ),
    categoryId: z.preprocess(
      (v) => (v === "" || v === null ? undefined : v),
      z.string().optional(),
    ),
    frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
    intervalValue: z.coerce.number().int().min(1).max(365).default(1),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Fecha inválida (YYYY-MM-DD)" }),
    endDate: z.preprocess(
      (v) => (v === "" || v === null ? undefined : v),
      z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Fecha inválida (YYYY-MM-DD)" })
        .optional(),
    ),
    nextExecutionDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Fecha inválida (YYYY-MM-DD)" }),
    isActive: z.boolean().default(true),
    autoCreate: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.type === "transfer") {
      if (!data.destinationAccountId) {
        ctx.addIssue({
          code: "custom",
          message: "Selecciona una cuenta financiera destino",
          path: ["destinationAccountId"],
        });
      } else if (data.destinationAccountId === data.accountId) {
        ctx.addIssue({
          code: "custom",
          message: "La cuenta destino debe ser diferente a la cuenta origen",
          path: ["destinationAccountId"],
        });
      }
    }
    if (data.endDate && data.endDate < data.startDate) {
      ctx.addIssue({
        code: "custom",
        message: "La fecha de fin debe ser posterior a la fecha de inicio",
        path: ["endDate"],
      });
    }
    if (data.nextExecutionDate < data.startDate) {
      ctx.addIssue({
        code: "custom",
        message: "La próxima ejecución no puede ser anterior a la fecha de inicio",
        path: ["nextExecutionDate"],
      });
    }
  });

// ─── Type ─────────────────────────────────────────────────────────────────────

// Manual type to avoid z.preprocess inference loss (same pattern as TransactionSchema)
export type RecurringSchema = {
  type: "income" | "expense" | "transfer";
  amount: number;
  description?: string;
  accountId: string;
  destinationAccountId?: string;
  categoryId?: string;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  intervalValue: number;
  startDate: string;
  endDate?: string;
  nextExecutionDate: string;
  isActive: boolean;
  autoCreate: boolean;
};
