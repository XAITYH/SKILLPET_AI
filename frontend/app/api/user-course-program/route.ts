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
      return NextResponse.json({ data: [] });
    }

    const url = `${STRAPI_URL}/api/user-course-programs?populate=course&populate=appUser`;
    
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      },
    });

    if (!res.ok) {
      return NextResponse.json({ data: [] });
    }

    const data = await res.json();
    
    const filtered = (data.data || []).filter((item: { appUser?: { email?: string } }) => {
      return item.appUser?.email === email;
    });
    
    if (courseDocumentId) {
      return NextResponse.json({
        data: filtered.filter((item: { course?: { documentId?: string } }) => {
          return item.course?.documentId === courseDocumentId;
        })
      });
    }
    
    return NextResponse.json({ data: filtered });
  } catch {
    return NextResponse.json({ data: [] });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await verifyAuth(request);
    if (auth.response) return auth.response;

    const body = await request.json();
    const { email, courseDocumentId, progress } = body;

    if (!email || !courseDocumentId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const emailMismatch = verifyEmailMatch(auth.user.email, email);
    if (emailMismatch) return emailMismatch;

    const existingUrl = `${STRAPI_URL}/api/user-course-programs?populate=course&populate=appUser`;
    
    const existingRes = await fetch(existingUrl, {
      headers: {
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      },
    });

    const existingData = await existingRes.json();
    
    const existing = (existingData.data || []).find((item: { appUser?: { email?: string }; course?: { documentId?: string } }) => {
      return item.appUser?.email === email && item.course?.documentId === courseDocumentId;
    });

    if (existing) {
      if (progress !== undefined) {
        const updateRes = await fetch(`${STRAPI_URL}/api/user-course-programs/${existing.documentId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${STRAPI_API_TOKEN}`,
          },
          body: JSON.stringify({ data: { progress } }),
        });
        
        if (updateRes.ok) {
          const updated = await updateRes.json();
          return NextResponse.json(updated.data || updated);
        }
      }
      return NextResponse.json(existing);
    }

    const courseUrl = `${STRAPI_URL}/api/courses?filters[documentId][$eq]=${encodeURIComponent(courseDocumentId)}`;
    const courseRes = await fetch(courseUrl, {
      headers: {
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      },
    });
    const courseData = await courseRes.json();
    const courseId = courseData.data?.[0]?.id;

    const userUrl = `${STRAPI_URL}/api/app-users?filters[email][$eq]=${encodeURIComponent(email)}`;
    const userRes = await fetch(userUrl, {
      headers: {
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      },
    });
    const userData = await userRes.json();
    const userId = userData.data?.[0]?.id;

    if (!courseId || !userId) {
      return NextResponse.json({ error: "Course or user not found" }, { status: 404 });
    }

    const createUrl = `${STRAPI_URL}/api/user-course-programs`;
    const createRes = await fetch(createUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      },
      body: JSON.stringify({
        data: {
          appUser: userId,
          course: courseId,
          progress: progress || 0,
        },
      }),
    });

    if (!createRes.ok) {
      return NextResponse.json({ error: "Failed to create enrollment" }, { status: 500 });
    }

    const data = await createRes.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
