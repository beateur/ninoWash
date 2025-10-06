"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Sparkles, AlertCircle, Loader2 } from "lucide-react"

interface CreditUsageBadgeProps {
  userId: string
  bookingWeightKg: number
  onCreditCheck?: (canUse: boolean, totalAmount: number) => void
}

interface CreditCheckResult {
  canUse: boolean
  creditsRemaining: number
  totalAmount: number
  discountAmount: number
  surplusAmount: number
  message: string
}

/**
 * Badge qui affiche si un crédit peut être utilisé pour une réservation
 * Affiche "Gratuit" ou le montant du surplus
 */
export function CreditUsageBadge({ userId, bookingWeightKg, onCreditCheck }: CreditUsageBadgeProps) {
  const [checking, setChecking] = useState(true)
  const [creditCheck, setCreditCheck] = useState<CreditCheckResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkCreditAvailability()
  }, [userId, bookingWeightKg])

  const checkCreditAvailability = async () => {
    setChecking(true)
    setError(null)

    try {
      const response = await fetch("/api/subscriptions/credits/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingWeightKg }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la vérification des crédits")
      }

      const data = await response.json()
      setCreditCheck(data)

      // Notifier le parent du résultat
      if (onCreditCheck) {
        onCreditCheck(data.canUse, data.totalAmount)
      }
    } catch (err) {
      console.error("[CreditUsageBadge] Error:", err)
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setChecking(false)
    }
  }

  if (checking) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Vérification des crédits...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="py-2">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">{error}</AlertDescription>
      </Alert>
    )
  }

  if (!creditCheck) {
    return null
  }

  // Pas de crédit disponible - tarif classique
  if (!creditCheck.canUse) {
    return (
      <Alert className="py-3">
        <AlertDescription className="text-sm">
          <strong>Tarif classique appliqué</strong> - {creditCheck.totalAmount.toFixed(2)}€
          <br />
          <span className="text-xs text-muted-foreground">Aucun crédit disponible cette semaine</span>
        </AlertDescription>
      </Alert>
    )
  }

  // Crédit disponible - réservation gratuite (≤ 15kg)
  if (bookingWeightKg <= 15) {
    return (
      <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900 py-3">
        <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertDescription className="text-sm">
          <strong className="text-green-700 dark:text-green-300">Réservation gratuite !</strong>
          <br />
          <span className="text-xs text-green-600 dark:text-green-400">
            1 crédit sera utilisé • {creditCheck.creditsRemaining} crédit(s) restant(s) après
          </span>
        </AlertDescription>
      </Alert>
    )
  }

  // Crédit disponible - avec surplus (> 15kg)
  const surplusKg = bookingWeightKg - 15
  return (
    <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900 py-3">
      <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <AlertDescription className="text-sm">
        <strong className="text-blue-700 dark:text-blue-300">15kg gratuits (crédit utilisé)</strong>
        <br />
        <span className="text-xs text-blue-600 dark:text-blue-400">
          Surplus de {surplusKg.toFixed(1)}kg : {creditCheck.surplusAmount.toFixed(2)}€ • Total :{" "}
          {creditCheck.totalAmount.toFixed(2)}€
        </span>
      </AlertDescription>
    </Alert>
  )
}
