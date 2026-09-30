"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error caught by root boundary:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full p-8 rounded-3xl bg-card border border-destructive/30 shadow-xl space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold text-destructive tracking-wider uppercase">
            Runtime Exception
          </span>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            Something went wrong
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Connect encountered an unexpected error while processing this view. Your progress and data are safe.
          </p>
          {error?.message && (
            <div className="p-3 rounded-xl bg-muted/60 text-left font-mono text-[11px] text-muted-foreground break-words overflow-auto max-h-24">
              {error.message}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-muted/60 hover:bg-muted text-foreground border border-border font-semibold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
