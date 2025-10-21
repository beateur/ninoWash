"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookingButton } from "@/components/ui/booking-button"
import { Calendar, MapPin, Package, Plus } from "lucide-react"
import Link from "next/link"
import { BookingCard, BookingDetailPanel } from "@/components/booking/booking-card"
import { CreditsDisplay } from "@/components/subscription/credits-display"
import { DevCreditReset } from "@/components/subscription/dev-credit-reset"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@supabase/supabase-js"

interface BookingWithAddresses {
  id: string
  status: string
  pickup_date: string
  pickup_time_slot: string
  delivery_date: string | null
  delivery_time_slot: string | null
  total_amount: number
  created_at: string
  pickup_address: {
    street_address: string
    city: string
  } | null
  delivery_address: {
    street_address: string
    city: string
  } | null
}

interface DashboardClientProps {
  user: User
  bookings: BookingWithAddresses[]
  addressCount: number
  hasActiveSubscription: boolean
}

export function DashboardClient({
  user,
  bookings,
  addressCount,
  hasActiveSubscription,
}: DashboardClientProps) {
  const [selectedBooking, setSelectedBooking] = useState<BookingWithAddresses | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Détecter le retour de paiement réussi
  useEffect(() => {
    const paymentStatus = searchParams.get("payment")
    const bookingId = searchParams.get("booking_id")
    
    if (paymentStatus === "success" && bookingId) {
      toast({
        title: "✅ Paiement confirmé !",
        description: "Votre réservation a été confirmée avec succès. Vous recevrez un email de confirmation.",
        duration: 8000,
      })
      
      // Nettoyer les paramètres de l'URL
      router.replace("/dashboard")
    }
  }, [searchParams, router, toast])

  const activeBookings = bookings.filter(
    (b) => ["confirmed", "picked_up", "in_progress", "ready", "pending"].includes(b.status)
  )

  const nextPickup = bookings.find((b) => b.status === "confirmed")

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className={`flex-1 ${selectedBooking ? "hidden lg:block" : ""}`}>
        <div className="p-6 lg:p-8 space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">
              Bonjour {user.user_metadata?.first_name || ""}
            </h1>
            <p className="text-muted-foreground">
              Voici un aperçu de vos réservations et services
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-4">
            <BookingButton size="lg" href="/reservation">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle réservation
            </BookingButton>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Réservations actives</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeBookings.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {bookings.length} réservation{bookings.length > 1 ? "s" : ""} au total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Adresses enregistrées</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{addressCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <Link href="/profile#addresses" className="hover:underline">
                    Gérer mes adresses
                  </Link>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Prochaine collecte</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {nextPickup ? "Planifiée" : "Aucune"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {nextPickup ? `Le ${new Date(nextPickup.pickup_date).toLocaleDateString("fr-FR")}` : "Créez une réservation"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Credits Display (for subscribers only) */}
          {hasActiveSubscription && (
            <CreditsDisplay userId={user.id} compact={false} />
          )}

          {/* Dev Tool: Manual Credit Reset */}
          <DevCreditReset userId={user.id} />

          {/* Bookings List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Mes réservations</h2>
              {/* Note: All bookings are displayed here. "Voir tout" link removed as obsolete /bookings page was deleted */}
            </div>

            {bookings.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Aucune réservation</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Vous n'avez pas encore de réservation. Créez votre première réservation pour commencer.
                  </p>
                  <BookingButton href="/reservation">
                    <Plus className="mr-2 h-4 w-4" />
                    Créer une réservation
                  </BookingButton>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {bookings.slice(0, 5).map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    isSelected={selectedBooking?.id === booking.id}
                    onClick={() => setSelectedBooking(booking)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Panel (Right Side) */}
      {selectedBooking && (
        <div className="w-full lg:w-[400px] xl:w-[500px] border-l bg-muted/30 fixed lg:relative inset-0 z-50 lg:z-auto">
          <BookingDetailPanel
            booking={selectedBooking}
            onClose={() => setSelectedBooking(null)}
            onBookingUpdated={() => {
              // Refresh server-side data
              router.refresh()
              setSelectedBooking(null)
            }}
          />
        </div>
      )}
    </div>
  )
}
