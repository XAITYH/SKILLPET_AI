import { NextResponse } from "next/server"
import { verifyAuth, verifyEmailMatch } from "@/lib/api-auth"

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337"
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const res = await fetch(
      `${STRAPI_URL}/api/app-users?filters[email][$eq]=${encodeURIComponent(email)}&populate=*`,
      {
        headers: {
          "Content-Type": "application/json",
          ...(STRAPI_API_TOKEN ? { Authorization: `Bearer ${STRAPI_API_TOKEN}` } : {}),
        },
      }
    )

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 })
    }

    const json = await res.json()
    const user = json.data?.[0] || null

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const character = user.characterName
      ? { fileName: user.characterFileName, name: user.characterName }
      : null

    // Fetch enrollments from user-course-program (filter in JS — Strapi v5 relation filters unreliable)
    let enrollments: Array<{ courseId: number; courseDocumentId: string; progress: number; enrolled: boolean }> = []
    try {
      const enrollRes = await fetch(
        `${STRAPI_URL}/api/user-course-programs?populate=course&populate=appUser`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(STRAPI_API_TOKEN ? { Authorization: `Bearer ${STRAPI_API_TOKEN}` } : {}),
          },
        }
      )
      if (enrollRes.ok) {
        const enrollData = await enrollRes.json()
        enrollments = (enrollData.data || [])
          .filter((item: { appUser?: { email?: string }; course?: unknown }) => {
            return item.appUser?.email === email && item.course;
          })
          .map((item: { course: { id: number; documentId: string }; progress?: number }) => ({
            courseId: item.course.id,
            courseDocumentId: item.course.documentId,
            progress: item.progress ?? 0,
            enrolled: true,
          }))
      }
    } catch {
      // Enrollment fetch failed, return empty
    }

    return NextResponse.json({
      documentId: user.documentId,
      email: user.email,
      displayName: user.displayName,
      character,
      metadata: user.metadata || null,
      enrollments,
    })
  } catch (err) {
    console.error("User profile error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (auth.response) return auth.response

    const body = await request.json()
    const { email, weeklyGoal, displayName } = body

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const emailMismatch = verifyEmailMatch(auth.user.email, email)
    if (emailMismatch) return emailMismatch

    // Find user
    const userRes = await fetch(
      `${STRAPI_URL}/api/app-users?filters[email][$eq]=${encodeURIComponent(email)}&populate=*`,
      {
        headers: {
          "Content-Type": "application/json",
          ...(STRAPI_API_TOKEN ? { Authorization: `Bearer ${STRAPI_API_TOKEN}` } : {}),
        },
      }
    )

    if (!userRes.ok) {
      return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
    }

    const userData = await userRes.json()
    const user = userData.data?.[0]

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Build update payload
    const updateData: Record<string, unknown> = {}
    if (displayName !== undefined) {
      updateData.displayName = displayName
    }
    if (weeklyGoal !== undefined) {
      const metadata = user.metadata || {}
      updateData.metadata = { ...metadata, weeklyGoal }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const updateRes = await fetch(`${STRAPI_URL}/api/app-users/${user.documentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(STRAPI_API_TOKEN ? { Authorization: `Bearer ${STRAPI_API_TOKEN}` } : {}),
      },
      body: JSON.stringify({ data: updateData }),
    })

    if (!updateRes.ok) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Update profile error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
