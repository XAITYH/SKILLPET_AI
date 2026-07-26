"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"

interface CharacterInfo {
  fileName: string
  name: string
}

interface StrapiUser {
  id: number
  documentId?: string
  email: string
  username?: string
  name?: string
}

interface SubscriptionInfo {
  plan: "monthly" | "yearly" | null
  startDate: string | null
  endDate: string | null
  active: boolean
}

interface AuthContextValue {
  user: StrapiUser | null
  character: CharacterInfo | null
  subscription: SubscriptionInfo | null
  loading: boolean
  refreshUser: () => Promise<void>
  refreshSubscription: () => Promise<void>
  signOut: () => Promise<void>
  setStrapiToken: (token: string, user: StrapiUser) => void
  setCharacter: (character: CharacterInfo) => void
  strapiToken: string | null
}

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337"

const AuthContext = createContext<AuthContextValue>({
  user: null,
  character: null,
  subscription: null,
  loading: true,
  refreshUser: async () => {},
  refreshSubscription: async () => {},
  signOut: async () => {},
  setStrapiToken: () => {},
  setCharacter: () => {},
  strapiToken: null,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StrapiUser | null>(null)
  const [character, setCharacterState] = useState<CharacterInfo | null>(null)
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [strapiToken, setStrapiTokenState] = useState<string | null>(null)

  const setStrapiToken = useCallback((token: string, strapiUser: StrapiUser) => {
    localStorage.setItem("strapi_token", token)
    localStorage.setItem("strapi_user", JSON.stringify(strapiUser))
    setStrapiTokenState(token)
    setUser(strapiUser)

    const savedChar = localStorage.getItem("selected_character")
    if (savedChar) {
      try { setCharacterState(JSON.parse(savedChar)) } catch { /* ignore */ }
    }

    if (strapiUser.email) {
      fetch(`/api/auth/user-profile?email=${encodeURIComponent(strapiUser.email)}`)
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data?.character) {
            setCharacterState(data.character)
            localStorage.setItem("selected_character", JSON.stringify(data.character))
          }
        })
        .catch(() => {})

      fetch(`/api/subscriptions?email=${encodeURIComponent(strapiUser.email)}`)
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          setSubscription(data?.subscription || null)
        })
        .catch(() => {})
    }

    setLoading(false)
  }, [])

  const setCharacter = useCallback((char: CharacterInfo) => {
    localStorage.setItem("selected_character", JSON.stringify(char))
    setCharacterState(char)
  }, [])

  const refreshSubscription = useCallback(async () => {
    if (!user?.email) {
      setSubscription(null)
      return
    }
    try {
      const res = await fetch(
        `/api/subscriptions?email=${encodeURIComponent(user.email)}`,
      )
      if (res.ok) {
        const data = await res.json()
        setSubscription(data.subscription || null)
      }
    } catch {
      // ignore
    }
  }, [user?.email])

  async function fetchCharacterFromStrapi(email: string): Promise<CharacterInfo | null> {
    try {
      const res = await fetch(`/api/auth/user-profile?email=${encodeURIComponent(email)}`)
      if (!res.ok) return null
      const data = await res.json()
      if (data.character) {
        setCharacter(data.character)
        return data.character
      }
    } catch {
      /* ignore */
    }
    return null
  }

  async function tryRefreshToken(): Promise<boolean> {
    const savedUser = localStorage.getItem("strapi_user")
    if (!savedUser) return false
    try {
      const parsed = JSON.parse(savedUser) as StrapiUser
      if (!parsed.email) return false
      const res = await fetch(`/api/auth/user-profile?email=${encodeURIComponent(parsed.email)}`)
      if (!res.ok) return false
      return true
    } catch {
      return false
    }
  }

  const refreshUser = useCallback(async () => {
    const savedToken = localStorage.getItem("strapi_token")
    const savedUserStr = localStorage.getItem("strapi_user")

    if (!savedToken) {
      if (savedUserStr) {
        try {
          const cached = JSON.parse(savedUserStr) as StrapiUser
          setUser(cached)
          const savedChar = localStorage.getItem("selected_character")
          if (savedChar) {
            try { setCharacterState(JSON.parse(savedChar)) } catch { /* ignore */ }
          }
          if (cached.email) {
            await fetchCharacterFromStrapi(cached.email)
          }
        } catch { /* ignore */ }
      }
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`${STRAPI_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
      if (res.ok) {
        const strapiUser = await res.json()
        setStrapiTokenState(savedToken)
        setUser(strapiUser)
        localStorage.setItem("strapi_user", JSON.stringify(strapiUser))
        if (strapiUser.email) {
          await fetchCharacterFromStrapi(strapiUser.email)
        }
      } else {
        if (savedUserStr) {
          try {
            const cached = JSON.parse(savedUserStr) as StrapiUser
            setUser(cached)
            const savedChar = localStorage.getItem("selected_character")
            if (savedChar) {
              try { setCharacterState(JSON.parse(savedChar)) } catch { /* ignore */ }
            }
          } catch { /* ignore */ }
        }
        setStrapiTokenState(null)
      }
    } catch {
      if (savedUserStr) {
        try {
          const cached = JSON.parse(savedUserStr) as StrapiUser
          setUser(cached)
          const savedChar = localStorage.getItem("selected_character")
          if (savedChar) {
            try { setCharacterState(JSON.parse(savedChar)) } catch { /* ignore */ }
          }
        } catch { /* ignore */ }
      }
      setStrapiTokenState(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function init() {
      const savedToken = localStorage.getItem("strapi_token")
      const savedUserStr = localStorage.getItem("strapi_user")

      const savedChar = localStorage.getItem("selected_character")
      if (savedChar) {
        try { setCharacterState(JSON.parse(savedChar)) } catch { /* ignore */ }
      }

      if (!savedToken) {
        if (savedUserStr && !cancelled) {
          try {
            const cached = JSON.parse(savedUserStr) as StrapiUser
            setUser(cached)
            if (cached.email) {
              await fetchCharacterFromStrapi(cached.email)
            }
          } catch { /* ignore */ }
        }
        if (!cancelled) setLoading(false)
        return
      }

      try {
        const res = await fetch(`${STRAPI_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${savedToken}` },
        })
        if (res.ok && !cancelled) {
          const strapiUser = await res.json()
          setStrapiTokenState(savedToken)
          setUser(strapiUser)
          localStorage.setItem("strapi_user", JSON.stringify(strapiUser))

          if (strapiUser.email) {
            await fetchCharacterFromStrapi(strapiUser.email)
            try {
              const subRes = await fetch(`/api/subscriptions?email=${encodeURIComponent(strapiUser.email)}`)
              if (subRes.ok && !cancelled) {
                const subData = await subRes.json()
                setSubscription(subData.subscription || null)
              }
            } catch { /* ignore */ }
          }
        } else {
          if (savedUserStr && !cancelled) {
            try {
              const cached = JSON.parse(savedUserStr) as StrapiUser
              setUser(cached)
              if (cached.email) {
                await fetchCharacterFromStrapi(cached.email)
              }
            } catch { /* ignore */ }
          }
          setStrapiTokenState(null)
        }
      } catch {
        if (savedUserStr && !cancelled) {
          try {
            const cached = JSON.parse(savedUserStr) as StrapiUser
            setUser(cached)
            if (cached.email) {
              await fetchCharacterFromStrapi(cached.email)
            }
          } catch { /* ignore */ }
        }
        setStrapiTokenState(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    init()
    return () => { cancelled = true }
  }, [])

  const signOut = useCallback(async () => {
    localStorage.removeItem("strapi_token")
    localStorage.removeItem("strapi_user")
    localStorage.removeItem("selected_character")
    setStrapiTokenState(null)
    setUser(null)
    setCharacterState(null)
    setSubscription(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, character, subscription, loading, refreshUser, refreshSubscription, signOut, setStrapiToken, setCharacter, strapiToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
