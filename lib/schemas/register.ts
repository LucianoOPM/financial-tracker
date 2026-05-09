import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().min(1, { error: "El nombre es requerido" }),
    email: z.email({ error: "Ingresa un email válido" }),
    password: z
      .string()
      .min(8, { error: "La contraseña debe tener al menos 8 caracteres" }),
    confirmPassword: z.string().min(1, { error: "Confirma tu contraseña" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type RegisterSchema = z.infer<typeof registerSchema>;
