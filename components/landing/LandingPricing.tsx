import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@components/ui/card";

const freeFeatures = [
  "Registra tus gastos e ingresos manualmente",
  "Tu panel financiero personal",
  "Categorías para organizar tus movimientos",
  "Crea y gestiona presupuestos",
  "Reportes mensuales para revisar tu avance",
  "Historial de los últimos 3 meses",
  "Tema claro y oscuro",
  "Define metas personales de ahorro",
  "Exporta tus datos en CSV",
  "Sin publicidad, siempre",
];

const proFeatures = [
  "Historial ilimitado sin restricciones",
  "Reportes financieros avanzados",
  "Exportación profesional en PDF y Excel",
  "Metas financieras avanzadas con seguimiento",
  "Dashboards personalizables",
  "Más categorías y etiquetas a medida",
  "Clasificación automática de gastos",
  "Alertas inteligentes de presupuesto",
  "Análisis con IA integrada",
  "Recomendaciones automáticas de ahorro",
  "Sincronización entre todos tus dispositivos",
  "Personalización visual de tu espacio",
  "Acceso prioritario a nuevas funciones",
];

const premiumFeatureGroups = [
  {
    label: "IA avanzada",
    items: [
      "Análisis avanzados con inteligencia artificial",
      "Predicciones financieras inteligentes",
      "Detección avanzada de patrones y hábitos",
      "Simulaciones financieras y proyecciones",
    ],
  },
  {
    label: "Colaboración y negocios",
    items: [
      "Multiusuario y cuentas compartidas",
      "Espacios de trabajo múltiples",
      "Herramientas para freelancers y pequeños negocios",
      "Reportes ejecutivos y fiscales",
      "Dashboards avanzados con múltiples layouts",
    ],
  },
  {
    label: "Personalización y soporte",
    items: [
      "Personalización completa: colores, gradientes e iconos",
      "Mayor almacenamiento y sincronización avanzada",
      "Soporte prioritario",
      "Acceso anticipado a nuevas funcionalidades",
      "Sin anuncios, con enfoque total en tu privacidad",
    ],
  },
];

export function LandingPricing() {
  return (
    <section id="pricing" className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
            Planes que se adaptan a ti
          </h2>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground md:text-sm">
            Empieza gratis cuando quieras. Escala según tus necesidades.
          </p>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-3">
          {/* Plan Gratuito */}
          <Card>
            <CardHeader className="border-b">
              <span className="font-heading text-sm font-semibold">Gratuito</span>
              <div className="mt-2">
                <span className="font-heading text-3xl font-bold">$0</span>
                <span className="ml-1 text-xs text-muted-foreground">para siempre</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Empieza hoy sin costo. Sin tarjeta de crédito, sin compromisos.
              </p>
            </CardHeader>

            <CardContent className="py-5">
              <ul className="space-y-2.5">
                {freeFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-xs">
                    <CheckCircle2 className="mt-px size-3.5 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/register">Crear cuenta gratis</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Plan Pro */}
          <Card className="ring-2 ring-primary ring-offset-0">
            <CardHeader className="border-b">
              <div className="flex items-start justify-between">
                <span className="font-heading text-sm font-semibold">Pro</span>
                <Badge variant="default">Más popular</Badge>
              </div>
              <div className="mt-2">
                <span className="font-heading text-3xl font-bold">$300</span>
                <span className="ml-1 text-xs text-muted-foreground">por mes</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Potencia tu gestión financiera con IA y reportes avanzados.
              </p>
            </CardHeader>

            <CardContent className="py-5">
              <p className="mb-3 flex items-center gap-2 text-xs font-medium text-primary">
                <CheckCircle2 className="size-3.5 shrink-0" />
                Todo lo del plan Gratuito, más:
              </p>
              <ul className="space-y-2.5">
                {proFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-xs">
                    <CheckCircle2 className="mt-px size-3.5 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              <Button variant="default" className="w-full" asChild>
                <Link href="/register?plan=pro">Comenzar 14 días gratis</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Plan Premium / Business */}
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-start justify-between">
                <span className="font-heading text-sm font-semibold">Business</span>
                <Badge variant="outline">Para equipos</Badge>
              </div>
              <div className="mt-2">
                <span className="font-heading text-3xl font-bold">$500</span>
                <span className="ml-1 text-xs text-muted-foreground">por mes</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                IA avanzada, colaboración en equipo y herramientas para profesionales.
              </p>
            </CardHeader>

            <CardContent className="py-5">
              <p className="mb-4 flex items-center gap-2 text-xs font-medium text-primary">
                <CheckCircle2 className="size-3.5 shrink-0" />
                Todo lo del plan Pro, más:
              </p>

              <div className="space-y-5">
                {premiumFeatureGroups.map((group) => (
                  <div key={group.label}>
                    <p className="mb-2 font-heading text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {group.label}
                    </p>
                    <ul className="space-y-2">
                      {group.items.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-xs">
                          <CheckCircle2 className="mt-px size-3.5 shrink-0 text-primary" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>

            <CardFooter>
              <Button variant="default" className="w-full" asChild>
                <Link href="/register?plan=business">Comenzar 14 días gratis</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Sin tarjeta de crédito requerida · Cancela cuando quieras · Tus datos siempre son tuyos
        </p>
      </div>
    </section>
  );
}
