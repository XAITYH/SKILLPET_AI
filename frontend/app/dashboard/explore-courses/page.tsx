"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search,
  Flame,
  ArrowRight,
  Loader2,
  Clock,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { CHARACTERS } from "@/lib/characters";
import { cn } from "@/lib/utils";

const STRAPI_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

interface StrapiMedia {
  url: string;
  alternativeText?: string;
  name?: string;
}

interface StrapiCourse {
  id: number;
  documentId: string;
  title: string;
  description: string;
  difficulty?: string;
  level?: string;
  duration?: string;
  estimated_duration?: string;
  time_duration?: string;
  timeLength?: string;
  length?: string;
  banner?: unknown;
  icon?: unknown;
  image?: unknown;
  slug: string;
  _resolvedImageUrl?: string | null;
}

function getStrapiMediaUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return `${STRAPI_URL}${url}`;
}

function getDifficulty(course: StrapiCourse): string {
  const raw = course.difficulty || course.level || "";
  if (!raw) return "";
  const lower = raw.toLowerCase();
  if (lower === "beginner") return "Beginner";
  if (lower === "intermediate") return "Intermediate";
  if (lower === "advanced") return "Advanced";
  return raw;
}

function getDuration(course: StrapiCourse): string {
  return (
    course.duration ||
    course.estimated_duration ||
    course.time_duration ||
    course.timeLength ||
    course.length ||
    ""
  );
}

interface CourseEnrollment {
  courseId: number;
  progress: number;
  enrolled: boolean;
}

