/**
 * Authentication Service Layer
 *
 * This service provides a clean abstraction for all authentication operations,
 * decoupling auth logic from UI components and API routes.
 */

import { createClient as createBrowserClient } from "@/lib/supabase/client"
import { createClient as createServerClient } from "@/lib/supabase/server"
import type { User } from "@supabase/supabase-js"
import { signUpSchema, signInSchema, type SignUpInput, type SignInInput } from "@/lib/validations/auth"

export interface AuthResult {
  success: boolean
  user?: User
  error?: string
  message?: string
}

export interface SessionInfo {
  user: User | null
  isAuthenticated: boolean
}

/**
 * Client-side authentication service
 * Use this in client components and browser contexts
 */
export class ClientAuthService {
  private supabase = createBrowserClient()

  /**
   * Sign up a new user
   */
  async signUp(data: SignUpInput): Promise<AuthResult> {
    try {
      // Validate input
      const validatedData = signUpSchema.parse(data)

      const { data: authData, error } = await this.supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`,
          data: {
            first_name: validatedData.firstName,
            last_name: validatedData.lastName,
            phone: validatedData.phone,
          },
        },
      })

      if (error) {
        return {
          success: false,
          error: error.message,
        }
      }

      return {
        success: true,
        user: authData.user ?? undefined,
        message: "Compte créé avec succès. Vérifiez votre email pour confirmer votre inscription.",
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur lors de la création du compte",
      }
    }
  }

  /**
   * Sign in an existing user
   */
  async signIn(data: SignInInput): Promise<AuthResult> {
    try {
      // Validate input
      const validatedData = signInSchema.parse(data)

      const { data: authData, error } = await this.supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      })

      if (error) {
        return {
          success: false,
          error: "Email ou mot de passe incorrect",
        }
      }

      return {
        success: true,
        user: authData.user,
        message: "Connexion réussie",
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur lors de la connexion",
      }
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<AuthResult> {
    try {
      const { error } = await this.supabase.auth.signOut()

      if (error) {
        return {
          success: false,
          error: error.message,
        }
      }

      return {
        success: true,
        message: "Déconnexion réussie",
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur lors de la déconnexion",
      }
    }
  }

  /**
   * Get current session information
   */
  async getSession(): Promise<SessionInfo> {
    try {
      const {
        data: { session },
        error,
      } = await this.supabase.auth.getSession()

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
   * Get current user
   */
  async getUser(): Promise<User | null> {
    try {
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser()

      if (error || !user) {
        return null
      }

      return user
    } catch {
      return null
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<AuthResult> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        return {
          success: false,
          error: error.message,
        }
      }

      return {
        success: true,
        message: "Email de réinitialisation envoyé",
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur lors de la réinitialisation",
      }
    }
  }

  /**
   * Update password
   */
  async updatePassword(newPassword: string): Promise<AuthResult> {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        return {
          success: false,
          error: error.message,
        }
      }

      return {
        success: true,
        message: "Mot de passe mis à jour",
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur lors de la mise à jour",
      }
    }
  }
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

// Export singleton instances
export const clientAuth = new ClientAuthService()
export const serverAuth = new ServerAuthService()
