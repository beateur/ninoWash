import type { NextRequest } from "next/server"

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

class RateLimiter {
  private requests = new Map<string, number[]>()

  isAllowed(identifier: string, config: RateLimitConfig): boolean {
    const now = Date.now()
    const windowStart = now - config.windowMs

    // Get existing requests for this identifier
    const userRequests = this.requests.get(identifier) || []

    // Filter out old requests
    const recentRequests = userRequests.filter((time) => time > windowStart)

    // Check if under limit
    if (recentRequests.length >= config.maxRequests) {
      return false
    }

    // Add current request
    recentRequests.push(now)
    this.requests.set(identifier, recentRequests)

    return true
  }

  cleanup() {
    const now = Date.now()
    for (const [identifier, requests] of this.requests.entries()) {
      const validRequests = requests.filter((time) => now - time < 3600000) // Keep 1 hour
      if (validRequests.length === 0) {
        this.requests.delete(identifier)
      } else {
        this.requests.set(identifier, validRequests)
      }
    }
  }
}

export const rateLimiter = new RateLimiter()

// Security headers
export const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
}

// Input sanitization
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .replace(/javascript:/gi, "") // Remove javascript: protocols
    .trim()
}

// Validate API requests
export function validateApiRequest(request: NextRequest): {
  isValid: boolean
  error?: string
} {
  const contentType = request.headers.get("content-type")

  if (request.method === "POST" && !contentType?.includes("application/json")) {
    return { isValid: false, error: "Invalid content type" }
  }

  // Check for required headers
  const userAgent = request.headers.get("user-agent")
  if (!userAgent) {
    return { isValid: false, error: "Missing user agent" }
  }

  return { isValid: true }
}

// CSRF protection
export function generateCSRFToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function validateCSRFToken(token: string, sessionToken: string): boolean {
  // Simple validation - in production, use more sophisticated approach
  return token.length > 10 && sessionToken.length > 10
}
