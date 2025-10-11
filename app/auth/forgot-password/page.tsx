"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react"
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth"
import { clientAuth } from "@/lib/services/auth.service.client"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState<string>("")
  const router = useRouter()

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (data: ResetPasswordInput) => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await clientAuth.resetPassword(data.email)

      if (!result.success) {
        setError(result.error || "Une erreur est survenue")
        return
      }

      // Success: show confirmation message
      setSuccess(true)
      setSubmittedEmail(data.email)
      form.reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Mot de passe oublié
          </CardTitle>
          <CardDescription className="text-center">
            Entrez votre email pour recevoir un lien de réinitialisation
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success ? (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <strong>Email envoyé !</strong>
                  <p className="mt-1">
                    Si un compte existe avec l'adresse{" "}
                    <span className="font-medium">{submittedEmail}</span>, vous recevrez un lien
                    de réinitialisation dans quelques instants.
                  </p>
                </AlertDescription>
              </Alert>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong>Prochaines étapes :</strong>
                </p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Vérifiez votre boîte de réception (et vos spams)</li>
                  <li>Cliquez sur le lien dans l'email</li>
                  <li>Définissez votre nouveau mot de passe</li>
                </ol>
              </div>

              <div className="pt-4 space-y-2">
                <Button asChild className="w-full" variant="outline">
                  <Link href="/auth/signin">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour à la connexion
                  </Link>
                </Button>
                <Button
                  className="w-full"
                  variant="ghost"
                  onClick={() => {
                    setSuccess(false)
                    setSubmittedEmail("")
                  }}
                >
                  Renvoyer un email
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="jean.dupont@example.com"
                    className="pl-10"
                    {...form.register("email")}
                    disabled={isLoading}
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Envoyer le lien de réinitialisation
              </Button>

              <div className="text-center">
                <Button asChild variant="link" className="p-0 h-auto">
                  <Link href="/auth/signin">
                    <ArrowLeft className="mr-1 h-3 w-3" />
                    Retour à la connexion
                  </Link>
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
