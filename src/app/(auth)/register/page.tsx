"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AlertCircle } from "lucide-react";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { AuthUI } from "@/components/ui/auth-fuse";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (name: string, email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to register account");
        setLoading(false);
        return;
      }
      const signInRes = await signIn("credentials", { redirect: false, email, password });
      if (signInRes?.error) {
        router.push("/login");
      } else {
        router.push("/consent");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred during registration.");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-black">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <AuthUI
        initialView="signup"
        onSignUpSubmit={handleSignUp}
        onToggle={() => router.push("/login")}
        loading={loading}
        topSlot={
          error ? (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2.5">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : undefined
        }
      />
    </div>
  );
}
