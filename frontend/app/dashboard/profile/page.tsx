"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  User,
  Mail,
  Flame,
  Gem,
  Target,
  LogOut,
  Check,
  Loader2,
  Settings,
  BookOpen,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { apiFetch } from "@/lib/api-client"
import { CHARACTERS } from "@/lib/characters"
import { cn } from "@/lib/utils"

export default function ProfilePage() {
  const { user, character, setCharacter, signOut, refreshUser } = useAuth()
  const router = useRouter()
  const [selectedChar, setSelectedChar] = useState<string>(
    character?.fileName || "",
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [weeklyGoal, setWeeklyGoal] = useState(10)
  const [savingGoal, setSavingGoal] = useState(false)
  const [profileData, setProfileData] = useState<{
    gems: number
    streak: number
    enrolledCount: number
  }>({ gems: 0, streak: 0, enrolledCount: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProfile() {
      if (!user?.email) {
        setLoading(false)
        return
      }
      try {
        const res = await fetch(
          `/api/auth/user-profile?email=${encodeURIComponent(user.email)}`,
        )
        if (res.ok) {
          const data = await res.json()
          const meta = data.metadata || {}
          setProfileData({
            gems: meta.gems || 0,
            streak: meta.streak || 0,
            enrolledCount: (data.enrollments || []).length,
          })
          setWeeklyGoal(meta.weeklyGoal || 10)
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [user?.email])

  async function handleCharacterChange(fileName: string) {
    if (!user?.email || saving) return
    const char = CHARACTERS.find((c) => c.fileName === fileName)
    if (!char) return

    setSelectedChar(fileName)
    setSaving(true)
    setSaved(false)

    try {
      const res = await apiFetch("/api/auth/select-character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          characterFileName: char.fileName,
          characterName: char.name,
        }),
      })

      if (res.ok) {
        setCharacter({ fileName: char.fileName, name: char.name })
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  async function handleWeeklyGoalChange(newGoal: number) {
    if (!user?.email) return
    setSavingGoal(true)
    try {
      await apiFetch("/api/auth/user-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, weeklyGoal: newGoal }),
      })
      setWeeklyGoal(newGoal)
    } catch {
      // ignore
    } finally {
      setSavingGoal(false)
    }
  }

  async function handleSignOut() {
    await signOut()
    router.push("/auth")
  }

  const currentChar = CHARACTERS.find(
    (c) => c.fileName === selectedChar,
  )

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Profile</h1>

      {/* Profile Card */}
      <div className="rounded-2xl bg-zinc-900/80 border border-white/[0.06] shadow-lg shadow-black/20 overflow-hidden">
        <div className="relative h-24 bg-gradient-to-r from-green-500/20 to-emerald-500/10">
          <div className="absolute -bottom-10 left-6">
            <div className="w-20 h-20 rounded-2xl bg-[#1a1a1a] border-4 border-[#0a0a0a] flex items-center justify-center overflow-hidden">
              {currentChar ? (
                <Image
                  src={currentChar.image}
                  alt={currentChar.name}
                  width={80}
                  height={80}
                  className="object-contain"
                />
              ) : (
                <User className="h-8 w-8 text-zinc-600" />
              )}
            </div>
          </div>
        </div>
        <div className="pt-14 px-6 pb-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-white font-semibold text-lg">
                {user?.username || user?.email?.split("@")[0] || "User"}
              </h2>
              <div className="flex items-center gap-1.5 text-zinc-500 text-sm mt-0.5">
                <Mail className="h-3.5 w-3.5" />
                <span>{user?.email}</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-3 text-center">
              <Flame className="h-4 w-4 text-orange-400 mx-auto mb-1" />
              <span className="text-lg font-bold text-white block">
                {profileData.streak}
              </span>
              <span className="text-[11px] text-zinc-500">Streak</span>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-3 text-center">
              <Gem className="h-4 w-4 text-purple-400 mx-auto mb-1" />
              <span className="text-lg font-bold text-white block">
                {profileData.gems}
              </span>
              <span className="text-[11px] text-zinc-500">Gems</span>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-3 text-center">
              <BookOpen className="h-4 w-4 text-blue-400 mx-auto mb-1" />
              <span className="text-lg font-bold text-white block">
                {profileData.enrolledCount}
              </span>
              <span className="text-[11px] text-zinc-500">Courses</span>
            </div>
          </div>
        </div>
      </div>

      {/* Character Selection */}
      <div className="rounded-2xl bg-zinc-900/80 border border-white/[0.06] shadow-lg shadow-black/20 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <User className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-[15px]">
                Character
              </h3>
              <p className="text-[11px] text-zinc-500">
                Choose your learning companion
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-4 gap-3">
            {CHARACTERS.map((char) => {
              const isSelected = selectedChar === char.fileName
              return (
                <button
                  key={char.id}
                  type="button"
                  onClick={() => handleCharacterChange(char.fileName)}
                  disabled={saving}
                  className={cn(
                    "relative rounded-xl border-2 p-3 flex flex-col items-center gap-2 transition-all duration-200 cursor-pointer",
                    isSelected
                      ? "border-green-500/50 bg-green-500/5"
                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]",
                  )}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                  <div className="w-14 h-14 rounded-xl bg-white/[0.03] flex items-center justify-center overflow-hidden">
                    <Image
                      src={char.image}
                      alt={char.name}
                      width={56}
                      height={56}
                      className="object-contain"
                    />
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isSelected ? "text-green-400" : "text-zinc-400",
                    )}
                  >
                    {char.name}
                  </span>
                </button>
              )
            })}
          </div>
          {saving && (
            <div className="flex items-center gap-2 mt-4 text-sm text-zinc-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving...</span>
            </div>
          )}
          {saved && (
            <div className="flex items-center gap-2 mt-4 text-sm text-green-400">
              <Check className="h-4 w-4" />
              <span>Character updated!</span>
            </div>
          )}
        </div>
      </div>

      {/* Settings */}
      <div className="rounded-2xl bg-zinc-900/80 border border-white/[0.06] shadow-lg shadow-black/20 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Settings className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-[15px]">
                Settings
              </h3>
              <p className="text-[11px] text-zinc-500">
                Customize your learning experience
              </p>
            </div>
          </div>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {/* Weekly Goal */}
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="h-4 w-4 text-zinc-500" />
              <div>
                <p className="text-sm text-white font-medium">
                  Weekly Goal
                </p>
                <p className="text-[11px] text-zinc-500">
                  Lessons per week target
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {[5, 10, 15, 20].map((goal) => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => handleWeeklyGoalChange(goal)}
                  disabled={savingGoal}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                    weeklyGoal === goal
                      ? "bg-green-600 text-white"
                      : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10",
                  )}
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>

          {/* Sign Out */}
          <div className="px-6 py-4">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-3 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
