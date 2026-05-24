import { z } from "zod";

export const transactionSchema = z
  .object({
    type: z.enum(["income", "expense", "transfer"]),
    amount: z.coerce.number({ error: "Ingresa un monto válido" }).positive({ error: "El monto debe ser mayor a 0" }),
    description: z.preprocess(
      (v) => (v === "" || v === null ? undefined : v),
      z.string().max(255, { error: "Máximo 255 caracteres" }).optional()
    ),
    transactionDate: z.coerce.date({ error: "Fecha inválida" }),
    status: z.enum(["pending", "completed", "cancelled"]).default("completed"),
    accountId: z.string().min(1, { error: "Selecciona una cuenta financiera" }),
    categoryId: z.preprocess(
      (v) => (v === "" || v === null ? undefined : v),
      z.string().optional()
    ),
    destinationAccountId: z.preprocess(
      (v) => (v === "" || v === null ? undefined : v),
      z.string().optional()
    ),
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
          message: "La cuenta financiera destino debe ser diferente a la origen",
          path: ["destinationAccountId"],
        });
      }
    }
  });

// z.preprocess causes the input type to be inferred as `unknown` by TypeScript.
// We define the output type manually to avoid resolver type mismatches in React Hook Form.
export type TransactionSchema = {
  type: "income" | "expense" | "transfer";
  amount: number;
  description?: string;
  transactionDate: Date;
  status: "pending" | "completed" | "cancelled";
  accountId: string;
  categoryId?: string;
  destinationAccountId?: string;
};
