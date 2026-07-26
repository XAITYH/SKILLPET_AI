"use client"

import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import {
  Home,
  BookOpen,
  Compass,
  TrendingUp,
  Trophy,
  User,
  ChevronLeft,
  ChevronRight,
  Crown,
  CreditCard,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/lib/sidebar-context"
import { useAuth } from "@/lib/auth-context"

const menuItems = [
  { icon: Home, label: "Home", href: "/dashboard" },
  { icon: Compass, label: "Explore Courses", href: "/dashboard/explore-courses" },
  { icon: BookOpen, label: "My Courses", href: "/dashboard/courses" },
  { icon: TrendingUp, label: "Progress", href: "/dashboard/progress" },
  { icon: Trophy, label: "Achievements", href: "/dashboard/achievements" },
  { icon: User, label: "Profile", href: "/dashboard/profile" },
]

export function DashboardSidebar() {
  const { collapsed, toggle } = useSidebar()
  const { subscription } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const isSubscribed = subscription?.active === true

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-[#0a0a0a] border-r border-white/5 transition-all duration-300 fixed left-0 top-0 z-40",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      <button
        type="button"
        onClick={() => router.push("/dashboard")}
        className={cn(
          "flex items-center h-16 border-b border-white/5 shrink-0 cursor-pointer hover:bg-white/5 transition-colors",
          collapsed ? "justify-center px-0" : "gap-1 px-5"
        )}
      >
        <Image
          src="/logo.png"
          alt="SkillPet"
          width={40}
          height={40}
          className="shrink-0"
        />
        {!collapsed && (
          <span className="text-lg font-bold text-white tracking-tight">
            SkillPet
          </span>
        )}
      </button>

      <nav className="flex-1 flex flex-col gap-0.5 px-3 py-4">
        {menuItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname?.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-[15px] font-medium transition-all duration-200",
                isActive
                  ? "bg-white/10 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 pb-4">
        <div
          className={cn(
            isSubscribed
              ? "rounded-xl bg-gradient-to-b from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 p-4"
              : "rounded-xl bg-gradient-to-b from-purple-500/10 to-purple-600/5 border border-purple-500/20 p-4",
            collapsed && "p-3 flex flex-col items-center"
          )}
        >
          {!collapsed ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                {isSubscribed ? (
                  <Check className="h-5 w-5 text-emerald-400" />
                ) : (
                  <Crown className="h-5 w-5 text-purple-400" />
                )}
                <span className="text-sm font-semibold text-white">
                  {isSubscribed ? "Pro Active" : "Upgrade to Pro"}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
                {isSubscribed
                  ? "You have access to all courses and features."
                  : "Unlock all courses, AI tutor and more."}
              </p>
              <button
                type="button"
                onClick={() => router.push("/dashboard/billing")}
                className={cn(
                  "w-full py-2 px-3 rounded-lg text-white text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2",
                  isSubscribed
                    ? "bg-emerald-500 hover:bg-emerald-600"
                    : "bg-purple-500 hover:bg-purple-600"
                )}
              >
                <CreditCard className="h-4 w-4" />
                {isSubscribed ? "Check Subscription" : "Upgrade Now"}
              </button>
            </>
          ) : (
            isSubscribed ? (
              <Check className="h-5 w-5 text-emerald-400" />
            ) : (
              <Crown className="h-5 w-5 text-purple-400" />
            )
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={toggle}
        className="absolute -right-3 top-[54px] w-6 h-6 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#222] transition-colors cursor-pointer z-50"
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </button>
    </aside>
  )
}
