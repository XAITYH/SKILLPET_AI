"use client";

import { useState, useEffect, useRef } from "react";
import { Check, X, BookOpen, Code, PenLine, CircleCheck, ToggleLeft, HelpCircle, GitCompare } from "lucide-react";
import type { ChapterContentBlock } from "@/components/chapter-content/types";

function renderMarkdown(text: string): string {
  return text
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-zinc-900 border border-white/10 rounded-lg p-4 my-3 overflow-x-auto text-sm"><code class="text-green-400">$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-zinc-800 text-green-400 px-1.5 py-0.5 rounded text-sm">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold text-white mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-white mt-6 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-white mt-6 mb-2">$1</h1>')
    .replace(/^- (.+)$/gm, '<li class="text-zinc-300 ml-4 mb-1">$1</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

interface LearningContentProps {
  block: ChapterContentBlock;
  onCorrect: () => void;
  onIncorrect: () => void;
  showFeedback: boolean;
  feedbackType: "correct" | "incorrect" | null;
  feedbackMessage: string;
}

export function LearningContent({
  block,
  onCorrect,
  onIncorrect,
  showFeedback,
  feedbackType,
  feedbackMessage,
}: LearningContentProps) {
  const content = block.content as Record<string, unknown>;

  switch (block.type) {
    case "theory":
      return <TheoryContent content={content} />;
    case "code":
      return <CodeContent content={content} onCorrect={onCorrect} onIncorrect={onIncorrect} showFeedback={showFeedback} feedbackType={feedbackType} feedbackMessage={feedbackMessage} />;
    case "fill-blank":
      return <FillBlankContent content={content} onCorrect={onCorrect} onIncorrect={onIncorrect} showFeedback={showFeedback} feedbackType={feedbackType} feedbackMessage={feedbackMessage} />;
    case "multiple-choice":
      return <MCQContent content={content} onCorrect={onCorrect} onIncorrect={onIncorrect} showFeedback={showFeedback} feedbackType={feedbackType} feedbackMessage={feedbackMessage} />;
    case "true-false":
      return <TrueFalseContent content={content} onCorrect={onCorrect} onIncorrect={onIncorrect} showFeedback={showFeedback} feedbackType={feedbackType} feedbackMessage={feedbackMessage} />;
    case "yes-no":
      return <YesNoContent content={content} onCorrect={onCorrect} onIncorrect={onIncorrect} showFeedback={showFeedback} feedbackType={feedbackType} feedbackMessage={feedbackMessage} />;
    case "matching":
      return <MatchingContent content={content} onCorrect={onCorrect} onIncorrect={onIncorrect} showFeedback={showFeedback} feedbackType={feedbackType} feedbackMessage={feedbackMessage} />;
    default:
      return null;
  }
}

function TheoryContent({ content }: { content: Record<string, unknown> }) {
  const title = content.title as string;
  const body = content.body as string;

  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-6">
        <BookOpen className="h-8 w-8 text-blue-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
      <div
        className="prose prose-invert max-w-2xl text-zinc-300 leading-relaxed text-left"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }}
      />
    </div>
  );
}

