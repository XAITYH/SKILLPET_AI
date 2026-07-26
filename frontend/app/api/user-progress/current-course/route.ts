import { NextResponse } from "next/server";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ course: null });
    }

    const url = `${STRAPI_URL}/api/user-progresses?populate[0]=courses&populate[1]=app_user`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      },
    });

    if (!res.ok) {
      return NextResponse.json({ course: null });
    }

    const data = await res.json();
    const records = (data.data || []).filter((item: { app_user?: { email?: string } }) => {
      return item.app_user?.email === email;
    });

    if (records.length === 0) {
      return NextResponse.json({ course: null });
    }

    const sorted = records.sort((a: { lastActive?: string }, b: { lastActive?: string }) => {
      const dateA = a.lastActive ? new Date(a.lastActive).getTime() : 0;
      const dateB = b.lastActive ? new Date(b.lastActive).getTime() : 0;
      return dateB - dateA;
    });

    const mostRecent = sorted[0];
    const course = mostRecent.courses?.[0];

    if (!course) {
      return NextResponse.json({ course: null });
    }

    // Parse completedChapters
    let completedChapters: string[] = [];
    try {
      const parsed = typeof mostRecent.completedChapters === "string"
        ? JSON.parse(mostRecent.completedChapters)
        : mostRecent.completedChapters;
      completedChapters = Array.isArray(parsed) ? parsed : [];
    } catch {
      completedChapters = [];
    }

    // Fetch chapters for this course to find the next one
    let nextChapter = null;
    try {
      const chaptersRes = await fetch(
        `${STRAPI_URL}/api/chapters?filters[course][documentId][$eq]=${course.documentId}&sort=order:asc`,
        {
          headers: {
            Authorization: `Bearer ${STRAPI_API_TOKEN}`,
          },
        }
      );

      if (chaptersRes.ok) {
        const chaptersData = await chaptersRes.json();
        const chapters = chaptersData.data || [];

        // Find first non-completed chapter
        nextChapter = chapters.find(
          (ch: { documentId: string }) => !completedChapters.includes(ch.documentId)
        ) || chapters[0] || null;

        if (nextChapter) {
          nextChapter = {
            documentId: nextChapter.documentId,
            title: nextChapter.title,
            order: nextChapter.order,
          };
        }
      }
    } catch {
      // Chapters fetch failed, continue without nextChapter
    }

    return NextResponse.json({
      course: {
        documentId: course.documentId,
        title: course.title,
        slug: course.slug,
        description: course.description,
      },
      progress: {
        gems: mostRecent.gems || 0,
        hearts: mostRecent.hearts || 10,
        streakDays: mostRecent.streakDays || 0,
        completedChapters,
        lastActive: mostRecent.lastActive,
      },
      nextChapter,
    });
  } catch (err) {
    console.error("Get current course error:", err);
    return NextResponse.json({ course: null });
  }
}
