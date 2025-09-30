"use client"

import type React from "react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Package } from "lucide-react"
import { useRouter } from "next/navigation"

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

interface BookingCardProps {
  booking: Booking
  getStatusBadge: (status: string) => React.ReactNode
}

export function BookingCard({ booking, getStatusBadge }: BookingCardProps) {
  const router = useRouter()

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold text-lg">{booking.booking_number}</h3>
            <p className="text-sm text-muted-foreground">
              {new Date(booking.pickup_date).toLocaleDateString("fr-FR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          {getStatusBadge(booking.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Collecte</p>
              <p className="text-muted-foreground">{booking.pickup_time_slot}</p>
            </div>
          </div>

          {booking.delivery_date && (
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Livraison</p>
                <p className="text-muted-foreground">{new Date(booking.delivery_date).toLocaleDateString("fr-FR")}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Adresse</p>
              <p className="text-muted-foreground line-clamp-1">{booking.pickup_address}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Package className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Articles</p>
              <p className="text-muted-foreground">{booking.items_count} article(s)</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t">
          <div>
            <p className="text-sm text-muted-foreground">Montant total</p>
            <p className="text-2xl font-bold">{booking.total_amount.toFixed(2)}€</p>
          </div>
          <Button variant="outline" onClick={() => router.push(`/bookings/${booking.id}`)}>
            Voir les détails
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
