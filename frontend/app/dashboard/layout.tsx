"use client"

import type { ReactNode } from "react"
import { SidebarProvider, useSidebar } from "@/lib/sidebar-context"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"

function DashboardShell({ children }: { children: ReactNode }) {
  const { collapsed } = useSidebar()

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <DashboardSidebar />
      <div
        className="transition-all duration-300"
        style={{ marginLeft: collapsed ? 72 : 260 }}
      >
        <DashboardHeader />
        <main className="pt-24 min-h-screen p-6">{children}</main>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardShell>{children}</DashboardShell>
    </SidebarProvider>
  )
}
