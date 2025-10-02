/**
 * Analytics event tracking with PII protection
 */

import { sanitizeForAnalytics } from "@/lib/utils/data-sanitization"

export type AnalyticsEvent =
  | "booking_created"
  | "booking_completed"
  | "subscription_started"
  | "subscription_canceled"
  | "payment_succeeded"
  | "payment_failed"
  | "user_registered"
  | "user_login"

export interface AnalyticsEventData {
  event: AnalyticsEvent
  userId?: string
  properties?: Record<string, any>
  timestamp?: Date
}

/**
 * Track analytics event (sanitized)
 */
export async function trackEvent(data: AnalyticsEventData): Promise<void> {
  try {
    // Sanitize properties to remove PII
    const sanitizedProperties = data.properties ? sanitizeForAnalytics(data.properties) : {}

    const eventData = {
      event: data.event,
      userId: data.userId,
      properties: sanitizedProperties,
      timestamp: data.timestamp || new Date(),
    }

    // Log for debugging (in production, send to analytics service)
    console.log("[v0] Analytics event:", eventData)

    // TODO: Send to analytics service (e.g., Mixpanel, Amplitude, PostHog)
    // await fetch('/api/analytics', {
    //   method: 'POST',
    //   body: JSON.stringify(eventData)
    // })
  } catch (error) {
    console.error("[v0] Error tracking analytics event:", error)
  }
}

/**
 * Track page view
 */
export async function trackPageView(path: string, userId?: string): Promise<void> {
  await trackEvent({
    event: "user_login", // Reuse existing event type
    userId,
    properties: {
      path,
      type: "page_view",
    },
  })
}
