"use client";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Field, FieldLabel, FieldError } from "@components/ui/field";
import PasswordInput from "@components/PasswordInput";
import { loginSchema, LoginSchema } from "@lib/schemas/login";
import { authClient } from "@lib/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

const LoginForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false, email: "", password: "" },
  });

  const onSubmit = async (data: LoginSchema) => {
    await authClient.signIn.email({
      email: data.email,
      password: data.password,
      rememberMe: data.rememberMe,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <Field>
        <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
        <Input
          id="email"
          type="email"
          placeholder="nombre@empresa.com"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        <FieldError errors={[errors.email]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="password">Contraseña</FieldLabel>
        <PasswordInput
          id="password"
          placeholder="••••••••"
          aria-invalid={!!errors.password}
          {...register("password")}
        />
        <FieldError errors={[errors.password]} />
      </Field>

      <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground select-none">
        <input
          type="checkbox"
          className="size-3.5 accent-primary"
          {...register("rememberMe")}
        />
        Recordarme en este dispositivo
      </label>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Iniciando sesión..." : "Iniciar sesión"}
      </Button>
    </form>
  );
};

export default LoginForm;
