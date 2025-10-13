/**
 * Types pour le système de créneaux logistiques (Collecte & Livraison)
 * @see docs/PRD/PRD_BOOKING_COLLECTION_DELIVERY.md
 * @see supabase/migrations/20251013000100_create_logistic_slots.sql
 */

/**
 * Slot de collecte ou livraison configuré par l'équipe opérationnelle
 */
export interface LogisticSlot {
  id: string
  role: "pickup" | "delivery"
  slot_date: string // ISO date (YYYY-MM-DD)
  start_time: string // HH:mm format
  end_time: string // HH:mm format
  label?: string | null // Ex: "Matin", "Après-midi", "Soirée"
  is_open: boolean
  notes?: string | null
  created_at: string // ISO timestamp
  updated_at: string // ISO timestamp
}

/**
 * Enregistrement de demande de slot (tracking analytique)
 */
export interface SlotRequest {
  id: string
  slot_id: string
  role: "pickup" | "delivery"
  booking_id: string | null
  created_by: string | null // User ID si authentifié, null pour guest
  requested_at: string // ISO timestamp
}

/**
 * Sélection de slots pour une réservation
 */
export interface SlotSelection {
  pickupSlot: LogisticSlot | null
  deliverySlot: LogisticSlot | null
}

/**
 * Paramètres de recherche de slots
 */
export interface GetSlotsParams {
  role: "pickup" | "delivery"
  startDate?: string // ISO date
  endDate?: string // ISO date
}

/**
 * Réponse API pour la récupération de slots
 */
export interface GetSlotsResponse {
  slots: LogisticSlot[]
}

/**
 * Configuration du délai minimum entre collecte et livraison
 */
export type ServiceType = "express" | "classic"

export interface DelayValidationResult {
  valid: boolean
  error?: string
  requiredHours?: number
  actualHours?: number
}

/**
 * DTO pour affichage UI des slots
 */
export interface SlotDisplayData {
  id: string
  date: string // Format localisé : "Lundi 14 Oct"
  timeRange: string // Format : "9h-12h"
  label?: string
  isAvailable: boolean
  reason?: string // Si isAvailable = false, raison de l'indisponibilité
}
