import { z } from "zod"
import { optionalSlotSelectionSchema } from "./logistic-slots"

export const addressSchema = z.object({
  type: z.enum(["home", "work", "other"]),
  label: z.string().min(1, "Libellé requis"),
  streetAddress: z.string().min(5, "Adresse complète requise"),
  buildingInfo: z.string().optional(),
  city: z.string().min(2, "Ville requise"),
  postalCode: z.string().regex(/^\d{5}$/, "Code postal invalide"),
  accessInstructions: z.string().optional(),
  isDefault: z.boolean(),
})

export const guestAddressSchema = z.object({
  street_address: z.string().min(5, "Adresse complète requise"),
  city: z.string().min(2, "Ville requise"),
  postal_code: z.string().regex(/^\d{5}$/, "Code postal invalide"),
  building_info: z.string().optional(),
  access_instructions: z.string().optional(),
  label: z.string().min(1, "Libellé requis"),
})

export const guestContactSchema = z.object({
  first_name: z.string().min(2, "Prénom requis"),
  last_name: z.string().min(2, "Nom requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(10, "Numéro de téléphone requis"),
})

export const bookingItemSchema = z.object({
  serviceId: z.string().uuid("Service invalide"),
  quantity: z.number().min(1, "Quantité minimum 1"),
  specialInstructions: z.string().optional(),
})

export const createBookingSchema = z
  .object({
    // Adresses
    pickupAddressId: z.string().uuid("Adresse de collecte requise").optional(),
    deliveryAddressId: z.string().uuid("Adresse de livraison requise").optional(),
    
    // Legacy date/time fields (optional si slots fournis)
    pickupDate: z.string().optional(),
    pickupTimeSlot: z.string()
      .regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/, "Format invalide. Attendu HH:MM-HH:MM")
      .optional(),
    
    // Nouveau: Slot-based scheduling
    pickupSlotId: z.string().uuid("ID slot collecte invalide").optional(),
    deliverySlotId: z.string().uuid("ID slot livraison invalide").optional(),
    
    // Items & options
    items: z.array(bookingItemSchema).min(1, "Au moins un article requis"),
    specialInstructions: z.string().optional(),
    subscriptionId: z.string().uuid().optional(),
    serviceType: z.string().optional(),
    
    // Guest fields
    guestPickupAddress: guestAddressSchema.optional(),
    guestDeliveryAddress: guestAddressSchema.optional(),
    guestContact: guestContactSchema.optional(),
  })
  .refine(
    (data) => {
      const hasAddressIds = data.pickupAddressId && data.deliveryAddressId
      const hasGuestAddresses = data.guestPickupAddress && data.guestDeliveryAddress && data.guestContact
      return hasAddressIds || hasGuestAddresses
    },
    {
      message: "Adresses de collecte et de livraison requises",
      path: ["pickupAddressId"],
    },
  )
  .refine(
    (data) => {
      // Si slots fournis, les deux doivent l'être
      const hasPickupSlot = !!data.pickupSlotId
      const hasDeliverySlot = !!data.deliverySlotId
      if (hasPickupSlot !== hasDeliverySlot) {
        return false
      }
      
      // Si slots fournis, date/time legacy optionnels
      // Si slots absents, date/time legacy requis
      if (!hasPickupSlot && !hasDeliverySlot) {
        return !!data.pickupDate && !!data.pickupTimeSlot
      }
      
      return true
    },
    {
      message: "Fournir soit les IDs de slots (collecte + livraison), soit la date et l'heure de collecte",
      path: ["pickupDate"],
    },
  )
  .refine(
    (data) => {
      // Validation date legacy uniquement si fournie
      if (data.pickupDate) {
        const selectedDate = new Date(data.pickupDate)
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(0, 0, 0, 0)
        selectedDate.setHours(0, 0, 0, 0)
        return selectedDate >= tomorrow
      }
      return true
    },
    {
      message: "La date de collecte doit être au minimum demain",
      path: ["pickupDate"],
    },
  )

