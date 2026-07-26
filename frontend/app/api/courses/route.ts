import { NextResponse } from "next/server";

const STRAPI_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

function extractMediaUrl(val: unknown): string | null {
  if (!val) return null;
  if (typeof val === "string") return val;
  if (typeof val === "object" && val !== null) {
    const obj = val as Record<string, unknown>;
    if ("url" in obj && typeof obj.url === "string") return obj.url;
    if (
      "attributes" in obj &&
      typeof obj.attributes === "object" &&
      obj.attributes !== null
    ) {
      const attrs = obj.attributes as Record<string, unknown>;
      if ("url" in attrs && typeof attrs.url === "string")
        return attrs.url;
    }
    if (
      "data" in obj &&
      typeof obj.data === "object" &&
      obj.data !== null
    ) {
      return extractMediaUrl(obj.data);
    }
  }
  if (Array.isArray(val) && val.length > 0) {
    return extractMediaUrl(val[0]);
  }
  return null;
}

export async function GET() {
  try {
    const res = await fetch(
      `${STRAPI_URL}/api/courses?populate=banner`,
      {
        headers: {
          "Content-Type": "application/json",
          ...(STRAPI_API_TOKEN
            ? { Authorization: `Bearer ${STRAPI_API_TOKEN}` }
            : {}),
        },
      },
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("Strapi courses error:", res.status, text);
      return NextResponse.json(
        { error: "Failed to fetch courses", details: text },
        { status: 500 },
      );
    }

    const json = await res.json();

    const mediaFields = [
      "banner",
      "icon",
      "image",
      "thumbnail",
      "cover",
      "course_image",
    ];
    const courses = (json.data || []).map(
      (course: Record<string, unknown>) => {
        let resolvedUrl: string | null = null;

        for (const field of mediaFields) {
          const url = extractMediaUrl(course[field]);
          if (url) {
            resolvedUrl = url;
            break;
          }
        }

        return { ...course, _resolvedImageUrl: resolvedUrl };
      },
    );

    if (courses.length > 0) {
      const first = courses[0] as Record<string, unknown>;
      console.log("[courses] all keys:", Object.keys(first));
      for (const field of mediaFields) {
        if (first[field] !== undefined && first[field] !== null) {
          console.log(
            `[courses] "${field}":`,
            JSON.stringify(first[field]).slice(0, 300),
          );
        }
      }
      const durationFields = [
        "duration",
        "estimated_duration",
        "time_duration",
        "length",
        "timeLength",
      ];
      for (const field of durationFields) {
        if (first[field] !== undefined && first[field] !== null) {
          console.log(
            `[courses] "${field}":`,
            JSON.stringify(first[field]).slice(0, 300),
          );
        }
      }
      console.log("[courses] resolved:", first._resolvedImageUrl);
    }

    return NextResponse.json({
      data: courses,
      _debug_first: courses[0] || null,
    });
  } catch (err) {
    console.error("Courses fetch error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
