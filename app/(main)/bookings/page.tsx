"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/hooks/use-auth"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Package, Plus } from "lucide-react"
import { BookingCard } from "./BookingCard" // Declare the BookingCard component

interface Booking {
  id: string
  booking_number: string
  status: string
  pickup_date: string
  pickup_time_slot: string
  delivery_date?: string
  total_amount: number
  items_count: number
  pickup_address: string
  delivery_address: string
}

export default function BookingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin")
      return
    }

    if (user) {
      fetchBookings()
    }
  }, [user, loading, router])

  const fetchBookings = async () => {
    try {
      // Simulate API call
      const mockBookings: Booking[] = [
        {
          id: "1",
          booking_number: "NW-20241201-001",
          status: "confirmed",
          pickup_date: "2024-12-02",
          pickup_time_slot: "09:00-12:00",
          delivery_date: "2024-12-04",
          total_amount: 45.9,
          items_count: 3,
          pickup_address: "123 Rue de la Paix, Paris",
          delivery_address: "123 Rue de la Paix, Paris",
        },
        {
          id: "2",
          booking_number: "NW-20241130-015",
          status: "completed",
          pickup_date: "2024-11-30",
          pickup_time_slot: "14:00-17:00",
          delivery_date: "2024-12-02",
          total_amount: 67.5,
          items_count: 5,
          pickup_address: "456 Avenue des Champs, Paris",
          delivery_address: "456 Avenue des Champs, Paris",
        },
      ]

      setBookings(mockBookings)
    } catch (error) {
      console.error("[v0] Error fetching bookings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "En attente", variant: "secondary" as const },
      confirmed: { label: "Confirmé", variant: "default" as const },
      collecting: { label: "Collecte", variant: "outline" as const },
      processing: { label: "Traitement", variant: "secondary" as const },
      ready: { label: "Prêt", variant: "default" as const },
      delivering: { label: "Livraison", variant: "outline" as const },
      completed: { label: "Terminé", variant: "secondary" as const },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const activeBookings = bookings.filter((b) => !["completed", "cancelled"].includes(b.status))
  const pastBookings = bookings.filter((b) => ["completed", "cancelled"].includes(b.status))

  if (loading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="text-center">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Mes réservations</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Suivez l'état de vos commandes</p>
        </div>
        <Button onClick={() => router.push("/reservation")} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle réservation
        </Button>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">En cours ({activeBookings.length})</TabsTrigger>
          <TabsTrigger value="past">Historique ({pastBookings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeBookings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 sm:py-12">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Aucune réservation en cours</h3>
                <p className="text-muted-foreground mb-4">Créez votre première réservation pour commencer</p>
                <Button onClick={() => router.push("/reservation")}>Réserver maintenant</Button>
              </CardContent>
            </Card>
          ) : (
            activeBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} getStatusBadge={getStatusBadge} />
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastBookings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 sm:py-12">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Aucun historique</h3>
                <p className="text-muted-foreground">Vos réservations terminées apparaîtront ici</p>
              </CardContent>
            </Card>
          ) : (
            pastBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} getStatusBadge={getStatusBadge} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
