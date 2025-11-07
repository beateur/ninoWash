/**
 * Client-side Authentication Service
 *
 * This service provides authentication operations for client components.
 * ONLY use this in client components ("use client" directive).
 */

import { createClient as createBrowserClient } from "@/lib/supabase/client"
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
  /**
   * Sign up a new user
   */
  async signUp(data: SignUpInput): Promise<AuthResult> {
    try {
      const supabase = createBrowserClient()

      // Validate input
      const validatedData = signUpSchema.parse(data)

      const { data: authData, error } = await supabase.auth.signUp({
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
      const supabase = createBrowserClient()

      // Validate input
      const validatedData = signInSchema.parse(data)

      const { data: authData, error } = await supabase.auth.signInWithPassword({
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
      const supabase = createBrowserClient()

      const { error } = await supabase.auth.signOut()

      if (error) {
        return {
          success: false,
          error: error.message,
        }
      }

      // ✅ FIX: Nettoyer manuellement TOUT le localStorage/cookies Supabase
      // Car supabase.auth.signOut() ne supprime pas toujours tout en PKCE
      if (typeof window !== "undefined") {
        // 1. Supprimer tous les items localStorage liés à Supabase
        Object.keys(localStorage).forEach((key) => {
          if (key.includes("supabase") || key.includes("auth") || key.includes("sb-")) {
            localStorage.removeItem(key)
          }
        })

        // 2. Supprimer tous les cookies Supabase
        document.cookie.split(";").forEach((cookie) => {
          const name = cookie.split("=")[0].trim()
          if (name.includes("supabase") || name.includes("auth") || name.includes("sb-")) {
            // Supprimer pour le domaine actuel
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
            // Supprimer pour localhost
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost`
            // Supprimer pour le domaine parent
            const domain = window.location.hostname
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain}`
          }
        })

        // 3. Nettoyer sessionStorage aussi
        Object.keys(sessionStorage).forEach((key) => {
          if (key.includes("supabase") || key.includes("auth") || key.includes("sb-")) {
            sessionStorage.removeItem(key)
          }
        })
      }

      // ✅ FIX: Forcer reload complet pour clear toutes les sessions
      window.location.href = "/"

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
      const supabase = createBrowserClient()

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
   * Get current user
   */
  async getUser(): Promise<User | null> {
    try {
      const supabase = createBrowserClient()

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
   * Reset password
   */
  async resetPassword(email: string): Promise<AuthResult> {
    try {
      const supabase = createBrowserClient()

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // ✅ Redirection directe vers reset-password (pas de callback intermédiaire)
        // Supabase va créer la session automatiquement via PKCE
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/reset-password`,
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
      const supabase = createBrowserClient()

      const { error } = await supabase.auth.updateUser({
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

// Export singleton instance for client-side use
export const clientAuth = new ClientAuthService()
