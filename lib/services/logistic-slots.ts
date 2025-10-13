/**
 * Service pour la gestion des créneaux logistiques (Collecte & Livraison)
 * @see docs/PRD/PRD_BOOKING_COLLECTION_DELIVERY.md
 * @see docs/IMPLEMENTATION_PLAN_SLOTS.md
 */

import { createClient } from "@/lib/supabase/server"
import type {
  LogisticSlot,
  DelayValidationResult,
  ServiceType,
} from "@/lib/types/logistic-slots"

/**
 * Récupère les slots disponibles filtrés par rôle et plage de dates
 * Utilise RLS: ne retourne que is_open = true et slot_date >= today
 *
 * @param role - Type de créneau ('pickup' ou 'delivery')
 * @param startDate - Date de début (ISO format YYYY-MM-DD, optionnel)
 * @param endDate - Date de fin (ISO format YYYY-MM-DD, optionnel)
 * @returns Liste des slots disponibles triés par date/heure
 */
export async function getAvailableSlots(
  role: "pickup" | "delivery",
  startDate?: string,
  endDate?: string
): Promise<LogisticSlot[]> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from("logistic_slots")
      .select("*")
      .eq("role", role)
      .order("slot_date", { ascending: true })
      .order("start_time", { ascending: true })

    if (startDate) {
      query = query.gte("slot_date", startDate)
    }
    if (endDate) {
      query = query.lte("slot_date", endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching logistic slots:", error)
      throw new Error("Impossible de charger les créneaux disponibles")
    }

    return (data as LogisticSlot[]) || []
  } catch (error) {
    console.error("[v0] getAvailableSlots exception:", error)
    throw error
  }
}

/**
 * Crée un enregistrement de demande de slot pour tracking analytique
 * Non-bloquant: une erreur n'empêche pas la création du booking
 *
 * @param slotId - ID du slot demandé
 * @param role - Type de créneau ('pickup' ou 'delivery')
 * @param bookingId - ID de la réservation associée
 * @param createdBy - ID utilisateur (null pour guest)
 */
export async function createSlotRequest(
  slotId: string,
  role: "pickup" | "delivery",
  bookingId: string,
  createdBy?: string
): Promise<void> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from("slot_requests").insert({
      slot_id: slotId,
      role,
      booking_id: bookingId,
      created_by: createdBy || null,
    })

    if (error) {
      console.error("[v0] Error creating slot request:", error)
      // Non-bloquant: on log mais on ne throw pas
    }
  } catch (error) {
    console.error("[v0] createSlotRequest exception:", error)
    // Non-bloquant
  }
}

/**
 * Valide que le délai entre collecte et livraison respecte les règles métier
 *
 * Règles:
 * - Service Express: minimum 24h entre fin collecte et début livraison
 * - Service Classic: minimum 72h entre fin collecte et début livraison
 *
 * @param pickupSlot - Slot de collecte sélectionné
 * @param deliverySlot - Slot de livraison sélectionné
 * @param serviceType - Type de service ('express' ou 'classic')
 * @returns Objet avec valid (boolean) et message d'erreur éventuel
 */
export function validateSlotDelay(
  pickupSlot: LogisticSlot,
  deliverySlot: LogisticSlot,
  serviceType: ServiceType
): DelayValidationResult {
  try {
    // Extraire HH:MM du format PostgreSQL TIME (HH:MM:SS)
    const pickupEndTime = pickupSlot.end_time.substring(0, 5)
    const deliveryStartTime = deliverySlot.start_time.substring(0, 5)
    
    // Calculer timestamp de fin de collecte
    const pickupEndDateTime = new Date(
      `${pickupSlot.slot_date}T${pickupEndTime}:00`
    )

    // Calculer timestamp de début de livraison
    const deliveryStartDateTime = new Date(
      `${deliverySlot.slot_date}T${deliveryStartTime}:00`
    )

    // Vérifier que livraison est après collecte
    if (deliveryStartDateTime <= pickupEndDateTime) {
      return {
        valid: false,
        error:
          "La livraison doit être planifiée après la collecte.",
        requiredHours: serviceType === "express" ? 24 : 72,
        actualHours: 0,
      }
    }

    // Calculer différence en heures
    const diffMs = deliveryStartDateTime.getTime() - pickupEndDateTime.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)

    // Déterminer délai minimum selon service
    const minHours = serviceType === "express" ? 24 : 72
    const serviceLabel = serviceType === "express" ? "Express" : "Classic"

    if (diffHours < minHours) {
      return {
        valid: false,
        error: `Le délai minimum entre collecte et livraison est de ${minHours}h pour le service ${serviceLabel}. Délai actuel: ${Math.round(diffHours)}h.`,
        requiredHours: minHours,
        actualHours: Math.round(diffHours),
      }
    }

    return {
      valid: true,
      requiredHours: minHours,
      actualHours: Math.round(diffHours),
    }
  } catch (error) {
    console.error("[v0] validateSlotDelay exception:", error)
    return {
      valid: false,
      error: "Erreur lors de la validation du délai entre les créneaux.",
    }
  }
}

/**
 * Récupère un slot par son ID (utile pour backend validation)
 *
 * @param slotId - UUID du slot
 * @returns Slot ou null si introuvable
 */
export async function getSlotById(
  slotId: string
): Promise<LogisticSlot | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("logistic_slots")
      .select("*")
      .eq("id", slotId)
      .single()

    if (error) {
      console.error("[v0] Error fetching slot by ID:", error)
      return null
    }

    return data as LogisticSlot
  } catch (error) {
    console.error("[v0] getSlotById exception:", error)
    return null
  }
}

/**
 * Génère les dates/heures fallback legacy à partir des slots
 * Utilisé pour maintenir compatibilité avec champs pickup_date/delivery_date
 *
 * @param pickupSlot - Slot de collecte
 * @param deliverySlot - Slot de livraison (optionnel)
 * @returns Objet avec pickup_date, pickup_time_slot, delivery_date, delivery_time_slot
 */
export function generateLegacyDatesFromSlots(
  pickupSlot: LogisticSlot,
  deliverySlot?: LogisticSlot
): {
  pickup_date: string
  pickup_time_slot: string
  delivery_date?: string
  delivery_time_slot?: string
} {
  // Extraire HH:MM du format PostgreSQL TIME (HH:MM:SS)
  // Convertir en format legacy (ex: "09:00-12:00")
  const pickupTimeSlot = `${pickupSlot.start_time.substring(0, 5)}-${pickupSlot.end_time.substring(0, 5)}`

  const result: {
    pickup_date: string
    pickup_time_slot: string
    delivery_date?: string
    delivery_time_slot?: string
  } = {
    pickup_date: pickupSlot.slot_date,
    pickup_time_slot: pickupTimeSlot,
  }

  if (deliverySlot) {
    const deliveryTimeSlot = `${deliverySlot.start_time.substring(0, 5)}-${deliverySlot.end_time.substring(0, 5)}`
    result.delivery_date = deliverySlot.slot_date
    result.delivery_time_slot = deliveryTimeSlot
  }

  return result
}
