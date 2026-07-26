"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Lock, CreditCard } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api-client";
import { LearningHeader, LearningContent, LearningFooter, ChapterIntro, CompletionScreen } from "@/components/learning";
import type { ChapterContentBlock, BlockType } from "@/components/chapter-content/types";
import {
  getCourseAccessType,
  canAccessChapter,
} from "@/lib/course-access";

interface ChapterData {
  id: number;
  documentId: string;
  title: string;
  description: string;
  emoji: string;
  order: number;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
}

interface UserProgress {
  gems: number;
  hearts: number;
  streakDays: number;
  completedChapters: string[];
  lastStreak: string;
}

const READ_ONLY_TYPES: BlockType[] = ["theory"];

export default function LearnPage() {
  const params = useParams();
  const router = useRouter();
  const { user, subscription } = useAuth();
  
  const chapterId = params.chapterId as string;
  
  const [chapter, setChapter] = useState<ChapterData | null>(null);
  const [allChapters, setAllChapters] = useState<ChapterData[]>([]);
  const [blocks, setBlocks] = useState<ChapterContentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  
  const [showIntro, setShowIntro] = useState(true);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"correct" | "incorrect" | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [canContinue, setCanContinue] = useState(false);
  const [showHint, setShowHint] = useState(false);
  
  const [gems, setGems] = useState(0);
  const [hearts, setHearts] = useState(10);
  const [gemsThisChapter, setGemsThisChapter] = useState(0);
  const [heartsThisChapter, setHeartsThisChapter] = useState(0);
  const [incorrectBlocks, setIncorrectBlocks] = useState<Set<number>>(new Set());
  
  const [isCompleted, setIsCompleted] = useState(false);
  const [streakDays, setStreakDays] = useState(0);
  const [isNewStreak, setIsNewStreak] = useState(false);
  const [serverCompletedChapters, setServerCompletedChapters] = useState<string[]>([]);

  const currentBlock = blocks[currentBlockIndex];
  const isReadOnly = useMemo(() => {
    return currentBlock ? READ_ONLY_TYPES.includes(currentBlock.type) : false;
  }, [currentBlock]);

  // Fetch user progress - try Strapi, fallback to localStorage
  const fetchUserProgress = useCallback(async (): Promise<UserProgress> => {
    if (!user?.email || !chapter?.courseId) {
      return { gems: 0, hearts: 10, streakDays: 0, completedChapters: [], lastStreak: "" };
    }

    // Try Strapi first
    try {
      const res = await fetch(
        `/api/user-progress?email=${encodeURIComponent(user.email)}&courseDocumentId=${chapter.courseId}`
      );
      if (res.ok) {
        const data = await res.json();
        const progress = data.data;
        
        if (progress) {
          return {
            gems: progress.gems || 0,
            hearts: progress.hearts || 10,
            streakDays: progress.streakDays || 0,
            completedChapters: (() => {
              try {
                const parsed = typeof progress.completedChapters === 'string'
                  ? JSON.parse(progress.completedChapters)
                  : progress.completedChapters;
                return Array.isArray(parsed) ? parsed : [];
              } catch {
                return [];
              }
            })(),
            lastStreak: progress.lastStreak || "",
          };
        }
      }
    } catch {
      // Strapi failed
    }

    // Fallback to localStorage
    const saved = localStorage.getItem(`progress_${user.email}`);
    if (saved) {
      const data = JSON.parse(saved);
      return {
        gems: data.gems || 0,
        hearts: data.hearts || 10,
        streakDays: data.streakDays || 0,
        completedChapters: Array.isArray(data.completedChapters) ? data.completedChapters : [],
        lastStreak: data.lastStreakDate || "",
      };
    }

    return { gems: 0, hearts: 10, streakDays: 0, completedChapters: [], lastStreak: "" };
  }, [user?.email, chapter?.courseId]);

  // Save user progress - always save to localStorage, try Strapi too
  const saveUserProgress = useCallback(async (updates: Partial<UserProgress> & { completedChapterDocumentId?: string; lastActiveDate?: string }) => {
    if (!user?.email || !chapter?.courseId) return;

    // Always save to localStorage
    const existing = localStorage.getItem(`progress_${user.email}`);
    const current = existing ? JSON.parse(existing) : { gems: 0, hearts: 10, streakDays: 0, completedChapters: [] };
    
    const prevCompleted = Array.isArray(current.completedChapters) ? current.completedChapters : [];
    const completedChapters = updates.completedChapterDocumentId
      ? [...new Set([...prevCompleted, updates.completedChapterDocumentId])]
      : prevCompleted;

    localStorage.setItem(`progress_${user.email}`, JSON.stringify({
      gems: updates.gems ?? gems,
      hearts: updates.hearts ?? hearts,
      streakDays: updates.streakDays ?? streakDays,
      completedChapters,
      lastActiveDate: updates.lastActiveDate ?? current.lastActiveDate ?? "",
    }));

    // Try Strapi too
    try {
      await apiFetch("/api/user-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          courseDocumentId: chapter.courseId,
          completedChapterDocumentId: updates.completedChapterDocumentId,
          gems: updates.gems ?? gems,
          hearts: updates.hearts ?? hearts,
          streakDays: updates.streakDays ?? streakDays,
        }),
      });
    } catch {
      // localStorage already saved
    }
  }, [user?.email, chapter?.courseId, gems, hearts, streakDays]);

  // Load initial user progress
  useEffect(() => {
    if (user?.email && chapter?.courseId) {
      fetchUserProgress().then((progress) => {
        setGems(progress.gems);
        setHearts(progress.hearts);
        setStreakDays(progress.streakDays);
        setServerCompletedChapters(progress.completedChapters);
      });
    }
  }, [user?.email, chapter?.courseId, fetchUserProgress]);

  // Auto-enable continue for read-only blocks
  useEffect(() => {
    if (isReadOnly && !showIntro && blocks.length > 0) {
      setCanContinue(true);
    }
  }, [isReadOnly, showIntro, blocks.length, currentBlockIndex]);

  useEffect(() => {
    async function fetchData() {
      try {
        const chaptersRes = await fetch("/api/chapters?populate=*&sort=order:asc");
        if (chaptersRes.ok) {
          const chaptersData = await chaptersRes.json();
          const allChaps = (chaptersData.data || []) as ChapterData[];
          
          const found = allChaps.find(
            (ch: Record<string, unknown>) => ch.documentId === chapterId
          );
          
          if (found) {
            let courseData = found.course as Record<string, unknown> | undefined;
            if (courseData?.data) {
              courseData = courseData.data as Record<string, unknown>;
              if (courseData?.attributes) {
                courseData = courseData.attributes as Record<string, unknown>;
              }
            }
            
            const courseTitle = (courseData?.title as string) || (courseData?.name as string) || "this course";
            const courseSlug = (courseData?.slug as string) || (courseData?.documentId as string) || "";
            const courseId = (courseData?.documentId as string) || String(courseData?.id || "");
            
            const chapterData: ChapterData = {
              id: found.id as number,
              documentId: found.documentId as string,
              title: (found.title as string) || "",
              description: (found.description as string) || "",
              emoji: (found.emoji as string) || "📚",
              order: (found.order as number) || 1,
              courseId,
              courseTitle,
              courseSlug,
            };
            setChapter(chapterData);

            // Check access control
            if (courseId) {
              const accessType = getCourseAccessType(courseId);
              const chapterIndex = allChaps.findIndex(
                (ch: Record<string, unknown>) => ch.documentId === chapterId
              );
              const hasActiveSubscription = subscription?.active === true;
              if (!canAccessChapter(accessType, chapterIndex, hasActiveSubscription)) {
                setAccessDenied(true);
                setLoading(false);
                return;
              }
            }

            // Fetch all chapters for this specific course to ensure accurate count
            let courseChapters = allChaps;
            if (courseId) {
              try {
                const courseChaptersRes = await fetch(
                  `/api/chapters?filters[course][documentId][$eq]=${courseId}&sort=order:asc`
                );
                if (courseChaptersRes.ok) {
                  const courseChaptersData = await courseChaptersRes.json();
                  courseChapters = (courseChaptersData.data || []) as ChapterData[];
                }
              } catch {
                // Fallback to all chapters if course-specific fetch fails
              }
            }
            setAllChapters(courseChapters);

            const blocksRes = await fetch(
              `/api/chapter-content-blocks?chapterDocumentId=${found.documentId}`
            );
            if (blocksRes.ok) {
              const blocksData = await blocksRes.json();
              setBlocks(blocksData.data || []);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch chapter data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (chapterId) {
      fetchData();
    }
  }, [chapterId]);

  const progress = blocks.length > 0 ? (currentBlockIndex / blocks.length) * 100 : 0;
  const isFirstBlock = currentBlockIndex === 0;

  const handleCorrectAnswer = () => {
    setShowFeedback(true);
    setFeedbackType("correct");
    
    const wasAlreadyIncorrect = incorrectBlocks.has(currentBlockIndex);
    
    if (!wasAlreadyIncorrect) {
      setGems((g) => g + 1);
      setGemsThisChapter((g) => g + 1);
    }
    
    setFeedbackMessage("Great job! That's the correct answer.");
    setCanContinue(true);
  };

  const handleIncorrectAnswer = () => {
    setShowFeedback(true);
    setFeedbackType("incorrect");
    setIncorrectBlocks((prev) => new Set([...prev, currentBlockIndex]));
    
    if (hearts > 0) {
      setHearts((h) => h - 1);
      setHeartsThisChapter((h) => h + 1);
    }
    
    setFeedbackMessage("Not quite. Try again or use the hint for help.");
    setCanContinue(true);
  };

  const handleContinue = () => {
    if (currentBlockIndex < blocks.length - 1) {
      setCurrentBlockIndex((i) => i + 1);
      setShowFeedback(false);
      setFeedbackType(null);
      setFeedbackMessage("");
      setCanContinue(false);
      setShowHint(false);
    } else {
      const earnedHearts = Math.min(10 - hearts + heartsThisChapter, 3);
      const newHearts = Math.min(hearts + earnedHearts, 10);
      setHearts(newHearts);
      
      // Calculate streak properly — only show on the first chapter per day
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const streakKey = `streak_shown_${user?.email}`;
      const lastStreakShownDate = localStorage.getItem(streakKey) || "";

      let isNew = false;
      let newStreakDays = streakDays;

      if (lastStreakShownDate !== todayStr) {
        const existing = localStorage.getItem(`progress_${user?.email}`);
        const currentData = existing ? JSON.parse(existing) : {};
        const lastActiveDate = currentData.lastActiveDate || "";

        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

        if (lastActiveDate === yesterdayStr) {
          isNew = true;
          newStreakDays = streakDays + 1;
        } else if (lastActiveDate === "") {
          isNew = true;
          newStreakDays = 1;
        } else {
          isNew = true;
          newStreakDays = 1;
        }

        localStorage.setItem(streakKey, todayStr);
      }

      if (isNew) {
        setStreakDays(newStreakDays);
        setIsNewStreak(true);
      } else {
        setIsNewStreak(false);
      }
      
      // Update localStorage with today's date for lastActive
      const existingProgress = localStorage.getItem(`progress_${user?.email}`);
      const currentProgressData = existingProgress ? JSON.parse(existingProgress) : {};
      localStorage.setItem(`progress_${user?.email}`, JSON.stringify({
        ...currentProgressData,
        lastActiveDate: todayStr,
      }));
      
      if (chapter) {
        const totalChapters = allChapters.length;
        const newCompletedChapters = [...new Set([...serverCompletedChapters, chapter.documentId])];
        const completedCount = allChapters.filter(
          (ch) => newCompletedChapters.includes(ch.documentId)
        ).length;
        const progressPercent = totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 0;

        setServerCompletedChapters(newCompletedChapters);

        saveUserProgress({
          gems: gems + gemsThisChapter,
          hearts: newHearts,
          streakDays: newStreakDays,
          completedChapterDocumentId: chapter.documentId,
        });

        // Update global stats in user-profile metadata (fire-and-forget)
        apiFetch("/api/auth/update-user-stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user?.email,
            gemsEarned: gemsThisChapter,
            isNewStreak: isNew,
            streakDays: newStreakDays,
          }),
        }).catch(() => {});

        // Update enrollment progress (fire-and-forget)
        apiFetch("/api/user-course-program", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user?.email,
            courseDocumentId: chapter.courseId,
            progress: progressPercent,
          }),
        }).catch(() => {});
      }
      
      setIsCompleted(true);
    }
  };

  const handleCompletionContinue = () => {
    if (chapter) {
      router.push(`/courses/${chapter.courseSlug || chapter.courseId}`);
    } else {
      router.push("/dashboard");
    }
  };

  const handleBack = () => {
    if (isFirstBlock) {
      router.push(`/courses/${chapter?.courseSlug || chapter?.courseId}`);
    } else {
      setCurrentBlockIndex((i) => i - 1);
      setShowFeedback(false);
      setFeedbackType(null);
      setFeedbackMessage("");
      setShowHint(false);
    }
  };

  useEffect(() => {
    if (!showIntro && blocks.length > 0) {
      const block = blocks[currentBlockIndex];
      if (block && READ_ONLY_TYPES.includes(block.type)) {
        setCanContinue(true);
      }
    }
  }, [currentBlockIndex, showIntro, blocks]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-green-500 animate-spin" />
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
        <p className="text-zinc-400">Chapter not found</p>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="text-green-500 hover:text-green-400 text-sm font-medium cursor-pointer"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-6 px-6">
        <div className="h-16 w-16 rounded-full bg-purple-500/10 flex items-center justify-center">
          <Lock className="h-8 w-8 text-purple-400" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Pro Content</h1>
          <p className="text-zinc-400 max-w-md">
            This chapter is part of a premium course. Subscribe to Pro to unlock all courses and learning content.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push("/dashboard/billing")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            <CreditCard className="h-4 w-4" />
            Subscribe to Pro
          </button>
          <button
            type="button"
            onClick={() => router.push(`/courses/${chapter?.courseSlug || chapter?.courseId}`)}
            className="px-6 py-3 rounded-xl border border-zinc-700 text-zinc-400 text-sm font-semibold hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <CompletionScreen
        gemsEarned={gemsThisChapter}
        heartsEarned={Math.min(10 - hearts + heartsThisChapter, 3)}
        streakDays={streakDays}
        isNewStreak={isNewStreak}
        onContinue={handleCompletionContinue}
      />
    );
  }

  const NoContentFallback = () => (
    <div className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto py-20 px-6">
      <div className="mb-8">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          <svg 
            className="w-8 h-8 text-white/40" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={1.5} 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" 
            />
          </svg>
        </div>
      </div>
      
      <h2 className="text-3xl font-bold text-white mb-4 leading-snug">
        Chapter content is not available yet
      </h2>
      
      <p className="text-zinc-400 text-lg leading-relaxed max-w-md">
        We could not find a renderable content block for{" "}
        <span className="text-white font-medium">{chapter.courseTitle}</span>. 
        This fallback avoids the blank state and makes the data issue visible.
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {showIntro && (
        <ChapterIntro
          chapterNumber={chapter.order}
          chapterTitle={chapter.title}
          chapterEmoji={chapter.emoji}
          onComplete={() => setShowIntro(false)}
        />
      )}

      <LearningHeader
        chapterNumber={chapter.order}
        chapterTitle={chapter.title}
        progress={progress}
        gems={gems}
        hearts={hearts}
        maxHearts={10}
        streakDays={streakDays}
        courseSlug={chapter.courseSlug}
        onBack={handleBack}
      />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {blocks.length === 0 ? (
          <NoContentFallback />
        ) : currentBlock ? (
          <LearningContent
            block={currentBlock}
            onCorrect={handleCorrectAnswer}
            onIncorrect={handleIncorrectAnswer}
            showFeedback={showFeedback}
            feedbackType={feedbackType}
            feedbackMessage={feedbackMessage}
          />
        ) : null}
      </main>

      <LearningFooter
        canContinue={canContinue}
        hint={currentBlock?.hint}
        showHint={showHint}
        hearts={hearts}
        onUseHeart={() => {
          setShowHint(true);
          setHearts((h) => Math.max(0, h - 1));
        }}
        onShowHint={() => setShowHint(true)}
        onContinue={handleContinue}
      />
    </div>
  );
}
