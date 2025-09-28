import { describe, it, expect, beforeEach, vi } from "vitest"
import { POST, GET } from "@/app/api/bookings/route"
import { NextRequest } from "next/server"

// Mock Supabase
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: 1, status: "pending" },
            error: null,
          })),
        })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [{ id: 1, status: "pending" }],
            error: null,
          })),
        })),
      })),
    })),
    auth: {
      getUser: vi.fn(() => ({
        data: { user: { id: "user-1" } },
        error: null,
      })),
    },
  }),
}))

describe("Bookings API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("POST /api/bookings", () => {
    it("should create booking successfully", async () => {
      const request = new NextRequest("http://localhost:3000/api/bookings", {
        method: "POST",
        body: JSON.stringify({
          services: [{ id: 1, quantity: 2 }],
          addressId: 1,
          scheduledDate: "2024-12-25",
          scheduledTime: "14:00",
          totalAmount: 30,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.booking).toBeDefined()
    })

    it("should handle validation errors", async () => {
      const request = new NextRequest("http://localhost:3000/api/bookings", {
        method: "POST",
        body: JSON.stringify({
          services: [],
          addressId: "invalid",
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
    })
  })

  describe("GET /api/bookings", () => {
    it("should return user bookings", async () => {
      const request = new NextRequest("http://localhost:3000/api/bookings")

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.bookings).toBeDefined()
      expect(Array.isArray(data.bookings)).toBe(true)
    })
  })
})
