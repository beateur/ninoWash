import { describe, it, expect, beforeEach, vi } from "vitest"
import { POST } from "@/app/api/auth/signup/route"
import { NextRequest } from "next/server"

// Mock Supabase
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => ({
    auth: {
      signUp: vi.fn(),
    },
  }),
}))

describe("Auth API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("POST /api/auth/signup", () => {
    it("should create user successfully", async () => {
      const mockSignUp = vi.fn().mockResolvedValue({
        data: { user: { id: "1", email: "test@test.com" } },
        error: null,
      })

      vi.mocked(require("@/lib/supabase/server").createServerClient).mockReturnValue({
        auth: { signUp: mockSignUp },
      })

      const request = new NextRequest("http://localhost:3000/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          email: "test@test.com",
          password: "password123",
          fullName: "Test User",
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(mockSignUp).toHaveBeenCalledWith({
        email: "test@test.com",
        password: "password123",
        options: {
          data: { full_name: "Test User" },
        },
      })
    })

    it("should handle validation errors", async () => {
      const request = new NextRequest("http://localhost:3000/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          email: "invalid-email",
          password: "123",
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.errors).toBeDefined()
    })
  })
})
