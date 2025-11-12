/**
 * Error Boundary for Guest Booking Flow
 * Catches and handles errors in step components
 */

"use client"

import { Component, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class GuestBookingErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[v0] Guest Booking Error Boundary caught error:", error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="container mx-auto flex min-h-[600px] items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Une erreur est survenue</CardTitle>
              <CardDescription>
                Nous sommes désolés, une erreur inattendue s'est produite lors du chargement de cette étape.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === "development" && this.state.error && (
                <div className="rounded-md bg-destructive/10 p-3">
                  <p className="text-sm font-mono text-destructive">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Button onClick={this.handleReset} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Réessayer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = "/")}
                  className="w-full"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Retour à l'accueil
                </Button>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Si le problème persiste, contactez-nous à{" "}
                <a href="mailto:contact@ninowash.fr" className="underline">
                  contact@ninowash.fr
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Supabase Error Handler
 * Provides user-friendly error messages for common Supabase errors
 */
export function handleSupabaseError(error: any): string {
  console.error("[v0] Supabase error:", error)

  // Network errors
  if (error.message?.includes("Failed to fetch") || error.message?.includes("Network")) {
    return "Erreur de connexion. Vérifiez votre connexion internet et réessayez."
  }

  // Auth errors
  if (error.message?.includes("JWT") || error.message?.includes("token")) {
    return "Session expirée. Veuillez rafraîchir la page."
  }

  // Permission errors
  if (error.message?.includes("permission") || error.message?.includes("policy")) {
    return "Accès refusé. Vous n'avez pas les permissions nécessaires."
  }

  // Database errors
  if (error.code === "PGRST116") {
    return "Aucune donnée trouvée."
  }

  if (error.code === "23505") {
    return "Cette donnée existe déjà."
  }

  if (error.code === "23503") {
    return "Impossible de supprimer : cette donnée est utilisée ailleurs."
  }

  // Generic error
  return "Une erreur est survenue. Veuillez réessayer."
}