// Booking cancellation schema
export const cancelBookingSchema = z.object({
  reason: z
    .string()
    .min(10, "La raison doit contenir au moins 10 caractères")
    .max(500, "La raison ne peut pas dépasser 500 caractères"),
})

// Booking modification schema
export const modifyBookingSchema = z
  .object({
    pickupAddressId: z.string().uuid("Adresse de collecte invalide"),
    
    // Legacy fields (optional si slots fournis)
    pickupDate: z.string().optional(),
    pickupTimeSlot: z.enum(["09:00-12:00", "14:00-17:00", "18:00-21:00"]).optional(),
    
    // Nouveau: Slot-based scheduling
    pickupSlotId: z.string().uuid("ID slot collecte invalide").optional(),
    deliverySlotId: z.string().uuid("ID slot livraison invalide").optional(),
    
    deliveryAddressId: z.string().uuid("Adresse de livraison invalide").optional(),
    deliveryDate: z.string().optional(),
    deliveryTimeSlot: z.enum(["09:00-12:00", "14:00-17:00", "18:00-21:00"]).optional(),
    specialInstructions: z.string().optional(),
  })
  .refine(
    (data) => {
      // Si slots fournis, les deux doivent l'être
      const hasPickupSlot = !!data.pickupSlotId
      const hasDeliverySlot = !!data.deliverySlotId
      if (hasPickupSlot !== hasDeliverySlot) {
        return false
      }
      
      // Si slots absents, date/time legacy requis
      if (!hasPickupSlot && !hasDeliverySlot) {
        return !!data.pickupDate && !!data.pickupTimeSlot
      }
      
      return true
    },
    {
      message: "Fournir soit les IDs de slots, soit la date et l'heure de collecte",
      path: ["pickupDate"],
    },
  )
  .refine(
    (data) => {
      // Validation date legacy uniquement si fournie
      if (data.pickupDate) {
        const selectedDate = new Date(data.pickupDate)
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(0, 0, 0, 0)
        selectedDate.setHours(0, 0, 0, 0)
        return selectedDate >= tomorrow
      }
      return true
    },
    {
      message: "La date de collecte doit être au minimum demain",
      path: ["pickupDate"],
    },
  )
  .refine(
    (data) => {
      if (data.deliveryDate && data.pickupDate) {
        const pickupDate = new Date(data.pickupDate)
        const deliveryDate = new Date(data.deliveryDate)
        return deliveryDate > pickupDate
      }
      return true
    },
    {
      message: "La date de livraison doit être après la date de collecte",
      path: ["deliveryDate"],
    },
  )

// Problem report schema
export const reportProblemSchema = z.object({
  type: z.enum(["damaged_items", "missing_items", "late_delivery", "quality_issue", "other"], {
    errorMap: () => ({ message: "Type de problème invalide" }),
  }),
  description: z
    .string()
    .min(20, "La description doit contenir au moins 20 caractères")
    .max(1000, "La description ne peut pas dépasser 1000 caractères"),
  photos: z.array(z.string().url("URL de photo invalide")).max(5, "Maximum 5 photos").optional(),
})

// Payment intent schema - for creating Stripe Checkout Session
export const createPaymentIntentSchema = z.object({
  bookingId: z.string().uuid("ID de réservation invalide"),
})

export type AddressInput = z.infer<typeof addressSchema>
export type GuestAddressInput = z.infer<typeof guestAddressSchema>
export type GuestContactInput = z.infer<typeof guestContactSchema>
export type BookingItemInput = z.infer<typeof bookingItemSchema>
export type CreateBookingInput = z.infer<typeof createBookingSchema>
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>
export type ModifyBookingInput = z.infer<typeof modifyBookingSchema>
export type ReportProblemInput = z.infer<typeof reportProblemSchema>
export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>
