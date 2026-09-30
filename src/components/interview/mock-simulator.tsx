"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  CheckCircle2,
  ArrowRight,
  Clock,
  RotateCcw,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Award,
  Zap,
  Loader2,
  ChevronRight,
  Layers,
  StopCircle,
} from "lucide-react";
import InterviewFeedbackView, {
  InterviewFeedbackData,
  InterviewTurnData,
} from "./interview-feedback-view";

interface PreloadedConfig {
  role: string;
  company: string;
  companyId?: string;
  type?: "TECHNICAL" | "BEHAVIORAL" | "MIXED";
  questions?: Array<{
    question: string;
    type: "TECHNICAL" | "BEHAVIORAL" | "SITUATIONAL";
    hint?: string;
    whyAsked?: string;
  }>;
  jdText?: string;
}

interface MockSimulatorProps {
  preloadedConfig?: PreloadedConfig | null;
  onClearPreloaded?: () => void;
  onViewHistory?: () => void;
}

interface ActiveTurn {
  id: string;
  turnNumber: number;
  question: string;
  answer?: string | null;
  feedback?: any;
}

interface ActiveSession {
  id: string;
  title: string;
  type: string;
  turns: ActiveTurn[];
}

export default function MockSimulator({
  preloadedConfig,
  onClearPreloaded,
  onViewHistory,
}: MockSimulatorProps) {
  // Wizard / Stage state
  const [stage, setStage] = useState<"SETUP" | "ACTIVE" | "FEEDBACK">("SETUP");

  // Setup options
  const [role, setRole] = useState<string>("Software Engineer");
  const [company, setCompany] = useState<string>("Tech Company");
  const [interviewType, setInterviewType] = useState<"TECHNICAL" | "BEHAVIORAL" | "MIXED">("MIXED");
  const [loadingStart, setLoadingStart] = useState<boolean>(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  // Active Session State
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [currentTurnIndex, setCurrentTurnIndex] = useState<number>(0);
  const [answerText, setAnswerText] = useState<string>("");
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [submittingTurn, setSubmittingTurn] = useState<boolean>(false);
  const [turnFeedback, setTurnFeedback] = useState<any | null>(null);
  const [finishingSession, setFinishingSession] = useState<boolean>(false);

  // Voice (STT & TTS)
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [interimText, setInterimText] = useState<string>("");
  const [micError, setMicError] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const baselineTextRef = useRef<string>("");
  const currentAnswerTextRef = useRef<string>("");

  // Completed Feedback
  const [finalFeedback, setFinalFeedback] = useState<InterviewFeedbackData | null>(null);

  // Detect Web Speech API support
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasSpeechRecognition =
        "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
      const hasSpeechSynthesis = "speechSynthesis" in window;
      setSpeechSupported(hasSpeechRecognition && hasSpeechSynthesis);
    }

    return () => {
      isListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Sync preloaded config from F10
  useEffect(() => {
    if (preloadedConfig) {
      setRole(preloadedConfig.role || "Software Engineer");
      setCompany(preloadedConfig.company || "Tech Company");
      if (preloadedConfig.type) {
        setInterviewType(preloadedConfig.type);
      }
    }
  }, [preloadedConfig]);

  // Turn Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // TTS Helper
  const speakText = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // STT Helper
  const toggleListening = () => {
    if (isListeningRef.current || isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Spawns a fresh SpeechRecognition instance on every cycle (avoids Chromium InvalidStateError)
  const spawnRecognition = () => {
    if (!isListeningRef.current) return;
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicError(
        "Speech recognition is not supported in this browser. Please type your response or use Google Chrome/Microsoft Edge."
      );
      isListeningRef.current = false;
      setIsListening(false);
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setMicError(null);
      };

      recognition.onresult = (event: any) => {
        let sessionFinal = "";
        let sessionInterim = "";

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          const text = res[0]?.transcript || "";
          if (res.isFinal) {
            sessionFinal += text + " ";
          } else {
            sessionInterim += text;
          }
        }

        const base = baselineTextRef.current.trim();
        const spoken = (sessionFinal + sessionInterim).trim();
        const combined = base ? (spoken ? `${base} ${spoken}` : base) : spoken;

        // Directly write the spoken response into the answer section
        setAnswerText(combined);
        currentAnswerTextRef.current = combined;
        setInterimText(sessionInterim);
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition event:", event.error);
        if (event.error === "no-speech") {
          // Pause during speech/thought - do not turn off!
          return;
        }
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          isListeningRef.current = false;
          setIsListening(false);
          setInterimText("");
          setMicError(
            "Microphone permission was denied. Please click the camera/mic icon in the browser address bar to allow microphone access."
          );
          return;
        }
        if (event.error === "network") {
          isListeningRef.current = false;
          setIsListening(false);
          setInterimText("");
          setMicError(
            "Speech recognition network error: Browser could not connect to speech service. You can type your response or use the sample answer button."
          );
          return;
        }
        if (event.error === "aborted") {
          return;
        }
      };

      recognition.onend = () => {
        // Continuous holding: if user intent is still active, spawn a fresh instance!
        if (isListeningRef.current) {
          baselineTextRef.current = currentAnswerTextRef.current;
          setTimeout(() => {
            if (isListeningRef.current) {
              spawnRecognition();
            }
          }, 150);
        } else {
          setIsListening(false);
          setInterimText("");
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error("Failed to spawn speech recognition:", err);
      isListeningRef.current = false;
      setIsListening(false);
      setMicError("Unable to activate microphone. Please check browser permissions.");
    }
  };

  const startListening = async () => {
    if (typeof window === "undefined") return;
    setMicError(null);
    stopSpeaking();

    // Lock baseline to whatever is currently written in the answer box
    baselineTextRef.current = currentAnswerTextRef.current;
    isListeningRef.current = true;
    setIsListening(true);

    // Pre-flight check for microphone permissions
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch (err: any) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          isListeningRef.current = false;
          setIsListening(false);
          setMicError(
            "Microphone permission was denied. Please allow microphone access in your browser address bar."
          );
          return;
        }
      }
    }

    spawnRecognition();
  };

  const stopListening = () => {
    isListeningRef.current = false;
    setIsListening(false);
    setInterimText("");
    // Ensure final transcribed text remains locked as the answer
    baselineTextRef.current = currentAnswerTextRef.current;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
  };

  // Start new mock session
  const handleStartSession = async () => {
    setLoadingStart(true);
    setSetupError(null);

    try {
      const res = await fetch("/api/interview/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          company,
          companyId: preloadedConfig?.companyId,
          type: interviewType,
          jobDescription: preloadedConfig?.jdText,
          preloadedQuestions: preloadedConfig?.questions,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to start interview session");
      }

      const data = await res.json();
      setSession({
        id: data.session.id,
        title: data.session.title,
        type: data.session.type,
        turns: data.turns || [],
      });
      setCurrentTurnIndex(0);
      setAnswerText("");
      currentAnswerTextRef.current = "";
      baselineTextRef.current = "";
      setInterimText("");
      setTurnFeedback(null);
      setTimerSeconds(0);
      setIsTimerRunning(true);
      setStage("ACTIVE");

      // Auto speak first question if voice is enabled
      if (voiceEnabled && data.turns && data.turns[0]) {
        setTimeout(() => speakText(data.turns[0].question), 400);
      }
    } catch (err: unknown) {
      setSetupError(err instanceof Error ? err.message : "Error starting interview");
    } finally {
      setLoadingStart(false);
    }
  };

  // Submit single answer
  const handleSubmitTurn = async () => {
    if (!session || !answerText.trim()) return;

    stopListening();
    stopSpeaking();
    setSubmittingTurn(true);

    const currentTurn = session.turns[currentTurnIndex];

    try {
      const res = await fetch("/api/interview/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          turnNumber: currentTurn.turnNumber,
          answer: answerText,
          questionType: session.type,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit answer");
      }

      const data = await res.json();
      setTurnFeedback(data.evaluation);

      // Update local session turns
      const updatedTurns = [...session.turns];
      updatedTurns[currentTurnIndex] = {
        ...updatedTurns[currentTurnIndex],
        answer: answerText,
        feedback: data.evaluation,
      };
      setSession({ ...session, turns: updatedTurns });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Submission error");
    } finally {
      setSubmittingTurn(false);
    }
  };

  // Move to next turn
  const handleNextTurn = () => {
    if (!session) return;
    const nextIdx = currentTurnIndex + 1;
    if (nextIdx < session.turns.length) {
      setCurrentTurnIndex(nextIdx);
      setAnswerText("");
      currentAnswerTextRef.current = "";
      baselineTextRef.current = "";
      setInterimText("");
      setTurnFeedback(null);
      setTimerSeconds(0);
      setIsTimerRunning(true);

      if (voiceEnabled && session.turns[nextIdx]) {
        speakText(session.turns[nextIdx].question);
      }
    }
  };

  // Complete entire session
  const handleFinishSession = async () => {
    if (!session) return;

    stopListening();
    stopSpeaking();
    setIsTimerRunning(false);
    setFinishingSession(true);

    try {
      const res = await fetch(`/api/interview/session/${session.id}/finish`, {
        method: "POST",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to finalize session feedback");
      }

      const data = await res.json();
      setFinalFeedback(data.feedback);
      setStage("FEEDBACK");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error completing session");
    } finally {
      setFinishingSession(false);
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remaining.toString().padStart(2, "0")}`;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Stage FEEDBACK
  // ─────────────────────────────────────────────────────────────────────────────
  if (stage === "FEEDBACK" && finalFeedback && session) {
    return (
      <InterviewFeedbackView
        sessionTitle={session.title}
        sessionType={session.type}
        feedback={finalFeedback}
        turns={session.turns}
        onRestart={() => {
          setStage("SETUP");
          setSession(null);
          setFinalFeedback(null);
          if (onClearPreloaded) onClearPreloaded();
        }}
        onViewHistory={onViewHistory}
      />
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Stage SETUP
  // ─────────────────────────────────────────────────────────────────────────────
  if (stage === "SETUP") {
    return (
      <div className="p-6 md:p-8 rounded-3xl bg-card border border-border space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                AI Mock Interview Simulator (F6)
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Real-time simulated interview with technical questions, speech input, instant turn evaluation, and STAR-method scoring.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {speechSupported && (
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground bg-muted/40 px-3 py-1.5 rounded-xl border border-border">
                <input
                  type="checkbox"
                  checked={voiceEnabled}
                  onChange={(e) => setVoiceEnabled(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
                />
                <Volume2 className="w-3.5 h-3.5 text-primary" />
                <span>Voice TTS Enabled</span>
              </label>
            )}
          </div>
        </div>

        {preloadedConfig && (
          <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-xs text-foreground flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
              <span>
                Preloaded with <strong>{preloadedConfig.questions?.length || 5} questions</strong> from{" "}
                <strong>{preloadedConfig.company}</strong> ({preloadedConfig.role}) JD Intelligence.
              </span>
            </div>
            {onClearPreloaded && (
              <button
                onClick={onClearPreloaded}
                className="text-[11px] font-semibold text-muted-foreground hover:text-foreground underline shrink-0"
              >
                Reset to default
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Target Role
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Software Engineer, Backend Lead"
              className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Target Company
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Stripe, Google, Microsoft, Seed Startup"
              className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-2">
            Interview Style & Focus
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: "MIXED",
                label: "Mixed Simulation",
                desc: "Balanced technical coding/architecture + STAR behavioral stories",
              },
              {
                id: "TECHNICAL",
                label: "Technical Deep Dive",
                desc: "System design, algorithms, databases, code architecture",
              },
              {
                id: "BEHAVIORAL",
                label: "Behavioral & Leadership",
                desc: "STAR-method situations, teamwork, conflict, ownership",
              },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setInterviewType(t.id as any)}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  interviewType === t.id
                    ? "bg-primary/10 border-primary text-foreground shadow-sm"
                    : "bg-muted/20 border-border text-muted-foreground hover:bg-muted/40"
                }`}
              >
                <span className="font-bold text-xs block text-foreground mb-1">{t.label}</span>
                <span className="text-[11px] leading-snug block">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {setupError && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{setupError}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-muted-foreground">
            Session length: 4–5 questions • Awards +15 XP per answer, +50 XP completion bonus
          </span>

          <button
            onClick={handleStartSession}
            disabled={loadingStart}
            className="px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-primary/20 disabled:opacity-50"
          >
            {loadingStart ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Personalized Questions...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-primary-foreground" />
                <span>Begin Mock Interview</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Stage ACTIVE INTERVIEW
  // ─────────────────────────────────────────────────────────────────────────────
  if (!session || !session.turns[currentTurnIndex]) return null;

  const currentTurn = session.turns[currentTurnIndex];
  const isLastTurn = currentTurnIndex === session.turns.length - 1;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header / Status bar */}
      <div className="p-4 md:p-5 rounded-2xl bg-card border border-border flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
            {currentTurnIndex + 1}/{session.turns.length}
          </span>
          <div>
            <h3 className="font-bold text-sm text-foreground">{session.title}</h3>
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
              {session.type} Mode • Turn #{currentTurn.turnNumber}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/40 border border-border text-xs font-mono font-bold text-foreground">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span>{formatTimer(timerSeconds)}</span>
          </div>

          <button
            onClick={handleFinishSession}
            disabled={finishingSession}
            className="px-3.5 py-1.5 rounded-xl border border-border hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Finish Early
          </button>
        </div>
      </div>

      {/* Question Card */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-card via-card to-primary/5 border border-border space-y-4 shadow-sm relative">
        <div className="flex items-center justify-between">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
            Interviewer Question
          </span>

          <div className="flex items-center gap-2">
            {isSpeaking ? (
              <button
                onClick={stopSpeaking}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center gap-1.5"
              >
                <VolumeX className="w-3.5 h-3.5" />
                <span>Stop Audio</span>
              </button>
            ) : (
              <button
                onClick={() => speakText(currentTurn.question)}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border flex items-center gap-1.5"
              >
                <Volume2 className="w-3.5 h-3.5 text-primary" />
                <span>Read Aloud</span>
              </button>
            )}
          </div>
        </div>

        <p className="text-base md:text-lg font-bold text-foreground leading-relaxed">
          &ldquo;{currentTurn.question}&rdquo;
        </p>
      </div>

      {/* Answer Area */}
      <div className="p-6 md:p-8 rounded-3xl bg-card border border-border space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-foreground">
              Your Response
            </h4>
            <span className="text-[11px] text-muted-foreground">
              (Voice or Typed • Evaluates depth, clarity, and STAR structure)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleListening}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                isListening
                  ? "bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30"
                  : "bg-secondary/15 hover:bg-secondary/25 text-secondary border border-secondary/30"
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-3.5 h-3.5" />
                  <span>Listening... (Tap to Pause)</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  <span>Speak via Mic</span>
                </>
              )}
            </button>
          </div>
        </div>

        {micError && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{micError}</span>
            </div>
            <button
              onClick={() => setMicError(null)}
              className="text-xs font-bold underline shrink-0 hover:text-amber-400"
            >
              Dismiss
            </button>
          </div>
        )}

        {isListening && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <div>
                <span className="font-bold text-xs block text-rose-500">
                  Microphone is Recording Continuously
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  Speak at your own pace. Pauses to think will not turn off recording.
                </span>
              </div>
            </div>
            <button
              onClick={stopListening}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-colors shadow-sm"
            >
              Done Speaking (Stop)
            </button>
          </div>
        )}

        <div className="relative">
          <textarea
            rows={6}
            value={answerText}
            onChange={(e) => {
              setAnswerText(e.target.value);
              currentAnswerTextRef.current = e.target.value;
              baselineTextRef.current = e.target.value;
            }}
            placeholder="Speak into your microphone or type your complete answer here. What you speak will appear directly in this answer box in real-time..."
            className={`w-full p-4 rounded-2xl bg-muted/20 border text-xs md:text-sm text-foreground placeholder:text-muted-foreground focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed transition-all ${
              isListening
                ? "border-rose-500/50 ring-2 ring-rose-500/20 bg-card"
                : "border-border"
            }`}
          />

          {interimText && (
            <div className="mt-2 p-2.5 rounded-xl bg-muted/40 border border-dashed border-border text-xs text-muted-foreground flex items-center gap-2 italic animate-in fade-in">
              <Mic className="w-3.5 h-3.5 text-rose-500 animate-pulse shrink-0" />
              <span className="line-clamp-2">&ldquo;{interimText}&rdquo;</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <div className="flex items-center gap-3">
            <span>
              {answerText.trim() ? answerText.trim().split(/\s+/).length : 0} words •{" "}
              {answerText.length} characters
            </span>
            {answerText.length === 0 && !isListening && (
              <button
                onClick={() => {
                  const sample =
                    "In my recent project, we diagnosed severe API latency under high concurrency. I designed a caching layer using Redis with cache-aside pattern and optimized our PostgreSQL query execution plans with composite indexes. This dropped p95 response time from 650ms to 95ms and reduced database load by 50%. We also introduced structured logging and Grafana dashboards for real-time observability.";
                  setAnswerText(sample);
                  currentAnswerTextRef.current = sample;
                  baselineTextRef.current = sample;
                }}
                className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1"
              >
                <span>Insert Sample Spoken Answer</span>
              </button>
            )}
            {answerText.length > 0 && !isListening && (
              <button
                onClick={() => {
                  setAnswerText("");
                  currentAnswerTextRef.current = "";
                  baselineTextRef.current = "";
                  setInterimText("");
                }}
                className="text-[11px] text-muted-foreground hover:text-foreground underline"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!turnFeedback && (
              <button
                onClick={handleSubmitTurn}
                disabled={submittingTurn || !answerText.trim()}
                className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
              >
                {submittingTurn ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Evaluating Answer...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Evaluate Response (+15 XP)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Turn Evaluation Drawer */}
        {turnFeedback && (
          <div className="mt-4 p-5 rounded-2xl bg-muted/30 border border-border space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <h5 className="font-bold text-xs uppercase tracking-wider text-foreground">
                  Instant Turn Feedback
                </h5>
                <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  +15 XP Earned
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono font-bold">
                <span className="text-primary">Content: {turnFeedback.contentScore}/10</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-secondary">Structure: {turnFeedback.structureScore}/10</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-foreground">Confidence: {turnFeedback.confidenceScore}/10</span>
              </div>
            </div>

            <p className="text-xs text-foreground/90 leading-relaxed">
              {turnFeedback.feedback}
            </p>

            {turnFeedback.suggestedAnswer && (
              <div className="p-3 rounded-xl bg-card border border-border text-xs text-muted-foreground">
                <span className="font-semibold text-primary block text-[11px] mb-1">
                  Model Response Recommendation:
                </span>
                <p className="leading-relaxed">{turnFeedback.suggestedAnswer}</p>
              </div>
            )}

            {turnFeedback.followUp && (
              <div className="p-3 rounded-xl bg-accent/20 border border-accent text-xs text-foreground flex items-start gap-2.5">
                <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[11px] block">
                    Interviewer Probing Follow-Up:
                  </span>
                  <p className="text-foreground/90">{turnFeedback.followUp}</p>
                </div>
              </div>
            )}

            {/* Turn Navigation Button */}
            <div className="flex items-center justify-end pt-2">
              {isLastTurn ? (
                <button
                  onClick={handleFinishSession}
                  disabled={finishingSession}
                  className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20"
                >
                  {finishingSession ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating Full Scorecard...</span>
                    </>
                  ) : (
                    <>
                      <Award className="w-4 h-4" />
                      <span>Finish & View Complete Scorecard (+50 XP)</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNextTurn}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center gap-2 transition-all shadow-sm"
                >
                  <span>Next Question ({currentTurnIndex + 2}/{session.turns.length})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
