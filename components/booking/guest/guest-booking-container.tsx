/**
 * Guest Booking Container - Orchestrates the 5-step flow
 * Manages step navigation and state persistence
 */

"use client"

import { useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useGuestBooking, hasAbandonedBooking } from "@/lib/hooks/use-guest-booking"
import type { GuestContact } from "@/lib/validations/guest-contact"
import type { GuestAddress, GuestBookingItem } from "@/lib/validations/guest-booking"
import { GuestStepper } from "./guest-stepper"
import { ContactStep } from "./steps/contact-step"
import { AddressesStep } from "./steps/addresses-step"
import { ServicesStep } from "./steps/services-step"
import { DateTimeStep } from "./steps/datetime-step"
import { SummaryStep } from "./steps/summary-step"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import { GuestBookingErrorBoundary } from "./error-boundary"

const STEP_TITLES = [
  "Vos informations",
  "Adresses",
  "Services",
  "Collecte & Livraison",
  "Paiement",
]

export function GuestBookingContainer() {
  const router = useRouter()
  const {
    state,
    isLoaded,
    updateContact,
    updateAddresses,
    updateServices,
    updateDateTime,
    updatePayment,
    goToStep,
    reset,
    canProceed,
  } = useGuestBooking()

  // Stabiliser les callbacks avec useCallback (AVANT tout early return)
  const handleContactComplete = useCallback((data: GuestContact) => {
    updateContact(data)
  }, [updateContact])

  const handleAddressesComplete = useCallback((pickup: GuestAddress, delivery: GuestAddress) => {
    updateAddresses(pickup, delivery)
  }, [updateAddresses])

  const handleServicesComplete = useCallback((items: GuestBookingItem[], totalAmount: number) => {
    updateServices(items, totalAmount)
  }, [updateServices])

  const handleDateTimeComplete = useCallback((
    pickupDate: Date | null,
    pickupTimeSlot: string | null,
    pickupSlot: any,
    deliverySlot: any
  ) => {
    const dateString = pickupDate ? pickupDate.toISOString() : new Date().toISOString()
    const timeString = pickupSlot 
      ? `${pickupSlot.start_time.substring(0,5)}-${pickupSlot.end_time.substring(0,5)}`
      : pickupTimeSlot || "09:00"
    updateDateTime(
      dateString,
      timeString,
      pickupSlot || undefined,
      deliverySlot || undefined
    )
  }, [updateDateTime])

  const handleNext = useCallback(() => {
    if (canProceed()) {
      goToStep(state.currentStep + 1)
    }
  }, [canProceed, goToStep, state.currentStep])

  const handlePrevious = useCallback(() => {
    if (state.currentStep > 0) {
      goToStep(state.currentStep - 1)
    }
  }, [state.currentStep, goToStep])

  // Prompt to resume abandoned booking
  useEffect(() => {
    if (isLoaded && hasAbandonedBooking() && state.currentStep === 0) {
      const shouldResume = window.confirm(
        "Vous avez une réservation en cours. Voulez-vous reprendre où vous en étiez ?"
      )
      if (!shouldResume) {
        reset()
      } else {
        goToStep(state.currentStep)
      }
    }
  }, [isLoaded, state.currentStep, goToStep, reset])

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Stepper */}
      <GuestStepper
        steps={STEP_TITLES}
        currentStep={state.currentStep}
        completedSteps={state.completedSteps}
        onStepClick={(step: number) => {
          // Allow navigation only to completed steps or next step
          if (state.completedSteps.includes(step) || step === state.currentStep + 1) {
            goToStep(step)
          }
        }}
      />

      {/* Step Content */}
      <div className="bg-card rounded-lg border p-6 min-h-[500px]">
        <GuestBookingErrorBoundary onReset={() => window.location.reload()}>
          {state.currentStep === 0 && (
            <ContactStep
              initialData={state.contact}
              onComplete={handleContactComplete}
            />
          )}

          {state.currentStep === 1 && (
            <AddressesStep
              initialPickupAddress={state.pickupAddress}
              initialDeliveryAddress={state.deliveryAddress}
              onComplete={handleAddressesComplete}
            />
          )}

          {state.currentStep === 2 && (
            <ServicesStep
              initialItems={state.items}
              onComplete={handleServicesComplete}
            />
          )}

          {state.currentStep === 3 && (
            <DateTimeStep
              pickupDate={state.pickupDate ? new Date(state.pickupDate) : null}
              pickupTimeSlot={state.pickupTimeSlot}
              deliveryDate={null}
              updateDateTime={handleDateTimeComplete}
              onNext={handleNext}
            />
          )}

          {state.currentStep === 4 && (
            <SummaryStep
              bookingData={state}
              onComplete={() => {
                // Phase 2: This will trigger Stripe payment
                console.log("[v0] Summary complete, ready for payment (Phase 2)")
              }}
            />
          )}
        </GuestBookingErrorBoundary>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={state.currentStep === 0}
        >
          ← Précédent
        </Button>

        <Button onClick={handleNext} disabled={!canProceed()}>
          {state.currentStep === 4 ? "Payer" : "Suivant →"}
        </Button>
      </div>

      {/* Debug Info (dev only) */}
      {process.env.NODE_ENV === "development" && (
        <Alert>
          <AlertDescription className="text-xs font-mono">
            <strong>Debug:</strong> Step {state.currentStep} | Completed:{" "}
            {state.completedSteps.join(", ")} | Can proceed: {canProceed() ? "Yes" : "No"}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