function CodeContent({ content, onCorrect, onIncorrect, showFeedback, feedbackType, feedbackMessage }: {
  content: Record<string, unknown>;
  onCorrect: () => void;
  onIncorrect: () => void;
  showFeedback: boolean;
  feedbackType: "correct" | "incorrect" | null;
  feedbackMessage: string;
}) {
  const [userCode, setUserCode] = useState("");
  const [validated, setValidated] = useState<boolean | null>(null);

  const title = content.title as string;
  const explanation = content.explanation as string;
  const code = content.code as string;
  const task = content.task as string;
  const expectedAnswer = content.expectedAnswer as string;

  const normalizeCode = (str: string) => {
    return str
      .trim()
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join("\n");
  };

  const handleCheck = () => {
    const normalized = normalizeCode(userCode);
    const expected = normalizeCode(expectedAnswer);
    
    // Exact match
    const isExactMatch = normalized === expected;
    
    // Line-by-line check: all expected lines exist in user answer (order-insensitive)
    const expectedLines = expected.split("\n").filter(l => l.length > 0);
    const userLines = normalized.split("\n").filter(l => l.length > 0);
    const allLinesPresent = expectedLines.length > 0 && expectedLines.every(line => 
      userLines.some(userLine => userLine.includes(line) || line.includes(userLine))
    );
    
    // Fuzzy match: normalize quotes and whitespace for comparison
    const fuzzyNormalize = (s: string) => s.replace(/['"]/g, '"').replace(/\s+/g, " ").trim().toLowerCase();
    const isFuzzyMatch = fuzzyNormalize(normalized) === fuzzyNormalize(expected);
    
    const isCorrect = isExactMatch || allLinesPresent || isFuzzyMatch;
    
    setValidated(isCorrect);
    if (isCorrect) {
      onCorrect();
    } else {
      onIncorrect();
    }
  };

  const handleTryAgain = () => {
    setValidated(null);
    setUserCode("");
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6">
        <Code className="h-8 w-8 text-purple-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
      
      <div
        className="text-zinc-300 leading-relaxed mb-6 text-center"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(explanation) }}
      />

      <div className="w-full bg-zinc-900 border border-white/10 rounded-xl p-4 mb-4">
        <pre className="text-sm overflow-x-auto">
          <code className="text-green-400">{code}</code>
        </pre>
      </div>

      <div className="w-full bg-zinc-800/50 border border-white/10 rounded-xl p-4 mb-4">
        <p className="text-sm text-zinc-400 mb-1 font-medium">Your task:</p>
        <p className="text-sm text-zinc-300">{task}</p>
      </div>

      <textarea
        value={userCode}
        onChange={(e) => setUserCode(e.target.value)}
        placeholder="Write your code here..."
        className="w-full h-32 bg-zinc-900 border border-white/10 rounded-xl p-4 text-sm text-green-400 font-mono resize-none focus:outline-none focus:border-purple-500/50 mb-4"
      />

      {validated === null && (
        <button
          type="button"
          onClick={handleCheck}
          disabled={!userCode.trim()}
          className="w-full py-4 rounded-xl bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-semibold transition-colors cursor-pointer"
        >
          Check Answer
        </button>
      )}

      {validated !== null && !validated && (
        <button
          type="button"
          onClick={handleTryAgain}
          className="w-full py-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition-colors cursor-pointer"
        >
          Try Again
        </button>
      )}

      {showFeedback && (
        <FeedbackAlert type={feedbackType} message={feedbackMessage} />
      )}
    </div>
  );
}

