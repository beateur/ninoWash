import { NextResponse } from "next/server"

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
}

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(config: RateLimitConfig) {
  return async (req: Request, identifier: string) => {
    const now = Date.now()
    const key = `${identifier}:${req.url}`

    // Get or create rate limit entry
    let entry = rateLimitStore.get(key)

    if (!entry || now > entry.resetAt) {
      // Create new window
      entry = {
        count: 0,
        resetAt: now + config.windowMs,
      }
      rateLimitStore.set(key, entry)
    }

    // Increment counter
    entry.count++

    // Check if limit exceeded
    if (entry.count > config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
      return NextResponse.json(
        { error: "Too many requests", retryAfter },
        {
          status: 429,
          headers: {
            "Retry-After": retryAfter.toString(),
            "X-RateLimit-Limit": config.maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": entry.resetAt.toString(),
          },
        },
      )
    }

    // Return remaining requests
    return {
      remaining: config.maxRequests - entry.count,
      resetAt: entry.resetAt,
    }
  }
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key)
    }
  }
}, 60 * 1000) // Every minute
