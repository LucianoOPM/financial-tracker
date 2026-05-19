import { z } from "zod";

export const financialAccountSchema = z
  .object({
    name: z.string().min(1, { error: "El nombre de la cuenta es requerido" }),
    type: z.enum(["debit", "credit", "savings", "cash", "investment"]),
    institutionName: z.string().optional(),
    currentBalance: z.coerce.number({ error: "Ingresa un monto válido" }),
    creditLimit: z.preprocess(
      (v) => (v === "" || v === null ? undefined : v),
      z.coerce.number({ error: "Ingresa un límite válido" }).optional()
    ),
    closingDay: z.preprocess(
      (v) => (v === "" || v === null ? undefined : v),
      z.coerce
        .number()
        .int()
        .min(1)
        .max(31, { error: "El día debe ser entre 1 y 31" })
        .optional()
    ),
    dueDay: z.preprocess(
      (v) => (v === "" || v === null ? undefined : v),
      z.coerce
        .number()
        .int()
        .min(1)
        .max(31, { error: "El día debe ser entre 1 y 31" })
        .optional()
    ),
    color: z.preprocess(
      (v) => (v === "" || v === null ? undefined : v),
      z.string().regex(/^#[0-9A-Fa-f]{6}$/, { error: "Color hex inválido" }).optional()
    ),
    gradientFrom: z.preprocess(
      (v) => (v === "" || v === null ? undefined : v),
      z.string().regex(/^#[0-9A-Fa-f]{6}$/, { error: "Color hex inválido" }).optional()
    ),
    gradientTo: z.preprocess(
      (v) => (v === "" || v === null ? undefined : v),
      z.string().regex(/^#[0-9A-Fa-f]{6}$/, { error: "Color hex inválido" }).optional()
    ),
    icon: z.preprocess(
      (v) => (v === "" || v === null ? undefined : v),
      z.string().optional()
    ),
    lastFourDigits: z.preprocess(
      (v) => (v === "" || v === null ? undefined : v),
      z.string().regex(/^\d{4}$/, { error: "Deben ser exactamente 4 dígitos" }).optional()
    ),
  })
  .superRefine((data, ctx) => {
    if (data.type === "credit") {
      if (data.creditLimit === undefined)
        ctx.addIssue({
          code: "custom",
          message: "El límite de crédito es requerido",
          path: ["creditLimit"],
        });
      if (data.closingDay === undefined)
        ctx.addIssue({
          code: "custom",
          message: "El día de cierre es requerido",
          path: ["closingDay"],
        });
      if (data.dueDay === undefined)
        ctx.addIssue({
          code: "custom",
          message: "El día de pago es requerido",
          path: ["dueDay"],
        });
    }
  });

// z.preprocess causes the input type to be inferred as `unknown` by TypeScript.
// We define the output type manually to avoid resolver type mismatches in React Hook Form.
export type FinancialAccountSchema = {
  name: string;
  type: "debit" | "credit" | "savings" | "cash" | "investment";
  institutionName?: string;
  currentBalance: number;
  creditLimit?: number;
  closingDay?: number;
  dueDay?: number;
  color?: string;
  gradientFrom?: string;
  gradientTo?: string;
  icon?: string;
  lastFourDigits?: string;
};
