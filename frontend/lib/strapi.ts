import type { UserSchema } from "@insforge/shared-schemas"

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337"
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN

interface StrapiUser {
  id: number
  documentId: string
  email: string
  name: string
  insforgeId: string
  authProvider: string
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

async function strapiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${STRAPI_URL}/api${path}`
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  if (STRAPI_API_TOKEN) {
    headers["Authorization"] = `Bearer ${STRAPI_API_TOKEN}`
  }

  const res = await fetch(url, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Strapi request failed (${res.status}): ${body}`)
  }

  return res.json()
}

export async function syncUserToStrapi(user: UserSchema, authProvider: string = "local"): Promise<StrapiUser | null> {
  if (!user.email) return null

  const existing = await findStrapiUserByEmail(user.email)

  if (existing) {
    return strapiRequest<{ data: StrapiUser }>(`/users/${existing.documentId}`, {
      method: "PUT",
      body: JSON.stringify({
        data: {
          name: user.profile?.name || user.email.split("@")[0],
          insforgeId: user.id,
          authProvider,
          avatarUrl: user.profile?.avatar_url || null,
        },
      }),
    }).then((r) => r.data)
  }

  return strapiRequest<{ data: StrapiUser }>("/users", {
    method: "POST",
    body: JSON.stringify({
      data: {
        email: user.email,
        name: user.profile?.name || user.email.split("@")[0],
        insforgeId: user.id,
        authProvider,
        avatarUrl: user.profile?.avatar_url || null,
      },
    }),
  }).then((r) => r.data)
}

export async function findStrapiUserByEmail(email: string): Promise<StrapiUser | null> {
  const res = await strapiRequest<{ data: StrapiUser[] }>(
    `/users?filters[email][$eq]=${encodeURIComponent(email)}&populate=*`
  )
  return res.data?.[0] || null
}
