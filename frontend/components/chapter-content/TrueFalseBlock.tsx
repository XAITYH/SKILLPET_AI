"use client";

import { useState } from "react";
import { ToggleLeft, Check, X } from "lucide-react";
import type { TrueFalseContent } from "./types";

interface TrueFalseBlockProps {
  content: TrueFalseContent;
}

export function TrueFalseBlock({ content }: TrueFalseBlockProps) {
  const [selected, setSelected] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isCorrect = selected === content.correct;

  return (
    <div className="rounded-2xl bg-white border border-zinc-200 shadow-sm p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
          <ToggleLeft className="h-5 w-5 text-emerald-600" />
        </div>
        <h3 className="text-lg font-bold text-zinc-800">True or False</h3>
      </div>

      <p className="text-lg text-zinc-700 mb-6 leading-relaxed">{content.statement}</p>

      <div className="flex gap-4 mb-6">
        <button
          type="button"
          onClick={() => !submitted && setSelected(true)}
          disabled={submitted}
          className={`flex-1 px-6 py-4 rounded-xl text-base font-semibold transition-all cursor-pointer ${
            submitted && content.correct === true
              ? "bg-green-100 border-2 border-green-500 text-green-700"
              : submitted && selected === true && !isCorrect
                ? "bg-red-100 border-2 border-red-500 text-red-700"
                : selected === true
                  ? "bg-emerald-100 border-2 border-emerald-500 text-emerald-700"
                  : "bg-zinc-50 border-2 border-zinc-200 text-zinc-700 hover:border-zinc-300"
          } ${submitted ? "cursor-default" : ""}`}
        >
          True
        </button>
        <button
          type="button"
          onClick={() => !submitted && setSelected(false)}
          disabled={submitted}
          className={`flex-1 px-6 py-4 rounded-xl text-base font-semibold transition-all cursor-pointer ${
            submitted && content.correct === false
              ? "bg-green-100 border-2 border-green-500 text-green-700"
              : submitted && selected === false && !isCorrect
                ? "bg-red-100 border-2 border-red-500 text-red-700"
                : selected === false
                  ? "bg-emerald-100 border-2 border-emerald-500 text-emerald-700"
                  : "bg-zinc-50 border-2 border-zinc-200 text-zinc-700 hover:border-zinc-300"
          } ${submitted ? "cursor-default" : ""}`}
        >
          False
        </button>
      </div>

      {!submitted && selected !== null && (
        <button
          type="button"
          onClick={() => setSubmitted(true)}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors cursor-pointer"
        >
          Submit Answer
        </button>
      )}

      {submitted && (
        <div className={`flex items-center gap-2 text-sm font-medium ${isCorrect ? "text-green-600" : "text-red-600"}`}>
          {isCorrect ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
          {isCorrect ? "Correct! Well done!" : "Incorrect. The correct answer is highlighted."}
        </div>
      )}
    </div>
  );
}
