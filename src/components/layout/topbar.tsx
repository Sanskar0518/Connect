"use client";

import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { Bell, Search, LogOut, User as UserIcon, Sparkles, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function Topbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const userName = session?.user?.name || "Student";
  const userEmail = session?.user?.email || "student@connect.dev";

  const [loadingDemo, setLoadingDemo] = useState(false);
  const [demoLoaded, setDemoLoaded] = useState(false);

  const handleLoadDemo = async () => {
    try {
      setLoadingDemo(true);
      const res = await fetch("/api/demo/load", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setDemoLoaded(true);
        setTimeout(() => {
          setDemoLoaded(false);
          router.refresh();
          window.location.reload();
        }, 800);
      } else {
        alert(data.error || "Failed to load demo student data");
      }
    } catch (err) {
      console.error("Demo load failed:", err);
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
      {/* Search Bar */}
      <div className="flex items-center gap-2 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            placeholder="Search skills, opportunities, companies, roadmaps..."
            className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm rounded-lg bg-muted/50 border border-border focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary transition-all text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Load Demo Student Button */}
        <button
          onClick={handleLoadDemo}
          disabled={loadingDemo || demoLoaded}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
            demoLoaded
              ? "bg-secondary text-secondary-foreground"
              : "bg-gradient-to-r from-accent/90 to-primary/90 hover:from-accent hover:to-primary text-white"
          }`}
          title="Populate complete demo dataset covering all 14 features in < 2 seconds"
        >
          {loadingDemo ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="hidden sm:inline">Loading Demo...</span>
            </>
          ) : demoLoaded ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Loaded (All 14 Features)!</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Demo Student</span>
            </>
          )}
        </button>

        {/* Readiness Pill */}
        <Link
          href="/dashboard"
          className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20 transition-colors"
          title="Overall AI Career Readiness Score"
        >
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          <span>Readiness: 73%</span>
        </Link>

        {/* Notifications Icon */}
        <button
          className="w-9 h-9 rounded-lg border border-border bg-card hover:bg-muted text-foreground flex items-center justify-center transition-colors relative"
          aria-label="View notifications"
          title="Notifications & Deadline reminders"
        >
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
        </button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Menu & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-xs uppercase">
            {userName.charAt(0) || <UserIcon className="w-4 h-4" />}
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-semibold text-foreground leading-tight">{userName}</span>
            <span className="text-[11px] text-muted-foreground leading-tight truncate max-w-[120px]">
              {userEmail}
            </span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive transition-colors ml-1"
            title="Log out"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
