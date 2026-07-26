import { NextResponse } from "next/server";
import { verifyAuth, verifyEmailMatch } from "@/lib/api-auth";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

export async function POST(request: Request) {
  try {
    const auth = await verifyAuth(request);
    if (auth.response) return auth.response;

    const body = await request.json();
    const { email, gemsEarned, isNewStreak, streakDays } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const emailMismatch = verifyEmailMatch(auth.user.email, email);
    if (emailMismatch) return emailMismatch;

    // Fetch current user profile
    const userRes = await fetch(
      `${STRAPI_URL}/api/app-users?filters[email][$eq]=${encodeURIComponent(email)}&populate=*`,
      {
        headers: {
          "Content-Type": "application/json",
          ...(STRAPI_API_TOKEN ? { Authorization: `Bearer ${STRAPI_API_TOKEN}` } : {}),
        },
      }
    );

    if (!userRes.ok) {
      return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
    }

    const userData = await userRes.json();
    const user = userData.data?.[0];

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Read existing metadata
    const metadata = user.metadata || {};
    const currentGems = metadata.gems || 0;
    const currentWeeklyLessons = metadata.weeklyLessonsCompleted || 0;
    const activityHistory: string[] = Array.isArray(metadata.last7DaysActivity) ? metadata.last7DaysActivity : [];
    const dailyLessonCounts: Record<string, number> = metadata.dailyLessonCounts || {};
    const weeklyGoalTarget = metadata.weeklyGoal || 10;
    const DAILY_GOAL_THRESHOLD = 3;

    // Calculate today's date in YYYY-MM-DD format (local timezone)
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // Update activity history: add today, deduplicate, keep all (cap at 400 for safety ~1+ year)
    const updatedActivity = [...new Set([...activityHistory, today])].sort().slice(-400);

    // Update daily lesson counts
    const updatedDailyCounts = { ...dailyLessonCounts };
    updatedDailyCounts[today] = (updatedDailyCounts[today] || 0) + 1;

    // Calculate streak from activity history (consecutive days ending today or yesterday)
    function calculateStreak(activity: string[]): number {
      if (activity.length === 0) return 0;
      const sorted = [...activity].sort().reverse();
      const todayDate = new Date(today);
      const yesterdayDate = new Date(todayDate);
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterdayStr = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

      // Streak must include today or yesterday
      if (sorted[0] !== today && sorted[0] !== yesterdayStr) return 0;

      let count = 1;
      for (let i = 0; i < sorted.length - 1; i++) {
        const curr = new Date(sorted[i]);
        const prev = new Date(sorted[i + 1]);
        const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          count++;
        } else {
          break;
        }
      }
      return count;
    }
    const computedStreak = calculateStreak(updatedActivity);

    // Update max streak
    const currentMaxStreak = metadata.maxStreak || 0;
    const newMaxStreak = Math.max(currentMaxStreak, computedStreak);

    // Count daily goals completed: unique days with >= DAILY_GOAL_THRESHOLD lessons
    const dailyGoalsCompleted = Object.values(updatedDailyCounts).filter(
      (count) => count >= DAILY_GOAL_THRESHOLD,
    ).length;

    // Count weekly goals completed: weeks where total lessons >= weeklyGoalTarget
    // Group by ISO week (year-week)
    function getWeekKey(dateStr: string): string {
      const d = new Date(dateStr);
      const dayOfWeek = d.getDay();
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((dayOfWeek + 6) % 7));
      return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
    }
    const weekCounts: Record<string, number> = {};
    for (const [dateStr, count] of Object.entries(updatedDailyCounts)) {
      const weekKey = getWeekKey(dateStr);
      weekCounts[weekKey] = (weekCounts[weekKey] || 0) + count;
    }
    const weeklyGoalsCompleted = Object.values(weekCounts).filter(
      (count) => count >= weeklyGoalTarget,
    ).length;

    // Build updated metadata
    const updatedMetadata = {
      ...metadata,
      gems: currentGems + (gemsEarned || 0),
      streak: computedStreak,
      maxStreak: newMaxStreak,
      dailyGoalsCompleted,
      weeklyGoalsCompleted,
      weeklyLessonsCompleted: currentWeeklyLessons + 1,
      last7DaysActivity: updatedActivity,
      dailyLessonCounts: updatedDailyCounts,
      lastActive: new Date().toISOString(),
    };

    // Save back to Strapi
    const updateRes = await fetch(`${STRAPI_URL}/api/app-users/${user.documentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(STRAPI_API_TOKEN ? { Authorization: `Bearer ${STRAPI_API_TOKEN}` } : {}),
      },
      body: JSON.stringify({ data: { metadata: updatedMetadata } }),
    });

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      console.error("Failed to update user stats:", errText);
      return NextResponse.json({ error: "Failed to update stats" }, { status: 500 });
    }

    return NextResponse.json({ success: true, metadata: updatedMetadata });
  } catch (err) {
    console.error("Update user stats error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