interface CourseWithProgress extends StrapiCourse {
  progress: number;
  enrolled: boolean;
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

const difficultyFilters = [
  "All",
  "Beginner",
  "Intermediate",
  "Advanced",
];
const days = ["S", "M", "T", "W", "T", "F", "S"];
const today = new Date().getDay();

export default function ExploreCoursesPage() {
  const { user, character } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [streak, setStreak] = useState(0);
  const [weeklyGoal, setWeeklyGoal] = useState({
    completed: 0,
    target: 10,
  });
  const [last7DaysActivity, setLast7DaysActivity] = useState<
    string[]
  >([]);
  const [enrollments, setEnrollments] = useState<
    Record<number, CourseEnrollment>
  >({});

  useEffect(() => {
    async function fetchData() {
      if (!user?.email) return;

      try {
        const [coursesRes, profileRes, enrollRes] = await Promise.all([
          fetch("/api/courses"),
          fetch(
            `/api/auth/user-profile?email=${encodeURIComponent(user.email)}`,
          ),
          fetch(
            `/api/user-course-program?email=${encodeURIComponent(user.email)}`,
          ),
        ]);

        if (coursesRes.ok) {
          const coursesData = await coursesRes.json();
          const fetchedCourses: StrapiCourse[] =
            coursesData.data || [];

          setCourses(
            fetchedCourses.map((c) => {
              // Логика вытаскивания URL из Strapi структуры
              let imageUrl = null;
              if (
                c.banner &&
                typeof c.banner === "object" &&
                "url" in c.banner
              ) {
                imageUrl = (c.banner as any).url;
              } else if (
                c.image &&
                typeof c.image === "object" &&
                "url" in c.image
              ) {
                imageUrl = (c.image as any).url; // Иногда может быть в поле image
              }

              return {
                ...c,
                progress: 0,
                enrolled: false,
                _resolvedImageUrl: imageUrl, // Записываем реальный урл
              };
            }),
          );
        }

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          const meta = profileData.metadata || {};
          setStreak(meta.streak ?? 0);

          // Extract last7DaysActivity
          const activity: string[] = Array.isArray(
            meta.last7DaysActivity,
          )
            ? meta.last7DaysActivity
            : [];
          setLast7DaysActivity(activity);

          // Calculate weekly completions (Monday-Sunday)
          const now = new Date();
          const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...
          const monday = new Date(now);
          monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
          monday.setHours(0, 0, 0, 0);
          const sunday = new Date(monday);
          sunday.setDate(monday.getDate() + 6);
          sunday.setHours(23, 59, 59, 999);

          const weeklyCompleted = activity.filter(
            (dateStr: string) => {
              const d = new Date(dateStr);
              return d >= monday && d <= sunday;
            },
          ).length;

          setWeeklyGoal({
            completed: weeklyCompleted,
            target: meta.weeklyGoal ?? 10,
          });

          if (profileData.enrollments) {
            const enrollmentMap: Record<number, CourseEnrollment> =
              {};
            for (const e of profileData.enrollments) {
              enrollmentMap[e.courseId] = {
                courseId: e.courseId,
                progress: e.progress ?? 0,
                enrolled: true,
              };
            }
            setEnrollments(enrollmentMap);
          }
        }

        // Fetch enrollment data directly from user-course-program, then calculate real progress per course
        if (enrollRes && enrollRes.ok) {
          const enrollData = await enrollRes.json();
          const rawEnrollments = enrollData.data || [];
          const enrollmentMap: Record<number, CourseEnrollment> = {};

          await Promise.all(
            rawEnrollments.map(async (e: { course?: { id?: number; documentId?: string }; progress?: number }) => {
              const courseId = e.course?.id;
              const courseDocId = e.course?.documentId;
              if (!courseId || !courseDocId) return;

              let realProgress = e.progress ?? 0;
              try {
                const [chaptersRes, progressRes] = await Promise.all([
                  fetch(`/api/chapters?filters[course][documentId][$eq]=${courseDocId}&sort=order:asc`),
                  fetch(`/api/user-progress?email=${encodeURIComponent(user!.email)}&courseDocumentId=${courseDocId}`),
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

              enrollmentMap[courseId] = {
                courseId,
                progress: realProgress,
                enrolled: true,
              };
            }),
          );

          setEnrollments(enrollmentMap);
        }
      } catch {
        console.error("Failed to fetch courses or profile");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user?.email]);

  useEffect(() => {
    setCourses((prev) =>
      prev.map((c) => {
        const enrollment = enrollments[c.id];
        if (enrollment) {
          return {
            ...c,
            progress: enrollment.progress,
            enrolled: enrollment.enrolled,
          };
        }
        return c;
      }),
    );
  }, [enrollments]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        searchQuery === "" ||
        course.title
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        course.description
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesFilter =
        activeFilter === "All" ||
        getDifficulty(course) === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [courses, searchQuery, activeFilter]);

  const characterImage = character?.fileName
    ? CHARACTERS.find((c) => c.fileName === character.fileName)
        ?.image || `/characters/${character.fileName}`
    : null;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          Explore Courses
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          Choose a path and keep building your AI skills.
        </p>
      </div>

      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#111] border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-green-500/50 transition-colors"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {difficultyFilters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer",
                    activeFilter === filter
                      ? "bg-green-600 text-white"
                      : "bg-[#111] border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5",
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 text-green-500 animate-spin" />
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-2xl bg-[#111] border border-white/5">
              <Search className="h-12 w-12 text-zinc-600 mb-4" />
              <p className="text-zinc-400">
                No courses found matching your search.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className="rounded-2xl bg-[#111] border border-white/5 overflow-hidden flex flex-col hover:border-white/10 transition-colors"
                >
                  <div className="relative w-full h-48 overflow-hidden bg-[#1a1a1a]">
                    {course._resolvedImageUrl ? (
                      <Image
                        src={
                          getStrapiMediaUrl(
                            course._resolvedImageUrl,
                          ) || ""
                        }
                        alt={course.title}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-zinc-600 text-sm">
                          No banner
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-white font-semibold text-base leading-tight">
                        {course.title}
                      </h3>
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0",
                          getDifficulty(course) === "Beginner" &&
                            "bg-emerald-700 text-white",
                          getDifficulty(course) === "Intermediate" &&
                            "bg-orange-500 text-white",
                          getDifficulty(course) === "Advanced" &&
                            "bg-rose-700 text-white",
                        )}
                      >
                        {getDifficulty(course)}
                      </span>
                    </div>

                    {getDuration(course) && (
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-2">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatDuration(getDuration(course))}
                        </span>
                      </div>
                    )}

                    <p className="text-zinc-400 text-sm leading-relaxed mb-4 line-clamp-2 flex-1">
                      {course.description}
                    </p>

                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-zinc-300 mb-1.5">
                        <span>Progress</span>
                        <span>{course.progress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-green-400"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/courses/${course.documentId || course.slug}`,
                        )
                      }
                      className="w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer bg-green-600 text-white hover:bg-green-500"
                    >
                      {course.enrolled ? "Continue" : "Start"}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="hidden lg:block w-72 shrink-0 space-y-4">
          <div className="rounded-2xl bg-[#111] border border-white/5 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">
                Weekly Goal
              </h2>
              <Flame className="h-5 w-5 text-orange-400" />
            </div>
            <p className="text-3xl font-bold text-white mb-1">
              {weeklyGoal.completed}/{weeklyGoal.target}
            </p>
            <p className="text-sm text-zinc-300 mb-4">
              lessons completed
            </p>
            <div className="h-2.5 rounded-full bg-white/10 mb-4">
              <div
                className="h-full rounded-full bg-green-400"
                style={{
                  width: `${Math.min((weeklyGoal.completed / weeklyGoal.target) * 100, 100)}%`,
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
                const hasActivity =
                  last7DaysActivity.includes(dayStr);
                const isToday = i === today;

                return (
                  <div
                    key={d + i}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                      isToday
                        ? "border-2 border-green-500/50 text-white"
                        : hasActivity
                          ? "text-white border-2 border-yellow-500"
                          : isToday
                            ? "text-green-400 border-2 border-green-500/50"
                            : "bg-white/5 text-zinc-500",
                    )}
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

          <div className="rounded-2xl bg-[#111] border border-white/5 p-5">
            <h2 className="text-white font-semibold mb-2">
              Keep going!
            </h2>
            <p className="text-zinc-400 text-sm mb-4">
              You&apos;re on a roll. One more lesson brings you closer
              to your goal!
            </p>
            {characterImage && (
              <div className="flex justify-center mb-4">
                <Image
                  src={characterImage}
                  alt={character?.name || "Character"}
                  width={160}
                  height={160}
                  className="drop-shadow-[0_0_20px_rgba(60,199,79,0.3)]"
                />
              </div>
            )}
            <button
              type="button"
              onClick={() => router.push("/dashboard/progress")}
              className="w-full py-2.5 rounded-xl bg-white/5 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/10 transition-colors cursor-pointer"
            >
              Go to Progress
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
