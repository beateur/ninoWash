import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { BookingFlow } from "@/app/reservation/page"

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
  createBrowserClient: () => ({
    from: () => ({
      select: () => ({
        data: [
          { id: 1, name: "Nettoyage Standard", price: 15, category: "cleaning" },
          { id: 2, name: "Repassage", price: 8, category: "ironing" },
        ],
        error: null,
      }),
    }),
    auth: {
      getUser: () => ({ data: { user: { id: "1", email: "test@test.com" } } }),
    },
  }),
}))

describe("Booking System", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Service Selection", () => {
    it("should display available services", async () => {
      render(<BookingFlow />)

      await waitFor(() => {
        expect(screen.getByText("Nettoyage Standard")).toBeInTheDocument()
        expect(screen.getByText("Repassage")).toBeInTheDocument()
      })
    })

    it("should calculate total price correctly", async () => {
      render(<BookingFlow />)

      await waitFor(() => {
        const standardService = screen.getByText("Nettoyage Standard")
        fireEvent.click(standardService)
      })

      const quantityInput = screen.getByDisplayValue("1")
      fireEvent.change(quantityInput, { target: { value: "2" } })

      await waitFor(() => {
        expect(screen.getByText("30,00 €")).toBeInTheDocument()
      })
    })
  })

  describe("Address Management", () => {
    it("should allow adding new address", async () => {
      render(<BookingFlow />)

      // Navigate to address step
      const nextButton = screen.getByText("Continuer")
      fireEvent.click(nextButton)

      const addAddressButton = screen.getByText("Ajouter une adresse")
      fireEvent.click(addAddressButton)

      expect(screen.getByLabelText("Adresse")).toBeInTheDocument()
      expect(screen.getByLabelText("Ville")).toBeInTheDocument()
      expect(screen.getByLabelText("Code postal")).toBeInTheDocument()
    })
  })
})
