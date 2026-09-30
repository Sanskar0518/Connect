"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  Share2,
  Inbox,
  MessageSquare,
  Compass,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Profile & Skills", href: "/profile", icon: User },
  { name: "Career Roadmap", href: "/roadmap", icon: Share2 },
  { name: "Applications", href: "/applications", icon: Inbox },
  { name: "Interview Prep", href: "/interview", icon: MessageSquare },
  { name: "Opportunities", href: "/opportunities", icon: Compass },
  { name: "Community", href: "/community", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-60 border-r border-border bg-card shrink-0 select-none">
      {/* Brand Header matching reference image: Blue circle logo + Connect */}
      <div className="h-16 flex items-center px-6 gap-2.5">
        <div className="w-8 h-8 rounded-full bg-[#4F46E5] flex items-center justify-center text-white shadow-sm">
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </div>
        <span className="font-bold tracking-tight text-xl text-foreground">
          Connect
        </span>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-muted-foreground">
          Platform Modules
        </div>
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center px-3 py-2 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-[#EEF2FF] text-[#4F46E5] dark:bg-primary/20 dark:text-primary-foreground font-semibold"
                  : "text-slate-600 dark:text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-muted"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive
                      ? "text-[#4F46E5] dark:text-primary-foreground"
                      : "text-slate-500 dark:text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
