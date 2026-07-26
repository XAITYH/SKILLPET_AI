import { NextResponse } from "next/server";
import { verifyAuth, verifyEmailMatch } from "@/lib/api-auth";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const courseDocumentId = searchParams.get("courseDocumentId");

    if (!email) {
      return NextResponse.json({ data: null });
    }

    const url = `${STRAPI_URL}/api/user-progresses?populate[0]=courses&populate[1]=app_user`;
    
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      },
    });

    if (!res.ok) {
      return NextResponse.json({ data: null });
    }

    const data = await res.json();
    
    const userRecords = (data.data || []).filter((item: { app_user?: { email?: string } }) => {
      return item.app_user?.email === email;
    });
    
    if (courseDocumentId) {
      const filtered = userRecords.find((item: { courses?: Array<{ documentId?: string }> }) => {
        return item.courses?.some((c: { documentId?: string }) => c.documentId === courseDocumentId);
      });
      return NextResponse.json({ data: filtered || null });
    }
    
    return NextResponse.json({ data: userRecords[0] || null });
  } catch {
    return NextResponse.json({ data: null });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await verifyAuth(request);
    if (auth.response) return auth.response;

    const body = await request.json();
    const { email, courseDocumentId, completedChapterDocumentId, gems, hearts, streakDays } = body;

    if (!email || !courseDocumentId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const emailMismatch = verifyEmailMatch(auth.user.email, email);
    if (emailMismatch) return emailMismatch;

    const existingUrl = `${STRAPI_URL}/api/user-progresses?populate[0]=courses&populate[1]=app_user`;
    
    const existingRes = await fetch(existingUrl, {
      headers: {
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      },
    });

    const existingData = await existingRes.json();
    const existing = (existingData.data || []).find((item: { app_user?: { email?: string }; courses?: Array<{ documentId?: string }> }) => {
      return item.app_user?.email === email && item.courses?.some((c: { documentId?: string }) => c.documentId === courseDocumentId);
    });

    let completedChapters: string[] = [];
    try {
      if (existing?.completedChapters) {
        const parsed = typeof existing.completedChapters === 'string' 
          ? JSON.parse(existing.completedChapters) 
          : existing.completedChapters;
        completedChapters = Array.isArray(parsed) ? parsed : [];
      }
    } catch {
      completedChapters = [];
    }
    
    if (completedChapterDocumentId && !completedChapters.includes(completedChapterDocumentId)) {
      completedChapters.push(completedChapterDocumentId);
    }

    let appUserDocId = existing?.app_user?.documentId;
    let courseDocId = existing?.courses?.[0]?.documentId;

    if (!existing) {
      const userUrl = `${STRAPI_URL}/api/app-users?filters[email][$eq]=${encodeURIComponent(email)}`;
      const userRes = await fetch(userUrl, {
        headers: { Authorization: `Bearer ${STRAPI_API_TOKEN}` },
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        appUserDocId = userData.data?.[0]?.documentId;
      }

      const courseUrl = `${STRAPI_URL}/api/courses?filters[documentId][$eq]=${encodeURIComponent(courseDocumentId)}`;
      const courseRes = await fetch(courseUrl, {
        headers: { Authorization: `Bearer ${STRAPI_API_TOKEN}` },
      });
      if (courseRes.ok) {
        const courseData = await courseRes.json();
        courseDocId = courseData.data?.[0]?.documentId;
      }
    }

    if (!appUserDocId || !courseDocId) {
      return NextResponse.json({ error: "User or course not found" }, { status: 404 });
    }

    const scalarFields = {
      completedChapters: JSON.stringify(completedChapters),
      gems: gems !== undefined ? gems : (existing?.gems ?? 0),
      hearts: hearts !== undefined ? hearts : (existing?.hearts ?? 10),
      streakDays: streakDays !== undefined ? streakDays : (existing?.streakDays ?? 0),
      lastActive: new Date().toISOString(),
    };

    let res;
    if (existing) {
      // PUT — omit relations; Strapi v5 rejects them on update
      res = await fetch(`${STRAPI_URL}/api/user-progresses/${existing.documentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${STRAPI_API_TOKEN}`,
        },
        body: JSON.stringify({ data: scalarFields }),
      });
    } else {
      res = await fetch(`${STRAPI_URL}/api/user-progresses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${STRAPI_API_TOKEN}`,
        },
        body: JSON.stringify({
          data: {
            ...scalarFields,
            app_user: appUserDocId,
            courses: [courseDocId],
          },
        }),
      });
    }

    if (!res.ok) {
      const errBody = await res.text().catch(() => "Unknown error");
      console.error("Strapi save progress error:", res.status, errBody);
      return NextResponse.json({ error: "Failed to save progress", strapiStatus: res.status, strapiBody: errBody }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
