import { redirect } from "next/navigation"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { CheckoutForm } from "@/components/subscription/checkout-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface PageProps {
  searchParams: Promise<{ plan?: string }>
}

export default async function CheckoutPage({ searchParams }: PageProps) {
  const params = await searchParams
  const planId = params.plan

  if (!planId) {
    redirect("/subscription")
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect(`/auth/signin?redirect=/subscription/checkout?plan=${planId}`)
  }

  // Get plan details
  const { data: plan, error: planError } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("id", planId)
    .eq("is_active", true)
    .single()

  if (planError || !plan) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Plan d'abonnement introuvable</AlertDescription>
        </Alert>
      </div>
    )
  }

  const getBillingLabel = (interval: string) => {
    switch (interval) {
      case "monthly":
        return "mois"
      case "quarterly":
        return "trimestre"
      case "annual":
        return "an"
      default:
        return interval
    }
  }

  const parseFeatures = (features: any): string[] => {
    if (!features) return []
    if (Array.isArray(features)) return features
    if (typeof features === "object") {
      return Object.entries(features).map(([key, value]) => `${key}: ${value}`)
    }
    return []
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-2">Finaliser votre abonnement</h1>
            <p className="text-muted-foreground">Complétez votre paiement pour activer votre abonnement</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Plan Summary */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Récapitulatif de votre commande</CardTitle>
                  <CardDescription>Détails de votre abonnement</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Prix</span>
                      <span className="font-medium">
                        {plan.price_amount}
                        {plan.currency === "EUR" ? "€" : plan.currency}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Facturation</span>
                      <span className="font-medium">Tous les {getBillingLabel(plan.billing_interval)}</span>
                    </div>
                    {plan.trial_days && plan.trial_days > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Période d'essai</span>
                        <span className="font-medium text-primary">{plan.trial_days} jours gratuits</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>
                        {plan.price_amount}
                        {plan.currency === "EUR" ? "€" : plan.currency}
                        <span className="text-sm font-normal text-muted-foreground">
                          /{getBillingLabel(plan.billing_interval)}
                        </span>
                      </span>
                    </div>
                  </div>

                  {parseFeatures(plan.features).length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-3">Inclus dans votre abonnement</h4>
                      <ul className="space-y-2">
                        {parseFeatures(plan.features).map((feature, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <span className="text-primary mt-0.5">✓</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Checkout Form */}
            <div>
              <CheckoutForm planId={planId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
