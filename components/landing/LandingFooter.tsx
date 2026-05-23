import Link from "next/link";
import { TrendingDown } from "lucide-react";
import { Separator } from "@components/ui/separator";

export function LandingFooter() {
  return (
    <footer className="border-t px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="flex flex-col gap-3">
            <Link href="/" className="flex items-center gap-2">
              <TrendingDown className="size-4 text-primary" />
              <span className="font-heading text-sm font-medium">
                WasteTracker
              </span>
            </Link>
            <p className="max-w-[200px] text-xs leading-relaxed text-muted-foreground">
              Toma el control de tus gastos con inteligencia artificial.
            </p>
          </div>

          <div className="flex gap-12">
            <div className="flex flex-col gap-3">
              <h4 className="font-heading text-xs font-semibold uppercase tracking-wider text-foreground/60">
                Producto
              </h4>
              <nav className="flex flex-col gap-2.5">
                <a
                  href="#features"
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  Funciones
                </a>
                <a
                  href="#pricing"
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  Precios
                </a>
              </nav>
            </div>

            <div className="flex flex-col gap-3">
              <h4 className="font-heading text-xs font-semibold uppercase tracking-wider text-foreground/60">
                Legal
              </h4>
              <nav className="flex flex-col gap-2.5">
                <Link
                  href="/privacy"
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  Privacidad
                </Link>
                <Link
                  href="/terms"
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  Términos
                </Link>
              </nav>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <p className="text-xs text-muted-foreground">
          © 2026 WasteTracker. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
