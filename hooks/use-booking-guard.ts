"use client"

import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { BOOKINGS_ENABLED } from "@/lib/flags"

/**
 * Hook pour gérer l'accès aux réservations avec feature flag
 * 
 * Utilisation:
 * ```tsx
 * const { canBook, handleBookingClick } = useBookingGuard()
 * 
 * <Button onClick={handleBookingClick} disabled={!canBook}>
 *   Réserver maintenant
 * </Button>
 * ```
 * 
 * Comportement:
 * - Si BOOKINGS_ENABLED=true : Navigation normale vers /reservation/guest
 * - Si BOOKINGS_ENABLED=false : Affiche toast + bloque la navigation
 */
export function useBookingGuard() {
  const router = useRouter()

  const handleBookingClick = (targetPath: string = "/reservation/guest") => {
    if (!BOOKINGS_ENABLED) {
      // Afficher le toast d'information avec lien Instagram
      toast({
        title: "🚨 Réservations temporairement indisponibles",
        description: "Nous rencontrons un nombre élevé de demandes. Contactez-nous sur Instagram : @nino.wash (lien disponible dans le footer). Merci de votre compréhension !",
        duration: 6000, // 6 secondes pour laisser le temps de lire
      })
      return
    }

    // Si bookings activés, naviguer normalement
    router.push(targetPath)
  }

  return {
    canBook: BOOKINGS_ENABLED,
    handleBookingClick,
  }
}
