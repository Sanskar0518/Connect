"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserCheck,
  Map,
  Briefcase,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mobileTabs = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Profile", href: "/profile", icon: UserCheck },
  { name: "Roadmap", href: "/roadmap", icon: Map },
  { name: "Apply", href: "/applications", icon: Briefcase },
  { name: "More", href: "/opportunities", icon: Layers },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-border bg-card/95 backdrop-blur-md z-40 flex items-center justify-around px-2">
      {mobileTabs.map((tab) => {
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-col items-center justify-center py-1 px-3 rounded-lg text-xs font-medium transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">{tab.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
