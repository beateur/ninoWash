const { z } = require("zod");

const modifyBookingSchema = z
  .object({
    pickupAddressId: z.string().uuid("Adresse de collecte invalide"),
    pickupDate: z.string().refine((date) => {
      const selectedDate = new Date(date)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      selectedDate.setHours(0, 0, 0, 0)
      console.log("  selectedDate:", selectedDate.toISOString())
      console.log("  tomorrow:", tomorrow.toISOString())
      console.log("  selectedDate >= tomorrow:", selectedDate >= tomorrow)
      return selectedDate >= tomorrow
    }, "La date de collecte doit être au minimum demain"),
    pickupTimeSlot: z.enum(["09:00-12:00", "14:00-17:00", "18:00-21:00"]),
    deliveryAddressId: z.string().uuid("Adresse de livraison invalide").optional(),
    deliveryDate: z.string().optional(),
    deliveryTimeSlot: z.enum(["09:00-12:00", "14:00-17:00", "18:00-21:00"]).optional(),
    specialInstructions: z.string().optional(),
  })

const testPayload = {
  "pickupDate": "2025-10-27",
  "pickupTimeSlot": "18:00-21:00",
  "pickupAddressId": "00fb3210-40a4-474f-9f02-6aaa07a3286e",
  "deliveryAddressId": "00fb3210-40a4-474f-9f02-6aaa07a3286e",
  "specialInstructions": ""
}

console.log("Testing validation with payload:", JSON.stringify(testPayload, null, 2))
console.log("\nValidation process:")

const result = modifyBookingSchema.safeParse(testPayload)

console.log("\nResult:")
if (result.success) {
  console.log("✅ VALIDATION PASSED")
  console.log("Data:", result.data)
} else {
  console.log("❌ VALIDATION FAILED")
  console.log("Errors:", JSON.stringify(result.error.issues, null, 2))
}
