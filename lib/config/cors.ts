/**
 * CORS configuration for API routes
 */

export const CORS_CONFIG = {
  // Allowed origins (production and development)
  allowedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    process.env.NEXT_PUBLIC_ADMIN_URL || "",
    process.env.PRODUCTION_URL || "",
    process.env.STAGING_URL || "",
  ].filter(Boolean),

  // Allowed HTTP methods
  allowedMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  // Allowed headers
  allowedHeaders: [
    "X-CSRF-Token",
    "X-Requested-With",
    "Accept",
    "Accept-Version",
    "Content-Length",
    "Content-MD5",
    "Content-Type",
    "Date",
    "X-Api-Version",
    "Authorization",
  ],

  // Exposed headers
  exposedHeaders: ["X-Request-Id", "X-Response-Time"],

  // Allow credentials (cookies, authorization headers)
  credentials: true,

  // Preflight cache duration (24 hours)
  maxAge: 86400,
}

/**
 * Check if origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false

  // Allow localhost in development
  if (process.env.NODE_ENV === "development" && origin.includes("localhost")) {
    return true
  }

  return CORS_CONFIG.allowedOrigins.some((allowed) => origin === allowed || origin.startsWith(allowed))
}

/**
 * Get CORS headers for a request
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {}

  if (isOriginAllowed(origin)) {
    headers["Access-Control-Allow-Origin"] = origin!
    headers["Access-Control-Allow-Credentials"] = "true"
    headers["Access-Control-Allow-Methods"] = CORS_CONFIG.allowedMethods.join(", ")
    headers["Access-Control-Allow-Headers"] = CORS_CONFIG.allowedHeaders.join(", ")
    headers["Access-Control-Expose-Headers"] = CORS_CONFIG.exposedHeaders.join(", ")
    headers["Access-Control-Max-Age"] = CORS_CONFIG.maxAge.toString()
  }

  return headers
}
