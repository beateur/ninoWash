"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X } from "lucide-react"
import { getUserConsent, saveUserConsent } from "@/lib/gdpr/consent"

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if user has already given consent
    const consent = getUserConsent()
    if (!consent) {
      setIsVisible(true)
    }
  }, [])

  const handleAcceptAll = () => {
    saveUserConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    })
    setIsVisible(false)
  }

  const handleAcceptNecessary = () => {
    saveUserConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    })
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6">
      <Card className="mx-auto max-w-4xl border-2 bg-background p-6 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Nous respectons votre vie privée</h3>
              <p className="text-sm text-muted-foreground">
                Nous utilisons des cookies pour améliorer votre expérience, analyser le trafic et personnaliser le
                contenu. Vous pouvez choisir d'accepter tous les cookies ou uniquement les cookies nécessaires au
                fonctionnement du site.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={handleAcceptAll} className="flex-1 sm:flex-none">
                Accepter tout
              </Button>
              <Button onClick={handleAcceptNecessary} variant="outline" className="flex-1 sm:flex-none bg-transparent">
                Nécessaires uniquement
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              En continuant, vous acceptez notre{" "}
              <a href="/privacy" className="underline hover:text-foreground">
                politique de confidentialité
              </a>{" "}
              et nos{" "}
              <a href="/terms" className="underline hover:text-foreground">
                conditions d'utilisation
              </a>
              .
            </p>
          </div>

          <Button variant="ghost" size="icon" onClick={handleAcceptNecessary} className="shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  )
}
