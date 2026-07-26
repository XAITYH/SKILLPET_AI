"use client";

import { BookOpen } from "lucide-react";
import type { TheoryContent } from "./types";

function renderMarkdown(text: string): string {
  return text
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-zinc-800 border border-zinc-300 rounded-lg p-4 my-3 overflow-x-auto text-sm"><code class="text-green-600">$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-zinc-100 text-green-600 px-1.5 py-0.5 rounded text-sm">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-zinc-900 font-semibold">$1</strong>')
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold text-zinc-800 mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-zinc-800 mt-6 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-zinc-800 mt-6 mb-2">$1</h1>')
    .replace(/^- (.+)$/gm, '<li class="text-zinc-600 ml-4 mb-1">$1</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

interface TheoryBlockProps {
  content: TheoryContent;
}

export function TheoryBlock({ content }: TheoryBlockProps) {
  return (
    <div className="rounded-2xl bg-white border border-zinc-200 shadow-sm p-6 md:p-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <BookOpen className="h-5 w-5 text-blue-600" />
        </div>
        <h3 className="text-lg font-bold text-zinc-800">{content.title}</h3>
      </div>
      <div
        className="prose prose-zinc max-w-none text-zinc-600 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(content.body) }}
      />
    </div>
  );
}
