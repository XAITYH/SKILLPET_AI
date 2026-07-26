import { NextResponse } from "next/server"
import { verifyAuth, verifyEmailMatch } from "@/lib/api-auth"

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337"
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN

async function findAppUser(email: string) {
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
  const data = await res.json()
  return data.data?.[0] || null
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const user = await findAppUser(email)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const metadata = user.metadata || {}
    const subscription = metadata.subscription || null

    // Check if subscription is still active
    let isActive = false
    if (subscription && subscription.endDate) {
      isActive = new Date(subscription.endDate) > new Date()
    }

    return NextResponse.json({
      subscription: subscription
        ? { ...subscription, active: isActive }
        : null,
    })
  } catch (err) {
    console.error("Get subscription error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (auth.response) return auth.response

    const body = await request.json()
    const { email, plan } = body

    if (!email || !plan) {
      return NextResponse.json({ error: "Email and plan are required" }, { status: 400 })
    }

    const emailMismatch = verifyEmailMatch(auth.user.email, email)
    if (emailMismatch) return emailMismatch

    if (plan !== "monthly" && plan !== "yearly") {
      return NextResponse.json({ error: "Plan must be 'monthly' or 'yearly'" }, { status: 400 })
    }

    const user = await findAppUser(email)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const metadata = user.metadata || {}
    const now = new Date()
    const endDate = new Date(now)

    if (plan === "monthly") {
      endDate.setMonth(endDate.getMonth() + 1)
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1)
    }

    const subscription = {
      plan,
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
    }

    const updatedMetadata = { ...metadata, subscription }

    const updateRes = await fetch(`${STRAPI_URL}/api/app-users/${user.documentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(STRAPI_API_TOKEN ? { Authorization: `Bearer ${STRAPI_API_TOKEN}` } : {}),
      },
      body: JSON.stringify({ data: { metadata: updatedMetadata } }),
    })

    if (!updateRes.ok) {
      return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      subscription: { ...subscription, active: true },
    })
  } catch (err) {
    console.error("Create subscription error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (auth.response) return auth.response

    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const emailMismatch = verifyEmailMatch(auth.user.email, email)
    if (emailMismatch) return emailMismatch

    const user = await findAppUser(email)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const metadata = user.metadata || {}
    const updatedMetadata = { ...metadata, subscription: null }

    const updateRes = await fetch(`${STRAPI_URL}/api/app-users/${user.documentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(STRAPI_API_TOKEN ? { Authorization: `Bearer ${STRAPI_API_TOKEN}` } : {}),
      },
      body: JSON.stringify({ data: { metadata: updatedMetadata } }),
    })

    if (!updateRes.ok) {
      return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Cancel subscription error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
