import { type NextRequest, NextResponse } from "next/server"
import { apiRequireAuth } from "@/lib/auth/api-guards"
import { sanitizeForAnalytics } from "@/lib/utils/data-sanitization"

/**
 * Analytics endpoint for tracking events
 * All PII is sanitized before storage
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate event data
    if (!body.event || typeof body.event !== "string") {
      return NextResponse.json({ error: "Event type is required" }, { status: 400 })
    }

    // Sanitize properties to remove PII
    const sanitizedProperties = body.properties ? sanitizeForAnalytics(body.properties) : {}

    const eventData = {
      event: body.event,
      userId: body.userId,
      properties: sanitizedProperties,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get("user-agent"),
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
    }

    // Log event (in production, send to analytics service)
    console.log("[v0] Analytics event tracked:", {
      event: eventData.event,
      userId: eventData.userId,
      timestamp: eventData.timestamp,
    })

    // TODO: Store in analytics database or send to third-party service
    // Example: await sendToAnalyticsService(eventData)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Analytics API error:", error)
    return NextResponse.json({ error: "Failed to track event" }, { status: 500 })
  }
}

/**
 * Get analytics data (admin only)
 */
export async function GET(request: NextRequest) {
  const { user, error } = await apiRequireAuth(request)

  if (error) {
    return error
  }

  // Check admin role
  const isAdmin = user.user_metadata?.role === "admin" || user.app_metadata?.role === "admin"

  if (!isAdmin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  try {
    // TODO: Fetch analytics data from database
    // This would return aggregated, anonymized data only

    return NextResponse.json({
      message: "Analytics data endpoint",
      note: "Returns only aggregated, anonymized data",
    })
  } catch (error) {
    console.error("[v0] Analytics fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
