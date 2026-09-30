"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState("Completing authentication...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function handleAuth() {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setError("Supabase client is not available.");
        return;
      }

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (session?.access_token) {
          if (!isMounted) return;
          setStatusMessage("Syncing user session...");

          const res = await signIn("supabase", {
            accessToken: session.access_token,
            redirect: false,
          });

          if (res?.error) {
            throw new Error(res.error);
          }

          if (isMounted) {
            router.push("/dashboard");
            router.refresh();
          }
          return;
        }

        // Listen for auth state change in case of hash fragment redirect
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            if (newSession?.access_token && isMounted) {
              setStatusMessage("Finalizing login...");
              const res = await signIn("supabase", {
                accessToken: newSession.access_token,
                redirect: false,
              });

              if (!res?.error) {
                router.push("/dashboard");
                router.refresh();
              }
            }
          }
        );

        // Fallback timeout
        const timeout = setTimeout(() => {
          if (isMounted && !session) {
            router.push("/login?error=OAuthTimeout");
          }
        }, 5000);

        return () => {
          subscription.unsubscribe();
          clearTimeout(timeout);
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Authentication failed";
        if (isMounted) setError(msg);
      }
    }

    handleAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-4">
      <div className="flex flex-col items-center gap-4 text-center">
        {error ? (
          <div className="max-w-md rounded-xl border border-red-800 bg-red-950/60 p-6 text-red-300">
            <h2 className="text-lg font-semibold mb-2">Authentication Error</h2>
            <p className="text-sm mb-4">{error}</p>
            <button
              onClick={() => router.push("/login")}
              className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-white hover:bg-zinc-700"
            >
              Return to Login
            </button>
          </div>
        ) : (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            <p className="text-base text-zinc-300 font-medium">{statusMessage}</p>
          </>
        )}
      </div>
    </div>
  );
}
