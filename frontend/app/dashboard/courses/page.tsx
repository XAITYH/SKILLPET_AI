"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { BookOpen, ArrowRight, Loader2, Clock } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337"

interface EnrolledCourse {
  documentId: string
  title: string
  slug: string
  description: string
  progress: number
  imageUrl: string | null
}

function extractMediaUrl(val: unknown): string | null {
  if (!val) return null
  if (typeof val === "string") return val
  if (typeof val === "object" && val !== null) {
    const obj = val as Record<string, unknown>
    if ("url" in obj && typeof obj.url === "string") return obj.url
    if ("attributes" in obj && typeof obj.attributes === "object" && obj.attributes !== null) {
      const attrs = obj.attributes as Record<string, unknown>
      if ("url" in attrs && typeof attrs.url === "string") return attrs.url
    }
    if ("data" in obj && typeof obj.data === "object" && obj.data !== null) {
      return extractMediaUrl(obj.data)
    }
  }
  if (Array.isArray(val) && val.length > 0) {
    return extractMediaUrl(val[0])
  }
  return null
}

function getStrapiMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined
  if (url.startsWith("http")) return url
  return `${STRAPI_URL}${url}`
}

function formatDuration(minutes: string): string {
  const mins = parseInt(minutes, 10)
  if (isNaN(mins)) return minutes
  const hrs = Math.floor(mins / 60)
  const remaining = mins % 60
  if (hrs === 0) return `${remaining} mins`
  if (remaining === 0) return `${hrs} hrs`
  return `${hrs} hrs, ${remaining} mins`
}

export default function CoursesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [courses, setCourses] = useState<EnrolledCourse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchEnrolledCourses() {
      if (!user?.email) {
        setLoading(false)
        return
      }

      try {
        // Fetch enrollments
        const enrollRes = await fetch(
          `/api/user-course-program?email=${encodeURIComponent(user.email)}`
        )
        
        if (!enrollRes.ok) {
          setLoading(false)
          return
        }

        const enrollData = await enrollRes.json()
        const enrollments = enrollData.data || []

        if (enrollments.length === 0) {
          setLoading(false)
          return
        }

        // Fetch course details and calculate real progress for each enrollment
        const coursesWithProgress: EnrolledCourse[] = await Promise.all(
          enrollments.map(async (enrollment: { course?: { documentId?: string }; progress?: number }) => {
            const courseDocId = enrollment.course?.documentId
            if (!courseDocId) return null

            try {
              const [courseRes, chaptersRes, progressRes] = await Promise.all([
                fetch(`/api/courses?filters[documentId][$eq]=${courseDocId}`),
                fetch(`/api/chapters?filters[course][documentId][$eq]=${courseDocId}&sort=order:asc`),
                user?.email ? fetch(`/api/user-progress?email=${encodeURIComponent(user.email)}&courseDocumentId=${courseDocId}`) : Promise.resolve(null),
              ])
              
              if (!courseRes.ok) return null

              const courseData = await courseRes.json()
              const course = courseData.data?.[0]
              
              if (!course) return null

              // Extract image URL
              let imageUrl: string | null = null
              const mediaFields = ["banner", "icon", "image", "thumbnail", "cover", "course_image"]
              for (const field of mediaFields) {
                const url = extractMediaUrl(course[field])
                if (url) {
                  imageUrl = getStrapiMediaUrl(url) || null
                  break
                }
              }

              // Get duration
              const duration = (course.duration as string) || 
                (course.estimated_duration as string) || 
                (course.time_duration as string) || 
                (course.timeLength as string) || 
                (course.length as string) || ""

              // Calculate real progress from completed chapters
              let realProgress = enrollment.progress ?? 0
              try {
                const chaptersData = chaptersRes.ok ? await chaptersRes.json() : { data: [] }
                const totalChapters = (chaptersData.data || []).length

                if (progressRes && progressRes.ok) {
                  const progressData = await progressRes.json()
                  if (progressData.data) {
                    const raw = progressData.data.completedChapters
                    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
                    const completedChapters = Array.isArray(parsed) ? parsed : []
                    realProgress = totalChapters > 0 ? Math.round((completedChapters.length / totalChapters) * 100) : 0
                  }
                }
              } catch {
                // Keep enrollment.progress as fallback
              }

              return {
                documentId: course.documentId,
                title: course.title || "",
                slug: course.slug || course.documentId,
                description: course.description || "",
                progress: realProgress,
                imageUrl,
              }
            } catch {
              return null
            }
          })
        )

        setCourses(coursesWithProgress.filter((c): c is EnrolledCourse => c !== null))
      } catch {
        console.error("Failed to fetch enrolled courses")
      } finally {
        setLoading(false)
      }
    }

    fetchEnrolledCourses()
  }, [user?.email])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">My Courses</h1>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-green-500 animate-spin" />
        </div>
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">My Courses</h1>
        <div className="rounded-2xl bg-[#111] border border-white/5 p-8 flex flex-col items-center justify-center text-center">
          <BookOpen className="h-12 w-12 text-zinc-600 mb-4" />
          <p className="text-zinc-400">No courses yet. Start learning from the dashboard!</p>
          <button
            type="button"
            onClick={() => router.push("/dashboard/explore-courses")}
            className="mt-4 px-6 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors cursor-pointer"
          >
            Explore Courses
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">My Courses</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map((course) => (
          <div
            key={course.documentId}
            className="rounded-2xl bg-[#111] border border-white/5 overflow-hidden flex flex-col hover:border-white/10 transition-colors"
          >
            <div className="relative w-full h-48 overflow-hidden bg-[#1a1a1a]">
              {course.imageUrl ? (
                <Image
                  src={course.imageUrl}
                  alt={course.title}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-zinc-600 text-sm">No image</span>
                </div>
              )}
            </div>

            <div className="p-4 flex flex-col flex-1">
              <h3 className="text-white font-semibold text-base mb-2">
                {course.title}
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-4 line-clamp-2 flex-1">
                {course.description}
              </p>

              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-zinc-300 mb-1.5">
                  <span>Progress</span>
                  <span>{course.progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-green-400"
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => router.push(`/courses/${course.slug || course.documentId}`)}
                className="w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer bg-green-600 text-white hover:bg-green-500"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
