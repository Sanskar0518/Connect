"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Check, ArrowRight, Loader2, Info } from "lucide-react";
import { ThemeToggle } from "@/components/common/theme-toggle";

export default function ConsentPage() {
  const router = useRouter();
  const [consents, setConsents] = useState({
    TERMS: true,
    PRIVACY: true,
    DATA_PROCESSING: true,
    AI_USAGE: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleConsent = (key: keyof typeof consents) => {
    setConsents((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAccept = async () => {
    if (!consents.TERMS || !consents.PRIVACY || !consents.DATA_PROCESSING || !consents.AI_USAGE) {
      setError("Please grant all required consents to proceed with talent analysis and AI services.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consents: [
            { type: "TERMS", granted: consents.TERMS },
            { type: "PRIVACY", granted: consents.PRIVACY },
            { type: "DATA_PROCESSING", granted: consents.DATA_PROCESSING },
            { type: "AI_USAGE", granted: consents.AI_USAGE },
          ],
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to record consent preferences.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Unable to save consent. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-background px-4 py-8 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-secondary/10 text-secondary border border-secondary/20 shadow-sm mb-2">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Data Privacy & AI Transparency
          </h1>
          <p className="text-sm text-muted-foreground">
            Connect puts you in control of your academic transcripts, resumes, and career inferences.
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-2xl bg-card border border-border shadow-sm space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3.5">
            {/* Terms of Service */}
            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={consents.TERMS}
                onChange={() => toggleConsent("TERMS")}
                className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary"
              />
              <div className="text-xs space-y-1">
                <span className="font-semibold text-foreground">Terms of Service</span>
                <p className="text-muted-foreground">
                  I agree to the Connect Terms of Service for educational and career readiness guidance.
                </p>
              </div>
            </label>

            {/* Privacy Policy */}
            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={consents.PRIVACY}
                onChange={() => toggleConsent("PRIVACY")}
                className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary"
              />
              <div className="text-xs space-y-1">
                <span className="font-semibold text-foreground">Privacy Policy & Storage</span>
                <p className="text-muted-foreground">
                  I understand uploaded transcripts and resumes are encrypted at rest using AES-256 and never shared without my permission.
                </p>
              </div>
            </label>

            {/* Data Processing */}
            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={consents.DATA_PROCESSING}
                onChange={() => toggleConsent("DATA_PROCESSING")}
                className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary"
              />
              <div className="text-xs space-y-1">
                <span className="font-semibold text-foreground">Academic & Skill Processing</span>
                <p className="text-muted-foreground">
                  I authorize Connect to parse coursework, project descriptions, and skill records to evaluate role competency benchmarks.
                </p>
              </div>
            </label>

            {/* AI Usage */}
            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={consents.AI_USAGE}
                onChange={() => toggleConsent("AI_USAGE")}
                className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary"
              />
              <div className="text-xs space-y-1">
                <span className="font-semibold text-foreground">AI Intelligence & Grounding</span>
                <p className="text-muted-foreground">
                  I consent to AI-assisted roadmap generation, mock interviews, and resume keyword analysis. I acknowledge AI recommendations are guidance baselines.
                </p>
              </div>
            </label>
          </div>

          <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 text-xs text-muted-foreground flex items-center gap-2">
            <Check className="w-4 h-4 text-primary shrink-0" />
            <span>You can export or delete your profile data at any time from Settings.</span>
          </div>

          <button
            onClick={handleAccept}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Accept & Enter Connect</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
