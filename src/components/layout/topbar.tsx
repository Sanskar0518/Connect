"use client";

import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { Search, LogOut, ChevronDown, Sparkles, Check, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export function Topbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const userName = session?.user?.name || "Sanskar";
  const userEmail = session?.user?.email || "shankar01289@gmail.com";
  const userImage = session?.user?.image;

  const [loadingDemo, setLoadingDemo] = useState(false);
  const [demoLoaded, setDemoLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
    <header className="h-16 border-b border-border bg-card/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between gap-4 sticky top-0 z-30">
      {/* Search Bar matching reference image (pill with search on right) */}
      <div className="flex items-center flex-1 max-w-xl">
        <div className="relative w-full">
          <input
            type="search"
            placeholder="Search skills, opportunities, companies, roadmaps..."
            className="w-full pl-5 pr-10 py-2 text-xs sm:text-sm rounded-full bg-slate-100 dark:bg-muted/60 border border-slate-200/60 dark:border-border focus:bg-card focus:outline-none focus:ring-2 focus:ring-[#4F46E5] transition-all text-foreground placeholder:text-muted-foreground"
          />
          <Search className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Load Demo Student Button */}
        <button
          onClick={handleLoadDemo}
          disabled={loadingDemo || demoLoaded}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
            demoLoaded
              ? "bg-emerald-600 text-white"
              : "bg-slate-100 hover:bg-slate-200 dark:bg-muted dark:hover:bg-muted/80 text-foreground border border-border"
          }`}
          title="Populate complete demo dataset covering all 14 features in < 2 seconds"
        >
          {loadingDemo ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#4F46E5]" />
              <span className="hidden sm:inline">Loading...</span>
            </>
          ) : demoLoaded ? (
            <>
              <Check className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline">Loaded!</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />
              <span className="hidden sm:inline">Load Demo</span>
            </>
          )}
        </button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Profile Pill matching reference image */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2.5 pl-2 py-1 pr-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-muted/60 transition-colors"
          >
            {userImage ? (
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-border">
                <Image
                  src={userImage}
                  alt={userName}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#4F46E5] to-[#7C3AED] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                {userName.charAt(0)}
              </div>
            )}
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-foreground leading-tight">{userName}</span>
              <span className="text-[10px] text-muted-foreground leading-tight truncate max-w-[140px]">
                {userEmail}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {/* User Dropdown Menu */}
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-card border border-border shadow-xl p-1.5 z-50 text-xs">
              <div className="px-3 py-2 border-b border-border sm:hidden">
                <p className="font-semibold text-foreground">{userName}</p>
                <p className="text-muted-foreground truncate">{userEmail}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
