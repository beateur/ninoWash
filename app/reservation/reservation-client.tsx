"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AddressStep } from "@/components/booking/address-step"
import { ServicesStep } from "@/components/booking/services-step"
import { DateTimeStep } from "@/components/booking/datetime-step"
import { SummaryStep } from "@/components/booking/summary-step"
import { ChevronLeft, ChevronRight, Info, Edit } from "lucide-react"
import type { LogisticSlot } from "@/lib/types/logistic-slots"

const STEPS = [
  { id: 1, title: "Adresses", description: "Collecte et livraison" },
  { id: 2, title: "Services", description: "Sélection des articles" },
  { id: 3, title: "Collecte & Livraison", description: "Créneaux horaires" },
  { id: 4, title: "Récapitulatif", description: "Confirmation" },
]

interface ReservationClientProps {
  existingBooking?: any
  isModification?: boolean
  serviceType?: string
}

export default function ReservationClient({
  existingBooking,
  isModification = false,
  serviceType = "classic",
}: ReservationClientProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [bookingData, setBookingData] = useState({
    pickupAddressId: existingBooking?.pickup_address_id || "",
    deliveryAddressId: existingBooking?.delivery_address_id || "",
    pickupAddress: existingBooking?.pickup_address || null,
    deliveryAddress: existingBooking?.delivery_address || null,
    items: existingBooking?.booking_items || [],
    pickupDate: existingBooking?.pickup_date || "",
    pickupTimeSlot: existingBooking?.pickup_time_slot || "",
    pickupSlot: null as LogisticSlot | null,
    deliverySlot: null as LogisticSlot | null,
    specialInstructions: existingBooking?.special_instructions || "",
    serviceType: serviceType,
  })

  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const requiresAuth = serviceType !== "classic" || isModification

    if (!loading && requiresAuth && !user) {
      router.push(`/auth/signin?redirectTo=/reservation?service=${serviceType}`)
      return
    }
  }, [user, loading, router, serviceType, isModification])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user && (bookingData.serviceType !== "classic" || isModification)) {
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

  const getServiceInfo = () => {
    switch (bookingData.serviceType) {
      case "monthly":
        return { name: "Abonnement Mensuel", price: "99,99€/mois" }
      case "quarterly":
        return { name: "Abonnement Trimestriel", price: "249,99€/trimestre" }
      default:
        return { name: "Service Classique", price: "24,99€ pour 8kg" }
    }
  }

  const serviceInfo = getServiceInfo()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-balance mb-2">
              {isModification ? "Modifier la réservation" : "Nouvelle réservation"}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              {isModification
                ? "Modifiez les détails de votre réservation"
                : "Planifiez votre service de pressing en quelques étapes"}
            </p>
            <div className="mt-4 flex gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                <Info className="h-4 w-4" />
                {serviceInfo.name} - {serviceInfo.price}
              </div>
              {isModification && (
                <Badge variant="outline" className="gap-1">
                  <Edit className="h-3 w-3" />
                  Mode modification
                </Badge>
              )}
            </div>
          </div>

          {/* Modification notice */}
          {isModification && (
            <Alert className="mb-6 bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                <strong>Mode modification :</strong> Les services sélectionnés ne peuvent pas être modifiés. Vous pouvez uniquement modifier les adresses, la date et le créneau horaire.
              </AlertDescription>
            </Alert>
          )}

          {!user && !isModification && bookingData.serviceType === "classic" && (
            <Alert className="mb-6">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Vous réservez en tant qu'invité. Pour accéder aux abonnements et à la gestion de vos réservations,
                <Button variant="link" className="p-0 h-auto ml-1" onClick={() => router.push("/auth/signin")}>
                  connectez-vous
                </Button>
                .
              </AlertDescription>
            </Alert>
          )}

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
                  pickupAddress={bookingData.pickupAddress}
                  deliveryAddress={bookingData.deliveryAddress}
                  onUpdate={updateBookingData}
                />
              )}
              {currentStep === 2 && (
                <ServicesStep
                  items={bookingData.items}
                  onUpdate={updateBookingData}
                  serviceType={bookingData.serviceType}
                  readOnly={isModification}
                />
              )}
              {currentStep === 3 && (
                <DateTimeStep
                  pickupDate={bookingData.pickupDate ? new Date(bookingData.pickupDate) : null}
                  pickupTimeSlot={bookingData.pickupTimeSlot}
                  deliveryDate={null}
                  updateDateTime={(
                    pickupDate: Date | null,
                    pickupTimeSlot: string | null,
                    pickupSlot,
                    deliverySlot
                  ) => {
                    // Convert Date to string format for the booking data
                    const dateString = pickupDate ? pickupDate.toISOString().split("T")[0] : ""
                    const timeString = pickupSlot 
                      ? `${pickupSlot.start_time.substring(0,5)}-${pickupSlot.end_time.substring(0,5)}`
                      : pickupTimeSlot || ""
                    updateBookingData({
                      pickupDate: dateString,
                      pickupTimeSlot: timeString,
                      pickupSlot,
                      deliverySlot,
                    })
                  }}
                  onNext={handleNext}
                />
              )}
              {currentStep === 4 && (
                <SummaryStep
                  bookingData={bookingData}
                  serviceType={bookingData.serviceType}
                  isModification={isModification}
                  bookingId={existingBooking?.id}
                />
              )}
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
                <span className="hidden sm:inline">
                  {isModification ? "Enregistrer les modifications" : "Confirmer la réservation"}
                </span>
                <span className="sm:hidden">{isModification ? "Enregistrer" : "Confirmer"}</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