function FillBlankContent({ content, onCorrect, onIncorrect, showFeedback, feedbackType, feedbackMessage }: {
  content: Record<string, unknown>;
  onCorrect: () => void;
  onIncorrect: () => void;
  showFeedback: boolean;
  feedbackType: "correct" | "incorrect" | null;
  feedbackMessage: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const sentence = content.sentence as string;
  const options = content.options as string[];
  const correctIndex = content.correctIndex as number;

  const parts = sentence.split("___");

  const handleSubmit = () => {
    if (selectedIndex === null) return;
    setSubmitted(true);
    const correct = selectedIndex === correctIndex;
    setIsCorrect(correct);
    if (correct) {
      onCorrect();
    } else {
      onIncorrect();
    }
  };

  const handleTryAgain = () => {
    setSubmitted(false);
    setSelectedIndex(null);
    setIsCorrect(null);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center mb-6">
        <PenLine className="h-8 w-8 text-amber-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-8">Fill in the Blank</h2>

      <div className="w-full bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
        <p className="text-lg text-zinc-300 leading-relaxed">
          {parts.map((part, i) => (
            <span key={i}>
              {part}
              {i < parts.length - 1 && (
                <span className="inline-block mx-1 px-4 py-1 rounded-lg bg-zinc-800 border border-white/10 text-green-400 font-mono min-w-[100px] text-center">
                  {selectedIndex !== null ? options[selectedIndex] : "______"}
                </span>
              )}
            </span>
          ))}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mb-6">
        {options.map((option, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => !submitted && setSelectedIndex(idx)}
            disabled={submitted}
            className={`px-6 py-4 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              submitted && idx === correctIndex
                ? "bg-green-500/20 border-2 border-green-500 text-green-400"
                : submitted && idx === selectedIndex && !isCorrect
                  ? "bg-red-500/20 border-2 border-red-500 text-red-400"
                  : selectedIndex === idx
                    ? "bg-amber-500/20 border-2 border-amber-500 text-amber-400"
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
          onClick={handleSubmit}
          className="w-full py-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold transition-colors cursor-pointer"
        >
          Check Answer
        </button>
      )}

      {submitted && !isCorrect && (
        <button
          type="button"
          onClick={handleTryAgain}
          className="w-full py-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition-colors cursor-pointer mt-4"
        >
          Try Again
        </button>
      )}

      {showFeedback && (
        <FeedbackAlert type={feedbackType} message={feedbackMessage} />
      )}
    </div>
  );
}

function MCQContent({ content, onCorrect, onIncorrect, showFeedback, feedbackType, feedbackMessage }: {
  content: Record<string, unknown>;
  onCorrect: () => void;
  onIncorrect: () => void;
  showFeedback: boolean;
  feedbackType: "correct" | "incorrect" | null;
  feedbackMessage: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const question = content.question as string;
  const options = content.options as string[];
  const correctIndex = content.correctIndex as number;

  const handleSubmit = () => {
    if (selectedIndex === null) return;
    setSubmitted(true);
    const correct = selectedIndex === correctIndex;
    setIsCorrect(correct);
    if (correct) {
      onCorrect();
    } else {
      onIncorrect();
    }
  };

  const handleTryAgain = () => {
    setSubmitted(false);
    setSelectedIndex(null);
    setIsCorrect(null);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 flex items-center justify-center mb-6">
        <CircleCheck className="h-8 w-8 text-cyan-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-8">Multiple Choice</h2>

      <div className="w-full bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
        <p className="text-lg text-zinc-300">{question}</p>
      </div>

      <div className="flex flex-col gap-3 w-full mb-6">
        {options.map((option, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => !submitted && setSelectedIndex(idx)}
            disabled={submitted}
            className={`px-6 py-4 rounded-xl text-sm font-medium text-left transition-all cursor-pointer ${
              submitted && idx === correctIndex
                ? "bg-green-500/20 border-2 border-green-500 text-green-400"
                : submitted && idx === selectedIndex && !isCorrect
                  ? "bg-red-500/20 border-2 border-red-500 text-red-400"
                  : selectedIndex === idx
                    ? "bg-cyan-500/20 border-2 border-cyan-500 text-cyan-400"
                    : "bg-white/5 border-2 border-white/10 text-zinc-300 hover:border-white/20"
            } ${submitted ? "cursor-default" : ""}`}
          >
            <span className="mr-3 text-zinc-500">{String.fromCharCode(65 + idx)}.</span>
            {option}
          </button>
        ))}
      </div>

      {!submitted && selectedIndex !== null && (
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full py-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold transition-colors cursor-pointer"
        >
          Check Answer
        </button>
      )}

      {submitted && !isCorrect && (
        <button
          type="button"
          onClick={handleTryAgain}
          className="w-full py-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition-colors cursor-pointer mt-4"
        >
          Try Again
        </button>
      )}

      {showFeedback && (
        <FeedbackAlert type={feedbackType} message={feedbackMessage} />
      )}
    </div>
  );
}

function TrueFalseContent({ content, onCorrect, onIncorrect, showFeedback, feedbackType, feedbackMessage }: {
  content: Record<string, unknown>;
  onCorrect: () => void;
  onIncorrect: () => void;
  showFeedback: boolean;
  feedbackType: "correct" | "incorrect" | null;
  feedbackMessage: string;
}) {
  const [selected, setSelected] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const statement = content.statement as string;
  const correct = content.correct as boolean;

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    const correctAnswer = selected === correct;
    setIsCorrect(correctAnswer);
    if (correctAnswer) {
      onCorrect();
    } else {
      onIncorrect();
    }
  };

  const handleTryAgain = () => {
    setSubmitted(false);
    setSelected(null);
    setIsCorrect(null);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-6">
        <ToggleLeft className="h-8 w-8 text-emerald-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-8">True or False</h2>

      <div className="w-full bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
        <p className="text-lg text-zinc-300">{statement}</p>
      </div>

      <div className="flex gap-4 w-full mb-6">
        <button
          type="button"
          onClick={() => !submitted && setSelected(true)}
          disabled={submitted}
          className={`flex-1 py-6 rounded-xl text-lg font-semibold transition-all cursor-pointer ${
            submitted && correct === true
              ? "bg-green-500/20 border-2 border-green-500 text-green-400"
              : submitted && selected === true && !correct
                ? "bg-red-500/20 border-2 border-red-500 text-red-400"
                : selected === true
                  ? "bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400"
                  : "bg-white/5 border-2 border-white/10 text-zinc-300 hover:border-white/20"
          } ${submitted ? "cursor-default" : ""}`}
        >
          True
        </button>
        <button
          type="button"
          onClick={() => !submitted && setSelected(false)}
          disabled={submitted}
          className={`flex-1 py-6 rounded-xl text-lg font-semibold transition-all cursor-pointer ${
            submitted && correct === false
              ? "bg-green-500/20 border-2 border-green-500 text-green-400"
              : submitted && selected === false && correct
                ? "bg-red-500/20 border-2 border-red-500 text-red-400"
                : selected === false
                  ? "bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400"
                  : "bg-white/5 border-2 border-white/10 text-zinc-300 hover:border-white/20"
          } ${submitted ? "cursor-default" : ""}`}
        >
          False
        </button>
      </div>

      {!submitted && selected !== null && (
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full py-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold transition-colors cursor-pointer"
        >
          Check Answer
        </button>
      )}

      {submitted && !isCorrect && (
        <button
          type="button"
          onClick={handleTryAgain}
          className="w-full py-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition-colors cursor-pointer mt-4"
        >
          Try Again
        </button>
      )}

      {showFeedback && (
        <FeedbackAlert type={feedbackType} message={feedbackMessage} />
      )}
    </div>
  );
}

function YesNoContent({ content, onCorrect, onIncorrect, showFeedback, feedbackType, feedbackMessage }: {
  content: Record<string, unknown>;
  onCorrect: () => void;
  onIncorrect: () => void;
  showFeedback: boolean;
  feedbackType: "correct" | "incorrect" | null;
  feedbackMessage: string;
}) {
  const [selected, setSelected] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const question = content.question as string;
  const correct = content.correct as boolean;

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    const correctAnswer = selected === correct;
    setIsCorrect(correctAnswer);
    if (correctAnswer) {
      onCorrect();
    } else {
      onIncorrect();
    }
  };

  const handleTryAgain = () => {
    setSubmitted(false);
    setSelected(null);
    setIsCorrect(null);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-pink-500/20 flex items-center justify-center mb-6">
        <HelpCircle className="h-8 w-8 text-pink-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-8">Yes or No</h2>

      <div className="w-full bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
        <p className="text-lg text-zinc-300">{question}</p>
      </div>

      <div className="flex gap-4 w-full mb-6">
        <button
          type="button"
          onClick={() => !submitted && setSelected(true)}
          disabled={submitted}
          className={`flex-1 py-6 rounded-xl text-lg font-semibold transition-all cursor-pointer ${
            submitted && correct === true
              ? "bg-green-500/20 border-2 border-green-500 text-green-400"
              : submitted && selected === true && !correct
                ? "bg-red-500/20 border-2 border-red-500 text-red-400"
                : selected === true
                  ? "bg-pink-500/20 border-2 border-pink-500 text-pink-400"
                  : "bg-white/5 border-2 border-white/10 text-zinc-300 hover:border-white/20"
          } ${submitted ? "cursor-default" : ""}`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => !submitted && setSelected(false)}
          disabled={submitted}
          className={`flex-1 py-6 rounded-xl text-lg font-semibold transition-all cursor-pointer ${
            submitted && correct === false
              ? "bg-green-500/20 border-2 border-green-500 text-green-400"
              : submitted && selected === false && correct
                ? "bg-red-500/20 border-2 border-red-500 text-red-400"
                : selected === false
                  ? "bg-pink-500/20 border-2 border-pink-500 text-pink-400"
                  : "bg-white/5 border-2 border-white/10 text-zinc-300 hover:border-white/20"
          } ${submitted ? "cursor-default" : ""}`}
        >
          No
        </button>
      </div>

      {!submitted && selected !== null && (
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full py-4 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-semibold transition-colors cursor-pointer"
        >
          Check Answer
        </button>
      )}

      {submitted && !isCorrect && (
        <button
          type="button"
          onClick={handleTryAgain}
          className="w-full py-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition-colors cursor-pointer mt-4"
        >
          Try Again
        </button>
      )}

      {showFeedback && (
        <FeedbackAlert type={feedbackType} message={feedbackMessage} />
      )}
    </div>
  );
}

function MatchingContent({ content, onCorrect, onIncorrect, showFeedback, feedbackType, feedbackMessage }: {
  content: Record<string, unknown>;
  onCorrect: () => void;
  onIncorrect: () => void;
  showFeedback: boolean;
  feedbackType: "correct" | "incorrect" | null;
  feedbackMessage: string;
}) {
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Map<number, number>>(new Map());
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [shuffledRightIndices] = useState(() => {
    const options = content.options as string[];
    return [...Array(options.length).keys()].sort(() => Math.random() - 0.5);
  });

  const onCorrectRef = useRef(onCorrect);
  const onIncorrectRef = useRef(onIncorrect);
  onCorrectRef.current = onCorrect;
  onIncorrectRef.current = onIncorrect;

  const question = content.question as string;
  const options = content.options as string[];

  const leftItems = options.map((opt) => {
    const parts = opt.split(" - ");
    return parts[0] || opt;
  });
  const rightItems = options.map((opt) => {
    const parts = opt.split(" - ");
    return parts[1] || opt;
  });

  useEffect(() => {
    if (selectedLeft !== null && selectedRight !== null && !submitted) {
      const newMatched = new Map(matchedPairs);
      newMatched.set(selectedLeft, selectedRight);
      setMatchedPairs(newMatched);
      setSelectedLeft(null);
      setSelectedRight(null);

      if (newMatched.size === options.length) {
        setSubmitted(true);
        const allCorrect = Array.from(newMatched.entries()).every(
          ([left, right]) => left === right
        );
        setIsCorrect(allCorrect);
      }
    }
  }, [selectedLeft, selectedRight, submitted, matchedPairs, options.length]);

  useEffect(() => {
    if (submitted && isCorrect !== null) {
      if (isCorrect) {
        onCorrectRef.current();
      } else {
        onIncorrectRef.current();
      }
    }
  }, [submitted, isCorrect]);

  const handleLeftClick = (idx: number) => {
    if (submitted || matchedPairs.has(idx)) return;
    setSelectedLeft(idx);
  };

  const handleRightClick = (idx: number) => {
    if (submitted || Array.from(matchedPairs.values()).includes(idx)) return;
    setSelectedRight(idx);
  };

  const handleTryAgain = () => {
    setSubmitted(false);
    setSelectedLeft(null);
    setSelectedRight(null);
    setMatchedPairs(new Map());
    setIsCorrect(null);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center mb-6">
        <GitCompare className="h-8 w-8 text-orange-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-4">Match the Pairs</h2>

      <div className="w-full bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
        <p className="text-lg text-zinc-300">{question}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full mb-6">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-zinc-500 font-medium mb-2 text-center">Items</p>
          {leftItems.map((item, idx) => {
            const isMatched = matchedPairs.has(idx);
            const isSelected = selectedLeft === idx;
            return (
              <button
                key={`left-${idx}`}
                type="button"
                onClick={() => handleLeftClick(idx)}
                disabled={submitted || isMatched}
                className={`px-4 py-4 rounded-xl text-sm font-medium text-left transition-all cursor-pointer ${
                  isMatched
                    ? "bg-green-500/20 border-2 border-green-500 text-green-400 cursor-default"
                    : isSelected
                      ? "bg-orange-500/20 border-2 border-orange-500 text-orange-400"
                      : "bg-white/5 border-2 border-white/10 text-zinc-300 hover:border-white/20"
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-sm text-zinc-500 font-medium mb-2 text-center">Matches</p>
          {shuffledRightIndices.map((origIdx) => {
            const isMatched = Array.from(matchedPairs.values()).includes(origIdx);
            const isSelected = selectedRight === origIdx;
            return (
              <button
                key={`right-${origIdx}`}
                type="button"
                onClick={() => handleRightClick(origIdx)}
                disabled={submitted || isMatched}
                className={`px-4 py-4 rounded-xl text-sm font-medium text-left transition-all cursor-pointer ${
                  isMatched
                    ? "bg-green-500/20 border-2 border-green-500 text-green-400 cursor-default"
                    : isSelected
                      ? "bg-orange-500/20 border-2 border-orange-500 text-orange-400"
                      : "bg-white/5 border-2 border-white/10 text-zinc-300 hover:border-white/20"
                }`}
              >
                {rightItems[origIdx]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="text-sm text-zinc-400 mb-4">
        {matchedPairs.size} of {options.length} pairs matched
      </div>

      {submitted && !isCorrect && (
        <button
          type="button"
          onClick={handleTryAgain}
          className="w-full py-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition-colors cursor-pointer"
        >
          Try Again
        </button>
      )}

      {showFeedback && (
        <FeedbackAlert type={feedbackType} message={feedbackMessage} />
      )}
    </div>
  );
}

function FeedbackAlert({ type, message }: { type: "correct" | "incorrect" | null; message: string }) {
  if (!type || !message) return null;

  return (
    <div className={`w-full p-4 rounded-xl mt-4 ${type === "correct" ? "bg-green-500/20 border border-green-500/50" : "bg-red-500/20 border border-red-500/50"}`}>
      <div className="flex items-start gap-3">
        {type === "correct" ? (
          <Check className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
        ) : (
          <X className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
        )}
        <p className={`text-sm ${type === "correct" ? "text-green-300" : "text-red-300"}`}>
          {message}
        </p>
      </div>
    </div>
  );
}
