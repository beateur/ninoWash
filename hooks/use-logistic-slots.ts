/**
 * Hook pour charger et gérer les créneaux logistiques disponibles
 * @see docs/IMPLEMENTATION_PLAN_SLOTS.md
 */

"use client"

import { useState, useEffect } from "react"
import type { LogisticSlot } from "@/lib/types/logistic-slots"

interface UseLogisticSlotsParams {
  role: "pickup" | "delivery"
  startDate?: string
  endDate?: string
  enabled?: boolean // Permet de désactiver le fetch (ex: avant sélection service)
}

interface UseLogisticSlotsReturn {
  slots: LogisticSlot[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useLogisticSlots({
  role,
  startDate,
  endDate,
  enabled = true,
}: UseLogisticSlotsParams): UseLogisticSlotsReturn {
  const [slots, setSlots] = useState<LogisticSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSlots = async () => {
    if (!enabled) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({ role })
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)

      const res = await fetch(`/api/logistic-slots?${params}`)

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(
          errorData.error || "Erreur lors du chargement des créneaux"
        )
      }

      const data = await res.json()
      setSlots(data.slots || [])
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur inconnue"
      setError(message)
      console.error("[v0] useLogisticSlots error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSlots()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, startDate, endDate, enabled])

  return {
    slots,
    loading,
    error,
    refetch: fetchSlots,
  }
}
