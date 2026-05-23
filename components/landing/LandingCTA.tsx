import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@components/ui/button";

export function LandingCTA() {
  return (
    <section
      className="relative overflow-hidden px-4 py-24"
      style={{ background: "oklch(0.13 0.06 240)" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 120%, oklch(0.35 0.18 240 / 0.5), transparent)",
        }}
      />

      <div className="relative mx-auto max-w-2xl text-center">
        <h2 className="font-heading text-3xl font-bold tracking-tight text-white md:text-4xl">
          ¿Listo para tomar el control de tus finanzas?
        </h2>
        <p className="mt-4 text-xs leading-relaxed text-white/50">
          Sin tarjeta de crédito · Configuración en 2 minutos · Cancela cuando
          quieras
        </p>
        <div className="mt-10">
          <Button
            size="lg"
            className="h-10 gap-1.5 bg-white px-8 text-xs font-medium text-primary hover:bg-white/90"
            asChild
          >
            <Link href="/register">
              Crear cuenta gratis
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
