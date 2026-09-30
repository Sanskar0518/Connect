"use client";

import { useState, useCallback } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, ShieldCheck } from "lucide-react";

interface UploadDropzoneProps {
  onSuccess: (result: {
    skillsCount: number;
    coursesCount: number;
    projectsCount: number;
    academicInfo: Record<string, unknown>;
    source: string;
  }) => void;
}

type UploadState = "idle" | "uploading" | "success" | "error";

export function UploadDropzone({ onSuccess }: UploadDropzoneProps) {
  const [state, setState] = useState<UploadState>("idle");
  const [message, setMessage] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");

  const processFile = useCallback(
    async (file: File) => {
      setFileName(file.name);
      setState("uploading");
      setMessage("Encrypting and extracting text…");

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/profile/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Upload failed.");
        }

        setState("success");
        setMessage(
          `Extracted ${data.extracted.skillsCount} skills, ${data.extracted.coursesCount} courses, ${data.extracted.projectsCount} projects.`
        );
        onSuccess(data.extracted);
      } catch (err: unknown) {
        setState("error");
        setMessage(err instanceof Error ? err.message : "Something went wrong.");
      }
    },
    [onSuccess]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const isUploading = state === "uploading";

  return (
    <div className="space-y-3">
      <label
        htmlFor="transcript-upload"
        className={`block border-2 border-dashed rounded-xl p-6 text-center space-y-2 transition-all cursor-pointer ${
          dragOver
            ? "border-primary bg-primary/5 scale-[1.01]"
            : state === "success"
            ? "border-secondary/60 bg-secondary/5"
            : state === "error"
            ? "border-destructive/60 bg-destructive/5"
            : "border-border bg-muted/20 hover:border-primary/50 hover:bg-primary/5"
        }`}
        onDragOver={(e: React.DragEvent<HTMLLabelElement>) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e: React.DragEvent<HTMLLabelElement>) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) processFile(file);
        }}
      >
        <input
          id="transcript-upload"
          type="file"
          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          className="sr-only"
          onChange={handleFileInput}
          disabled={isUploading}
        />

        <div className="flex flex-col items-center gap-2">
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          ) : state === "success" ? (
            <CheckCircle2 className="w-8 h-8 text-secondary" />
          ) : state === "error" ? (
            <AlertCircle className="w-8 h-8 text-destructive" />
          ) : (
            <UploadCloud className="w-8 h-8 text-muted-foreground" />
          )}

          {state === "idle" && (
            <>
              <p className="text-xs font-semibold text-foreground">
                Drag &amp; drop your academic transcript
              </p>
              <p className="text-[11px] text-muted-foreground">
                PDF, DOCX, or TXT · Max 10 MB
              </p>
            </>
          )}

          {isUploading && (
            <p className="text-xs font-medium text-primary animate-pulse">{message}</p>
          )}

          {state === "success" && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-secondary">Extraction complete!</p>
              <div className="flex items-center gap-1.5 text-[11px] text-secondary/80">
                <FileText className="w-3.5 h-3.5" />
                <span>{fileName}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">{message}</p>
              <p className="text-[11px] text-primary underline underline-offset-2 cursor-pointer mt-1">
                Upload another file
              </p>
            </div>
          )}

          {state === "error" && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-destructive">Upload failed</p>
              <p className="text-[11px] text-muted-foreground">{message}</p>
              <p className="text-[11px] text-primary underline underline-offset-2 cursor-pointer mt-1">
                Try again
              </p>
            </div>
          )}
        </div>
      </label>

      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <ShieldCheck className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
        <span>Files are encrypted with AES-256-GCM before storage. Consent granted.</span>
      </div>
    </div>
  );
}
