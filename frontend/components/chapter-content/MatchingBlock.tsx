"use client";

import { useState } from "react";
import { GitCompare, Check, X } from "lucide-react";
import type { MatchingContent } from "./types";

interface MatchingBlockProps {
  content: MatchingContent;
}

export function MatchingBlock({ content }: MatchingBlockProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isCorrect = selectedIndex === content.correctIndex;

  return (
    <div className="rounded-2xl bg-[#111] border border-white/5 p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
          <GitCompare className="h-5 w-5 text-orange-400" />
        </div>
        <h3 className="text-lg font-bold text-white">Select the Best Match</h3>
      </div>

      <p className="text-lg text-zinc-300 mb-6 leading-relaxed">{content.question}</p>

      <div className="grid grid-cols-1 gap-3 mb-6">
        {content.options.map((option, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => !submitted && setSelectedIndex(idx)}
            disabled={submitted}
            className={`px-4 py-3 rounded-xl text-sm font-medium text-left transition-all cursor-pointer ${
              submitted && idx === content.correctIndex
                ? "bg-green-500/20 border-2 border-green-500 text-green-400"
                : submitted && idx === selectedIndex && !isCorrect
                  ? "bg-red-500/20 border-2 border-red-500 text-red-400"
                  : selectedIndex === idx
                    ? "bg-orange-500/20 border-2 border-orange-500 text-orange-400"
                    : "bg-white/5 border-2 border-white/10 text-zinc-300 hover:border-white/20"
            } ${submitted ? "cursor-default" : ""}`}
          >
            {option}
          </button>
        ))}
      </div>

      {!submitted && selectedIndex !== null && (
        <button
          type="button"
          onClick={() => setSubmitted(true)}
          className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold transition-colors cursor-pointer"
        >
          Submit Answer
        </button>
      )}

      {submitted && (
        <div className={`flex items-center gap-2 text-sm font-medium ${isCorrect ? "text-green-400" : "text-red-400"}`}>
          {isCorrect ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
          {isCorrect ? "Correct! Well done!" : "Incorrect. The correct answer is highlighted."}
        </div>
      )}
    </div>
  );
}
