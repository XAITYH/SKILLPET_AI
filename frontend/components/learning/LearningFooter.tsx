"use client";

import { ArrowRight, Lightbulb, Heart } from "lucide-react";

interface LearningFooterProps {
  canContinue: boolean;
  hint?: string;
  showHint: boolean;
  hearts: number;
  onUseHeart: () => void;
  onShowHint: () => void;
  onContinue: () => void;
}

const DEFAULT_HINT =
  "Think carefully about what you've learned in this chapter and apply it to the question.";

export function LearningFooter({
  canContinue,
  hint,
  showHint,
  hearts,
  onUseHeart,
  onShowHint,
  onContinue,
}: LearningFooterProps) {
  const displayHint = hint || DEFAULT_HINT;

  return (
    <div className=" bottom-0 bg-[#0a0a0a] border-t border-white/10 px-6 py-4">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {!showHint && hearts > 0 ? (
            <button
              type="button"
              onClick={onUseHeart}
              className="flex items-center gap-2 px-5 py-4 rounded-3xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            >
              <Heart className="h-5 w-5 text-red-500 fill-red-500" />
              <span className="text-sm font-semibold">Use Heart</span>
            </button>
          ) : showHint ? (
            <div className="flex-1 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-300">
                  {displayHint}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue}
          className={`flex-1 max-w-md px-8 py-4 rounded-3xl font-semibold text-base transition-all cursor-pointer flex items-center justify-between gap-2 ${
            canContinue
              ? "bg-green-600 hover:bg-green-500 text-white"
              : "bg-white/5 text-zinc-500 cursor-not-allowed"
          }`}
        >
          Continue
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
