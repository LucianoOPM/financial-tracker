"use client";

import Link from "next/link";
import { TrendingUp } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
} from "@components/ui/sidebar";
import { SidebarNav } from "@components/layout/sidebar-nav";

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border pb-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2 text-sidebar-foreground"
        >
          <div className="flex size-7 shrink-0 items-center justify-center rounded bg-sidebar-primary">
            <TrendingUp className="size-4 text-sidebar-primary-foreground" />
          </div>
          <span className="truncate text-sm font-semibold uppercase tracking-widest text-sidebar-foreground">
            FinControl
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarNav />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter />
    </Sidebar>
  );
}
