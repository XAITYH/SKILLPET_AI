"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Mail, Lock, User, Loader2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337"

type Mode = "signin" | "signup"

const steps = [
  { num: "01", title: "Create your Account!", desc: "Sign up with email or Google to get started" },
  { num: "02", title: "Get a Subscription!", desc: "Choose a plan that fits your learning goals" },
  { num: "03", title: "Start Learning!", desc: "Access personalized AI-powered lessons" },
]

export default function AuthPage() {
  const router = useRouter()
  const { setStrapiToken } = useAuth()
  const [mode, setMode] = useState<Mode>("signin")

  return (
    <main className="flex-1 flex">
      <div className="hidden lg:flex w-[45%] bg-gradient-to-br from-[#0a0a0a] via-[#0d1f0e] to-[#0a0a0a] p-12 flex-col relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #3cc74f 0%, transparent 50%), radial-gradient(circle at 75% 75%, #3cc74f 0%, transparent 50%)`
        }} />
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex-1 flex flex-col justify-center max-w-md mx-auto">
            <span className="w-fit border border-[#3cc74f]/40 rounded-full px-5 py-1.5 text-[#3cc74f] text-xs font-bold tracking-[0.15em] mb-3">
              SKILLPET AI
            </span>
            <h1 className="text-4xl font-bold text-white mb-3">
              Welcome to SkillPet
            </h1>
            <p className="text-zinc-400 text-lg mb-12">
              Your AI-powered learning companion that adapts to your pace and style.
            </p>

            <div className="space-y-5">
              {steps.map((step) => (
                <div
                  key={step.num}
                  className="flex gap-4 items-start group p-4 rounded-xl border border-white/5 bg-white/[0.03] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_30px_-5px_rgba(60,199,79,0.3)] hover:border-[#3cc74f]/20 hover:bg-white/[0.06]"
                >
                  <span className="flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold shrink-0 bg-[#3cc74f] text-black mt-0.5" style={{ fontFamily: "var(--font-geist-mono)" }}>
                    {step.num}
                  </span>
                  <div className="pt-1">
                    <h3 className="text-white font-semibold">{step.title}</h3>
                    <p className="text-zinc-500 text-sm mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-zinc-600 text-xs text-center mt-6">
            &copy; {new Date().getFullYear()} SkillPet. All rights reserved.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex justify-center mb-8">
            <span className="inline-block border border-[#3cc74f]/40 rounded-full px-5 py-1.5 text-[#3cc74f] text-xs font-semibold tracking-widest">
              SKILLPET AI
            </span>
          </div>

          <div className="flex mb-8 bg-muted rounded-lg p-1">
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all cursor-pointer ${
                mode === "signin"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setMode("signin")}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all cursor-pointer ${
                mode === "signup"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setMode("signup")}
            >
              Sign Up
            </button>
          </div>

          {mode === "signin" ? (
            <SignInForm router={router} setStrapiToken={setStrapiToken} onSwitch={() => setMode("signup")} />
          ) : (
            <SignUpForm router={router} setStrapiToken={setStrapiToken} onSwitch={() => setMode("signin")} />
          )}
        </div>
      </div>
    </main>
  )
}

function SignInForm({
  router,
  setStrapiToken,
  onSwitch,
}: {
  router: ReturnType<typeof useRouter>
  setStrapiToken: (token: string, user: { id: number; email: string }) => void
  onSwitch: () => void
}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch(`${STRAPI_URL}/api/auth/local`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email, password }),
      })

      const body = await res.json()

      if (!res.ok) {
        if (res.status === 400) {
          setError(body.error?.message === "Invalid identifier or password"
            ? "Account not found. Please check your credentials or sign up."
            : body.error?.message || "Invalid credentials")
        } else {
          setError(body.error?.message || "An unexpected error occurred")
        }
        return
      }

      setStrapiToken(body.jwt, body.user)
      syncUserToStrapi(body.user, body.jwt, "local")
      router.push("/")
    } catch {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  function handleGoogleSignIn() {
    setGoogleLoading(true)
    window.location.href = `${STRAPI_URL}/api/connect/google?redirect=${encodeURIComponent(`${window.location.origin}/auth/callback`)}`
  }

  return (
    <form onSubmit={handleEmailSignIn} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signin-email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="signin-email" type="email" placeholder="you@example.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="signin-password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="signin-password" type={showPassword ? "text" : "password"} placeholder="••••••••" className="pl-10 pr-10" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Sign In
      </Button>
      <div className="relative">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or continue with</span></div>
      </div>
      <Button type="button" variant="outline" className="w-full cursor-pointer" disabled={googleLoading} onClick={handleGoogleSignIn}>
        {googleLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : (
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
        )}
        Sign in with Google
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <button type="button" className="text-primary hover:underline font-medium cursor-pointer" onClick={onSwitch}>Sign up</button>
      </p>
    </form>
  )
}

