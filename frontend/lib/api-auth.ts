import { NextResponse } from "next/server"

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337"

export interface AuthenticatedUser {
  id: number
  email: string
  username?: string
}

/**
 * Verify the Strapi JWT from the Authorization header and return the authenticated user.
 * Returns null and sends a 401 response if authentication fails.
 */
export async function verifyAuth(request: Request): Promise<
  { user: AuthenticatedUser; response?: never } | { user?: never; response: NextResponse }
> {
  const authHeader = request.headers.get("Authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      response: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      ),
    }
  }

  const token = authHeader.slice(7)

  try {
    const res = await fetch(`${STRAPI_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) {
      return {
        response: NextResponse.json(
          { error: "Invalid or expired token" },
          { status: 401 }
        ),
      }
    }

    const user = await res.json()
    return { user: { id: user.id, email: user.email, username: user.username } }
  } catch {
    return {
      response: NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      ),
    }
  }
}

/**
 * Verify the authenticated user's email matches the expected email.
 * Returns a 403 response if they don't match.
 */
export function verifyEmailMatch(
  authenticatedEmail: string,
  requestedEmail: string
): NextResponse | null {
  if (authenticatedEmail !== requestedEmail) {
    return NextResponse.json(
      { error: "You can only modify your own account" },
      { status: 403 }
    )
  }
  return null
}
