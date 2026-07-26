import { NextResponse } from "next/server"
import { verifyAuth, verifyEmailMatch } from "@/lib/api-auth"

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337"
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN

export async function POST(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (auth.response) return auth.response

    const body = await request.json()
    const { email, characterFileName, characterName } = body

    if (!email || !characterFileName || !characterName) {
      return NextResponse.json({ error: "email, characterFileName, and characterName are required" }, { status: 400 })
    }

    const emailMismatch = verifyEmailMatch(auth.user.email, email)
    if (emailMismatch) return emailMismatch

    let existingUser = await findAppUserByEmail(email)

    if (!existingUser) {
      const created = await fetch(`${STRAPI_URL}/api/app-users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(STRAPI_API_TOKEN ? { Authorization: `Bearer ${STRAPI_API_TOKEN}` } : {}),
        },
        body: JSON.stringify({
          data: {
            email,
            displayName: email.split("@")[0],
            characterFileName,
            characterName,
            authProviders: ["local"],
          },
        }),
      })

      if (!created.ok) {
        const errText = await created.text()
        console.error("Strapi create error:", errText)
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
      }

      const createdData = await created.json()
      return NextResponse.json({
        success: true,
        character: { fileName: characterFileName, name: characterName },
        user: createdData.data,
      })
    }

    const updateRes = await fetch(`${STRAPI_URL}/api/app-users/${existingUser.documentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(STRAPI_API_TOKEN ? { Authorization: `Bearer ${STRAPI_API_TOKEN}` } : {}),
      },
      body: JSON.stringify({
        data: {
          characterFileName,
          characterName,
        },
      }),
    })

    if (!updateRes.ok) {
      const errText = await updateRes.text()
      console.error("Strapi update error:", errText)
      return NextResponse.json({ error: "Failed to save character" }, { status: 500 })
    }

    const updatedData = await updateRes.json()

    return NextResponse.json({
      success: true,
      character: { fileName: characterFileName, name: characterName },
      user: updatedData.data,
    })
  } catch (err) {
    console.error("Select character error:", err)
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
