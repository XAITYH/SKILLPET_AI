const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337"

/**
 * Client-side fetch wrapper that automatically includes the Strapi JWT token.
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = typeof window !== "undefined" ? localStorage.getItem("strapi_token") : null

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  return fetch(url, { ...options, headers })
}

/**
 * Client-side fetch for Strapi API directly (not through Next.js API routes).
 */
export async function strapiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = typeof window !== "undefined" ? localStorage.getItem("strapi_token") : null

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  return fetch(`${STRAPI_URL}${path}`, { ...options, headers })
}
