"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserCheck,
  Map,
  Briefcase,
  MessageSquareCode,
  GraduationCap,
  Users,
  Compass,
  Flame,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Profile & Skills", href: "/profile", icon: UserCheck, badge: "F1, F2" },
  { name: "Career Roadmap", href: "/roadmap", icon: Map, badge: "F3, F9" },
  { name: "Applications", href: "/applications", icon: Briefcase, badge: "F5, F12" },
  { name: "Interview Prep", href: "/interview", icon: MessageSquareCode, badge: "F6, F10" },
  { name: "Opportunities", href: "/opportunities", icon: GraduationCap, badge: "F8, F11" },
  { name: "Community", href: "/community", icon: Users, badge: "F14" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-border gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
          <Compass className="w-5 h-5 animate-spin-slow" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold tracking-tight text-lg text-foreground flex items-center gap-1.5">
            Connect
            <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">
              AI
            </span>
          </span>
          <span className="text-xs text-muted-foreground -mt-0.5">Career Readiness Platform</span>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Platform Modules
        </div>
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Student Motivation / Gamification Footer */}
      <div className="p-4 m-3 rounded-xl bg-muted/60 border border-border space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-muted-foreground">Readiness Tracker</span>
          <span className="flex items-center gap-1 text-accent font-semibold">
            <Flame className="w-3.5 h-3.5 fill-current" />
            5 Days
          </span>
        </div>
        <div className="w-full bg-border rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary h-full rounded-full transition-all duration-500"
            style={{ width: "68%" }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Award className="w-3 h-3 text-secondary" />
            450 XP
          </span>
          <span className="font-semibold text-primary">Level 2 Scholar</span>
        </div>
      </div>
    </aside>
  );
}
