"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import {
  Trophy,
  Flame,
  Gem,
  BookOpen,
  GraduationCap,
  Target,
  CalendarCheck,
  Calendar,
  Lock,
  CheckCircle2,
  Crown,
  Medal,
  Star,
  Loader2,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { CHARACTERS } from "@/lib/characters"
import { cn } from "@/lib/utils"

const DAILY_GOAL_THRESHOLD = 3

interface Achievement {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  unlocked: boolean
  progress: number
  total: number
}

interface LeaderboardEntry {
  rank: number
  displayName: string
  characterFileName: string | null
  characterName: string | null
  gems: number
  maxStreak: number
  xp: number
}

function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr)
  const dayOfWeek = d.getDay()
  const monday = new Date(d)
  monday.setDate(d.getDate() - ((dayOfWeek + 6) % 7))
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`
}

function calculateStreakFromActivity(activity: string[]): number {
  if (activity.length === 0) return 0
  const sorted = [...new Set(activity)].sort().reverse()
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
  const yesterdayDate = new Date(now)
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, "0")}-${String(yesterdayDate.getDate()).padStart(2, "0")}`

  if (sorted[0] !== today && sorted[0] !== yesterday) return 0

  let count = 1
  for (let i = 0; i < sorted.length - 1; i++) {
    const curr = new Date(sorted[i])
    const prev = new Date(sorted[i + 1])
    const diffDays = Math.round(
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24),
    )
    if (diffDays === 1) {
      count++
    } else {
      break
    }
  }
  return count
}

function getMaxStreakFromActivity(activity: string[]): number {
  const sorted = [...new Set(activity)].sort()
  if (sorted.length === 0) return 0
  let maxStreak = 1
  let current = 1
  for (let i = 1; i < sorted.length; i++) {
    const curr = new Date(sorted[i])
    const prev = new Date(sorted[i - 1])
    const diffDays = Math.round(
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24),
    )
    if (diffDays === 1) {
      current++
      maxStreak = Math.max(maxStreak, current)
    } else {
      current = 1
    }
  }
  return maxStreak
}

function countDailyGoals(activity: string[]): number {
  const dayCounts: Record<string, number> = {}
  for (const date of activity) {
    dayCounts[date] = (dayCounts[date] || 0) + 1
  }
  return Object.values(dayCounts).filter((c) => c >= DAILY_GOAL_THRESHOLD)
    .length
}

function countWeeklyGoals(activity: string[], target: number): number {
  const weekCounts: Record<string, number> = {}
  for (const date of activity) {
    const key = getWeekKey(date)
    weekCounts[key] = (weekCounts[key] || 0) + 1
  }
  return Object.values(weekCounts).filter((c) => c >= target).length
}

function getRankIcon(rank: number) {
  if (rank === 1)
    return (
      <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
        <Crown className="h-4.5 w-4.5 text-yellow-400" />
      </div>
    )
  if (rank === 2)
    return (
      <div className="w-8 h-8 rounded-lg bg-zinc-300/10 flex items-center justify-center">
        <Medal className="h-4.5 w-4.5 text-zinc-300" />
      </div>
    )
  if (rank === 3)
    return (
      <div className="w-8 h-8 rounded-lg bg-amber-600/10 flex items-center justify-center">
        <Medal className="h-4.5 w-4.5 text-amber-600" />
      </div>
    )
  return (
    <span className="text-sm text-zinc-500 w-8 text-center font-medium">
      {rank}
    </span>
  )
}

