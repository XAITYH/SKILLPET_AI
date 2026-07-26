"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Play,
  Check,
  Lock,
  Clock,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api-client";
import {
  getCourseAccessType,
  getAccessTypeLabel,
  getAccessTypeColor,
  canAccessChapter,
} from "@/lib/course-access";

const STRAPI_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

interface CourseData {
  id: number;
  title: string;
  description: string;
  slug: string;
  difficulty?: string;
  level?: string;
  duration?: string;
  estimated_duration?: string;
  time_duration?: string;
  timeLength?: string;
  length?: string;
  _resolvedImageUrl?: string | null;
}

interface Chapter {
  id: number;
  documentId: string;
  title: string;
  description: string;
  emoji: string;
  order: number;
  status: "completed" | "in_progress" | "locked";
}

function extractMediaUrl(val: unknown): string | null {
  if (!val) return null;
  if (typeof val === "string") return val;
  if (typeof val === "object" && val !== null) {
    const obj = val as Record<string, unknown>;
    if ("url" in obj && typeof obj.url === "string") return obj.url;
    if (
      "attributes" in obj &&
      typeof obj.attributes === "object" &&
      obj.attributes !== null
    ) {
      const attrs = obj.attributes as Record<string, unknown>;
      if ("url" in attrs && typeof attrs.url === "string")
        return attrs.url;
    }
    if (
      "data" in obj &&
      typeof obj.data === "object" &&
      obj.data !== null
    ) {
      return extractMediaUrl(obj.data);
    }
  }
  if (Array.isArray(val) && val.length > 0) {
    return extractMediaUrl(val[0]);
  }
  return null;
}

function getStrapiMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return `${STRAPI_URL}${url}`;
}

function getDifficulty(course: CourseData): string {
  const raw = course.difficulty || course.level || "";
  if (!raw) return "";
  const lower = raw.toLowerCase();
  if (lower === "beginner") return "Beginner";
  if (lower === "intermediate") return "Intermediate";
  if (lower === "advanced") return "Advanced";
  return raw;
}

function getDuration(course: CourseData): string {
  return (
    course.duration ||
    course.estimated_duration ||
    course.time_duration ||
    course.timeLength ||
    course.length ||
    ""
  );
}

