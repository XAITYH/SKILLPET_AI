export type CourseAccessType = "free" | "freemium" | "paid"

/**
 * Map of course documentId → access type.
 * Populate this with real course documentIds from Strapi.
 * Default for unconfigured courses: "free"
 */
const COURSE_ACCESS_MAP: Record<string, CourseAccessType> = {}

export function getCourseAccessType(courseDocumentId: string): CourseAccessType {
  return COURSE_ACCESS_MAP[courseDocumentId] || "free"
}

export function canAccessChapter(
  accessType: CourseAccessType,
  chapterIndex: number,
  hasActiveSubscription: boolean,
): boolean {
  if (accessType === "free") return true
  if (hasActiveSubscription) return true
  if (accessType === "freemium" && chapterIndex < 3) return true
  return false
}

export function getAccessTypeLabel(accessType: CourseAccessType): string {
  switch (accessType) {
    case "free":
      return "Free"
    case "freemium":
      return "Free Preview"
    case "paid":
      return "Pro"
    default:
      return "Free"
  }
}

export function getAccessTypeColor(accessType: CourseAccessType): string {
  switch (accessType) {
    case "free":
      return "bg-emerald-500/10 text-emerald-400"
    case "freemium":
      return "bg-blue-500/10 text-blue-400"
    case "paid":
      return "bg-purple-500/10 text-purple-400"
    default:
      return "bg-emerald-500/10 text-emerald-400"
  }
}
