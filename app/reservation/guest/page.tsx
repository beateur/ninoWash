/**
 * Guest Booking Flow - Main Entry Point
 * Route: /reservation/guest
 * 
 * 5-step flow for non-authenticated users:
 * 0. Contact information
 * 1. Pickup & delivery addresses
 * 2. Service selection
 * 3. Date & time picker
 * 4. Summary & payment
 */

import { Suspense } from "react"
import { GuestBookingContainer } from "@/components/booking/guest/guest-booking-container"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export const metadata = {
  title: "Réserver sans compte - Nino Wash",
  description:
    "Réservez votre pressing à domicile en quelques clics. Créez automatiquement votre compte après paiement.",
}

export default function GuestBookingPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Réservez votre pressing
        </h1>
        <p className="text-muted-foreground">
          Un compte sera créé automatiquement après votre paiement
        </p>
      </div>

      <Suspense fallback={<LoadingSpinner />}>
        <GuestBookingContainer />
      </Suspense>
    </div>
  )
}
