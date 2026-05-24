"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@components/ui/sidebar";
import { Separator } from "@components/ui/separator";
import { UserMenu } from "@components/layout/user-menu";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/accounts": "Cuentas",
  "/transactions": "Transacciones",
  "/categories": "Categorías",
  "/recurring": "Recurrentes",
  "/settings": "Configuración",
};

function getPageTitle(pathname: string): string {
  for (const [route, title] of Object.entries(PAGE_TITLES)) {
    if (
      pathname === route ||
      (route !== "/dashboard" && pathname.startsWith(route))
    ) {
      return title;
    }
  }
  return "FinControl";
}

export function DashboardHeader() {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur-sm">
      <SidebarTrigger />
      <Separator orientation="vertical" className="self-stretch" />
      <span className="text-sm font-medium text-foreground">{pageTitle}</span>
      <div className="ml-auto">
        <UserMenu />
      </div>
    </header>
  );
}
