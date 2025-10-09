/**
 * Guest Booking Container - Orchestrates the 5-step flow
 * Manages step navigation and state persistence
 */

"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useGuestBooking, hasAbandonedBooking } from "@/lib/hooks/use-guest-booking"
import type { GuestContact } from "@/lib/validations/guest-contact"
import { GuestStepper } from "./guest-stepper"
import { ContactStep } from "./steps/contact-step"
// import { AddressesStep } from "./steps/addresses-step"
// import { ServicesStep } from "./steps/services-step"
// import { DateTimeStep } from "./steps/datetime-step"
// import { SummaryStep } from "./steps/summary-step"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

const STEP_TITLES = [
  "Vos informations",
  "Adresses",
  "Services",
  "Date & heure",
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

  const handleNext = () => {
    if (canProceed()) {
      goToStep(state.currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (state.currentStep > 0) {
      goToStep(state.currentStep - 1)
    }
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
        {state.currentStep === 0 && (
          <ContactStep
            initialData={state.contact}
            onComplete={(data: GuestContact) => {
              updateContact(data)
              handleNext()
            }}
          />
        )}

        {state.currentStep === 1 && (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Étape Adresses - En cours de développement</p>
          </div>
        )}

        {state.currentStep === 2 && (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Étape Services - En cours de développement</p>
          </div>
        )}

        {state.currentStep === 3 && (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Étape Date & Heure - En cours de développement</p>
          </div>
        )}

        {state.currentStep === 4 && (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Étape Paiement - En cours de développement</p>
          </div>
        )}
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
