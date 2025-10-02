import type { CookieOptions } from "@supabase/ssr"

/**
 * Cookie configuration for secure session management
 */

export const COOKIE_CONFIG = {
  // Cookie name prefix
  prefix: "nino-wash",

  // Cookie options for production
  production: {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  },

  // Cookie options for development
  development: {
    httpOnly: true,
    secure: false, // Allow HTTP in development
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  },
}

/**
 * Get cookie options based on environment
 */
export function getCookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === "production"

  return isProduction ? COOKIE_CONFIG.production : COOKIE_CONFIG.development
}

/**
 * Get Supabase cookie options
 */
export function getSupabaseCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production"

  return {
    name: `${COOKIE_CONFIG.prefix}-auth-token`,
    lifetime: 60 * 60 * 24 * 7, // 7 days
    domain: isProduction ? process.env.NEXT_PUBLIC_APP_URL?.replace(/https?:\/\//, "") : undefined,
    path: "/",
    sameSite: "lax" as const,
  }
}
