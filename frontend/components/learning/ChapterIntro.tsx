"use client";

import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";

interface ChapterIntroProps {
  chapterNumber: number;
  chapterTitle: string;
  chapterEmoji: string;
  onComplete: () => void;
}

export function ChapterIntro({ chapterNumber, chapterTitle, chapterEmoji, onComplete }: ChapterIntroProps) {
  const [phase, setPhase] = useState<"enter" | "show" | "exit">("enter");

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase("show"), 100);
    const timer2 = setTimeout(() => setPhase("exit"), 3500);
    const timer3 = setTimeout(() => onComplete(), 4000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a] overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] animate-pulse delay-700" />
      </div>

      <div
        className={`relative flex flex-col items-center transition-all duration-700 ease-out ${
          phase === "enter"
            ? "opacity-0 scale-90 translate-y-12"
            : phase === "show"
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-105 -translate-y-8"
        }`}
      >
        {/* Emoji with glow effect */}
        <div className="relative mb-8">
          <div className="absolute inset-0 w-28 h-28 bg-green-500/20 rounded-full blur-2xl" />
          <div className="relative w-28 h-28 rounded-3xl bg-gradient-to-br from-green-500/20 to-blue-500/10 border border-white/10 flex items-center justify-center">
            <span className="text-7xl">{chapterEmoji}</span>
          </div>
        </div>

        {/* Chapter label */}
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-4 w-4 text-green-500" />
          <p className="text-green-500 font-semibold text-sm tracking-wide uppercase">
            Chapter {chapterNumber}
          </p>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-white text-center max-w-lg leading-tight">
          {chapterTitle}
        </h1>

        {/* Decorative line */}
        <div className="mt-8 flex items-center gap-3">
          <div className="w-12 h-px bg-gradient-to-r from-transparent to-green-500/50" />
          <div className="w-2 h-2 rounded-full bg-green-500/50" />
          <div className="w-12 h-px bg-gradient-to-l from-transparent to-green-500/50" />
        </div>
      </div>
    </div>
  );
}
