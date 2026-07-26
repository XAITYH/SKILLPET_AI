import { NextResponse } from "next/server";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

function computeXP(metadata: Record<string, unknown>): number {
  const gems = (metadata.gems as number) || 0;
  const maxStreak = (metadata.maxStreak as number) || 0;
  const dailyGoalsCompleted = (metadata.dailyGoalsCompleted as number) || 0;
  const weeklyGoalsCompleted = (metadata.weeklyGoalsCompleted as number) || 0;
  return gems + maxStreak * 5 + dailyGoalsCompleted * 10 + weeklyGoalsCompleted * 25;
}

export async function GET() {
  try {
    const res = await fetch(`${STRAPI_URL}/api/app-users?populate=*`, {
      headers: {
        "Content-Type": "application/json",
        ...(STRAPI_API_TOKEN ? { Authorization: `Bearer ${STRAPI_API_TOKEN}` } : {}),
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }

    const data = await res.json();
    const users = (data.data || [])
      .filter((u: { metadata?: Record<string, unknown>; displayName?: string }) => u.displayName)
      .map((u: {
        displayName: string;
        characterFileName?: string;
        characterName?: string;
        metadata?: Record<string, unknown>;
      }) => {
        const metadata = u.metadata || {};
        return {
          displayName: u.displayName,
          characterFileName: u.characterFileName || null,
          characterName: u.characterName || null,
          gems: (metadata.gems as number) || 0,
          maxStreak: (metadata.maxStreak as number) || 0,
          xp: computeXP(metadata),
        };
      })
      .sort((a: { xp: number }, b: { xp: number }) => b.xp - a.xp)
      .map((u: { displayName: string; characterFileName: string | null; characterName: string | null; gems: number; maxStreak: number; xp: number }, i: number) => ({
        rank: i + 1,
        ...u,
      }));

    return NextResponse.json({ data: users });
  } catch (err) {
    console.error("Leaderboard error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
