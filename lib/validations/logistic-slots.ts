/**
 * Validation schemas pour les créneaux logistiques
 * @see lib/types/logistic-slots.ts
 */

import { z } from "zod"

/**
 * Schema pour un slot logistique (pickup ou delivery)
 */
export const logisticSlotSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(["pickup", "delivery"]),
  slot_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format date invalide (YYYY-MM-DD requis)"),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "Format heure invalide (HH:mm requis)"),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, "Format heure invalide (HH:mm requis)"),
  label: z.string().nullable().optional(),
  is_open: z.boolean(),
  notes: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

/**
 * Schema pour la requête GET /api/logistic-slots
 */
export const getLogisticSlotsSchema = z.object({
  role: z.enum(["pickup", "delivery"], {
    required_error: "Le paramètre 'role' est requis (pickup ou delivery)",
  }),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format date invalide (YYYY-MM-DD)")
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format date invalide (YYYY-MM-DD)")
    .optional(),
})

/**
 * Schema pour la sélection de slots (utilisé dans booking)
 */
export const slotSelectionSchema = z.object({
  pickupSlotId: z.string().uuid("ID slot collecte invalide"),
  deliverySlotId: z.string().uuid("ID slot livraison invalide"),
})

/**
 * Schema partiel pour la sélection optionnelle de slots
 * (utilisé quand slots ET dates legacy peuvent coexister)
 */
export const optionalSlotSelectionSchema = z
  .object({
    pickupSlotId: z.string().uuid("ID slot collecte invalide").optional(),
    deliverySlotId: z.string().uuid("ID slot livraison invalide").optional(),
  })
  .refine(
    (data) => {
      // Si un slot est fourni, l'autre doit l'être aussi
      const hasPickup = !!data.pickupSlotId
      const hasDelivery = !!data.deliverySlotId
      return hasPickup === hasDelivery
    },
    {
      message:
        "Si vous fournissez un slot de collecte, vous devez également fournir un slot de livraison (et vice-versa)",
    }
  )

/**
 * Type inféré pour la réponse API
 */
export type GetLogisticSlotsParams = z.infer<typeof getLogisticSlotsSchema>
export type SlotSelection = z.infer<typeof slotSelectionSchema>
export type OptionalSlotSelection = z.infer<typeof optionalSlotSelectionSchema>
