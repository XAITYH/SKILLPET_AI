"use client"

import { Settings } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>
      <div className="rounded-2xl bg-[#111] border border-white/5 p-8 flex flex-col items-center justify-center text-center">
        <Settings className="h-12 w-12 text-zinc-600 mb-4" />
        <p className="text-zinc-400">Settings coming soon.</p>
      </div>
    </div>
  )
}
