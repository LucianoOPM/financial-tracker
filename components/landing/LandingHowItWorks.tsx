import { CreditCard, ScanLine, PiggyBank } from "lucide-react";

const steps = [
  {
    icon: CreditCard,
    title: "Registra tus cuentas",
    description:
      "Agrega tus cuentas de débito, crédito, ahorro e inversión en minutos.",
  },
  {
    icon: ScanLine,
    title: "Analiza tus patrones",
    description:
      "La IA categoriza tus transacciones y detecta dónde estás gastando de más.",
  },
  {
    icon: PiggyBank,
    title: "Ahorra más cada mes",
    description:
      "Implementa las recomendaciones personalizadas y observa cómo crece tu ahorro.",
  },
];

export function LandingHowItWorks() {
  return (
    <section className="bg-muted/40 px-4 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-16 text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
            Así de simple
          </h2>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground md:text-sm">
            Empieza a ahorrar en tres pasos. Sin complicaciones.
          </p>
        </div>

        <div className="grid gap-10 md:grid-cols-3 md:gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="relative flex flex-col items-center text-center"
              >
                {index < steps.length - 1 && (
                  <div
                    aria-hidden
                    className="absolute top-4 left-[calc(50%+2.5rem)] hidden h-px w-[calc(100%-5rem)] bg-border md:block"
                  />
                )}

                <div className="relative mb-5">
                  <div className="flex size-9 items-center justify-center bg-primary text-primary-foreground">
                    <Icon className="size-4" />
                  </div>
                  <span className="absolute -top-2 -right-2.5 flex size-5 items-center justify-center bg-background font-heading text-[10px] font-bold ring-1 ring-border">
                    {index + 1}
                  </span>
                </div>

                <h3 className="font-heading text-sm font-semibold">
                  {step.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
