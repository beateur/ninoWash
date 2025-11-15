/**
 * Step 4: Summary & Booking Confirmation
 * Displays complete booking summary + creates booking (payment happens on separate page)
 */

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, MapPin, Package, Home, Calendar, Clock, ShoppingCart, CheckCircle2, Loader2, AlertCircle } from "lucide-react"
import type { GuestBookingState } from "@/lib/hooks/use-guest-booking"
import { toast } from "sonner"
import { createBookingSchema } from "@/lib/validations/booking"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface SummaryStepProps {
  bookingData: GuestBookingState
  onComplete: () => void
}

export function SummaryStep({ bookingData, onComplete }: SummaryStepProps) {
  const router = useRouter()
  const [services, setServices] = useState<Array<{ id: string; name: string; base_price: number }>>([])
  const [loadingServices, setLoadingServices] = useState(true)
  const [isCreatingBooking, setIsCreatingBooking] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)

  // Fetch services details for items
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const supabase = createClient()
        const serviceIds = bookingData.items.map((item) => item.serviceId)
        
        const { data, error } = await supabase
          .from("services")
          .select("id, name, base_price")
          .in("id", serviceIds)

        if (error) throw error
        setServices(data || [])
      } catch (error) {
        console.error("[v0] Failed to fetch services:", error)
        toast.error("Erreur lors du chargement des services")
      } finally {
        setLoadingServices(false)
      }
    }

    if (bookingData.items.length > 0) {
      fetchServices()
    } else {
      setLoadingServices(false)
    }
  }, [bookingData.items])

  const formatDate = (dateString: string) => {
    if (!dateString) return "Date non sélectionnée"
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "Date invalide"
      return date.toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch (error) {
      return "Date invalide"
    }
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
              {bookingData.items.map((item, index) => {
                // Extraire les extras KG depuis specialInstructions
                let extraKg = 0
                let userNotes = ""
                try {
                  if (item.specialInstructions) {
                    const parsed = JSON.parse(item.specialInstructions)
                    extraKg = parsed.extraKg || 0
                    userNotes = parsed.userNotes || ""
                  }
                } catch {
                  // Si ce n'est pas du JSON, c'est probablement une ancienne note texte
                  userNotes = item.specialInstructions || ""
                }

                const service = services.find(s => s.id === item.serviceId)
                const baseWeight = 7 // Poids de base par défaut
                const totalWeight = baseWeight + extraKg

                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">
                        {service?.name || `Service ${index + 1}`}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-muted-foreground">
                          Quantité: {item.quantity}
                        </p>
                        {extraKg > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {totalWeight}kg ({baseWeight}kg + {extraKg}kg)
                          </Badge>
                        )}
                        {extraKg === 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {baseWeight}kg
                          </Badge>
                        )}
                      </div>
                      {userNotes && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Note: "{userNotes}"
                        </p>
                      )}
                    </div>
                    {service && (
                      <div className="text-right">
                        <p className="font-semibold">{service.base_price.toFixed(2)} €</p>
                        {extraKg > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Base: {service.base_price}€
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Date & Time */}
      {bookingData.pickupSlot && bookingData.deliverySlot && (
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
                  {format(new Date(bookingData.pickupSlot.slot_date), "EEEE d MMMM yyyy", { locale: fr })}
                </p>
                <p className="text-sm font-medium text-primary">
                  {bookingData.pickupSlot.label} ({bookingData.pickupSlot.start_time.substring(0,5)}-{bookingData.pickupSlot.end_time.substring(0,5)})
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Livraison prévue</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(bookingData.deliverySlot.slot_date), "EEEE d MMMM yyyy", { locale: fr })}
                </p>
                <p className="text-sm font-medium text-primary">
                  {bookingData.deliverySlot.label} ({bookingData.deliverySlot.start_time.substring(0,5)}-{bookingData.deliverySlot.end_time.substring(0,5)})
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

      {/* Confirm Booking Button */}
      <Card className="border-primary bg-gradient-to-br from-blue-50 to-blue-50">
        <CardContent className="p-6">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">
              En confirmant, vous acceptez les conditions de service et recevrez un email avec un lien de paiement.
            </p>
          </div>
          
          <Button
            size="lg"
            className="w-full"
            onClick={() => handleConfirmBooking(bookingData, router, setIsCreatingBooking, setBookingError)}
            disabled={isCreatingBooking || loadingServices}
          >
            {isCreatingBooking ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Confirmation en cours...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Confirmer ma réservation
              </>
            )}
          </Button>
          
          {bookingError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{bookingError}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Message */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Comment ça fonctionne ?</p>
              <ol className="space-y-1 text-xs">
                <li>1. Vous confirmez votre réservation</li>
                <li>2. Vous recevez un email avec un lien de paiement</li>
                <li>3. Vous complétez le paiement en toute sécurité</li>
                <li>4. Votre réservation est confirmée !</li>
              </ol>
            </div>
          </div>
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

async function handleConfirmBooking(
  bookingData: GuestBookingState,
  router: any,
  setIsCreatingBooking: (value: boolean) => void,
  setBookingError: (value: string | null) => void
) {
  setIsCreatingBooking(true)
  setBookingError(null)

  try {
    // Validate booking data
    if (!bookingData.contact || !bookingData.pickupAddress || !bookingData.deliveryAddress) {
      throw new Error("Données de réservation incomplètes")
    }

    if (bookingData.items.length === 0) {
      throw new Error("Aucun service sélectionné")
    }

    // Prepare booking payload
    const bookingPayload = {
      guestContact: {
        first_name: bookingData.contact.firstName,
        last_name: bookingData.contact.lastName,
        email: bookingData.contact.email,
        phone: bookingData.contact.phone,
      },
      guestPickupAddress: {
        street_address: bookingData.pickupAddress.street_address,
        city: bookingData.pickupAddress.city,
        postal_code: bookingData.pickupAddress.postal_code,
        building_info: bookingData.pickupAddress.building_info,
        access_instructions: bookingData.pickupAddress.access_instructions,
        label: bookingData.pickupAddress.label || "Pickup",
      },
      guestDeliveryAddress: {
        street_address: bookingData.deliveryAddress.street_address,
        city: bookingData.deliveryAddress.city,
        postal_code: bookingData.deliveryAddress.postal_code,
        building_info: bookingData.deliveryAddress.building_info,
        access_instructions: bookingData.deliveryAddress.access_instructions,
        label: bookingData.deliveryAddress.label || "Delivery",
      },
      items: bookingData.items.map((item) => ({
        serviceId: item.serviceId,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions,
      })),
      // Slot-based scheduling with API slots (required)
      pickupSlotId: bookingData.pickupSlot!.id,
      deliverySlotId: bookingData.deliverySlot!.id,
      serviceType: "classic", // Default service type for guest bookings
      totalAmount: bookingData.totalAmount, // ✅ Inclut le prix de base + extras KG
    }

    // Validate with Zod schema
    const validationResult = createBookingSchema.safeParse(bookingPayload)
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(", ")
      throw new Error(`Validation échouée: ${errors}`)
    }

    // Create booking via API
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookingPayload),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Erreur lors de la création de la réservation")
    }

    const result = await response.json()
    const { id: bookingId, session } = result

    console.log("[v0] Booking created successfully:", bookingId)
    if (session?.accessToken && session?.refreshToken) {
      console.log("[v0] Session tokens received, will auto-login user")
    }

    // Show success message
    toast.success("Réservation créée ! En attente de confirmation...")

    // Redirect to guest success page with booking details and session tokens
    const email = bookingData.contact?.email || ""
    const params = new URLSearchParams({
      bookingId: bookingId,
      email: email,
      ...(session?.accessToken && { accessToken: session.accessToken }),
      ...(session?.refreshToken && { refreshToken: session.refreshToken }),
    })
    router.push(`/reservation/guest/success?${params.toString()}`)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"
    console.error("[v0] Booking creation error:", errorMessage)
    setBookingError(errorMessage)
    toast.error(errorMessage)
  } finally {
    setIsCreatingBooking(false)
  }
}
