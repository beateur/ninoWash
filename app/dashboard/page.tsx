import { requireAuth, redirect } from "@/lib/auth/route-guards"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Package, MapPin, Clock, Plus, Crown } from "lucide-react"
import Link from "next/link"
import { SyncSubscriptionButton } from "@/components/subscription/sync-subscription-button"

export default async function DashboardPage() {
  const { user, supabase } = await requireAuth()

  const {
    data: { user: fetchedUser },
  } = await supabase.auth.getUser()

  if (!fetchedUser) {
    redirect("/auth/signin")
  }

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5)

  let addressMap: Record<string, any> = {}
  if (bookings && bookings.length > 0) {
    const addressIds = [
      ...new Set([
        ...bookings.map((b) => b.pickup_address_id).filter(Boolean),
        ...bookings.map((b) => b.delivery_address_id).filter(Boolean),
      ]),
    ]

    if (addressIds.length > 0) {
      const { data: addresses } = await supabase
        .from("user_addresses")
        .select("id, street_address, city")
        .in("id", addressIds)

      if (addresses) {
        addressMap = addresses.reduce(
          (acc, addr) => {
            acc[addr.id] = addr
            return acc
          },
          {} as Record<string, any>,
        )
      }
    }
  }

  const enrichedBookings = bookings?.map((booking) => ({
    ...booking,
    pickup_address: booking.pickup_address_id ? addressMap[booking.pickup_address_id] : null,
    delivery_address: booking.delivery_address_id ? addressMap[booking.delivery_address_id] : null,
  }))

  // Get user's addresses count
  const { count: addressCount } = await supabase
    .from("user_addresses")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select(`
      *,
      subscription_plans (
        name,
        billing_interval,
        price_amount
      )
    `)
    .eq("user_id", user.id)
    .in("status", ["active", "trialing"])
    .maybeSingle()

  console.log("[v0] Subscription query result:", { subscription, subscriptionError })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">En attente</Badge>
      case "confirmed":
        return <Badge className="bg-blue-100 text-blue-800">Confirmée</Badge>
      case "picked_up":
        return <Badge className="bg-yellow-100 text-yellow-800">Collectée</Badge>
      case "in_progress":
        return <Badge className="bg-purple-100 text-purple-800">En cours</Badge>
      case "ready":
        return <Badge className="bg-green-100 text-green-800">Prête</Badge>
      case "delivered":
        return <Badge className="bg-green-600 text-white">Livrée</Badge>
      case "cancelled":
        return <Badge variant="destructive">Annulée</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-balance">Bonjour {user.user_metadata?.first_name || ""}</h1>
          <p className="text-muted-foreground mt-2">
            Gérez vos réservations et votre profil depuis votre tableau de bord
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Réservations totales</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{enrichedBookings?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Adresses enregistrées</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{addressCount || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prochaine collecte</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {enrichedBookings?.find((b) => b.status === "confirmed") ? "Demain" : "Aucune"}
              </div>
            </CardContent>
          </Card>
        </div>

        {subscription && (
          <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Crown className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Abonnement actif</h3>
                    <p className="text-sm text-muted-foreground">
                      Plan {subscription.subscription_plans?.name} - {subscription.subscription_plans?.price_amount}€/
                      {subscription.subscription_plans?.billing_interval === "monthly"
                        ? "mois"
                        : subscription.subscription_plans?.billing_interval === "yearly"
                          ? "an"
                          : "trimestre"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {subscription.status === "trialing" ? "Période d'essai" : "Actif"} jusqu'au{" "}
                      {new Date(subscription.current_period_end).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline" size="lg" className="shrink-0 bg-transparent">
                  <Link href="/subscription/manage">Gérer mon abonnement</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!subscription && (
          <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Crown className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Passez au plan supérieur</h3>
                    <p className="text-sm text-muted-foreground">
                      Profitez de tarifs réduits et d'avantages exclusifs avec nos abonnements
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Vous venez de payer ? Cliquez sur synchroniser pour récupérer votre abonnement
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button asChild size="lg" className="shrink-0">
                    <Link href="/subscription">
                      <Crown className="h-4 w-4 mr-2" />
                      S'abonner
                    </Link>
                  </Button>
                  <SyncSubscriptionButton />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Button asChild className="h-auto p-6 flex-col space-y-2">
            <Link href="/reservation">
              <Plus className="h-6 w-6" />
              <span>Nouvelle réservation</span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-auto p-6 flex-col space-y-2 bg-transparent">
            <Link href="/bookings">
              <Package className="h-6 w-6" />
              <span>Mes réservations</span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-auto p-6 flex-col space-y-2 bg-transparent">
            <Link href="/addresses">
              <MapPin className="h-6 w-6" />
              <span>Mes adresses</span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-auto p-6 flex-col space-y-2 bg-transparent">
            <Link href="/profile">
              <Clock className="h-6 w-6" />
              <span>Mon profil</span>
            </Link>
          </Button>
        </div>

        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Réservations récentes</CardTitle>
            <CardDescription>Vos dernières demandes de pressing</CardDescription>
          </CardHeader>
          <CardContent>
            {enrichedBookings && enrichedBookings.length > 0 ? (
              <div className="space-y-4">
                {enrichedBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">#{booking.booking_number}</span>
                        {getStatusBadge(booking.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Collecte: {booking.pickup_address?.street_address}, {booking.pickup_address?.city}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(booking.pickup_date).toLocaleDateString("fr-FR")} - {booking.pickup_time_slot}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{booking.total_amount}€</div>
                      <Button asChild variant="outline" size="sm" className="mt-2 bg-transparent">
                        <Link href={`/bookings/${booking.id}`}>Voir détails</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucune réservation</h3>
                <p className="text-muted-foreground mb-4">Vous n'avez pas encore effectué de réservation</p>
                <Button asChild>
                  <Link href="/reservation">Faire ma première réservation</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
