"use client";

import React from "react";

interface BubbleItem {
  percent: number;
  label: string;
  color: "teal" | "purple" | "blue";
}

interface SkillRatingBubblesProps {
  title?: string;
  subtitle?: string;
  items?: BubbleItem[];
}

export function SkillRatingBubbles({
  title = "Your Rating",
  subtitle = "Skill mastery across verified curriculum competencies",
}: SkillRatingBubblesProps) {
  return (
    <div className="flex flex-col justify-between h-full space-y-4">
      <div>
        <h3 className="font-bold text-base text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>

      {/* Bubble Chart Graphic Matching Reference Layout */}
      <div className="relative w-full h-44 flex items-center justify-center">
        {/* Top/Center Purple Bubble */}
        <div className="absolute top-2 left-16 sm:left-20 w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex flex-col items-center justify-center shadow-md z-10 border-2 border-white/80 dark:border-card hover:scale-105 transition-transform duration-300">
          <span className="text-sm font-bold leading-none">85%</span>
          <span className="text-[10px] font-medium opacity-90 mt-0.5">Hygiene</span>
        </div>

        {/* Bottom Left Teal Bubble */}
        <div className="absolute bottom-1 left-4 sm:left-8 w-28 h-28 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 text-white flex flex-col items-center justify-center shadow-lg z-20 border-2 border-white dark:border-card hover:scale-105 transition-transform duration-300">
          <span className="text-base font-extrabold leading-none">92%</span>
          <span className="text-[11px] font-medium opacity-90 mt-0.5">Packaging</span>
        </div>

        {/* Right Large Blue Bubble */}
        <div className="absolute top-4 right-6 sm:right-10 w-32 h-32 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-white flex flex-col items-center justify-center shadow-xl z-10 border-2 border-white dark:border-card hover:scale-105 transition-transform duration-300">
          <span className="text-lg font-extrabold leading-none">85%</span>
          <span className="text-xs font-medium opacity-90 mt-0.5">Food Taste</span>
        </div>
      </div>
    </div>
  );
}
