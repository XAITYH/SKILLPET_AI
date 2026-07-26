"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  User,
  BookOpen,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useSidebar } from "@/lib/sidebar-context";
import { CHARACTERS } from "@/lib/characters";

const menuItems = [
  { icon: User, label: "Profile", href: "/dashboard/profile" },
  { icon: BookOpen, label: "My courses", href: "/dashboard/courses" },
  { icon: BarChart3, label: "Progress", href: "/dashboard/progress" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export function DashboardHeader() {
  const router = useRouter();
  const { character, signOut, user } = useAuth();
  const { collapsed } = useSidebar();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [gems, setGems] = useState(0);
  const [streak, setStreak] = useState(0);

  const fetchUserData = useCallback(async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(
        `/api/auth/user-profile?email=${encodeURIComponent(user.email)}`,
      );
      if (res.ok) {
        const data = await res.json();
        const meta = data.metadata || {};
        setGems(meta.gems ?? 0);
        setStreak(meta.streak ?? 0);
      }
    } catch {
      /* ignore */
    }
  }, [user?.email]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Refresh data when tab becomes visible (returning from lesson)
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        fetchUserData();
      }
    }
    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );
    return () =>
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
  }, [fetchUserData]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    await signOut();
    router.push("/auth");
  }

  return (
    <header
      className="fixed top-0 right-0 h-16 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 z-30 flex items-center justify-end px-6 gap-6"
      style={{ left: collapsed ? 72 : 260 }}
    >
      <div className="flex items-center gap-2">
        <Image
          src="/streak.png"
          alt="Streak"
          width={22}
          height={22}
          className="shrink-0"
        />
        <span className="text-sm font-semibold text-white">
          {streak}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Image
          src="/gems.png"
          alt="Gems"
          width={22}
          height={22}
          className="shrink-0"
        />
        <span className="text-sm font-semibold text-white">
          {gems}
        </span>
      </div>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 cursor-pointer"
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#EBFFE8" }}
          >
            {character?.fileName && (
              <Image
                src={
                  CHARACTERS.find(
                    (c) => c.fileName === character.fileName,
                  )?.image || `/characters/${character.fileName}`
                }
                alt={character.name || "Character"}
                width={36}
                height={36}
                className="w-full h-full object-cover rounded-full"
              />
            )}
          </div>
          <ChevronDown
            className={`h-4 w-4 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-52 rounded-xl bg-[#111] border border-white/10 shadow-xl overflow-hidden menu-container">
            {menuItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  router.push(item.href);
                  setOpen(false);
                }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer menu-item"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            ))}
            <div className="border-t border-white/5" />
            <button
              type="button"
              onClick={() => {
                handleSignOut();
                setOpen(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all cursor-pointer menu-item"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
