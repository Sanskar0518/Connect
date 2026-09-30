import React from "react";
import Link from "next/link";
import { Compass, ArrowLeft, Home, Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full p-8 rounded-3xl bg-card border border-border shadow-xl space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
          <Compass className="w-8 h-8 animate-spin-slow" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold text-primary tracking-wider uppercase">
            Error 404 • Lost in the Career Graph
          </span>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            Page Not Found
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The opportunity, roadmap, or credential node you are looking for has either moved or does not exist on Connect.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Student Dashboard</span>
          </Link>
          <Link
            href="/roadmap"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-muted/60 hover:bg-muted text-foreground border border-border font-semibold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <Sparkles className="w-4 h-4 text-accent" />
            <span>Explore Roadmap</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
