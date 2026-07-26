"use client"

import { useState, useEffect } from "react"
import {
  Flame,
  Trophy,
  Gem,
  BookOpen,
  GraduationCap,
  Target,
  CalendarCheck,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

const DAILY_GOAL_THRESHOLD = 3

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

export default function ProgressPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [gems, setGems] = useState(0)
  const [enrolledCount, setEnrolledCount] = useState(0)
  const [finishedCount, setFinishedCount] = useState(0)
  const [dailyGoalsCompleted, setDailyGoalsCompleted] = useState(0)
  const [weeklyGoalsCompleted, setWeeklyGoalsCompleted] = useState(0)
  const [weeklyGoal, setWeeklyGoal] = useState({ completed: 0, target: 10 })
  const [last7DaysActivity, setLast7DaysActivity] = useState<string[]>([])

  useEffect(() => {
    async function fetchData() {
      if (!user?.email) {
        setLoading(false)
        return
      }

      // Computed values used across sections
      let computedStreak = 0
      let computedMaxStreak = 0
      let computedDailyGoals = 0
      let computedWeeklyGoals = 0
      let activity: string[] = []
      let weeklyGoalTarget = 10
      let currentGems = 0
      let currentEnrolledCount = 0
      let currentFinishedCount = 0

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
          weeklyGoalTarget = meta.weeklyGoal || 10
          currentGems = meta.gems || 0

          computedStreak = calculateStreakFromActivity(activity)
          computedMaxStreak = Math.max(
            meta.maxStreak || 0,
            getMaxStreakFromActivity(activity),
          )
          computedDailyGoals = countDailyGoals(activity)
          computedWeeklyGoals = countWeeklyGoals(activity, weeklyGoalTarget)

          // Weekly goal for current week
          const now = new Date()
          const dayOfWeek = now.getDay()
          const monday = new Date(now)
          monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
          monday.setHours(0, 0, 0, 0)
          const sunday = new Date(monday)
          sunday.setDate(monday.getDate() + 6)
          sunday.setHours(23, 59, 59, 999)

          const weeklyCompleted = activity.filter((dateStr: string) => {
            const d = new Date(dateStr)
            return d >= monday && d <= sunday
          }).length

          setWeeklyGoal({
            completed: weeklyCompleted,
            target: weeklyGoalTarget,
          })

          // Count enrolled courses
          const enrollments = profileData.enrollments || []
          currentEnrolledCount = enrollments.length
        }

        // Calculate finished courses from real progress
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

        // Update state
        setStreak(computedStreak)
        setMaxStreak(computedMaxStreak)
        setGems(currentGems)
        setEnrolledCount(currentEnrolledCount)
        setFinishedCount(currentFinishedCount)
        setDailyGoalsCompleted(computedDailyGoals)
        setWeeklyGoalsCompleted(computedWeeklyGoals)
        setLast7DaysActivity(activity)
      } catch {
        console.error("Failed to fetch progress data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user?.email])

  const days = ["S", "M", "T", "W", "T", "F", "S"]
  const todayIdx = new Date().getDay()

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Progress</h1>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Your Progress</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="rounded-2xl bg-[#111] border border-white/5 p-4 flex flex-col items-center text-center">
          <Flame className="h-6 w-6 text-orange-400 mb-2" />
          <span className="text-2xl font-bold text-white">{streak}</span>
          <span className="text-xs text-zinc-400">Streak</span>
        </div>
        <div className="rounded-2xl bg-[#111] border border-white/5 p-4 flex flex-col items-center text-center">
          <Trophy className="h-6 w-6 text-yellow-400 mb-2" />
          <span className="text-2xl font-bold text-white">{maxStreak}</span>
          <span className="text-xs text-zinc-400">Max Streak</span>
        </div>
        <div className="rounded-2xl bg-[#111] border border-white/5 p-4 flex flex-col items-center text-center">
          <Gem className="h-6 w-6 text-purple-400 mb-2" />
          <span className="text-2xl font-bold text-white">{gems}</span>
          <span className="text-xs text-zinc-400">Gems</span>
        </div>
        <div className="rounded-2xl bg-[#111] border border-white/5 p-4 flex flex-col items-center text-center">
          <BookOpen className="h-6 w-6 text-blue-400 mb-2" />
          <span className="text-2xl font-bold text-white">{enrolledCount}</span>
          <span className="text-xs text-zinc-400">Enrolled</span>
        </div>
        <div className="rounded-2xl bg-[#111] border border-white/5 p-4 flex flex-col items-center text-center col-span-2 md:col-span-1">
          <GraduationCap className="h-6 w-6 text-green-400 mb-2" />
          <span className="text-2xl font-bold text-white">{finishedCount}</span>
          <span className="text-xs text-zinc-400">Finished</span>
        </div>
      </div>

      {/* Weekly Goal */}
      <div className="rounded-2xl bg-[#111] border border-white/5 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Weekly Goal</h2>
          <Target className="h-5 w-5 text-green-400" />
        </div>
        <p className="text-3xl font-bold text-white mb-1">
          {weeklyGoal.completed}/{weeklyGoal.target}
        </p>
        <p className="text-sm text-zinc-400 mb-4">lessons completed</p>
        <div className="h-2.5 rounded-full bg-white/10 mb-4">
          <div
            className="h-full rounded-full bg-green-400 transition-all duration-500"
            style={{
              width: `${Math.min((weeklyGoal.completed / weeklyGoal.target) * 100, 100)}%`,
            }}
          />
        </div>
        <div className="flex gap-2 justify-between">
          {days.map((d, i) => {
            const now = new Date()
            const dayDate = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate() - now.getDay() + i,
            )
            const dayStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, "0")}-${String(dayDate.getDate()).padStart(2, "0")}`
            const hasActivity = last7DaysActivity.includes(dayStr)
            const isToday = i === todayIdx

            return (
              <div
                key={d + i}
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                  isToday
                    ? "border-2 border-green-500/50 text-white"
                    : hasActivity
                      ? "text-white border-2 border-yellow-500"
                      : "bg-white/5 text-zinc-500",
                )}
              >
                {hasActivity ? (
                  <span className="text-yellow-400">&#9733;</span>
                ) : (
                  d
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Goal Tabs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[#111] border border-white/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CalendarCheck className="h-4 w-4 text-green-400" />
            <span className="text-xs text-zinc-400">Daily Goals</span>
          </div>
          <span className="text-2xl font-bold text-white">
            {dailyGoalsCompleted}
          </span>
          <p className="text-xs text-zinc-500 mt-1">
            days with {DAILY_GOAL_THRESHOLD}+ lessons
          </p>
        </div>
        <div className="rounded-2xl bg-[#111] border border-white/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-purple-400" />
            <span className="text-xs text-zinc-400">Weekly Goals</span>
          </div>
          <span className="text-2xl font-bold text-white">
            {weeklyGoalsCompleted}
          </span>
          <p className="text-xs text-zinc-500 mt-1">
            weeks with target met
          </p>
        </div>
      </div>
    </div>
  )
}
