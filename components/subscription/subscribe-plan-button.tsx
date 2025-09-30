"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface SubscribePlanButtonProps {
  planId: string
  planName: string
  isCurrentPlan: boolean
  isPopular: boolean
}

export function SubscribePlanButton({ planId, planName, isCurrentPlan, isPopular }: SubscribePlanButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubscribe = async () => {
    console.log("[v0] Subscribe to plan:", planId, planName)
    setIsLoading(true)
    setError(null)

    try {
      // NEGATIVE PROGRAMMING: Verify plan ID exists before proceeding
      if (!planId || typeof planId !== "string") {
        throw new Error("ID de plan invalide")
      }

      // Navigate to checkout page
      router.push(`/subscription/checkout?plan=${encodeURIComponent(planId)}`)
    } catch (err) {
      console.error("[v0] Error navigating to checkout:", err)
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full space-y-2">
      <Button
        className="w-full"
        variant={isPopular ? "default" : "outline"}
        onClick={handleSubscribe}
        disabled={isCurrentPlan || isLoading}
      >
        {isLoading ? "Chargement..." : isCurrentPlan ? "Abonnement actuel" : "Choisir ce plan"}
      </Button>
      {error && <p className="text-sm text-destructive text-center">{error}</p>}
    </div>
  )
}
