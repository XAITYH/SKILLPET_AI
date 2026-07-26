"use client";

import { ArrowLeft, Gem, Heart, Flame } from "lucide-react";

interface LearningHeaderProps {
  chapterNumber: number;
  chapterTitle: string;
  progress: number;
  gems: number;
  hearts: number;
  maxHearts: number;
  streakDays?: number;
  courseSlug: string;
  onBack: () => void;
}

export function LearningHeader({
  chapterNumber,
  chapterTitle,
  progress,
  gems,
  hearts,
  maxHearts,
  streakDays = 0,
  courseSlug,
  onBack,
}: LearningHeaderProps) {
  return (
    <div className="sticky top-0 z-50 bg-[#0a0a0a] border-b border-white/10 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="shrink-0">
          <p className="text-xs text-green-500 font-semibold">
            Chapter {chapterNumber}
          </p>
          <p className="text-sm font-semibold text-white truncate max-w-[200px]">
            {chapterTitle}
          </p>
        </div>

        <div className="flex-1 max-w-xl mx-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-3.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm font-bold text-white shrink-0">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {streakDays > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5">
              <Flame className="h-5 w-5 text-orange-400" />
              <span className="text-sm font-bold text-white">
                {streakDays}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5">
            <Gem className="h-5 w-5 text-green-400" />
            <span className="text-sm font-bold text-white">
              {gems}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5">
            <Heart className="h-5 w-5 text-red-500 fill-red-500" />
            <span className="text-sm font-bold text-white">
              {hearts}/{maxHearts}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
