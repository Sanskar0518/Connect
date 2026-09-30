"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Compass, Sparkles, ArrowRight, Lock, Mail, AlertCircle, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/common/theme-toggle";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: email.trim(),
        password,
      });

      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred during sign in.");
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setError(null);
    setDemoLoading(true);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: "demo@connect.dev",
        password: "Demo1234!",
      });

      if (res?.error) {
        setError(res.error);
        setDemoLoading(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Demo sign in failed.");
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-background px-4 py-8 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary text-primary-foreground shadow-md mb-2">
            <Compass className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Welcome to Connect
          </h1>
          <p className="text-sm text-muted-foreground">
            The AI-powered career readiness & talent development platform
          </p>
        </div>

        {/* Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-card border border-border shadow-sm space-y-6">
          {/* Quick Demo Student Button */}
          <button
            type="button"
            onClick={handleDemoSignIn}
            disabled={demoLoading || loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-indigo-700 hover:from-primary-hover hover:to-indigo-800 text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
          >
            {demoLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-accent fill-accent" />
            )}
            <span>Sign In as Demo Student (Alex Rivera)</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-border w-full" />
            <span className="bg-card px-3 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Or sign in with email
            </span>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  required
                  placeholder="student@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted/30 border border-border text-foreground text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">Password</label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted/30 border border-border text-foreground text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || demoLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-primary hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