function formatDuration(minutes: string): string {
  const mins = parseInt(minutes, 10);
  if (isNaN(mins)) return minutes;
  const hrs = Math.floor(mins / 60);
  const remaining = mins % 60;
  if (hrs === 0) return `${remaining} mins`;
  if (remaining === 0) return `${hrs} hrs`;
  return `${hrs} hrs, ${remaining} mins`;
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, subscription } = useAuth();
  const slug = params.slug as string;

  const [course, setCourse] = useState<CourseData | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [completedChapterIds, setCompletedChapterIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [courseDocumentId, setCourseDocumentId] = useState<string | null>(null);

  // Load completed chapters - try Strapi, fallback to localStorage
  const fetchCompletedChapters = useCallback(async (docId: string) => {
    if (!user?.email || !docId) return;

    // Try Strapi first
    try {
      const res = await fetch(
        `/api/user-progress?email=${encodeURIComponent(user.email)}&courseDocumentId=${docId}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          // Strapi returned a record — trust its completedChapters (even if empty)
          try {
            const raw = data.data.completedChapters;
            const parsed = typeof raw === 'string'
              ? JSON.parse(raw)
              : raw;
            if (Array.isArray(parsed)) {
              setCompletedChapterIds(parsed);
              return;
            }
          } catch {
            // Invalid JSON — treat as empty
          }
          // No parseable completedChapters — record exists but is empty
          setCompletedChapterIds([]);
          return;
        }
      }
    } catch {
      // Strapi failed
    }

    // Fallback to localStorage only when Strapi has no record at all
    const saved = localStorage.getItem(`progress_${user.email}`);
    if (saved) {
      const data = JSON.parse(saved);
      if (data.completedChapters && Array.isArray(data.completedChapters)) {
        setCompletedChapterIds(data.completedChapters);
      }
    }
  }, [user?.email]);

  useEffect(() => {
    if (courseDocumentId) {
      fetchCompletedChapters(courseDocumentId);
    }
  }, [courseDocumentId, fetchCompletedChapters]);

  useEffect(() => {
    async function fetchCourse() {
      try {
        const res = await fetch(`/api/courses`);
        if (!res.ok) throw new Error("Failed to fetch courses");
        const data = await res.json();
        const found = (data.data || []).find(
          (c: Record<string, unknown>) => {
            const docId = c.documentId as string;
            const id = String(c.id as number);
            const courseSlug = c.slug as string;
            return (
              docId === slug || id === slug || courseSlug === slug
            );
          },
        );
        if (!found) {
          setError("Course not found");
          return;
        }

        const mediaFields = [
          "banner",
          "icon",
          "image",
          "thumbnail",
          "cover",
          "course_image",
        ];
        let resolvedUrl: string | null = null;
        for (const field of mediaFields) {
          const url = extractMediaUrl(found[field]);
          if (url) {
            resolvedUrl = url;
            break;
          }
        }

        setCourse({
          id: found.id as number,
          title: (found.title as string) || "",
          description: (found.description as string) || "",
          slug: (found.slug as string) || "",
          difficulty: found.difficulty as string | undefined,
          level: found.level as string | undefined,
          duration: found.duration as string | undefined,
          estimated_duration: found.estimated_duration as
            | string
            | undefined,
          time_duration: found.time_duration as string | undefined,
          timeLength: found.timeLength as string | undefined,
          length: found.length as string | undefined,
          _resolvedImageUrl: resolvedUrl,
        });

        // Store the actual documentId for enrollment and progress checks
        setCourseDocumentId(found.documentId as string);

        // Fetch chapters for this course
        try {
          const chaptersRes = await fetch(
            `/api/chapters?filters[course][documentId][$eq]=${found.documentId}&sort=order:asc`,
          );
          if (chaptersRes.ok) {
            const chaptersData = await chaptersRes.json();
            const fetchedChapters = (chaptersData.data || []).map(
              (ch: Record<string, unknown>, idx: number) => ({
                id: ch.id as number,
                documentId: ch.documentId as string,
                title: (ch.title as string) || `Chapter ${idx + 1}`,
                description: (ch.description as string) || "",
                emoji: (ch.emoji as string) || "📚",
                order: (ch.order as number) || idx + 1,
                status: "locked" as const,
              }),
            );
            setChapters(fetchedChapters);
          }
        } catch {
          // Chapters endpoint may not exist yet, use empty array
          setChapters([]);
        }

        // Fetch user enrollment for this course
        if (user?.email) {
          try {
            const enrollRes = await fetch(
              `/api/user-course-program?email=${encodeURIComponent(user.email)}&courseDocumentId=${found.documentId}`,
            );
            if (enrollRes.ok) {
              const enrollData = await enrollRes.json();
              if (enrollData.data && enrollData.data.length > 0) {
                setIsEnrolled(true);
              }
            }
          } catch {
            // Not enrolled or error
          }
        }
      } catch {
        setError("Failed to load course");
      } finally {
        setLoading(false);
      }
    }
    if (slug) fetchCourse();
  }, [slug, user?.email]);

  // Update chapter status based on Strapi data
  const chaptersWithStatus = chapters.map((chapter, idx) => {
    // Check if chapter is completed in Strapi
    if (completedChapterIds.includes(chapter.documentId)) {
      return { ...chapter, status: "completed" as const };
    }
    
    if (!isEnrolled) {
      // All chapters locked until user clicks Start Learning
      return { ...chapter, status: "locked" as const };
    }

    // Find the first non-completed chapter - that's in_progress
    const firstNonCompletedIdx = chapters.findIndex(
      (ch) => !completedChapterIds.includes(ch.documentId)
    );
    
    if (idx === firstNonCompletedIdx) {
      return { ...chapter, status: "in_progress" as const };
    }

    // Chapters after the first non-completed are locked
    if (idx > firstNonCompletedIdx) {
      return { ...chapter, status: "locked" as const };
    }

    return { ...chapter, status: "locked" as const };
  });

  // Navigate to learning page when chapter is selected
  const handleSelectChapter = (chapter: Chapter) => {
    router.push(`/learn/${chapter.documentId}`);
  };

  const completedCount = chaptersWithStatus.filter(
    (c) => c.status === "completed",
  ).length;
  const overallProgress =
    chaptersWithStatus.length > 0
      ? Math.round((completedCount / chaptersWithStatus.length) * 100)
      : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-green-500 animate-spin" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
        <p className="text-zinc-400">{error || "Course not found"}</p>
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

  const difficulty = getDifficulty(course);
  const duration = getDuration(course);
  const accessType = courseDocumentId
    ? getCourseAccessType(courseDocumentId)
    : "free";
  const hasActiveSubscription = subscription?.active === true;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-green-500 hover:text-green-400 text-sm font-medium mb-8 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </button>

        <div className="rounded-2xl bg-[#111] border border-white/5 overflow-hidden mb-8">
          <div className="flex flex-col md:flex-row">
            <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
              {difficulty && (
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold w-fit mb-4 ${
                    difficulty === "Beginner"
                      ? "bg-emerald-700 text-white"
                      : difficulty === "Intermediate"
                        ? "bg-orange-500 text-white"
                        : difficulty === "Advanced"
                          ? "bg-rose-700 text-white"
                          : "bg-white/10 text-zinc-300"
                  }`}
                >
                  {difficulty}
                </span>
              )}
              {accessType !== "free" && (
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold w-fit mb-4 ml-2 ${getAccessTypeColor(accessType)}`}
                >
                  {getAccessTypeLabel(accessType)}
                </span>
              )}
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                {course.title}
              </h1>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6 max-w-lg">
                {course.description}
              </p>

              <div className="flex flex-wrap items-center gap-3 mb-6">
                {duration && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-zinc-300 text-xs font-medium">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDuration(duration)}
                  </span>
                )}
                {isEnrolled ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-green-400 text-xs font-medium">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Enrolled
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-zinc-400 text-xs font-medium">
                    Not enrolled yet
                  </span>
                )}
              </div>

              <button
                type="button"
                disabled={enrolling || (accessType !== "free" && !hasActiveSubscription)}
                onClick={async () => {
                  if (isEnrolled) {
                    // Continue Course - find first in_progress chapter or first chapter
                    const continueChapter =
                      chaptersWithStatus.find(
                        (ch) => ch.status === "in_progress",
                      ) || chaptersWithStatus[0];
                    if (continueChapter) {
                      handleSelectChapter(continueChapter);
                    }
                  } else {
                    // Start Learning - enroll and select first chapter
                    setEnrolling(true);
                    try {
                      // Create initial progress and enrollment in Strapi (wait for both)
                      await Promise.all([
                        apiFetch("/api/user-progress", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            email: user?.email,
                            courseDocumentId: courseDocumentId || course?.slug,
                            gems: 0,
                            hearts: 10,
                            streakDays: 0,
                          }),
                        }),
                        apiFetch("/api/user-course-program", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            email: user?.email,
                            courseDocumentId: courseDocumentId || course?.slug,
                          }),
                        }),
                      ]);
                      
                      setIsEnrolled(true);
                      
                      if (chaptersWithStatus.length > 0) {
                        handleSelectChapter(chaptersWithStatus[0]);
                      }
                    } catch {
                      // Enrollment failed, keep current state
                    } finally {
                      setEnrolling(false);
                    }
                  }
                }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-semibold transition-colors cursor-pointer w-fit disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {enrolling ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enrolling...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    {isEnrolled ? "Continue Course" : "Start Learning"}
                  </>
                )}
              </button>
              {accessType !== "free" && !hasActiveSubscription && (
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/billing")}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-colors cursor-pointer w-fit ml-3"
                >
                  <Lock className="h-4 w-4" />
                  Subscribe to Unlock
                </button>
              )}
            </div>

            <div className="relative w-full md:w-80 h-56 md:h-auto shrink-0 bg-[#1a1a1a]">
              {course._resolvedImageUrl ? (
                <Image
                  src={
                    getStrapiMediaUrl(course._resolvedImageUrl) || ""
                  }
                  alt={course.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 320px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-zinc-600 text-sm">
                    No banner
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          id="chapters-section"
          className="rounded-2xl bg-[#111] border border-white/5 p-6 md:p-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <h2 className="text-xl font-bold text-white">
              Course Chapters
            </h2>
            <div className="flex items-center gap-4 flex-1 max-w-md">
              <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-400 transition-all duration-500"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
              <span className="text-xs text-zinc-400 whitespace-nowrap">
                Overall Progress{" "}
                <span className="text-green-400 font-semibold">
                  {overallProgress}%
                </span>
              </span>
            </div>
          </div>

          <div className="relative">
            {chaptersWithStatus.map((chapter, index) => {
              const isCompleted = chapter.status === "completed";
              const isInProgress = chapter.status === "in_progress";
              const isLocked = chapter.status === "locked";
              const isLast = index === chaptersWithStatus.length - 1;
              const isLockedBySubscription =
                isLocked &&
                accessType !== "free" &&
                !hasActiveSubscription &&
                !canAccessChapter(accessType, index, hasActiveSubscription);

              return (
                <div key={chapter.id} className="relative flex gap-4">
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() =>
                        !isLocked && handleSelectChapter(chapter)
                      }
                      disabled={isLocked}
                      className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full text-xl shrink-0 transition-all cursor-pointer ${
                        isCompleted
                          ? "bg-green-500/20 border-2 border-green-500"
                          : isInProgress
                            ? "bg-blue-500/20 border-2 border-blue-500"
                            : "bg-white/5 border-2 border-white/10"
                      } ${isLocked ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}`}
                    >
                      {chapter.emoji}
                      {isCompleted && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                          <Check
                            className="h-3 w-3 text-white"
                            strokeWidth={3}
                          />
                        </div>
                      )}
                      {isLocked && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center">
                          <Lock
                            className="h-3 w-3 text-zinc-400"
                            strokeWidth={3}
                          />
                        </div>
                      )}
                    </button>
                    {!isLast && (
                      <div className="w-0.5 flex-1 min-h-[40px] border-l-2 border-dashed border-white/10" />
                    )}
                  </div>

                  <div
                    className={`flex-1 py-2.5 ${isLast ? "" : "pb-6"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <h3
                          className={`font-semibold text-sm ${isLocked ? "text-zinc-500" : "text-white"}`}
                        >
                          {chapter.title}
                        </h3>
                        <p className="text-xs text-zinc-500 truncate mt-0.5">
                          {chapter.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        {isLockedBySubscription && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-semibold">
                            PRO
                          </span>
                        )}
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            isCompleted
                              ? "bg-green-500/20 text-green-400"
                              : isInProgress
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-white/5 text-zinc-500"
                          }`}
                        >
                          {isCompleted
                            ? "Completed"
                            : isInProgress
                              ? "In Progress"
                              : "Locked"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
