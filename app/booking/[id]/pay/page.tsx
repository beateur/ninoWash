import { notFound, redirect } from "next/navigation"
import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface BookingPaymentPageProps {
  params: {
    id: string
  }
}

async function BookingPaymentContent({ bookingId }: { bookingId: string }) {
  const supabase = await createClient()

  // Fetch booking details
  const { data: booking, error } = await supabase
    .from("bookings")
    .select(`
      *,
      booking_items (
        id,
        service_id,
        quantity,
        unit_price,
        special_instructions
      )
    `)
    .eq("id", bookingId)
    .single()

  if (error || !booking) {
    console.error("[v0] Booking not found:", error)
    notFound()
  }

  // Check if booking is in pending_payment status
  if (booking.status !== "pending_payment") {
    console.warn("[v0] Booking is not in pending_payment status:", booking.status)
    // If already paid or confirmed, redirect to success page
    if (booking.status === "confirmed" && booking.paid_at) {
      redirect(`/booking/${bookingId}/success`)
    }
    // Otherwise show error
    notFound()
  }

  // Format payment amount
  const totalAmountCents = booking.total_amount_cents || (booking.total_amount ?? 0) * 100
  const totalAmount = totalAmountCents / 100
  const formattedAmount = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(totalAmount)

  // Extract addresses from metadata or database
  const isGuestBooking = booking.metadata?.is_guest_booking
  let pickupAddress: any = null
  let deliveryAddress: any = null

  if (isGuestBooking && booking.metadata) {
    pickupAddress = booking.metadata.guest_pickup_address
    deliveryAddress = booking.metadata.guest_delivery_address
  } else if (booking.pickup_address_id && booking.delivery_address_id) {
    // Fetch addresses for authenticated bookings
    const { data: addresses } = await supabase
      .from("user_addresses")
      .select("*")
      .in("id", [booking.pickup_address_id, booking.delivery_address_id])

    pickupAddress = addresses?.find((a) => a.id === booking.pickup_address_id)
    deliveryAddress = addresses?.find((a) => a.id === booking.delivery_address_id)
  }

  // Parse booking items with service details
  const items = (booking.booking_items as any[]) || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Procéder au paiement</h1>
          <p className="text-slate-600 mt-2">Finalisez votre réservation en effectuant le paiement</p>
        </div>

        {/* Booking Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Récapitulatif de la réservation</CardTitle>
            <CardDescription>Réservation n° {booking.booking_number}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Addresses */}
            {pickupAddress && deliveryAddress && (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Adresse de collecte</h3>
                  <div className="text-sm text-slate-600 space-y-1">
                    <p>{pickupAddress.street_address}</p>
                    {pickupAddress.building_info && <p>{pickupAddress.building_info}</p>}
                    <p>
                      {pickupAddress.postal_code} {pickupAddress.city}
                    </p>
                    {pickupAddress.access_instructions && (
                      <p className="italic text-slate-500">{pickupAddress.access_instructions}</p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Adresse de livraison</h3>
                  <div className="text-sm text-slate-600 space-y-1">
                    <p>{deliveryAddress.street_address}</p>
                    {deliveryAddress.building_info && <p>{deliveryAddress.building_info}</p>}
                    <p>
                      {deliveryAddress.postal_code} {deliveryAddress.city}
                    </p>
                    {deliveryAddress.access_instructions && (
                      <p className="italic text-slate-500">{deliveryAddress.access_instructions}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Dates */}
            {booking.pickup_date && (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Date de collecte</h3>
                  <p className="text-sm text-slate-600">
                    {new Date(booking.pickup_date).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  {booking.pickup_time_slot && (
                    <p className="text-sm text-slate-600">Créneau : {booking.pickup_time_slot}</p>
                  )}
                </div>
                {booking.delivery_date && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Date de livraison</h3>
                    <p className="text-sm text-slate-600">
                      {new Date(booking.delivery_date).toLocaleDateString("fr-FR", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    {booking.delivery_time_slot && (
                      <p className="text-sm text-slate-600">Créneau : {booking.delivery_time_slot}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Services */}
            {items.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Services commandés</h3>
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item.id} className="flex justify-between text-sm text-slate-600">
                      <span>
                        Service (quantité: {item.quantity})
                        {item.special_instructions && (
                          <span className="block text-xs text-slate-500 italic">
                            {item.special_instructions}
                          </span>
                        )}
                      </span>
                      <span>{(item.unit_price * item.quantity).toFixed(2)}€</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Total */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-900">Montant total</span>
                <span className="text-2xl font-bold text-blue-600">{formattedAmount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Button */}
        <Card>
          <CardHeader>
            <CardTitle>Paiement sécurisé</CardTitle>
            <CardDescription>Vous serez redirigé vers Stripe pour finaliser votre paiement</CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentButton bookingId={bookingId} />
          </CardContent>
        </Card>

        {/* Info */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            ℹ️ Votre réservation est en attente de paiement. Cliquez sur le bouton ci-dessous pour
            procéder au paiement sécurisé.
          </p>
        </div>
      </div>
    </div>
  )
}

function PaymentButton({ bookingId }: { bookingId: string }) {
  const handlePaymentClick = async () => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/create-payment-intent`, {
        method: "POST",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erreur lors de la création de la session de paiement")
      }

      const data = await response.json()

      // Redirect to Stripe Checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      }
    } catch (error) {
      console.error("[v0] Payment error:", error)
      alert(`Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`)
    }
  }

  return (
    <Button size="lg" onClick={handlePaymentClick} className="w-full" disabled={false}>
      Payer maintenant
    </Button>
  )
}

export default async function BookingPaymentPage({ params }: BookingPaymentPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-slate-600">Chargement de la réservation...</p>
          </div>
        </div>
      }
    >
      {/* @ts-expect-error Server Component */}
      <BookingPaymentContent bookingId={params.id} />
    </Suspense>
  )
}
