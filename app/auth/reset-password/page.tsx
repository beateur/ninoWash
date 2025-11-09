"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Lock, CheckCircle2, AlertCircle } from "lucide-react"
import { newPasswordSchema, type NewPasswordInput } from "@/lib/validations/auth"
import { clientAuth } from "@/lib/services/auth.service.client"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [tokenError, setTokenError] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

  const form = useForm<NewPasswordInput>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  // ✅ Vérifier session et erreurs (session créée par /api/auth/callback)
  useEffect(() => {
    async function checkSession() {
      try {
        const supabase = createClient()
        
        // Vérifier erreurs dans l'URL
        const urlError = searchParams.get("error")
        const errorDescription = searchParams.get("error_description")

        if (urlError) {
          setTokenError(true)
          if (errorDescription) {
            setError(decodeURIComponent(errorDescription))
          } else if (urlError === "access_denied") {
            setError("Le lien de réinitialisation a expiré ou est invalide")
          } else {
            setError("Erreur lors de la vérification du lien")
          }
          setIsCheckingSession(false)
          return
        }

        // ✅ Vérifier session (doit être créée par Route Handler /api/auth/callback)
        const { data: sessionData } = await supabase.auth.getSession()

        if (!sessionData?.session) {
          setTokenError(true)
          setError("Votre session a expiré. Veuillez demander un nouveau lien de réinitialisation.")
        }
      } catch (err) {
        setTokenError(true)
        setError("Erreur lors de la vérification de votre session.")
      } finally {
        setIsCheckingSession(false)
      }
    }

    checkSession()
  }, [searchParams])

  // ✅ Afficher loading pendant vérification de session
  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="pt-6 flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Vérification de votre session...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const onSubmit = async (data: NewPasswordInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await clientAuth.updatePassword(data.password)

      if (!result.success) {
        setError(result.error || "Une erreur est survenue")
        return
      }

      // Success: show confirmation and redirect
      setSuccess(true)
      
      // Redirect to dashboard after 1.5 seconds
      setTimeout(() => {
        window.location.href = "/dashboard"
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  // If token is invalid, show error message
  if (tokenError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-destructive">
              Lien invalide
            </CardTitle>
            <CardDescription className="text-center">
              Le lien de réinitialisation a expiré ou est invalide
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || "Le lien de réinitialisation a expiré ou est invalide"}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/auth/forgot-password">
                  Demander un nouveau lien
                </Link>
              </Button>
              <Button asChild className="w-full" variant="outline">
                <Link href="/auth/signin">
                  Retour à la connexion
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Nouveau mot de passe
          </CardTitle>
          <CardDescription className="text-center">
            Choisissez un mot de passe sécurisé pour votre compte
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && !tokenError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success ? (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <strong>Mot de passe modifié avec succès !</strong>
                  <p className="mt-1">
                    Vous allez être redirigé vers votre tableau de bord...
                  </p>
                </AlertDescription>
              </Alert>

              <div className="flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              </div>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nouveau mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    {...form.register("password")}
                    disabled={isLoading}
                  />
                </div>
                {form.formState.errors.password && (
                  <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Minimum 8 caractères
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    {...form.register("confirmPassword")}
                    disabled={isLoading}
                  />
                </div>
                {form.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Réinitialiser le mot de passe
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                <p>
                  Vous vous souvenez de votre mot de passe ?{" "}
                  <Button asChild variant="link" className="p-0 h-auto">
                    <Link href="/auth/signin">Se connecter</Link>
                  </Button>
                </p>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ✅ Wrapper avec Suspense pour éviter l'erreur de prerendering
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
          <Card className="w-full max-w-md mx-auto">
            <CardContent className="pt-6 flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Chargement...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
