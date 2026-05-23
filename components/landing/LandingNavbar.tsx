"use client";

import { useState } from "react";
import Link from "next/link";
import { TrendingDown, Menu } from "lucide-react";
import { Button } from "@components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@components/ui/sheet";

export function LandingNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <TrendingDown className="size-4 text-primary" />
          <span className="font-heading text-sm font-medium">WasteTracker</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Button variant="ghost" size="sm" asChild>
            <a href="#features">Funciones</a>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a href="#pricing">Precios</a>
          </Button>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Iniciar sesión</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/register">Comenzar gratis</Link>
          </Button>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="md:hidden">
              <Menu />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <div className="flex flex-col gap-1 pt-8">
              <Button
                variant="ghost"
                className="justify-start"
                asChild
                onClick={() => setOpen(false)}
              >
                <a href="#features">Funciones</a>
              </Button>
              <Button
                variant="ghost"
                className="justify-start"
                asChild
                onClick={() => setOpen(false)}
              >
                <a href="#pricing">Precios</a>
              </Button>
              <div className="mt-4 flex flex-col gap-2">
                <Button variant="outline" asChild>
                  <Link href="/login" onClick={() => setOpen(false)}>
                    Iniciar sesión
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/register" onClick={() => setOpen(false)}>
                    Comenzar gratis
                  </Link>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
