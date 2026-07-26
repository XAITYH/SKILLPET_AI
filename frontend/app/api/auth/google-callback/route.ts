import { NextResponse } from "next/server"

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337"
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN

const TEMP_PASSWORD_PREFIX = "Sk1llP3t_G00gl3_"

function generateTempPassword(): string {
  return TEMP_PASSWORD_PREFIX + Math.random().toString(36).slice(2, 10)
}

function decodeIdToken(token: string): { email?: string; name?: string; sub?: string } | null {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    return JSON.parse(Buffer.from(parts[1]!, "base64url").toString("utf-8"))
  } catch {
    return null
  }
}

async function findStrapiUserByEmail(email: string) {
  const res = await fetch(
    `${STRAPI_URL}/api/users?filters[email][$eq]=${encodeURIComponent(email)}`,
    {
      headers: {
        "Content-Type": "application/json",
        ...(STRAPI_API_TOKEN ? { Authorization: `Bearer ${STRAPI_API_TOKEN}` } : {}),
      },
    }
  )
  if (!res.ok) return null
  const users = await res.json()
  return users?.[0] || null
}

async function strapiLogin(email: string, password: string) {
  const res = await fetch(`${STRAPI_URL}/api/auth/local`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: email, password }),
  })
  if (!res.ok) return null
  return await res.json()
}

async function strapiRegister(username: string, email: string, password: string) {
  const res = await fetch(`${STRAPI_URL}/api/auth/local/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  })
  if (!res.ok) return null
  return await res.json()
}

async function updateUserPassword(userId: number | string, newPassword: string) {
  const res = await fetch(`${STRAPI_URL}/api/users/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(STRAPI_API_TOKEN ? { Authorization: `Bearer ${STRAPI_API_TOKEN}` } : {}),
    },
    body: JSON.stringify({ password: newPassword }),
  })
  return res.ok
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id_token, access_token } = body

    const payload = decodeIdToken(id_token || access_token)
    const email = payload?.email
    if (!email) {
      return NextResponse.json({ error: "Could not retrieve email from token" }, { status: 400 })
    }

    const existingUser = await findStrapiUserByEmail(email)

    if (existingUser) {
      if (existingUser.provider === "local") {
        const pw = TEMP_PASSWORD_PREFIX + "reset"
        await updateUserPassword(existingUser.id, pw)
        const loginResult = await strapiLogin(email, pw)
        if (loginResult) {
          return NextResponse.json({ jwt: loginResult.jwt, user: loginResult.user })
        }
      }

      const tmpPw = generateTempPassword()
      await updateUserPassword(existingUser.id, tmpPw)
      const loginResult = await strapiLogin(email, tmpPw)
      if (loginResult) {
        return NextResponse.json({ jwt: loginResult.jwt, user: loginResult.user })
      }
    }

    const newPw = generateTempPassword()
    const name = payload.name || email.split("@")[0]
    const registerResult = await strapiRegister(name, email, newPw)
    if (registerResult) {
      return NextResponse.json({ jwt: registerResult.jwt, user: registerResult.user })
    }

    return NextResponse.json({ error: "Failed to authenticate with Google" }, { status: 500 })
  } catch (err) {
    console.error("Google callback error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
