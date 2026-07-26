"use client";

import type { ChapterContentBlock } from "./types";
import { TheoryBlock } from "./TheoryBlock";
import { CodeBlock } from "./CodeBlock";
import { FillBlankBlock } from "./FillBlankBlock";
import { MCQBlock } from "./MCQBlock";
import { TrueFalseBlock } from "./TrueFalseBlock";
import { YesNoBlock } from "./YesNoBlock";
import { MatchingBlock } from "./MatchingBlock";

interface ChapterContentRendererProps {
  blocks: ChapterContentBlock[];
}

function BlockWrapper({ children, index }: { children: React.ReactNode; index: number }) {
  return (
    <div className="relative">
      {index > 0 && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-px h-4 bg-white/10" />
      )}
      {children}
    </div>
  );
}

export function ChapterContentRenderer({ blocks }: ChapterContentRendererProps) {
  if (blocks.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
        <p>No content available for this chapter yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {blocks.map((block, index) => (
        <BlockWrapper key={block.id} index={index}>
          {renderBlock(block)}
        </BlockWrapper>
      ))}
    </div>
  );
}

function renderBlock(block: ChapterContentBlock) {
  switch (block.type) {
    case "theory":
      return <TheoryBlock content={block.content as import("./types").TheoryContent} />;
    case "code":
      return <CodeBlock content={block.content as import("./types").CodeContent} />;
    case "fill-blank":
      return <FillBlankBlock content={block.content as import("./types").FillBlankContent} />;
    case "multiple-choice":
      return <MCQBlock content={block.content as import("./types").MCQContent} />;
    case "true-false":
      return <TrueFalseBlock content={block.content as import("./types").TrueFalseContent} />;
    case "yes-no":
      return <YesNoBlock content={block.content as import("./types").YesNoContent} />;
    case "matching":
      return <MatchingBlock content={block.content as import("./types").MatchingContent} />;
    default:
      return null;
  }
}
