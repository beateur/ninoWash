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
        // ✅ Utiliser callback au lieu de reset-password directement
        // Cela permet d'échanger le code contre une session avant d'afficher le formulaire
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
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
