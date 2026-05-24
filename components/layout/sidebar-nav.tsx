"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  LayoutDashboard,
  RefreshCw,
  Settings,
  Tag,
  Wallet,
} from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@components/ui/sidebar";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Cuentas", href: "/accounts", icon: Wallet },
  { label: "Transacciones", href: "/transactions", icon: ArrowLeftRight },
  { label: "Categorías", href: "/categories", icon: Tag },
  { label: "Recurrentes", href: "/recurring", icon: RefreshCw },
  { label: "Configuración", href: "/settings", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map(({ label, href, icon: Icon }) => {
        const isActive =
          href === "/dashboard"
            ? pathname === href
            : pathname.startsWith(href);

        return (
          <SidebarMenuItem key={href}>
            <SidebarMenuButton asChild isActive={isActive} tooltip={label} className="h-9 px-3 text-xs">
              <Link href={href}>
                <Icon />
                <span>{label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
