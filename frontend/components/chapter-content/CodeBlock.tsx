"use client";

import { useState } from "react";
import { Code, Check, X } from "lucide-react";
import type { CodeContent } from "./types";

function renderMarkdown(text: string): string {
  return text
    .replace(/`([^`]+)`/g, '<code class="bg-zinc-800 text-green-400 px-1.5 py-0.5 rounded text-sm">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/^- (.+)$/gm, '<li class="text-zinc-300 ml-4 mb-1">• $1</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

interface CodeBlockProps {
  content: CodeContent;
}

export function CodeBlock({ content }: CodeBlockProps) {
  const [userCode, setUserCode] = useState("");
  const [validated, setValidated] = useState<boolean | null>(null);

  const handleValidate = () => {
    const normalized = userCode.trim().replace(/\s+/g, " ");
    const expected = content.expectedAnswer.trim().replace(/\s+/g, " ");
    setValidated(normalized === expected);
  };

  return (
    <div className="rounded-2xl bg-[#111] border border-white/5 p-6 md:p-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
          <Code className="h-5 w-5 text-purple-400" />
        </div>
        <h3 className="text-lg font-bold text-white">{content.title}</h3>
      </div>

      <div
        className="text-zinc-300 leading-relaxed mb-4"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(content.explanation) }}
      />

      <div className="bg-zinc-900 border border-white/10 rounded-lg p-4 mb-4">
        <pre className="text-sm overflow-x-auto">
          <code className="text-green-400">{content.code}</code>
        </pre>
      </div>

      <div className="bg-zinc-800/50 border border-white/10 rounded-lg p-4 mb-4">
        <p className="text-sm text-zinc-400 mb-2 font-medium">Your task:</p>
        <p className="text-sm text-zinc-300">{content.task}</p>
      </div>

      <textarea
        value={userCode}
        onChange={(e) => setUserCode(e.target.value)}
        placeholder="Write your code here..."
        className="w-full h-32 bg-zinc-900 border border-white/10 rounded-lg p-4 text-sm text-green-400 font-mono resize-none focus:outline-none focus:border-purple-500/50 mb-4"
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleValidate}
          className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-colors cursor-pointer"
        >
          Check Answer
        </button>

        {validated !== null && (
          <div className={`flex items-center gap-2 text-sm font-medium ${validated ? "text-green-400" : "text-red-400"}`}>
            {validated ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
            {validated ? "Correct!" : "Not quite. Try again!"}
          </div>
        )}
      </div>
    </div>
  );
}
