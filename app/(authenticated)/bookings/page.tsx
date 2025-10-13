import { createServerClient } from "@supabase/ssr"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { NewBookingButton } from "@/components/ui/booking-button-server"
import { Badge } from "@/components/ui/badge"
import { Package, MapPin, Calendar, Plus } from "lucide-react"
import Link from "next/link"
import { cookies } from "next/headers"

export default async function BookingsPage() {
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

  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      *,
      pickup_address:user_addresses!pickup_address_id(street_address, city),
      delivery_address:user_addresses!delivery_address_id(street_address, city),
      booking_items(
        id,
        quantity,
        service:services(name, category)
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

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

  const getItemsCount = (bookingItems: any[]) => {
    return bookingItems.reduce((total, item) => total + item.quantity, 0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-balance">Mes réservations</h1>
            <p className="text-muted-foreground mt-2">Suivez l'état de vos demandes de pressing</p>
          </div>
          <NewBookingButton />
        </div>

        {bookings && bookings.length > 0 ? (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <Card key={booking.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>#{booking.booking_number}</span>
                        {getStatusBadge(booking.status)}
                      </CardTitle>
                      <CardDescription>
                        Créée le {new Date(booking.created_at).toLocaleDateString("fr-FR")}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{booking.total_amount}€</div>
                      <div className="text-sm text-muted-foreground">
                        {getItemsCount(booking.booking_items)} articles
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Collecte</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.pickup_address?.street_address}, {booking.pickup_address?.city}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Date & Heure</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(booking.pickup_date).toLocaleDateString("fr-FR")}
                        </p>
                        <p className="text-sm text-muted-foreground">{booking.pickup_time_slot}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Services</p>
                        <div className="text-sm text-muted-foreground">
                          {booking.booking_items.slice(0, 2).map((item: any, index: number) => (
                            <p key={index}>
                              {item.service.name} x{item.quantity}
                            </p>
                          ))}
                          {booking.booking_items.length > 2 && <p>+{booking.booking_items.length - 2} autres...</p>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button asChild variant="outline" className="bg-transparent">
                      <Link href={`/bookings/${booking.id}`}>Voir détails</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-2">Aucune réservation</h3>
              <p className="text-muted-foreground mb-6">Vous n'avez pas encore effectué de réservation</p>
              <NewBookingButton label="Faire ma première réservation" />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
