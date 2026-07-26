"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { apiFetch } from "@/lib/api-client"
import { CreditCard, Check, Crown, Calendar, Loader2 } from "lucide-react"

const plans = [
  {
    id: "monthly" as const,
    name: "Monthly",
    price: "$5.99",
    period: "/month",
    description: "Access all courses, AI tutor and premium features.",
    features: [
      "Unlimited course access",
      "AI-powered tutor",
      "Progress tracking",
      "Achievement system",
    ],
  },
  {
    id: "yearly" as const,
    name: "Yearly",
    price: "$49.99",
    period: "/year",
    badge: "Save 30%",
    description: "Best value — all features at a discounted annual rate.",
    features: [
      "Unlimited course access",
      "AI-powered tutor",
      "Progress tracking",
      "Achievement system",
      "Priority support",
    ],
  },
]

export default function BillingPage() {
  const { user, subscription, refreshSubscription } = useAuth()
  const [loading, setLoading] = useState<"monthly" | "yearly" | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isSubscribed = subscription?.active === true

  async function handleSubscribe(plan: "monthly" | "yearly") {
    if (!user?.email) return
    setLoading(plan)
    setError(null)

    try {
      const res = await apiFetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, plan }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to subscribe")
        return
      }
      await refreshSubscription()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(null)
    }
  }

  async function handleCancel() {
    if (!user?.email) return
    setLoading("monthly") // reuse loading state
    setError(null)

    try {
      const res = await apiFetch(`/api/subscriptions?email=${encodeURIComponent(user.email)}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        setError("Failed to cancel subscription")
        return
      }
      await refreshSubscription()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Billing</h1>
        <p className="text-zinc-400">Manage your subscription and access.</p>
      </div>

      {isSubscribed && (
        <div className="mb-8 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Crown className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Active Subscription</h2>
              <p className="text-sm text-zinc-400">
                {subscription?.plan === "monthly" ? "Monthly" : "Yearly"} plan
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-400 mb-4">
            <Calendar className="h-4 w-4" />
            <span>
              Renews {subscription?.endDate
                ? new Date(subscription.endDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "N/A"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <Check className="h-4 w-4" />
              <span>All courses unlocked</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <Check className="h-4 w-4" />
              <span>AI tutor enabled</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading !== null}
            className="mt-4 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? "Processing..." : "Cancel Subscription"}
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = isSubscribed && subscription?.plan === plan.id
          const isLoading = loading === plan.id

          return (
            <div
              key={plan.id}
              className={`rounded-xl border p-6 ${
                isCurrentPlan
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-zinc-800 bg-zinc-900/50"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                {plan.badge && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-xs font-medium">
                    {plan.badge}
                  </span>
                )}
                {isCurrentPlan && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                    Current
                  </span>
                )}
              </div>
              <div className="mb-4">
                <span className="text-3xl font-bold text-white">{plan.price}</span>
                <span className="text-zinc-400 text-sm">{plan.period}</span>
              </div>
              <p className="text-sm text-zinc-400 mb-6">{plan.description}</p>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-zinc-300">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => handleSubscribe(plan.id)}
                disabled={isCurrentPlan || isLoading}
                className={`w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                  isCurrentPlan
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    : "bg-purple-500 hover:bg-purple-600 text-white"
                } disabled:opacity-50`}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isCurrentPlan ? (
                  "Current Plan"
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Subscribe
                  </>
                )}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
