"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Check, Crown, Star, Zap, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/hooks/use-auth"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface SubscriptionPlan {
  id: string
  code: string
  name: string
  description: string
  type: "monthly" | "quarterly" | "annual"
  price: number
  discount_percentage: number
  included_services: number
  extra_service_price: number
  features: string[]
}

interface UserSubscription {
  id: string
  status: string
  start_date: string
  end_date: string
  services_used: number
  services_remaining: number
  subscription_plans: SubscriptionPlan
}

export default function SubscriptionPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const plansResponse = await fetch("/api/subscriptions/plans")
      if (!plansResponse.ok) {
        if (plansResponse.status === 429) {
          throw new Error("Trop de requêtes. Veuillez réessayer dans quelques instants.")
        }
        throw new Error(`Erreur lors du chargement des plans: ${plansResponse.status}`)
      }
      const plansData = await plansResponse.json()

      const subscriptionsResponse = await fetch("/api/subscriptions")
      if (!subscriptionsResponse.ok) {
        if (subscriptionsResponse.status === 429) {
          throw new Error("Trop de requêtes. Veuillez réessayer dans quelques instants.")
        }
        throw new Error(`Erreur lors du chargement des abonnements: ${subscriptionsResponse.status}`)
      }
      const subscriptionsData = await subscriptionsResponse.json()

      setPlans(plansData.plans || [])

      const activeSubscription = subscriptionsData.subscriptions?.find(
        (sub: UserSubscription) => sub.status === "active",
      )
      setCurrentSubscription(activeSubscription || null)
    } catch (error) {
      console.error("[v0] Error fetching subscription data:", error)
      setError(error instanceof Error ? error.message : "Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin")
      return
    }

    if (user && isLoading) {
      fetchData()
    }
  }, [user, loading, router, fetchData, isLoading])

  const handleSubscribe = async (planId: string) => {
    console.log("[v0] Subscribe to plan:", planId)
    router.push(`/subscription/checkout?plan=${planId}`)
  }

  const getPlanIcon = (type: string) => {
    switch (type) {
      case "monthly":
        return <Star className="h-6 w-6" />
      case "quarterly":
        return <Zap className="h-6 w-6" />
      case "annual":
        return <Crown className="h-6 w-6" />
      default:
        return <Star className="h-6 w-6" />
    }
  }

  const getTypeLabel = (type: string) => {
    if (!type) return "Mensuel"

    switch (type) {
      case "monthly":
        return "Mensuel"
      case "quarterly":
        return "Trimestriel"
      case "annual":
        return "Annuel"
      default:
        return type
    }
  }

  if (loading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Chargement...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4 text-center">
          <Button
            onClick={() => {
              setIsLoading(true)
              setError(null)
              fetchData()
            }}
          >
            Réessayer
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-balance mb-4">Choisissez votre abonnement</h1>
        <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
          Économisez avec nos formules d'abonnement et profitez d'un service de pressing régulier
        </p>
      </div>

      {currentSubscription && (
        <Card className="mb-8 border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {getPlanIcon(currentSubscription.subscription_plans.type)}
                  Votre abonnement actuel
                </CardTitle>
                <CardDescription>{currentSubscription.subscription_plans.name}</CardDescription>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {currentSubscription.status === "active" ? "Actif" : currentSubscription.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{currentSubscription.services_remaining}</div>
                <div className="text-sm text-muted-foreground">Services restants</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{currentSubscription.services_used}</div>
                <div className="text-sm text-muted-foreground">Services utilisés</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{new Date(currentSubscription.end_date).toLocaleDateString()}</div>
                <div className="text-sm text-muted-foreground">Date d'expiration</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative ${plan.type === "quarterly" ? "border-primary shadow-lg scale-105" : ""}`}
          >
            {plan.type === "quarterly" && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">Le plus populaire</Badge>
              </div>
            )}

            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">{getPlanIcon(plan.type)}</div>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <div className="text-4xl font-bold">
                  {plan.price}€
                  <span className="text-lg font-normal text-muted-foreground">
                    /{plan.type ? getTypeLabel(plan.type).toLowerCase() : "mensuel"}
                  </span>
                </div>
                {plan.discount_percentage > 0 && (
                  <Badge variant="secondary" className="mt-2">
                    -{plan.discount_percentage}%
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{plan.included_services}</div>
                  <div className="text-sm text-muted-foreground">Services inclus</div>
                </div>

                <Separator />

                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.extra_service_price && (
                  <div className="text-center text-sm text-muted-foreground">
                    Services supplémentaires : {plan.extra_service_price}€/service
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter>
              <Button
                className="w-full"
                variant={plan.type === "quarterly" ? "default" : "outline"}
                onClick={() => handleSubscribe(plan.id)}
                disabled={currentSubscription?.subscription_plans.id === plan.id}
              >
                {currentSubscription?.subscription_plans.id === plan.id ? "Abonnement actuel" : "Choisir ce plan"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-16 text-center">
        <h2 className="text-3xl font-bold mb-8">Pourquoi choisir un abonnement ?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Star className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Économies garanties</h3>
            <p className="text-muted-foreground">Jusqu'à 30% d'économies par rapport aux tarifs à l'unité</p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Service prioritaire</h3>
            <p className="text-muted-foreground">Créneaux de collecte et livraison prioritaires pour les abonnés</p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Crown className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Flexibilité totale</h3>
            <p className="text-muted-foreground">Pausez ou annulez votre abonnement à tout moment</p>
          </div>
        </div>
      </div>
    </div>
  )
}
