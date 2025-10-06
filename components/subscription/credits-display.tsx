"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Sparkles, Clock, Calendar } from "lucide-react"

interface UserCredits {
  creditsRemaining: number
  creditsTotal: number
  weekStartDate: string
  resetAt: string
}

interface CreditsDisplayProps {
  userId: string
  compact?: boolean
}

export function CreditsDisplay({ userId, compact = false }: CreditsDisplayProps) {
  const [credits, setCredits] = useState<UserCredits | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCredits()
  }, [userId])

  const fetchCredits = async () => {
    try {
      const response = await fetch("/api/subscriptions/credits")
      const data = await response.json()

      if (response.ok && data.credits) {
        setCredits(data.credits)
      } else {
        setCredits(null)
      }
    } catch (error) {
      console.error("Error fetching credits:", error)
      setCredits(null)
    } finally {
      setLoading(false)
    }
  }

  const getResetMessage = (resetAt: string) => {
    const resetDate = new Date(resetAt)
    const now = new Date()
    const diffDays = Math.ceil((resetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Reset aujourd'hui"
    if (diffDays === 1) return "Reset demain"
    return `Reset dans ${diffDays} jours`
  }

  const getProgressColor = (remaining: number, total: number) => {
    const percentage = (remaining / total) * 100
    if (percentage >= 50) return "bg-green-500"
    if (percentage >= 25) return "bg-yellow-500"
    return "bg-red-500"
  }

  if (loading) {
    return (
      <Card className={compact ? "border-0 shadow-none" : ""}>
        <CardContent className={compact ? "p-4" : "p-6"}>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-2 bg-muted rounded w-full" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!credits) {
    return (
      <Card className={compact ? "border-0 shadow-none" : ""}>
        <CardContent className={compact ? "p-4" : "p-6"}>
          <div className="text-center text-muted-foreground">
            <p className="text-sm">Aucun crédit disponible</p>
            <p className="text-xs mt-1">Souscrivez à un abonnement pour bénéficier de réservations gratuites</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const usagePercentage = ((credits.creditsTotal - credits.creditsRemaining) / credits.creditsTotal) * 100

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-medium">Réservations gratuites</span>
          </div>
          <Badge variant={credits.creditsRemaining > 0 ? "default" : "secondary"}>
            {credits.creditsRemaining} / {credits.creditsTotal}
          </Badge>
        </div>

        <div className="space-y-1">
          <Progress value={usagePercentage} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {credits.creditsRemaining === 0 ? (
                "Tous les crédits utilisés"
              ) : (
                <>
                  {credits.creditsRemaining} réservation{credits.creditsRemaining > 1 ? "s" : ""} restante
                  {credits.creditsRemaining > 1 ? "s" : ""}
                </>
              )}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {getResetMessage(credits.resetAt)}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Réservations Gratuites
            </CardTitle>
            <CardDescription>Incluses dans votre abonnement cette semaine</CardDescription>
          </div>
          <Badge
            variant={credits.creditsRemaining > 0 ? "default" : "secondary"}
            className="text-lg px-4 py-1"
          >
            {credits.creditsRemaining} / {credits.creditsTotal}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Barre de progression */}
        <div className="space-y-2">
          <Progress
            value={usagePercentage}
            className={`h-3 ${getProgressColor(credits.creditsRemaining, credits.creditsTotal)}`}
          />
          <p className="text-sm text-muted-foreground">
            {credits.creditsRemaining === 0 ? (
              <span className="text-destructive font-medium">Tous vos crédits ont été utilisés cette semaine</span>
            ) : credits.creditsRemaining === credits.creditsTotal ? (
              <span className="text-green-600 font-medium">
                Vous avez tous vos crédits disponibles !
              </span>
            ) : (
              <span>
                {credits.creditsRemaining} réservation{credits.creditsRemaining > 1 ? "s" : ""} gratuite
                {credits.creditsRemaining > 1 ? "s" : ""} restante{credits.creditsRemaining > 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>

        {/* Reset date */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground border-t pt-4">
          <Calendar className="h-4 w-4" />
          <span>{getResetMessage(credits.resetAt)}</span>
        </div>

        {/* Info bulle */}
        <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
          <p>• 1 crédit = 1 réservation gratuite jusqu'à 15kg</p>
          <p>• Au-delà de 15kg, le surplus est facturé</p>
          <p>• Les crédits non utilisés sont perdus au reset</p>
        </div>
      </CardContent>
    </Card>
  )
}
