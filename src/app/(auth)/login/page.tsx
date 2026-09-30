"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Sparkles, AlertCircle, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { AuthUI } from "@/components/ui/auth-fuse";
import { getSupabaseClient } from "@/lib/supabase";
import { signInWithGooglePopup } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSignIn = async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("credentials", { redirect: false, email: email.trim(), password });
      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else {
        // Also quietly sign in to Supabase if configured for client-side storage
        const supabase = getSupabaseClient();
        if (supabase) {
          try {
            await supabase.auth.signInWithPassword({ email: email.trim(), password });
          } catch {
            // Ignore Supabase shadow auth errors
          }
        }
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred during sign in.");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const result = await signInWithGooglePopup();
      if (result?.user?.email) {
        const idToken = await result.user.getIdToken();
        const authRes = await signIn("firebase", {
          idToken,
          email: result.user.email,
          name: result.user.displayName || result.user.email.split("@")[0],
          image: result.user.photoURL || "",
          redirect: false,
        });

        if (authRes?.error) {
          setError(authRes.error);
          setGoogleLoading(false);
          return;
        }

        router.push("/dashboard");
        router.refresh();
      }
    } catch (fbErr: unknown) {
      setGoogleLoading(false);
      const code = (fbErr as { code?: string })?.code;
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        return;
      }
      if (code === "auth/unauthorized-domain") {
        setError(
          `Domain "${window.location.hostname}" is not authorized in Firebase. Please add it to your Firebase Console under Authentication -> Settings -> Authorized domains.`
        );
        return;
      }
      if (code === "auth/operation-not-allowed") {
        setError(
          "Google Sign-In is disabled in Firebase. Please enable the Google provider in Firebase Console -> Authentication -> Sign-in method."
        );
        return;
      }
      if (code === "auth/popup-blocked") {
        setError("Sign-in popup was blocked by your browser. Please allow popups for this site and try again.");
        return;
      }

      const msg = fbErr instanceof Error ? fbErr.message : "Failed to sign in with Google";
      setError(msg);
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
    <div className="relative min-h-screen bg-black">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <AuthUI
        initialView="signin"
        onSignInSubmit={handleSignIn}
        onGoogleSignIn={handleGoogleSignIn}
        googleLoading={googleLoading}
        onToggle={() => router.push("/register")}
        loading={loading}
        topSlot={
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleDemoSignIn}
              disabled={demoLoading || loading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50"
            >
              {demoLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4 text-yellow-400 fill-yellow-400" />
              )}
              Sign In as Demo Student (Alex Rivera)
            </button>

            <div className="relative flex items-center">
              <div className="flex-1 border-t border-zinc-800" />
              <span className="px-3 text-xs text-zinc-500 uppercase tracking-wider font-semibold">
                or continue with email
              </span>
              <div className="flex-1 border-t border-zinc-800" />
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-800/50 text-red-400 text-sm flex items-center gap-2.5">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        }
      />
    </div>
  );
}
