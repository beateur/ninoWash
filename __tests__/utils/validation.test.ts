import { describe, it, expect } from "vitest"
import { bookingSchema, addressSchema } from "@/lib/validations"

describe("Validation Schemas", () => {
  describe("bookingSchema", () => {
    it("should validate correct booking data", () => {
      const validBooking = {
        services: [{ id: 1, quantity: 2 }],
        addressId: 1,
        scheduledDate: "2024-12-25",
        scheduledTime: "14:00",
        notes: "Handle with care",
      }

      const result = bookingSchema.safeParse(validBooking)
      expect(result.success).toBe(true)
    })

    it("should reject invalid booking data", () => {
      const invalidBooking = {
        services: [],
        addressId: "invalid",
        scheduledDate: "invalid-date",
        scheduledTime: "25:00",
      }

      const result = bookingSchema.safeParse(invalidBooking)
      expect(result.success).toBe(false)
    })
  })

  describe("addressSchema", () => {
    it("should validate French postal codes", () => {
      const validAddress = {
        street: "123 Rue de la Paix",
        city: "Paris",
        postalCode: "75001",
        country: "France",
      }

      const result = addressSchema.safeParse(validAddress)
      expect(result.success).toBe(true)
    })

    it("should reject invalid postal codes", () => {
      const invalidAddress = {
        street: "123 Rue de la Paix",
        city: "Paris",
        postalCode: "invalid",
        country: "France",
      }

      const result = addressSchema.safeParse(invalidAddress)
      expect(result.success).toBe(false)
    })
  })
})
