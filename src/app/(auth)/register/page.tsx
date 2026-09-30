"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AlertCircle } from "lucide-react";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { AuthUI } from "@/components/ui/auth-fuse";
import { signInWithGooglePopup } from "@/lib/firebase";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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

        router.push("/consent");
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

      const msg = fbErr instanceof Error ? fbErr.message : "Failed to sign up with Google";
      setError(msg);
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
        onGoogleSignIn={handleGoogleSignIn}
        googleLoading={googleLoading}
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
