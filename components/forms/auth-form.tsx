"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, Lock, User, Phone } from "lucide-react"
import { signUpSchema, signInSchema, type SignUpInput, type SignInInput } from "@/lib/validations/auth"
import { clientAuth } from "@/lib/services/auth.service.client"

interface AuthFormProps {
  mode: "signin" | "signup"
  onSuccess?: () => void
  defaultEmail?: string
  infoMessage?: string
}

export function AuthForm({ mode, onSuccess, defaultEmail, infoMessage }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  const isSignUp = mode === "signup"
  const schema = isSignUp ? signUpSchema : signInSchema

  const form = useForm<SignUpInput | SignInInput>({
    resolver: zodResolver(schema),
    defaultValues: isSignUp
      ? {
          email: defaultEmail || "",
          password: "",
          firstName: "",
          lastName: "",
          phone: "",
          marketingConsent: false,
        }
      : {
          email: defaultEmail || "",
          password: "",
        },
  })

  const onSubmit = async (data: SignUpInput | SignInInput) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = isSignUp
        ? await clientAuth.signUp(data as SignUpInput)
        : await clientAuth.signIn(data as SignInInput)

      if (!result.success) {
        setError(result.error || "Une erreur est survenue")
        return
      }

      setSuccess(result.message || "Opération réussie")

      if (isSignUp) {
        form.reset()
      } else {
        onSuccess?.()
        router.push("/dashboard")
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          {isSignUp ? "Créer un compte" : "Se connecter"}
        </CardTitle>
        <CardDescription className="text-center">
          {isSignUp
            ? "Rejoignez Nino Wash pour un pressing de qualité à domicile"
            : "Connectez-vous à votre compte Nino Wash"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {infoMessage && (
          <Alert className="border-blue-200 bg-blue-50 text-blue-800">
            <AlertDescription>{infoMessage}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {isSignUp && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="firstName"
                    placeholder="Jean"
                    className="pl-10"
                    {...form.register("firstName" as keyof (SignUpInput | SignInInput))}
                  />
                </div>
                {(form.formState.errors as any).firstName && (
                  <p className="text-sm text-red-600">{(form.formState.errors as any).firstName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="lastName"
                    placeholder="Dupont"
                    className="pl-10"
                    {...form.register("lastName" as keyof (SignUpInput | SignInInput))}
                  />
                </div>
                {(form.formState.errors as any).lastName && (
                  <p className="text-sm text-red-600">{(form.formState.errors as any).lastName.message}</p>
                )}
              </div>
            </div>
          )}

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
              />
            </div>
            {form.formState.errors.email && (
              <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
            )}
          </div>

          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="06 12 34 56 78"
                  className="pl-10"
                  {...form.register("phone" as keyof (SignUpInput | SignInInput))}
                />
              </div>
              {(form.formState.errors as any).phone && (
                <p className="text-sm text-red-600">{(form.formState.errors as any).phone.message}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Mot de passe</Label>
              {!isSignUp && (
                <Button
                  asChild
                  variant="link"
                  className="p-0 h-auto text-xs text-muted-foreground hover:text-primary"
                >
                  <a href="/auth/forgot-password">
                    Mot de passe oublié ?
                  </a>
                </Button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="pl-10"
                {...form.register("password")}
              />
            </div>
            {form.formState.errors.password && (
              <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
            )}
          </div>

          {isSignUp && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="marketingConsent"
                {...form.register("marketingConsent" as keyof (SignUpInput | SignInInput))}
              />
              <Label htmlFor="marketingConsent" className="text-sm">
                J'accepte de recevoir des offres promotionnelles par email
              </Label>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSignUp ? "Créer mon compte" : "Se connecter"}
          </Button>
        </form>

        <div className="text-center text-sm">
          {isSignUp ? (
            <p>
              Déjà un compte ?{" "}
              <Button variant="link" className="p-0 h-auto" onClick={() => router.push("/auth/signin")}>
                Se connecter
              </Button>
            </p>
          ) : (
            <p>
              Pas encore de compte ?{" "}
              <Button variant="link" className="p-0 h-auto" onClick={() => router.push("/auth/signup")}>
                Créer un compte
              </Button>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
