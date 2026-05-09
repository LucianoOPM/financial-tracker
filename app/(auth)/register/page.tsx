import Link from "next/link";
import { TrendingUp, ShieldCheck, DollarSign, ArrowRight } from "lucide-react";
import RegisterForm from "./components/RegisterForm";

const features = [
  {
    icon: TrendingUp,
    label: "Análisis de gastos en tiempo real",
    description: "Visualiza hacia dónde va tu dinero con reportes inteligentes.",
  },
  {
    icon: ShieldCheck,
    label: "Seguridad de nivel empresarial",
    description: "Tus datos financieros protegidos con cifrado de extremo a extremo.",
  },
  {
    icon: DollarSign,
    label: "Control de gastos innecesarios",
    description: "Identifica y elimina el desperdicio financiero automáticamente.",
  },
];

const RegisterPage = () => {
  return (
    <div className="flex min-h-screen">
      {/* Left: Brand Panel */}
      <aside className="relative hidden overflow-hidden bg-primary lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:p-12">
        {/* Decorative background rings */}
        <div className="absolute -top-32 -left-32 size-[480px] rounded-full border border-white/5" />
        <div className="absolute -top-32 -left-32 size-[320px] rounded-full border border-white/5" />
        <div className="absolute -bottom-40 -right-40 size-[500px] rounded-full border border-white/5" />
        <div className="absolute -bottom-40 -right-40 size-[320px] rounded-full border border-white/5" />
        <div className="absolute right-12 top-1/2 size-2 -translate-y-1/2 rounded-full bg-white/10" />
        <div className="absolute right-16 top-1/2 size-1 translate-y-8 rounded-full bg-white/10" />

        {/* Logo */}
        <div className="relative flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded bg-white/10">
            <TrendingUp className="size-4 text-white" />
          </div>
          <span className="text-sm font-semibold tracking-widest text-white/90 uppercase">
            FinControl
          </span>
        </div>

        {/* Center content */}
        <div className="relative flex flex-col gap-10">
          <div className="flex flex-col gap-4">
            <p className="text-xs font-medium tracking-widest text-white/40 uppercase">
              Plataforma financiera profesional
            </p>
            <h1 className="text-3xl leading-snug font-semibold text-white">
              Recupera el control de tus finanzas empresariales
            </h1>
            <p className="text-sm leading-relaxed text-white/60">
              Deja de perder dinero en gastos innecesarios. FinControl te da la
              visibilidad y las herramientas para tomar decisiones financieras
              inteligentes.
            </p>
          </div>

          <ul className="flex flex-col gap-6">
            {features.map(({ icon: Icon, label, description }) => (
              <li key={label} className="flex items-start gap-4">
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded bg-white/10">
                  <Icon className="size-4 text-white/80" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-white/90">{label}</span>
                  <span className="text-xs leading-relaxed text-white/50">
                    {description}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="relative flex items-center justify-between">
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} FinControl. Todos los derechos reservados.
          </p>
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-xs text-white/40 transition-colors hover:text-white/70"
          >
            Ya tengo cuenta
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </aside>

      {/* Right: Form Panel */}
      <main className="flex w-full flex-col items-center justify-center bg-background px-6 py-12 lg:w-1/2">
        <div className="flex w-full max-w-sm flex-col gap-8">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex size-7 items-center justify-center rounded bg-primary">
              <TrendingUp className="size-3.5 text-primary-foreground" />
            </div>
            <span className="text-xs font-semibold tracking-widest text-primary uppercase">
              FinControl
            </span>
          </div>

          {/* Heading */}
          <div className="flex flex-col gap-1.5">
            <h2 className="text-2xl font-semibold text-foreground">
              Crear cuenta
            </h2>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Completa el formulario para comenzar a controlar tus gastos
              financieros.
            </p>
          </div>

          {/* Form */}
          <RegisterForm />

          {/* Login link */}
          <p className="text-center text-xs text-muted-foreground">
            ¿Ya tienes una cuenta?{" "}
            <Link
              href="/login"
              className="font-medium text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
            >
              Iniciar sesión
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default RegisterPage;
