import { z } from "zod";

export const loginSchema = z.object({
  email: z.email({ error: "Ingresa un email válido" }),
  password: z.string().min(1, { error: "La contraseña es requerida" }),
  rememberMe: z.coerce.boolean(),
});

export type LoginSchema = z.infer<typeof loginSchema>;
