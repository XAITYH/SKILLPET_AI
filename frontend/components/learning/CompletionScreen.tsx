"use client";

import { useEffect, useState } from "react";
import { Gem, Heart, Flame, Trophy, Star } from "lucide-react";

interface CompletionScreenProps {
  gemsEarned: number;
  heartsEarned: number;
  streakDays: number;
  isNewStreak: boolean;
  onContinue: () => void;
}

export function CompletionScreen({
  gemsEarned,
  heartsEarned,
  streakDays,
  isNewStreak,
  onContinue,
}: CompletionScreenProps) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1300),
      setTimeout(() => setPhase(4), 1800),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]">
      <div className="flex flex-col items-center text-center px-6">
        <div
          className={`transition-all duration-700 ease-out ${phase >= 1 ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}
        >
          <Trophy className="h-24 w-24 text-yellow-400 mx-auto mb-4" />
        </div>

        <h1
          className={`text-4xl font-bold text-white mb-8 transition-all duration-700 ease-out delay-200 ${phase >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          Chapter Complete!
        </h1>

        <div className="flex flex-col gap-6 w-full max-w-sm">
          <div
            className={`flex items-center justify-between p-6 rounded-2xl bg-green-500/10 border border-green-500/30 transition-all duration-700 ease-out ${phase >= 2 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-green-500/20 flex items-center justify-center">
                <Gem className="h-8 w-8 text-green-400" />
              </div>
              <div className="text-left">
                <p className="text-sm text-zinc-400">Gems Earned</p>
                <p className="text-2xl font-bold text-white">
                  +{gemsEarned}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`flex items-center justify-between p-6 rounded-2xl bg-red-500/10 border border-red-500/30 transition-all duration-700 ease-out delay-100 ${phase >= 3 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center">
                <Heart className="h-8 w-8 text-red-500 fill-red-500 animate-pulse" />
              </div>
              <div className="text-left">
                <p className="text-sm text-zinc-400">Hearts Earned</p>
                <p className="text-2xl font-bold text-white">
                  +{heartsEarned}
                </p>
              </div>
            </div>
          </div>

          {isNewStreak && (
            <div
              className={`flex items-center justify-between p-6 rounded-2xl bg-orange-500/10 border border-orange-500/30 transition-all duration-700 ease-out delay-200 ${phase >= 4 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-orange-500/20 flex items-center justify-center">
                  <Flame className="h-8 w-8 text-orange-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm text-zinc-400">
                    Daily Streak
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {streakDays} day{streakDays > 1 ? "s" : ""}!
                  </p>
                </div>
              </div>
              <Flame className="h-8 w-8 text-orange-500 animate-bounce" />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onContinue}
          className={`mt-10 w-full max-w-sm py-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold text-lg transition-all cursor-pointer ${phase >= 4 ? "opacity-100" : "opacity-0"}`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
