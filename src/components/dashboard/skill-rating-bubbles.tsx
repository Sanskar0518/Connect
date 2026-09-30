"use client";

import React from "react";

export interface SkillBubble {
  percent: number;
  label: string;
}

interface SkillRatingBubblesProps {
  title?: string;
  subtitle?: string;
  bubbles?: {
    systemDesign?: SkillBubble;
    problemSolving?: SkillBubble;
    techStack?: SkillBubble;
  };
}

export function SkillRatingBubbles({
  title = "Skill Proficiency",
  subtitle = "Mastery across verified software engineering competencies",
  bubbles = {
    systemDesign: { percent: 85, label: "System Design" },
    problemSolving: { percent: 92, label: "Problem Solving" },
    techStack: { percent: 88, label: "Tech Stack" },
  },
}: SkillRatingBubblesProps) {
  const p1 = bubbles.systemDesign || { percent: 85, label: "System Design" };
  const p2 = bubbles.problemSolving || { percent: 92, label: "Problem Solving" };
  const p3 = bubbles.techStack || { percent: 88, label: "Tech Stack" };

  return (
    <div className="flex flex-col justify-between h-full space-y-4">
      <div>
        <h3 className="font-bold text-base text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>

      {/* Bubble Chart Graphic Matching Reference Layout with Relevant Engineering Domains */}
      <div className="relative w-full h-44 flex items-center justify-center">
        {/* Top/Center Purple Bubble - Architecture / System Design */}
        <div className="absolute top-2 left-12 sm:left-16 w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex flex-col items-center justify-center text-center shadow-md z-10 border-2 border-white/80 dark:border-card hover:scale-105 transition-transform duration-300 p-2">
          <span className="text-sm font-extrabold leading-none">{p1.percent}%</span>
          <span className="text-[10px] font-semibold opacity-90 mt-1 leading-tight">{p1.label}</span>
        </div>

        {/* Bottom Left Teal Bubble - Problem Solving / Algorithms */}
        <div className="absolute bottom-1 left-2 sm:left-6 w-28 h-28 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 text-white flex flex-col items-center justify-center text-center shadow-lg z-20 border-2 border-white dark:border-card hover:scale-105 transition-transform duration-300 p-2">
          <span className="text-base font-extrabold leading-none">{p2.percent}%</span>
          <span className="text-[11px] font-semibold opacity-90 mt-1 leading-tight">{p2.label}</span>
        </div>

        {/* Right Large Blue Bubble - Core Tech Stack / Development */}
        <div className="absolute top-4 right-4 sm:right-8 w-32 h-32 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-white flex flex-col items-center justify-center text-center shadow-xl z-10 border-2 border-white dark:border-card hover:scale-105 transition-transform duration-300 p-3">
          <span className="text-lg font-extrabold leading-none">{p3.percent}%</span>
          <span className="text-xs font-semibold opacity-90 mt-1 leading-tight">{p3.label}</span>
        </div>
      </div>
    </div>
  );
}
