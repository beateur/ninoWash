"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Hero } from "@/components/sections/hero"
import { Services } from "@/components/sections/services"
import { HowItWorks } from "@/components/sections/how-it-works"
import { Testimonials } from "@/components/sections/testimonials"
import { Footer } from "@/components/layout/footer"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  const searchParams = useSearchParams()
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [bookingNumber, setBookingNumber] = useState<string | null>(null)

  useEffect(() => {
    const bookingSuccess = searchParams.get("booking_success")
    const bookingNum = searchParams.get("booking_number")

    if (bookingSuccess === "true" && bookingNum) {
      setShowSuccessMessage(true)
      setBookingNumber(bookingNum)
    }
  }, [searchParams])

  const handleCloseSuccessMessage = () => {
    setShowSuccessMessage(false)
    // Remove URL parameters
    const url = new URL(window.location.href)
    url.searchParams.delete("booking_success")
    url.searchParams.delete("booking_number")
    window.history.replaceState({}, "", url.toString())
  }

  return (
    <main className="min-h-screen">
      <Header />

      {showSuccessMessage && bookingNumber && (
        <div className="bg-green-50 border-b border-green-200 p-4">
          <div className="max-w-7xl mx-auto">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <AlertDescription className="flex items-center justify-between">
                <div>
                  <strong className="text-green-800">Réservation confirmée !</strong>
                  <p className="text-green-700 mt-1">
                    Votre réservation <strong>{bookingNumber}</strong> a été créée avec succès. Nous vous contacterons
                    bientôt pour confirmer les détails.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseSuccessMessage}
                  className="text-green-600 hover:text-green-800 hover:bg-green-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}

      <Hero />
      <Services />
      <HowItWorks />
      <Testimonials />
      <Footer />
    </main>
  )
}
