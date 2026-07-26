import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { updateSession } from "@insforge/sdk/ssr"
import type { CookieStore } from "@insforge/sdk/ssr/middleware"

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request })

  await updateSession({
    requestCookies: request.cookies as unknown as CookieStore,
    responseCookies: response.cookies as unknown as CookieStore,
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_BASE_URL,
  })

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
