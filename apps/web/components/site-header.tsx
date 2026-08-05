"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { formatDate, formatTime, getGreeting } from "@/lib/utils";

import { useAuth } from "@/providers/auth-provider";
import { useState, useEffect } from "react";

export function SiteHeader() {
  const { user } = useAuth();
  const [time, setTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTime(new Date());
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-lg font-semibold text-foreground">
          {getGreeting(time || new Date())}, {user?.name || "AyarFarm"}
        </h1>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-4 px-4 lg:px-6">
        <div className="flex items-center gap-2 px-3 py-2 ">
          <div className="flex flex-col items-end">
            <span className="font-mono text-sm font-semibold text-foreground tabular-nums leading-none">
              {mounted && time ? formatTime(time) : '--:--:--'}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              {mounted && time ? formatDate(time) : '--/--/----'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
