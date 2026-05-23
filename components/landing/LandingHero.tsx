import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Button } from "@components/ui/button";
import { Separator } from "@components/ui/separator";

export function LandingHero() {
  return (
    <section
      className="relative overflow-hidden px-4 py-24 md:py-36"
      style={{ background: "oklch(0.13 0.06 240)" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% -10%, oklch(0.35 0.18 240 / 0.5), transparent)",
        }}
      />

      <div className="relative mx-auto max-w-4xl text-center">
        <div className="mb-6 inline-flex items-center gap-1.5 border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70">
          <span className="text-yellow-300">✦</span>
          Recomendaciones impulsadas con IA
        </div>

        <h1 className="font-heading text-4xl font-bold tracking-tight text-white md:text-6xl lg:text-7xl">
          Descubre en qué estás{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(135deg, oklch(0.92 0.12 55), oklch(0.78 0.18 48))",
            }}
          >
            perdiendo
          </span>{" "}
          tu dinero
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-white/55 md:text-base">
          Conecta tus cuentas, analiza tus patrones de gasto y recibe
          recomendaciones personalizadas con inteligencia artificial para ahorrar
          más cada mes.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            size="lg"
            className="h-10 gap-1.5 bg-white px-6 text-xs font-medium text-primary hover:bg-white/90"
            asChild
          >
            <Link href="/register">
              Comenzar gratis
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="h-10 gap-1 px-6 text-xs text-white/60 hover:bg-white/8 hover:text-white"
            asChild
          >
            <a href="#features">
              Ver cómo funciona
              <ChevronRight className="size-3.5" />
            </a>
          </Button>
        </div>

        <div className="mt-16 flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-0">
          <div className="flex flex-col items-center px-10">
            <span className="font-heading text-2xl font-bold text-white">10K+</span>
            <span className="mt-1 text-xs text-white/40">Usuarios activos</span>
          </div>
          <Separator
            orientation="vertical"
            className="hidden h-8 bg-white/10 sm:block"
          />
          <div className="flex flex-col items-center px-10">
            <span className="font-heading text-2xl font-bold text-white">
              $2.400
            </span>
            <span className="mt-1 text-xs text-white/40">
              Ahorro promedio anual
            </span>
          </div>
          <Separator
            orientation="vertical"
            className="hidden h-8 bg-white/10 sm:block"
          />
          <div className="flex flex-col items-center px-10">
            <span className="font-heading text-2xl font-bold text-white">
              100%
            </span>
            <span className="mt-1 text-xs text-white/40">Privado y seguro</span>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-xs">
          <div
            className="border border-white/10 p-5 text-left"
            style={{
              background: "oklch(1 0 0 / 0.04)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-medium text-white/50">
                Gastos este mes
              </span>
              <span className="text-xs text-red-400">↑ 12% vs anterior</span>
            </div>
            <div className="space-y-3">
              {[
                {
                  label: "Suscripciones olvidadas",
                  amount: "$47.99",
                  color: "bg-red-400",
                },
                {
                  label: "Restaurantes",
                  amount: "$183.50",
                  color: "bg-orange-400",
                },
                {
                  label: "Transporte",
                  amount: "$62.00",
                  color: "bg-yellow-400",
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={`size-1.5 rounded-full ${item.color}`} />
                  <span className="flex-1 text-xs text-white/60">
                    {item.label}
                  </span>
                  <span className="font-heading text-xs font-medium text-white">
                    {item.amount}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="text-xs leading-relaxed text-yellow-300/75">
                ✦ IA detectó $47 en suscripciones que no usas
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
