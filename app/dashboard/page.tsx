import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Package, MapPin, Clock, Plus } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/signin")
  }

  // Get user's recent bookings
  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      *,
      pickup_address:addresses!pickup_address_id(street_address, city),
      delivery_address:addresses!delivery_address_id(street_address, city)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5)

  // Get user's addresses count
  const { count: addressCount } = await supabase
    .from("addresses")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

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
              <div className="text-2xl font-bold">{bookings?.length || 0}</div>
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
                {bookings?.find((b) => b.status === "confirmed") ? "Demain" : "Aucune"}
              </div>
            </CardContent>
          </Card>
        </div>

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
            {bookings && bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings.map((booking) => (
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
