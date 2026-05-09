"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@components/ui/field";
import { Alert, AlertDescription } from "@components/ui/alert";
import PasswordInput from "@components/PasswordInput";
import { registerSchema, RegisterSchema } from "@lib/schemas/register";
import { authClient } from "@lib/auth-client";

const RegisterForm = () => {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: RegisterSchema) => {
    setServerError(null);
    const { error } = await authClient.signUp.email({
      name: data.name,
      email: data.email,
      password: data.password,
    });
    if (error) {
      setServerError(error.message ?? "Error al crear la cuenta");
    } else {
      router.push("/login");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {serverError && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <FieldGroup>
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="name">Nombre completo</FieldLabel>
          <Input
            id="name"
            {...register("name")}
            type="text"
            placeholder="Juan García"
            aria-invalid={!!errors.name}
            autoComplete="name"
          />
          <FieldError errors={[errors.name]} />
        </Field>

        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
          <Input
            id="email"
            {...register("email")}
            type="email"
            placeholder="juan@empresa.com"
            aria-invalid={!!errors.email}
            autoComplete="email"
          />
          <FieldError errors={[errors.email]} />
        </Field>

        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">Contraseña</FieldLabel>
          <PasswordInput
            id="password"
            {...register("password")}
            placeholder="Mínimo 8 caracteres"
            aria-invalid={!!errors.password}
            autoComplete="new-password"
          />
          <FieldError errors={[errors.password]} />
        </Field>

        <Field data-invalid={!!errors.confirmPassword}>
          <FieldLabel htmlFor="confirmPassword">Confirmar contraseña</FieldLabel>
          <PasswordInput
            id="confirmPassword"
            {...register("confirmPassword")}
            placeholder="Repite tu contraseña"
            aria-invalid={!!errors.confirmPassword}
            autoComplete="new-password"
          />
          <FieldError errors={[errors.confirmPassword]} />
        </Field>
      </FieldGroup>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
      </Button>
    </form>
  );
};

export default RegisterForm;
