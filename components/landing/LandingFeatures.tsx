import { TrendingDown, Sparkles, BarChart3, Target } from "lucide-react";
import { Card, CardContent } from "@components/ui/card";

const features = [
  {
    icon: TrendingDown,
    title: "Detecta gastos invisibles",
    description:
      "Identifica suscripciones olvidadas, cargos automáticos y comisiones que no recuerdas haber activado.",
  },
  {
    icon: Sparkles,
    title: "IA que trabaja por ti",
    description:
      "Obtén recomendaciones personalizadas basadas en tus patrones de gasto para ahorrar más cada mes.",
  },
  {
    icon: BarChart3,
    title: "Visualiza tus finanzas",
    description:
      "Reportes claros que muestran a dónde va tu dinero con categorías automáticas y gráficos intuitivos.",
  },
  {
    icon: Target,
    title: "Cumple tus metas",
    description:
      "Define objetivos de ahorro y recibe alertas inteligentes cuando estás a punto de desviarte del plan.",
  },
];

export function LandingFeatures() {
  return (
    <section id="features" className="px-4 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-16 text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
            ¿Por qué elegir WasteTracker?
          </h2>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground md:text-sm">
            Todo lo que necesitas para tomar el control total de tus finanzas
            personales.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title}>
                <CardContent className="flex flex-col gap-4">
                  <div className="inline-flex size-8 items-center justify-center bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="font-heading text-sm font-medium">
                      {feature.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
