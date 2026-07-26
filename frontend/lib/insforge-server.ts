import { cookies } from "next/headers"
import { createServerClient, createAuthActions } from "@insforge/sdk/ssr"

export async function getInsForgeServerClient() {
  const cookieStore = await cookies()
  return createServerClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_BASE_URL,
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY,
    cookies: cookieStore,
  })
}

export async function getAuthActions() {
  const cookieStore = await cookies()
  return createAuthActions({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_BASE_URL,
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY,
    cookies: cookieStore,
  })
}
