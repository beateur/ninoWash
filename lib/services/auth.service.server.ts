/**
 * Server-side Authentication Service
 *
 * This service provides authentication operations for server components.
 * ONLY use this in server components, API routes, and server actions.
 */

import { createClient as createServerClient } from "@/lib/supabase/server"
import type { User } from "@supabase/supabase-js"

export interface SessionInfo {
  user: User | null
  isAuthenticated: boolean
}

/**
 * Server-side authentication service
 * Use this in server components, API routes, and server actions
 */
export class ServerAuthService {
  private async getSupabase() {
    return await createServerClient()
  }

  /**
   * Get current user on server
   */
  async getUser(): Promise<User | null> {
    try {
      const supabase = await this.getSupabase()
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        return null
      }

      return user
    } catch {
      return null
    }
  }

  /**
   * Get session information on server
   */
  async getSession(): Promise<SessionInfo> {
    try {
      const supabase = await this.getSupabase()
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error || !session) {
        return {
          user: null,
          isAuthenticated: false,
        }
      }

      return {
        user: session.user,
        isAuthenticated: true,
      }
    } catch {
      return {
        user: null,
        isAuthenticated: false,
      }
    }
  }

  /**
   * Check if user is admin
   */
  async isAdmin(): Promise<boolean> {
    try {
      const user = await this.getUser()

      if (!user) {
        return false
      }

      return user.user_metadata?.role === "admin" || user.app_metadata?.role === "admin"
    } catch {
      return false
    }
  }

  /**
   * Require authentication (throws if not authenticated)
   */
  async requireAuth(): Promise<User> {
    const user = await this.getUser()

    if (!user) {
      throw new Error("Authentication required")
    }

    return user
  }

  /**
   * Require admin role (throws if not admin)
   */
  async requireAdmin(): Promise<User> {
    const user = await this.requireAuth()
    const isAdmin = await this.isAdmin()

    if (!isAdmin) {
      throw new Error("Admin access required")
    }

    return user
  }
}

// Export singleton instance for server-side use
export const serverAuth = new ServerAuthService()
