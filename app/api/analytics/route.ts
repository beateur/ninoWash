import { type NextRequest, NextResponse } from "next/server"
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
 * GET endpoint removed - was admin-only analytics
 * All admin functionality removed as per project separation
 */
