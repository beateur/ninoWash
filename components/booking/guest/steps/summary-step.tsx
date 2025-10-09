/**
 * Step 4: Summary & Payment Preview
 * Displays complete booking summary
 * Payment integration will be added in Phase 2
 */

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, MapPin, Package, Home, Calendar, Clock, ShoppingCart, CreditCard } from "lucide-react"
import type { GuestBookingState } from "@/lib/hooks/use-guest-booking"

interface SummaryStepProps {
  bookingData: GuestBookingState
  onComplete: () => void
}

const TIME_SLOTS = [
  { value: "09:00-12:00", label: "9h00 - 12h00" },
  { value: "14:00-17:00", label: "14h00 - 17h00" },
  { value: "18:00-21:00", label: "18h00 - 21h00" },
]

export function SummaryStep({ bookingData, onComplete }: SummaryStepProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const calculateDeliveryDate = (pickupDate: string): string => {
    const delivery = new Date(pickupDate)
    delivery.setDate(delivery.getDate() + 3) // 72h = 3 days
    return delivery.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
  }

  const getTimeSlotLabel = (value: string | null): string => {
    return TIME_SLOTS.find((slot) => slot.value === value)?.label || value || ""
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Récapitulatif de votre réservation</h2>
        <p className="text-muted-foreground">
          Vérifiez les informations avant de procéder au paiement
        </p>
      </div>

      {/* Contact Information */}
      {bookingData.contact && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-primary" />
              Informations de contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Nom complet</p>
              <p className="font-medium">
                {bookingData.contact.firstName} {bookingData.contact.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{bookingData.contact.email}</p>
            </div>
            {bookingData.contact.phone && (
              <div>
                <p className="text-sm text-muted-foreground">Téléphone</p>
                <p className="font-medium">{bookingData.contact.phone}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Addresses */}
      {bookingData.pickupAddress && bookingData.deliveryAddress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5 text-primary" />
              Adresses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pickup Address */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-primary" />
                <p className="font-medium">Adresse de collecte</p>
              </div>
              <p className="text-sm">
                {bookingData.pickupAddress.street_address}
              </p>
              <p className="text-sm">
                {bookingData.pickupAddress.postal_code} {bookingData.pickupAddress.city}
              </p>
              {bookingData.pickupAddress.building_info && (
                <p className="text-sm text-muted-foreground">
                  {bookingData.pickupAddress.building_info}
                </p>
              )}
              {bookingData.pickupAddress.access_instructions && (
                <p className="text-xs text-muted-foreground mt-1">
                  Instructions: {bookingData.pickupAddress.access_instructions}
                </p>
              )}
            </div>

            <Separator />

            {/* Delivery Address */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Home className="h-4 w-4 text-primary" />
                <p className="font-medium">Adresse de livraison</p>
              </div>
              {JSON.stringify(bookingData.pickupAddress) ===
              JSON.stringify(bookingData.deliveryAddress) ? (
                <Badge variant="secondary">Même adresse que la collecte</Badge>
              ) : (
                <>
                  <p className="text-sm">
                    {bookingData.deliveryAddress.street_address}
                  </p>
                  <p className="text-sm">
                    {bookingData.deliveryAddress.postal_code}{" "}
                    {bookingData.deliveryAddress.city}
                  </p>
                  {bookingData.deliveryAddress.building_info && (
                    <p className="text-sm text-muted-foreground">
                      {bookingData.deliveryAddress.building_info}
                    </p>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Services */}
      {bookingData.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Services sélectionnés ({bookingData.items.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bookingData.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">Service {index + 1}</p>
                    <p className="text-sm text-muted-foreground">
                      Quantité: {item.quantity}
                    </p>
                    {item.specialInstructions && (
                      <p className="text-xs text-muted-foreground mt-1">
                        "{item.specialInstructions}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Date & Time */}
      {bookingData.pickupDate && bookingData.pickupTimeSlot && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              Planification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Collecte prévue</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(bookingData.pickupDate)}
                </p>
                <p className="text-sm font-medium text-primary">
                  {getTimeSlotLabel(bookingData.pickupTimeSlot)}
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Livraison estimée</p>
                <p className="text-sm text-muted-foreground">
                  {calculateDeliveryDate(bookingData.pickupDate)} (72h après collecte)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Total */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-medium">Total à payer</span>
            <span className="text-3xl font-bold">
              {bookingData.totalAmount.toFixed(2)} €
            </span>
          </div>
          <Separator className="my-4" />
          <p className="text-sm text-muted-foreground">
            Paiement sécurisé par Stripe • TVA incluse
          </p>
        </CardContent>
      </Card>

      {/* Payment Button (Placeholder for Phase 2) */}
      <Card className="border-dashed">
        <CardContent className="p-6 text-center">
          <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="font-semibold mb-2">Paiement Stripe</h3>
          <p className="text-sm text-muted-foreground mb-4">
            L&apos;intégration du paiement Stripe sera disponible en Phase 2
          </p>
          <Button size="lg" disabled className="w-full">
            Payer {bookingData.totalAmount.toFixed(2)} € (Phase 2)
          </Button>
          <p className="text-xs text-muted-foreground mt-3">
            🚧 En développement - Stripe Payment Intent + Elements
          </p>
        </CardContent>
      </Card>

      {/* Test Button (Development only) */}
      {process.env.NODE_ENV === "development" && (
        <Button onClick={onComplete} variant="outline" className="w-full">
          [DEV] Simuler la réservation complète
        </Button>
      )}
    </div>
  )
}
