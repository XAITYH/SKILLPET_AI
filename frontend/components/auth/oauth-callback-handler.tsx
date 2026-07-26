"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { insforge } from "@/lib/insforge"
import { useAuth } from "@/lib/auth-context"

export function OAuthCallbackHandler() {
  const router = useRouter()
  const { refreshUser } = useAuth()
  const [status, setStatus] = useState<"processing" | "syncing" | "redirecting">("processing")

  useEffect(() => {
    async function handleCallback() {
      try {
        setStatus("processing")
        const { data } = await insforge.auth.getCurrentUser()

        if (data?.user) {
          setStatus("syncing")
          const syncRes = await fetch("/api/auth/sync-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: data.user.id,
              email: data.user.email,
              name: data.user.profile?.name || data.user.email.split("@")[0],
              avatarUrl: data.user.profile?.avatar_url || null,
              authProvider: "google",
            }),
          })

          if (!syncRes.ok) {
            const err = await syncRes.json()
            throw new Error(err.error || `Sync failed: ${syncRes.status}`)
          }

          await refreshUser()
        }

        setStatus("redirecting")
        router.push("/")
      } catch {
        router.push("/signin?error=oauth_failed")
      }
    }

    handleCallback()
  }, [router, refreshUser])

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">
        {status === "processing" && "Completing authentication..."}
        {status === "syncing" && "Setting up your account..."}
        {status === "redirecting" && "Redirecting..."}
      </p>
    </div>
  )
}
