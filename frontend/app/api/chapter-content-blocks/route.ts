import { NextResponse } from "next/server";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chapterDocumentId = searchParams.get("chapterDocumentId");

    if (!chapterDocumentId) {
      return NextResponse.json({ data: [] });
    }

    const url = `${STRAPI_URL}/api/chapter-content-blocks?filters[chapter][documentId][$eq]=${encodeURIComponent(chapterDocumentId)}&sort=order:asc`;
    
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      },
    });

    if (!res.ok) {
      return NextResponse.json({ data: [] });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ data: [] });
  }
}
