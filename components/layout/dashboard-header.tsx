"use client";

import { SidebarTrigger } from "@components/ui/sidebar";
import { Separator } from "@components/ui/separator";
import { UserMenu } from "@components/layout/user-menu";

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-border bg-background/95 px-4 backdrop-blur-sm">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-4" />
      <div className="ml-auto">
        <UserMenu />
      </div>
    </header>
  );
}