export default function AchievementsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [leaderboardLoading, setLeaderboardLoading] = useState(true)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all")

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch("/api/leaderboard")
        if (res.ok) {
          const data = await res.json()
          setLeaderboard(data.data || [])
        }
      } catch {
        console.error("Failed to fetch leaderboard")
      } finally {
        setLeaderboardLoading(false)
      }
    }
    fetchLeaderboard()
  }, [])

  useEffect(() => {
    async function fetchAchievements() {
      if (!user?.email) {
        setLoading(false)
        return
      }

      let computedStreak = 0
      let computedMaxStreak = 0
      let computedDailyGoals = 0
      let computedWeeklyGoals = 0
      let currentGems = 0
      let currentEnrolledCount = 0
      let currentFinishedCount = 0
      let activity: string[] = []

      try {
        const [profileRes, enrollRes] = await Promise.all([
          fetch(
            `/api/auth/user-profile?email=${encodeURIComponent(user.email)}`,
          ),
          fetch(
            `/api/user-course-program?email=${encodeURIComponent(user.email)}`,
          ),
        ])

        if (profileRes.ok) {
          const profileData = await profileRes.json()
          const meta = profileData.metadata || {}

          activity = Array.isArray(meta.last7DaysActivity)
            ? meta.last7DaysActivity
            : []
          const weeklyGoalTarget = meta.weeklyGoal || 10
          currentGems = meta.gems || 0

          computedStreak = calculateStreakFromActivity(activity)
          computedMaxStreak = Math.max(
            meta.maxStreak || 0,
            getMaxStreakFromActivity(activity),
          )
          computedDailyGoals = countDailyGoals(activity)
          computedWeeklyGoals = countWeeklyGoals(activity, weeklyGoalTarget)

          const enrollments = profileData.enrollments || []
          currentEnrolledCount = enrollments.length
        }

        if (enrollRes.ok) {
          const enrollData = await enrollRes.json()
          const rawEnrollments = enrollData.data || []
          let finished = 0

          await Promise.all(
            rawEnrollments.map(
              async (e: {
                course?: { documentId?: string }
                progress?: number
              }) => {
                const courseDocId = e.course?.documentId
                if (!courseDocId) return

                try {
                  const [chaptersRes, progressRes] = await Promise.all([
                    fetch(
                      `/api/chapters?filters[course][documentId][$eq]=${courseDocId}&sort=order:asc`,
                    ),
                    fetch(
                      `/api/user-progress?email=${encodeURIComponent(user!.email)}&courseDocumentId=${courseDocId}`,
                    ),
                  ])

                  const chaptersData = chaptersRes.ok
                    ? await chaptersRes.json()
                    : { data: [] }
                  const totalChapters = (chaptersData.data || []).length

                  if (progressRes && progressRes.ok) {
                    const progressData = await progressRes.json()
                    if (progressData.data) {
                      const raw = progressData.data.completedChapters
                      const parsed =
                        typeof raw === "string" ? JSON.parse(raw) : raw
                      const completedChapters = Array.isArray(parsed)
                        ? parsed
                        : []
                      const realProgress =
                        totalChapters > 0
                          ? Math.round(
                              (completedChapters.length / totalChapters) * 100,
                            )
                          : 0
                      if (realProgress === 100) {
                        finished++
                      }
                    }
                  }
                } catch {
                  // Skip on error
                }
              },
            ),
          )

          currentFinishedCount = finished
        }

        const uniqueDays = new Set(activity).size
        const allAchievements: Achievement[] = [
          {
            id: "streak_3",
            title: "On Fire",
            description: "3-day streak",
            icon: <Flame className="h-5 w-5" />,
            unlocked: computedStreak >= 3 || computedMaxStreak >= 3,
            progress: Math.min(computedStreak, 3),
            total: 3,
          },
          {
            id: "streak_7",
            title: "Week Warrior",
            description: "7-day streak",
            icon: <Flame className="h-5 w-5" />,
            unlocked: computedStreak >= 7 || computedMaxStreak >= 7,
            progress: Math.min(computedStreak, 7),
            total: 7,
          },
          {
            id: "streak_30",
            title: "Monthly Master",
            description: "30-day streak",
            icon: <Flame className="h-5 w-5" />,
            unlocked: computedStreak >= 30 || computedMaxStreak >= 30,
            progress: Math.min(computedStreak, 30),
            total: 30,
          },
          {
            id: "streak_100",
            title: "Century Club",
            description: "100-day streak",
            icon: <Trophy className="h-5 w-5" />,
            unlocked: computedStreak >= 100 || computedMaxStreak >= 100,
            progress: Math.min(computedStreak, 100),
            total: 100,
          },
          {
            id: "streak_365",
            title: "Year Legend",
            description: "365-day streak",
            icon: <Trophy className="h-5 w-5" />,
            unlocked: computedStreak >= 365 || computedMaxStreak >= 365,
            progress: Math.min(computedStreak, 365),
            total: 365,
          },
          {
            id: "gems_10",
            title: "Sparkle",
            description: "Earn 10 gems",
            icon: <Gem className="h-5 w-5" />,
            unlocked: currentGems >= 10,
            progress: Math.min(currentGems, 10),
            total: 10,
          },
          {
            id: "gems_50",
            title: "Gem Collector",
            description: "Earn 50 gems",
            icon: <Gem className="h-5 w-5" />,
            unlocked: currentGems >= 50,
            progress: Math.min(currentGems, 50),
            total: 50,
          },
          {
            id: "gems_100",
            title: "Treasure Hunter",
            description: "Earn 100 gems",
            icon: <Gem className="h-5 w-5" />,
            unlocked: currentGems >= 100,
            progress: Math.min(currentGems, 100),
            total: 100,
          },
          {
            id: "enroll_1",
            title: "First Steps",
            description: "Enroll in a course",
            icon: <BookOpen className="h-5 w-5" />,
            unlocked: currentEnrolledCount >= 1,
            progress: Math.min(currentEnrolledCount, 1),
            total: 1,
          },
          {
            id: "enroll_3",
            title: "Explorer",
            description: "Enroll in 3 courses",
            icon: <BookOpen className="h-5 w-5" />,
            unlocked: currentEnrolledCount >= 3,
            progress: Math.min(currentEnrolledCount, 3),
            total: 3,
          },
          {
            id: "finish_1",
            title: "Graduate",
            description: "Complete a course",
            icon: <GraduationCap className="h-5 w-5" />,
            unlocked: currentFinishedCount >= 1,
            progress: Math.min(currentFinishedCount, 1),
            total: 1,
          },
          {
            id: "finish_3",
            title: "Scholar",
            description: "Complete 3 courses",
            icon: <GraduationCap className="h-5 w-5" />,
            unlocked: currentFinishedCount >= 3,
            progress: Math.min(currentFinishedCount, 3),
            total: 3,
          },
          {
            id: "daily_1",
            title: "Early Bird",
            description: "Complete 1 daily goal",
            icon: <CalendarCheck className="h-5 w-5" />,
            unlocked: computedDailyGoals >= 1,
            progress: Math.min(computedDailyGoals, 1),
            total: 1,
          },
          {
            id: "daily_7",
            title: "Consistent Learner",
            description: "Complete 7 daily goals",
            icon: <CalendarCheck className="h-5 w-5" />,
            unlocked: computedDailyGoals >= 7,
            progress: Math.min(computedDailyGoals, 7),
            total: 7,
          },
          {
            id: "weekly_1",
            title: "Goal Setter",
            description: "Complete 1 weekly goal",
            icon: <Target className="h-5 w-5" />,
            unlocked: computedWeeklyGoals >= 1,
            progress: Math.min(computedWeeklyGoals, 1),
            total: 1,
          },
          {
            id: "weekly_10",
            title: "Goal Crusher",
            description: "Complete 10 weekly goals",
            icon: <Target className="h-5 w-5" />,
            unlocked: computedWeeklyGoals >= 10,
            progress: Math.min(computedWeeklyGoals, 10),
            total: 10,
          },
          {
            id: "active_7",
            title: "Getting Started",
            description: "7 active days",
            icon: <Calendar className="h-5 w-5" />,
            unlocked: uniqueDays >= 7,
            progress: Math.min(uniqueDays, 7),
            total: 7,
          },
          {
            id: "active_30",
            title: "Dedicated",
            description: "30 active days",
            icon: <Calendar className="h-5 w-5" />,
            unlocked: uniqueDays >= 30,
            progress: Math.min(uniqueDays, 30),
            total: 30,
          },
          {
            id: "active_100",
            title: "Devoted",
            description: "100 active days",
            icon: <Calendar className="h-5 w-5" />,
            unlocked: uniqueDays >= 100,
            progress: Math.min(uniqueDays, 100),
            total: 100,
          },
        ]

        allAchievements.sort((a, b) => {
          if (a.unlocked && !b.unlocked) return -1
          if (!a.unlocked && b.unlocked) return 1
          return b.progress / b.total - a.progress / a.total
        })

        setAchievements(allAchievements)
      } catch {
        console.error("Failed to fetch achievements data")
      } finally {
        setLoading(false)
      }
    }

    fetchAchievements()
  }, [user?.email])

  const filteredAchievements = achievements.filter((a) => {
    if (filter === "unlocked") return a.unlocked
    if (filter === "locked") return !a.unlocked
    return true
  })

  const unlockedCount = achievements.filter((a) => a.unlocked).length

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Achievements</h1>

      {/* Leaderboard */}
      <div className="rounded-2xl bg-zinc-900/80 border border-white/[0.06] shadow-lg shadow-black/20 overflow-hidden">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-[15px]">
                  Leaderboard
                </h2>
                <p className="text-[11px] text-zinc-500">
                  Ranked by Total XP
                </p>
              </div>
            </div>
          </div>
        </div>
        {leaderboardLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 text-green-500 animate-spin" />
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-4">
              <Trophy className="h-7 w-7 text-zinc-600" />
            </div>
            <p className="text-zinc-400 text-sm font-medium">
              No learners yet
            </p>
            <p className="text-zinc-600 text-xs mt-1">
              Complete lessons to appear here
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/[0.02]">
                  <th className="text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-widest px-6 py-3">
                    Rank
                  </th>
                  <th className="text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-widest px-6 py-3">
                    User
                  </th>
                  <th className="text-right text-[11px] font-semibold text-zinc-500 uppercase tracking-widest px-6 py-3">
                    Gems
                  </th>
                  <th className="text-right text-[11px] font-semibold text-zinc-500 uppercase tracking-widest px-6 py-3">
                    Streak
                  </th>
                  <th className="text-right text-[11px] font-semibold text-zinc-500 uppercase tracking-widest px-6 py-3">
                    Total XP
                  </th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => {
                  const isCurrentUser =
                    entry.displayName === user?.displayName
                  const character = entry.characterFileName
                    ? CHARACTERS.find(
                        (c) => c.fileName === entry.characterFileName,
                      )
                    : null

                  const maxXP =
                    leaderboard.length > 0
                      ? Math.max(...leaderboard.map((e) => e.xp), 1000)
                      : 1000
                  const xpPercent = Math.min(
                    (entry.xp / maxXP) * 100,
                    100,
                  )
                  const gemsPercent = Math.min((entry.gems / 100) * 100, 100)
                  const streakPercent = Math.min(
                    (entry.maxStreak / 365) * 100,
                    100,
                  )

                  return (
                    <tr
                      key={entry.rank}
                      className={cn(
                        "border-b border-white/[0.04] last:border-0 transition-all duration-200",
                        isCurrentUser
                          ? "bg-green-500/[0.06]"
                          : "hover:bg-white/[0.04]",
                      )}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center">
                          {getRankIcon(entry.rank)}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.06] flex items-center justify-center overflow-hidden shrink-0">
                            {character ? (
                              <Image
                                src={character.image}
                                alt={entry.characterName || ""}
                                width={40}
                                height={40}
                                className="object-contain"
                              />
                            ) : (
                              <span className="text-sm font-semibold text-zinc-400">
                                {entry.displayName[0]}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "font-semibold text-[15px]",
                                isCurrentUser
                                  ? "text-green-400"
                                  : "text-white",
                              )}
                            >
                              {entry.displayName}
                            </span>
                            {isCurrentUser && (
                              <span className="text-[10px] font-medium text-green-400 bg-green-500/10 rounded-full px-2 py-0.5">
                                you
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col items-end gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <Gem className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-[15px] font-bold text-white tabular-nums">
                              {entry.gems}
                            </span>
                          </div>
                          <div className="w-20 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                              style={{ width: `${gemsPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col items-end gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <Flame className="h-3.5 w-3.5 text-orange-400" />
                            <span className="text-[15px] font-bold text-white tabular-nums">
                              {entry.maxStreak}
                              <span className="text-xs font-medium text-zinc-500 ml-0.5">
                                d
                              </span>
                            </span>
                          </div>
                          <div className="w-20 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-500"
                              style={{ width: `${streakPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col items-end gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <Star className="h-3.5 w-3.5 text-yellow-400" />
                            <span className="text-[15px] font-bold text-white tabular-nums">
                              {entry.xp.toLocaleString()}
                            </span>
                          </div>
                          <div className="w-20 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-yellow-400 transition-all duration-500"
                              style={{ width: `${xpPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Achievements */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-white font-semibold">Your Achievements</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {unlockedCount}/{achievements.length} unlocked
            </p>
          </div>
          <div className="flex gap-1.5">
            {(["all", "unlocked", "locked"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                  filter === f
                    ? "bg-green-600 text-white"
                    : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10",
                )}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 text-green-500 animate-spin" />
          </div>
        ) : filteredAchievements.length === 0 ? (
          <div className="rounded-2xl bg-[#111] border border-white/5 p-8 flex flex-col items-center justify-center text-center">
            <Trophy className="h-10 w-10 text-zinc-600 mb-3" />
            <p className="text-zinc-400 text-sm">
              {filter === "unlocked"
                ? "No achievements unlocked yet"
                : "All achievements unlocked!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredAchievements.map((a) => (
              <div
                key={a.id}
                className={cn(
                  "rounded-2xl border p-4 flex items-center gap-4 transition-colors",
                  a.unlocked
                    ? "bg-[#111] border-green-500/30"
                    : "bg-[#111] border-white/5 opacity-60",
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    a.unlocked
                      ? "bg-green-500/20 text-green-400"
                      : "bg-white/5 text-zinc-500",
                  )}
                >
                  {a.unlocked ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Lock className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span
                    className={cn(
                      "font-medium text-sm",
                      a.unlocked ? "text-white" : "text-zinc-400",
                    )}
                  >
                    {a.title}
                  </span>
                  <p className="text-xs text-zinc-500">{a.description}</p>
                  {!a.unlocked && (
                    <div className="mt-1.5">
                      <div className="h-1 rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-green-400/50"
                          style={{
                            width: `${(a.progress / a.total) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-zinc-600 mt-0.5">
                        {a.progress}/{a.total}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
