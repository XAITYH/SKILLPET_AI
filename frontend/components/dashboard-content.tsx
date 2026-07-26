"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  ChevronLeft,
  Calendar,
  Clock,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { CHARACTERS } from "@/lib/characters";

function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-[#1a1a1a] border border-white/[0.08] overflow-hidden flex flex-col">
      <div className="relative w-full h-48 shrink-0 bg-white/5 animate-pulse" />
      <div className="px-3 py-2.5 flex flex-col gap-2">
        <div className="h-4 bg-white/10 rounded w-3/4 animate-pulse" />
        <div className="h-3 bg-white/10 rounded w-1/2 animate-pulse" />
        <div className="h-1.5 bg-white/10 rounded-full w-full animate-pulse" />
      </div>
    </div>
  );
}

const days = ["S", "M", "T", "W", "T", "F", "S"];
const today = new Date().getDay();

const STRAPI_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

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

interface CourseItem {
  id: number;
  name: string;
  level: string;
  duration: string;
  progress: number;
  icon: string;
  slug: string;
  documentId: string;
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

const VISIBLE_COUNT = 4;

export function DashboardContent() {
  const { user, character } = useAuth();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [cardWidth, setCardWidth] = useState(0);
  const visIdxRef = useRef(0);
  const animOffsetRef = useRef(0);
  const rafRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const coursesRef = useRef<CourseItem[]>([]);

  // User metadata state
  const [last7DaysActivity, setLast7DaysActivity] = useState<
    string[]
  >([]);
  const [dailyLessonsCompleted, setDailyLessonsCompleted] =
    useState(0);
  const [weeklyGoal, setWeeklyGoal] = useState({
    completed: 0,
    target: 10,
  });
  const [displayName, setDisplayName] = useState("Learner");

  // Current course state
  const [currentCourse, setCurrentCourse] = useState<{
    course: {
      documentId: string;
      title: string;
      slug: string;
      description: string;
      icon: string | null;
      banner: string | null;
    } | null;
    progress: {
      gems: number;
      hearts: number;
      streakDays: number;
      completedChapters: string[];
    };
    nextChapter: {
      documentId: string;
      title: string;
      order: number;
    } | null;
    progressPercent?: number;
  } | null>(null);
  const [currentCourseLoading, setCurrentCourseLoading] =
    useState(true);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const [coursesRes, enrollRes] = await Promise.all([
          fetch("/api/courses"),
          user?.email
            ? fetch(
                `/api/user-course-program?email=${encodeURIComponent(user.email)}`,
              )
            : Promise.resolve(null),
        ]);

        const enrollmentMap: Record<number, number> = {};
        if (enrollRes && enrollRes.ok) {
          const enrollData = await enrollRes.json();
          const rawEnrollments = enrollData.data || [];

          await Promise.all(
            rawEnrollments.map(async (e: { course?: { id?: number; documentId?: string }; progress?: number }) => {
              const courseId = e.course?.id;
              const courseDocId = e.course?.documentId;
              if (!courseId || !courseDocId) return;

              let realProgress = e.progress ?? 0;
              try {
                const [chaptersRes, progressRes] = await Promise.all([
                  fetch(`/api/chapters?filters[course][documentId][$eq]=${courseDocId}&sort=order:asc`),
                  user?.email
                    ? fetch(`/api/user-progress?email=${encodeURIComponent(user.email)}&courseDocumentId=${courseDocId}`)
                    : Promise.resolve(null),
                ]);

                const chaptersData = chaptersRes.ok ? await chaptersRes.json() : { data: [] };
                const totalChapters = (chaptersData.data || []).length;

                if (progressRes && progressRes.ok) {
                  const progressData = await progressRes.json();
                  if (progressData.data) {
                    const raw = progressData.data.completedChapters;
                    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                    const completedChapters = Array.isArray(parsed) ? parsed : [];
                    realProgress = totalChapters > 0 ? Math.round((completedChapters.length / totalChapters) * 100) : 0;
                  }
                }
              } catch {
                // Keep enrollment.progress as fallback
              }

              enrollmentMap[courseId] = realProgress;
            }),
          );
        }

        if (coursesRes.ok) {
          const data = await coursesRes.json();
          const items: CourseItem[] = (data.data || []).map(
            (c: Record<string, unknown>) => {
              const mediaFields = [
                "banner",
                "icon",
                "image",
                "thumbnail",
                "cover",
                "course_image",
              ];
              let iconUrl = "";
              for (const field of mediaFields) {
                const url = extractMediaUrl(c[field]);
                if (url) {
                  iconUrl = getStrapiMediaUrl(url) || "";
                  break;
                }
              }
              const courseId = (c.id as number) || 0;
              const durationValue =
                (c.duration as string) ||
                (c.estimated_duration as string) ||
                (c.time_duration as string) ||
                (c.timeLength as string) ||
                (c.length as string) ||
                "";
              const docId =
                (c.documentId as string) || String(courseId);
              return {
                id: courseId,
                name: (c.title as string) || "",
                level:
                  (c.level as string) ||
                  (c.difficulty as string) ||
                  "",
                duration: durationValue,
                progress: enrollmentMap[courseId] ?? 0,
                icon: iconUrl,
                slug: (c.slug as string) || docId,
                documentId: docId,
              };
            },
          );
          setCourses(items);
          coursesRef.current = items;
        }
      } catch {
        console.error("Failed to fetch courses");
      } finally {
        setCoursesLoading(false);
      }
    }
    fetchCourses();
  }, [user?.email]);

  // Fetch user metadata and current course
  useEffect(() => {
    async function fetchUserData() {
      if (!user?.email) {
        setCurrentCourseLoading(false);
        return;
      }

      try {
        const [profileRes, currentCourseRes] = await Promise.all([
          fetch(
            `/api/auth/user-profile?email=${encodeURIComponent(user.email)}`,
          ),
          fetch(
            `/api/user-progress/current-course?email=${encodeURIComponent(user.email)}`,
          ),
        ]);

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          const meta = profileData.metadata || {};

          // Extract display name
          if (profileData.displayName) {
            setDisplayName(profileData.displayName);
          }

          // Extract last7DaysActivity
          const activity: string[] = Array.isArray(
            meta.last7DaysActivity,
          )
            ? meta.last7DaysActivity
            : [];
          setLast7DaysActivity(activity);

          // Count today's completions
          const now = new Date();
          const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
          const todayCount = activity.filter(
            (d: string) => d === today,
          ).length;
          setDailyLessonsCompleted(todayCount);

          // Weekly goal
          const weeklyCompleted = meta.weeklyLessonsCompleted || 0;
          const weeklyTarget = meta.weeklyGoal || 10;
          setWeeklyGoal({
            completed: weeklyCompleted,
            target: weeklyTarget,
          });
        }

        if (currentCourseRes.ok) {
          const ccData = await currentCourseRes.json();

          // Fetch total chapters for this course to calculate accurate progress
          if (ccData.course?.documentId) {
            // Найти полные данные курса в сохраненном списке
            const fullCourse = coursesRef.current.find(
              (c) => c.documentId === ccData.course.documentId,
            );

            if (fullCourse) {
              // Использовать иконку из полных данных
              ccData.course.icon = fullCourse.icon || null;
              // Можете также добавить banner, если он есть в fullCourse
              ccData.course.banner = fullCourse.icon || null;
            }

            try {
              const chaptersRes = await fetch(
                `/api/chapters?filters[course][documentId][$eq]=${ccData.course.documentId}&sort=order:asc`,
              );
              if (chaptersRes.ok) {
                const chaptersData = await chaptersRes.json();
                const totalChapters = (chaptersData.data || [])
                  .length;
                const completedCount =
                  ccData.progress?.completedChapters?.length || 0;
                ccData.progressPercent =
                  totalChapters > 0
                    ? Math.round(
                        (completedCount / totalChapters) * 100,
                      )
                    : 0;
                try {
                  await fetch("/api/user-course-program", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      email: user.email,
                      courseId: ccData.course.documentId,
                      progress: ccData.progressPercent,
                    }),
                  });
                } catch (err) {
                  console.error(
                    "Failed to update progress in DB:",
                    err,
                  );
                }
              }
            } catch {
              // Chapters fetch failed, keep default
            }
          }

          setCurrentCourse(ccData);
        }
      } catch {
        console.error("Failed to fetch user data");
      } finally {
        setCurrentCourseLoading(false);
      }
    }
    fetchUserData();
  }, [user?.email]);

  const measure = useCallback(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const gap = 16;
      setCardWidth(
        (containerWidth - gap * (VISIBLE_COUNT - 1)) / VISIBLE_COUNT,
      );
    }
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  useEffect(() => {
    if (cardWidth > 0 && courses.length > 0) {
      requestAnimationFrame(() => updatePositions());
    }
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [cardWidth, courses.length]);

  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? "Good morning"
      : hour < 18
        ? "Good afternoon"
        : "Good evening";

  const dailyGoalFinished = dailyLessonsCompleted >= 3;
  const hasStartedCourse = currentCourse?.course !== null;

  const total = coursesRef.current.length;
  const gap = 16;
  const step = cardWidth + gap;

  function getPos(i: number) {
    if (total === 0) return 0;
    const rel = (((i - visIdxRef.current) % total) + total) % total;
    return rel * step + animOffsetRef.current;
  }

  function updatePositions() {
    const n = coursesRef.current.length;
    const cw = containerRef.current?.offsetWidth ?? 0;
    const pad = cardWidth * 3;
    for (let i = 0; i < n; i++) {
      const el = cardRefs.current[i];
      if (!el) continue;
      let x = getPos(i);
      if (x < -pad) x += n * step;
      if (x > cw + pad) x -= n * step;
      el.style.transform = `translateX(${x}px)`;
      el.style.visibility =
        x > -pad && x < cw + pad ? "visible" : "hidden";
    }
  }

  function animate(from: number, to: number, onDone: () => void) {
    cancelAnimationFrame(rafRef.current);
    const start = performance.now();
    const duration = 400;
    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      animOffsetRef.current = from + (to - from) * ease;
      updatePositions();
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else onDone();
    }
    rafRef.current = requestAnimationFrame(tick);
  }

  function shiftRight() {
    if (total === 0) return;
    const curFrom = animOffsetRef.current;
    visIdxRef.current = (visIdxRef.current + 1) % total;
    animOffsetRef.current = curFrom + step;
    updatePositions();
    animate(curFrom + step, 0, () => {
      animOffsetRef.current = 0;
      updatePositions();
    });
  }

  function shiftLeft() {
    if (total === 0) return;
    const curFrom = animOffsetRef.current;
    visIdxRef.current = (visIdxRef.current - 1 + total) % total;
    animOffsetRef.current = curFrom - step;
    updatePositions();
    animate(curFrom - step, 0, () => {
      animOffsetRef.current = 0;
      updatePositions();
    });
  }

  function startInterval(fn: () => void) {
    fn();
    intervalRef.current = setInterval(fn, 350);
  }

  function stopInterval() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function handlePointerDown(fn: () => void) {
    return (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      startInterval(fn);
    };
  }

  function handlePointerUp() {
    stopInterval();
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 mt-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-zinc-400 text-sm mb-1">
            {greeting}, {displayName}!
          </p>
          <h1 className="text-2xl font-bold text-white">
            Let&apos;s learn something
            <br />
            amazing today.
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="speech-bubble">
            {dailyGoalFinished
              ? "See you tomorrow ^_^"
              : "Ready for learning? ヾ(•ω•`)o"}
          </div>
          {character?.fileName && (
            <Image
              src={
                CHARACTERS.find(
                  (c) => c.fileName === character.fileName,
                )?.image || `/characters/${character.fileName}`
              }
              alt={character.name || "Character"}
              width={120}
              height={120}
              className="drop-shadow-[0_0_30px_rgba(60,199,79,0.3)]"
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-[#111] border border-white/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Daily Goal</h2>
            <Calendar className="h-5 w-5 text-zinc-500" />
          </div>
          <p className="text-3xl font-bold text-green-500 mb-1">
            {dailyLessonsCompleted}/3
          </p>
          <p className="text-sm text-zinc-300 mb-4">
            lessons completed
          </p>
          <div className="h-2.5 rounded-full bg-white/10 mb-6">
            <div
              className="h-full rounded-full bg-green-400 transition-all duration-500"
              style={{
                width: `${Math.min((dailyLessonsCompleted / 3) * 100, 100)}%`,
              }}
            />
          </div>
          <div className="flex gap-2 justify-between">
            {days.map((d, i) => {
              const now = new Date();
              const dayDate = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() - now.getDay() + i,
              );
              const dayStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, "0")}-${String(dayDate.getDate()).padStart(2, "0")}`;
              const hasActivity = last7DaysActivity.includes(dayStr);
              const isToday = i === today;

              return (
                <div
                  key={d + i}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                    isToday
                      ? "border-2 border-green-500/50 text-white"
                      : hasActivity
                        ? "text-white border-yellow-500 border-2"
                        : isToday
                          ? "text-green-400 border-2 border-green-500/50"
                          : "bg-white/5 text-zinc-500"
                  }`}
                >
                  {hasActivity ? (
                    <Image
                      src="/streak.png"
                      alt="Streak"
                      width={22}
                      height={22}
                      className="shrink-0"
                    />
                  ) : (
                    d
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl bg-[#111] border border-white/5 overflow-hidden">
          {currentCourseLoading ? (
            <div className="p-5 flex items-center justify-center min-h-[220px]">
              <div className="h-6 w-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : hasStartedCourse && currentCourse?.course ? (
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold">
                  Continue Learning
                </h2>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/courses")}
                  className="text-xs text-green-400 hover:text-green-300 font-medium cursor-pointer"
                >
                  See all
                </button>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "#EBFFE8" }}
                >
                  {currentCourse.course.icon ? (
                    <Image
                      src={currentCourse.course.icon}
                      alt={currentCourse.course.title}
                      width={100}
                      height={100}
                    />
                  ) : (
                    <span className="text-2xl font-bold text-green-600">
                      {currentCourse.course.title?.[0] || "📚"}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-medium truncate">
                    {currentCourse.course.title}
                  </p>
                  <p className="text-sm text-zinc-500 truncate">
                    {currentCourse.nextChapter
                      ? `Chapter ${currentCourse.nextChapter.order} · ${currentCourse.nextChapter.title}`
                      : "Course completed"}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-300">
                  <span>Progress</span>
                  <span>{currentCourse.progressPercent ?? 0}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-green-400 transition-all duration-500"
                    style={{
                      width: `${currentCourse.progressPercent ?? 0}%`,
                    }}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (currentCourse.nextChapter) {
                    router.push(
                      `/learn/${currentCourse.nextChapter.documentId}`,
                    );
                  } else if (currentCourse.course) {
                    router.push(
                      `/courses/${currentCourse.course.slug || currentCourse.course.documentId}`,
                    );
                  }
                }}
                className="mt-4 w-full py-2 rounded-lg border border-white/10 text-white text-sm font-medium hover:bg-white/5 transition-colors cursor-pointer"
              >
                Continue Course
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() =>
                router.push("/dashboard/explore-courses")
              }
              className="group relative w-full h-full min-h-[220px] flex items-center justify-center gap-3 p-5 overflow-hidden cursor-pointer choose-step-btn"
            >
              <div className="relative z-10 flex items-center gap-6">
                <h3
                  className="font-semibold text-lg text-white"
                  style={{
                    textShadow:
                      "0 0 20px rgba(255,255,255,0.3), 0 0 40px rgba(74,222,128,0.15)",
                  }}
                >
                  Choose your next step
                </h3>
                <ChevronRight
                  className="h-5 w-5 text-white shrink-0 transition-transform duration-300 group-hover:translate-x-1"
                  style={{
                    filter:
                      "drop-shadow(0 0 6px rgba(255,255,255,0.4))",
                  }}
                />
              </div>
            </button>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold text-lg">
            Recommended for you
          </h2>
          <div className="flex gap-2">
            <button
              type="button"
              onMouseDown={handlePointerDown(shiftLeft)}
              onMouseUp={handlePointerUp}
              onMouseLeave={handlePointerUp}
              onTouchStart={handlePointerDown(shiftLeft)}
              onTouchEnd={handlePointerUp}
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer select-none"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onMouseDown={handlePointerDown(shiftRight)}
              onMouseUp={handlePointerUp}
              onMouseLeave={handlePointerUp}
              onTouchStart={handlePointerDown(shiftRight)}
              onTouchEnd={handlePointerUp}
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer select-none"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div
          ref={containerRef}
          className="overflow-hidden rounded-2xl"
        >
          <div
            ref={trackRef}
            className="relative"
            style={{ height: 300 }}
          >
            {coursesLoading ? (
              <div className="flex gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    style={{ width: cardWidth || "calc(25% - 12px)" }}
                  >
                    <SkeletonCard />
                  </div>
                ))}
              </div>
            ) : (
              courses.map((course, idx) => (
                <Link
                  key={course.documentId || course.slug || idx}
                  ref={(el) => {
                    cardRefs.current[idx] = el;
                  }}
                  href={`/courses/${course.documentId || course.slug}`}
                  className="absolute top-0 left-0 rounded-2xl bg-[#1a1a1a] border border-white/[0.08] overflow-hidden flex flex-col hover:bg-[#1f1f1f] transition-colors cursor-pointer block"
                  style={{ width: cardWidth || "calc(25% - 12px)" }}
                >
                  <div className="relative w-full h-48 shrink-0 overflow-hidden rounded-t-2xl bg-[#1a1a1a]">
                    {course.icon ? (
                      <Image
                        src={course.icon}
                        alt={course.name}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-zinc-600 text-sm">
                          No image
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="px-3 py-2.5 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-semibold text-sm leading-tight truncate">
                        {course.name}
                      </p>
                      {course.level &&
                        (() => {
                          const lower = course.level.toLowerCase();
                          const isBeginner = lower === "beginner";
                          const isIntermediate =
                            lower === "intermediate";
                          const isAdvanced = lower === "advanced";
                          return (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                                isBeginner
                                  ? "bg-emerald-700 text-white"
                                  : isIntermediate
                                    ? "bg-orange-500 text-white"
                                    : isAdvanced
                                      ? "bg-rose-700 text-white"
                                      : "bg-white/10 text-zinc-300"
                              }`}
                            >
                              {course.level}
                            </span>
                          );
                        })()}
                    </div>
                    {course.duration && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <Clock className="h-3 w-3 text-zinc-500" />
                        <span className="text-zinc-500">
                          {formatDuration(course.duration)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 h-1.5 rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-green-400"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-300 tabular-nums shrink-0">
                        {course.progress}%
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
