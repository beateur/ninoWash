"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AddressStep } from "@/components/booking/address-step"
import { ServicesStep } from "@/components/booking/services-step"
import { DateTimeStep } from "@/components/booking/datetime-step"
import { SummaryStep } from "@/components/booking/summary-step"
import { ChevronLeft, ChevronRight } from "lucide-react"

const STEPS = [
  { id: 1, title: "Adresses", description: "Collecte et livraison" },
  { id: 2, title: "Services", description: "Sélection des articles" },
  { id: 3, title: "Date & Heure", description: "Planification" },
  { id: 4, title: "Récapitulatif", description: "Confirmation" },
]

export default function ReservationPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [bookingData, setBookingData] = useState({
    pickupAddressId: "",
    deliveryAddressId: "",
    items: [] as Array<{ serviceId: string; quantity: number; specialInstructions?: string }>,
    pickupDate: "",
    pickupTimeSlot: "",
    specialInstructions: "",
  })

  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin?redirectTo=/reservation")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const progress = (currentStep / STEPS.length) * 100

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const updateBookingData = (data: Partial<typeof bookingData>) => {
    setBookingData((prev) => ({ ...prev, ...data }))
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return bookingData.pickupAddressId && bookingData.deliveryAddressId
      case 2:
        return bookingData.items.length > 0
      case 3:
        return bookingData.pickupDate && bookingData.pickupTimeSlot
      default:
        return true
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-balance mb-2">Nouvelle réservation</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Planifiez votre service de pressing en quelques étapes
            </p>
          </div>

          {/* Progress */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-4 overflow-x-auto pb-2">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center flex-shrink-0">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                      step.id <= currentStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step.id}
                  </div>
                  <div className="ml-2 sm:ml-3 min-w-0">
                    <div className="text-xs sm:text-sm font-medium truncate">{step.title}</div>
                    <div className="text-xs text-muted-foreground hidden sm:block">{step.description}</div>
                  </div>
                  {index < STEPS.length - 1 && <div className="flex-1 mx-2 sm:mx-4 h-px bg-border min-w-[20px]" />}
                </div>
              ))}
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Content */}
          <Card className="mb-6 sm:mb-8">
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl">{STEPS[currentStep - 1].title}</CardTitle>
              <CardDescription className="text-sm">{STEPS[currentStep - 1].description}</CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              {currentStep === 1 && (
                <AddressStep
                  pickupAddressId={bookingData.pickupAddressId}
                  deliveryAddressId={bookingData.deliveryAddressId}
                  onUpdate={updateBookingData}
                />
              )}
              {currentStep === 2 && <ServicesStep items={bookingData.items} onUpdate={updateBookingData} />}
              {currentStep === 3 && (
                <DateTimeStep
                  pickupDate={bookingData.pickupDate}
                  pickupTimeSlot={bookingData.pickupTimeSlot}
                  onUpdate={updateBookingData}
                />
              )}
              {currentStep === 4 && <SummaryStep bookingData={bookingData} />}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="bg-transparent flex-1 sm:flex-none"
              size="sm"
            >
              <ChevronLeft className="mr-1 sm:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Précédent</span>
              <span className="sm:hidden">Préc.</span>
            </Button>

            <div className="text-xs sm:text-sm text-muted-foreground text-center">
              <span className="hidden sm:inline">Étape </span>
              {currentStep}
              <span className="hidden sm:inline"> sur </span>
              <span className="sm:hidden">/</span>
              {STEPS.length}
            </div>

            {currentStep < STEPS.length ? (
              <Button onClick={handleNext} disabled={!canProceed()} className="flex-1 sm:flex-none" size="sm">
                <span className="hidden sm:inline">Suivant</span>
                <span className="sm:hidden">Suiv.</span>
                <ChevronRight className="ml-1 sm:ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button disabled={!canProceed()} className="flex-1 sm:flex-none" size="sm">
                <span className="hidden sm:inline">Confirmer la réservation</span>
                <span className="sm:hidden">Confirmer</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
