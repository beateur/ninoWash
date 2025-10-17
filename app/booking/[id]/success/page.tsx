import { notFound } from "next/navigation"
import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Loader2 } from "lucide-react"
import Link from "next/link"

interface BookingSuccessPageProps {
  params: {
    id: string
  }
  searchParams?: {
    session_id?: string
  }
}

async function BookingSuccessContent({
  bookingId,
  sessionId,
}: {
  bookingId: string
  sessionId?: string
}) {
  const supabase = await createClient()

  // Fetch booking details
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single()

  if (error || !booking) {
    console.error("[v0] Booking not found:", error)
    notFound()
  }

  // Verify session_id matches if provided (for extra security)
  if (sessionId && booking.stripe_session_id !== sessionId) {
    console.warn("[v0] Session ID mismatch for booking:", bookingId)
    notFound()
  }

  // If payment hasn't been confirmed yet, show a message
  const isPaymentConfirmed = booking.payment_status === "succeeded" || booking.status === "confirmed"

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-green-200 rounded-full animate-pulse"></div>
              <CheckCircle2 className="h-16 w-16 text-green-600 relative" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-green-900 mb-2">Paiement confirmé !</h1>
          <p className="text-green-700">
            Votre réservation a été confirmée avec succès
          </p>
        </div>

        {/* Booking Details Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Détails de votre réservation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Booking Number */}
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
              <span className="text-slate-600">Numéro de réservation</span>
              <span className="font-mono font-bold text-slate-900 text-lg">{booking.booking_number}</span>
            </div>

            {/* Payment Confirmation */}
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-200">
              <span className="text-green-700 font-semibold">Paiement</span>
              <span className="text-green-700 font-semibold">
                ✓ Confirmé
              </span>
            </div>

            {/* Amount */}
            {booking.total_amount_cents && (
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Montant payé</span>
                <span className="text-2xl font-bold text-slate-900">
                  {new Intl.NumberFormat("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                  }).format(booking.total_amount_cents / 100)}
                </span>
              </div>
            )}

            {/* Dates */}
            {booking.pickup_date && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">Date de collecte</p>
                  <p className="font-semibold text-slate-900">
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
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600 mb-1">Date de livraison</p>
                    <p className="font-semibold text-slate-900">
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
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Prochaines étapes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-200 text-green-700 font-semibold">
                  1
                </div>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Confirmation envoyée</p>
                <p className="text-sm text-slate-600">Un email de confirmation a été envoyé à votre adresse</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-200 text-green-700 font-semibold">
                  2
                </div>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Collecte programmée</p>
                <p className="text-sm text-slate-600">
                  Nous viendrons collecter vos vêtements à la date et heure prévues
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-200 text-green-700 font-semibold">
                  3
                </div>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Livraison</p>
                <p className="text-sm text-slate-600">
                  Vos vêtements nettoyés et repassés seront livrés à la date prévue
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/dashboard" className="flex-1">
            <Button variant="outline" size="lg" className="w-full">
              Voir mes réservations
            </Button>
          </Link>
          <Link href="/" className="flex-1">
            <Button size="lg" className="w-full bg-green-600 hover:bg-green-700">
              Accueil
            </Button>
          </Link>
        </div>

        {/* Info Message */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            💡 Vous pouvez suivre l'état de votre réservation depuis votre tableau de bord.
          </p>
        </div>
      </div>
    </div>
  )
}

export default async function BookingSuccessPage({ params, searchParams }: BookingSuccessPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            <p className="text-slate-600">Traitement de votre confirmation...</p>
          </div>
        </div>
      }
    >
      {/* @ts-expect-error Server Component */}
      <BookingSuccessContent bookingId={params.id} sessionId={searchParams?.session_id} />
    </Suspense>
  )
}