function SignUpForm({
  router,
  setStrapiToken,
  onSwitch,
}: {
  router: ReturnType<typeof useRouter>
  setStrapiToken: (token: string, user: { id: number; email: string }) => void
  onSwitch: () => void
}) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  function getPasswordLabel(pw: string) {
    if (!pw) return ""
    const checks = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z\d]/]
    const score = checks.reduce((s, re) => s + (re.test(pw) ? 1 : 0), 0) + Math.min(Math.floor(pw.length / 4), 2)
    if (score <= 2) return "Weak"
    if (score <= 3) return "Fair"
    if (score <= 4) return "Good"
    return "Strong"
  }

  async function handleEmailSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords don't match")
      return
    }

    const pwLabel = getPasswordLabel(password)
    if (pwLabel === "Weak") {
      setError("Password is too weak! Add uppercase, numbers, or special characters to make it stronger.")
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`${STRAPI_URL}/api/auth/local/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name, email, password }),
      })

      const body = await res.json()

      if (!res.ok) {
        setError(body.error?.message || "Registration failed")
        return
      }

      setStrapiToken(body.jwt, body.user)

      syncUserToStrapi(body.user, body.jwt, "local")

      router.push("/character-picker")
    } catch {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  async function syncUserToStrapi(strapiUser: { id: number; email: string; username?: string }, jwt: string, authProvider: string) {
    try {
      await fetch("/api/auth/sync-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: strapiUser.id,
          email: strapiUser.email,
          name: strapiUser.username || strapiUser.email.split("@")[0],
          authProvider,
        }),
      })
    } catch (err) {
      console.error("Failed to sync user to Strapi:", err)
    }
  }

  function handleGoogleSignUp() {
    setGoogleLoading(true)
    window.location.href = `${STRAPI_URL}/api/connect/google?redirect=${encodeURIComponent(`${window.location.origin}/auth/callback`)}`
  }

  return (
    <form onSubmit={handleEmailSignUp} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-name">Username</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="signup-name" type="text" placeholder="cooluser123" className="pl-10" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="signup-email" type="email" placeholder="you@example.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="signup-password" type={showPassword ? "text" : "password"} placeholder="••••••••" className="pl-10 pr-10" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {password && (
          <div className="space-y-1.5 pt-1">
            <div className="flex gap-1">
              {["Weak", "Fair", "Good", "Strong"].map((level, i) => {
                const colors: Record<string, string> = { Weak: "bg-red-500", Fair: "bg-orange-500", Good: "bg-yellow-500", Strong: "bg-[#3cc74f]" }
                const pwLabel = getPasswordLabel(password)
                const levels = ["", "Weak", "Fair", "Good", "Strong"]
                const pwScore = levels.indexOf(pwLabel)
                return <div key={level} className={`h-1 flex-1 rounded-full transition-all ${i < pwScore ? colors[level] : "bg-muted"}`} />
              })}
            </div>
            <p className={`text-xs ${getPasswordLabel(password) === "Weak" ? "text-red-400" : "text-muted-foreground"}`}>
              {getPasswordLabel(password) || "Enter a password"}
              {getPasswordLabel(password) === "Weak" && " — add uppercase, numbers, or symbols"}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-confirm">Confirm Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="signup-confirm"
            type={showConfirm ? "text" : "password"}
            placeholder="••••••••"
            className="pl-10 pr-10"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {confirmPassword && password !== confirmPassword && (
          <p className="text-xs text-red-400">Passwords don't match</p>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Create Account
      </Button>
      <div className="relative">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or continue with</span></div>
      </div>
      <Button type="button" variant="outline" className="w-full cursor-pointer" disabled={googleLoading} onClick={handleGoogleSignUp}>
        {googleLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : (
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
        )}
        Sign up with Google
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <button type="button" className="text-primary hover:underline font-medium cursor-pointer" onClick={onSwitch}>Sign in</button>
      </p>
    </form>
  )
}
