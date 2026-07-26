import { NextResponse } from "next/server"

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337"
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id: insforgeId, email, name, avatarUrl, authProvider, emailVerified, metadata } = body

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const existingUser = await findAppUserByEmail(email)

    const userData = {
      insforgeUserId: String(insforgeId),
      email,
      displayName: name || email.split("@")[0],
      avatarUrl: avatarUrl || null,
      emailVerified: emailVerified ?? false,
      authProviders: authProvider ? [authProvider] : ["local"],
      metadata: metadata || {},
      lastAuthenticatedAt: new Date().toISOString(),
    }

    if (existingUser) {
      const updated = await fetch(`${STRAPI_URL}/api/app-users/${existingUser.documentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(STRAPI_API_TOKEN ? { Authorization: `Bearer ${STRAPI_API_TOKEN}` } : {}),
        },
        body: JSON.stringify({ data: userData }),
      })

      if (!updated.ok) {
        const errText = await updated.text()
        console.error("Strapi update error:", errText)
        return NextResponse.json({ error: `Failed to update user: ${errText}` }, { status: 500 })
      }

      const updatedData = await updated.json()
      return NextResponse.json({ user: updatedData.data })
    }

    const created = await fetch(`${STRAPI_URL}/api/app-users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(STRAPI_API_TOKEN ? { Authorization: `Bearer ${STRAPI_API_TOKEN}` } : {}),
      },
      body: JSON.stringify({ data: userData }),
    })

    if (!created.ok) {
      const errText = await created.text()
      console.error("Strapi create error:", errText)
      return NextResponse.json({ error: `Failed to create user: ${errText}` }, { status: 500 })
    }

    const createdData = await created.json()
    return NextResponse.json({ user: createdData.data })
  } catch (err) {
    console.error("Sync user error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function findAppUserByEmail(email: string) {
  const res = await fetch(
    `${STRAPI_URL}/api/app-users?filters[email][$eq]=${encodeURIComponent(email)}&populate=*`,
    {
      headers: {
        "Content-Type": "application/json",
        ...(STRAPI_API_TOKEN ? { Authorization: `Bearer ${STRAPI_API_TOKEN}` } : {}),
      },
    }
  )

  if (!res.ok) return null

  const json = await res.json()
  return json.data?.[0] || null
}
