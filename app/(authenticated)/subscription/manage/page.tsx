import { createServerClient } from "@supabase/ssr"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Crown, Calendar, CreditCard, AlertCircle } from "lucide-react"
import Link from "next/link"
import { cookies } from "next/headers"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default async function ManageSubscriptionPage() {
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
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/signin")
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select(`
      *,
      subscription_plans (
        name,
        description,
        billing_interval,
        price,
        trial_days
      )
    `)
    .eq("user_id", user.id)
    .in("status", ["active", "trialing", "past_due"])
    .maybeSingle()

  if (!subscription) {
    redirect("/subscription")
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Actif</Badge>
      case "trialing":
        return <Badge className="bg-blue-100 text-blue-800">Période d'essai</Badge>
      case "past_due":
        return <Badge variant="destructive">Paiement en retard</Badge>
      case "canceled":
        return <Badge variant="secondary">Annulé</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getBillingIntervalLabel = (interval: string) => {
    switch (interval) {
      case "monthly":
        return "mois"
      case "yearly":
        return "an"
      case "quarterly":
        return "trimestre"
      default:
        return interval
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-balance">Gérer mon abonnement</h1>
          <p className="text-muted-foreground mt-2">Consultez et gérez les détails de votre abonnement</p>
        </div>

        {subscription.status === "past_due" && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Paiement en retard</AlertTitle>
            <AlertDescription>
              Votre dernier paiement a échoué. Veuillez mettre à jour votre moyen de paiement pour continuer à profiter
              de votre abonnement.
            </AlertDescription>
          </Alert>
        )}

        {subscription.cancel_at_period_end && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Abonnement en cours d'annulation</AlertTitle>
            <AlertDescription>
              Votre abonnement sera annulé le {new Date(subscription.current_period_end).toLocaleDateString("fr-FR")}.
              Vous pouvez continuer à l'utiliser jusqu'à cette date.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6">
          {/* Subscription Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Crown className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle>{subscription.subscription_plans?.name}</CardTitle>
                    <CardDescription>{subscription.subscription_plans?.description}</CardDescription>
                  </div>
                </div>
                {getStatusBadge(subscription.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Prix</p>
                  <p className="text-2xl font-bold">
                    {subscription.subscription_plans?.price}€
                    <span className="text-sm font-normal text-muted-foreground">
                      /{getBillingIntervalLabel(subscription.subscription_plans?.billing_interval || "")}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Prochaine facturation</p>
                  <p className="text-lg font-semibold">
                    {new Date(subscription.current_period_end).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Calendar className="h-4 w-4" />
                  <span>Période actuelle</span>
                </div>
                <p className="text-sm">
                  Du {new Date(subscription.current_period_start).toLocaleDateString("fr-FR")} au{" "}
                  {new Date(subscription.current_period_end).toLocaleDateString("fr-FR")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                <CardTitle>Moyen de paiement</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Gérez votre moyen de paiement directement depuis votre portail client Stripe.
              </p>
              <Button variant="outline" asChild>
                <a
                  href={`https://billing.stripe.com/p/login/test_${subscription.stripe_customer_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Gérer le paiement
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild variant="outline" className="w-full justify-start bg-transparent">
                <Link href="/subscription">Changer de plan</Link>
              </Button>

              {!subscription.cancel_at_period_end && (
                <Button variant="destructive" className="w-full justify-start">
                  Annuler l'abonnement
                </Button>
              )}

              {subscription.cancel_at_period_end && (
                <Button variant="default" className="w-full justify-start">
                  Réactiver l'abonnement
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Button asChild variant="ghost">
            <Link href="/dashboard">← Retour au tableau de bord</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
