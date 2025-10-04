import { createServerClient } from "@supabase/ssr"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Check, Crown, Calendar, Zap, AlertCircle, Sparkles } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { SubscribePlanButton } from "@/components/subscription/subscribe-plan-button"

interface SubscriptionPlan {
  id: string
  name: string
  description: string | null
  plan_type: string
  price_amount: number
  billing_interval: string
  currency: string
  trial_days: number | null
  features: any
  is_active: boolean
  is_public: boolean
  sort_order: number | null
}

interface UserSubscription {
  id: string
  status: string
  current_period_start: string
  current_period_end: string
  quantity: number | null
  subscription_plans: SubscriptionPlan
}

export default async function SubscriptionPage() {
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
    redirect("/auth/signin?redirect=/subscription")
  }

  let plans: SubscriptionPlan[] = []
  let currentSubscription: UserSubscription | null = null
  let error: string | null = null

  try {
    // Fetch plans
    const { data: plansData, error: plansError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .eq("is_public", true)
      .order("price_amount", { ascending: true })

    if (plansError) {
      console.error("[v0] Error fetching subscription plans:", plansError)
      error = "Erreur lors du chargement des plans d'abonnement"
    } else {
      plans = plansData || []
    }

    // Fetch user's current subscription
    const { data: subscriptionsData, error: subscriptionsError } = await supabase
      .from("subscriptions")
      .select(
        `
        *,
        subscription_plans (
          id,
          name,
          description,
          plan_type,
          price_amount,
          billing_interval,
          currency,
          features,
          trial_days,
          is_active
        )
      `,
      )
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle()

    if (subscriptionsError) {
      console.error("[v0] Error fetching user subscription:", subscriptionsError)
      // Don't set error, just log it - user might not have a subscription
    } else {
      currentSubscription = subscriptionsData
    }
  } catch (err) {
    console.error("[v0] Unexpected error in subscription page:", err)
    error = "Une erreur inattendue s'est produite"
  }

  // Helper functions
  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case "monthly":
        return <Calendar className="h-5 w-5" />
      case "quarterly":
        return <Zap className="h-5 w-5" />
      case "annual":
        return <Crown className="h-5 w-5" />
      default:
        return <Calendar className="h-5 w-5" />
    }
  }

  const getBillingLabel = (interval: string | null | undefined) => {
    if (!interval) return "mois"

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
      // Convert object features to array of strings
      return Object.entries(features).map(([key, value]) => `${key}: ${value}`)
    }
    return []
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-balance mb-4">Choisissez votre abonnement</h1>
          <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
            Économisez avec nos formules d'abonnement et profitez d'un service de pressing régulier et de qualité
          </p>
        </div>

        {/* Current Subscription Card */}
        {currentSubscription && (
          <Card className="mb-8 border-primary bg-gradient-to-r from-primary/5 to-primary/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {getPlanIcon(currentSubscription.subscription_plans.plan_type)}
                    Votre abonnement actuel
                  </CardTitle>
                  <CardDescription>{currentSubscription.subscription_plans.name}</CardDescription>
                </div>
                <Badge variant="secondary" className="bg-primary text-primary">
                  {currentSubscription.status === "active" ? "Actif" : currentSubscription.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {currentSubscription.subscription_plans.price_amount}
                    {currentSubscription.subscription_plans.currency === "EUR"
                      ? "€"
                      : currentSubscription.subscription_plans.currency}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    par {getBillingLabel(currentSubscription.subscription_plans.billing_interval)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {new Date(currentSubscription.current_period_end).toLocaleDateString("fr-FR")}
                  </div>
                  <div className="text-sm text-muted-foreground">Prochaine facturation</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {plans.map((plan) => {
            const isCurrentPlan = currentSubscription?.subscription_plans.id === plan.id
            const isPopular = plan.plan_type === "quarterly"
            const features = parseFeatures(plan.features)

            return (
              <Card
                key={plan.id}
                className={`relative ${isPopular ? "border-primary shadow-lg md:scale-105" : ""} ${isCurrentPlan ? "border-primary/50" : ""}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Le plus populaire
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center">
                  <div className="flex justify-center mb-3">{getPlanIcon(plan.plan_type)}</div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-3">
                    <div className="text-3xl font-bold">
                      {plan.price_amount}
                      {plan.currency === "EUR" ? "€" : plan.currency}
                      <span className="text-base font-normal text-muted-foreground">
                        /{getBillingLabel(plan.billing_interval)}
                      </span>
                    </div>
                    {plan.trial_days && plan.trial_days > 0 && (
                      <Badge variant="secondary" className="mt-2">
                        {plan.trial_days} jours d'essai
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    <Separator />

                    {features.length > 0 && (
                      <ul className="space-y-2">
                        {features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </CardContent>

                <CardFooter>
                  <SubscribePlanButton
                    planId={plan.id}
                    planName={plan.name}
                    isCurrentPlan={isCurrentPlan}
                    isPopular={isPopular}
                  />
                </CardFooter>
              </Card>
            )
          })}
        </div>

        {/* Benefits Section */}
        <div className="text-center mb-8">
          <h2 className="font-serif text-3xl font-bold mb-8">Pourquoi choisir un abonnement ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Check className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Économies garanties</h3>
              <p className="text-muted-foreground">
                Profitez de tarifs préférentiels et d'avantages exclusifs réservés aux abonnés
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Service prioritaire</h3>
              <p className="text-muted-foreground">
                Créneaux de collecte et livraison prioritaires pour tous nos abonnés
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Crown className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Flexibilité totale</h3>
              <p className="text-muted-foreground">
                Pausez, modifiez ou annulez votre abonnement à tout moment sans frais
              </p>
            </div>
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="bg-muted/30 rounded-lg p-8 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <h3 className="font-semibold text-lg mb-3">Qualité Garantie</h3>
              <p className="text-muted-foreground text-sm">
                Nos professionnels utilisent des techniques de nettoyage respectueuses de vos vêtements
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3">Livraison Rapide</h3>
              <p className="text-muted-foreground text-sm">
                Collecte et livraison à domicile selon la fréquence de votre abonnement
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3">Assurance Incluse</h3>
              <p className="text-muted-foreground text-sm">
                Tous nos abonnements incluent une assurance pour votre tranquillité d'esprit
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
