import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { AuthForm } from "@/components/forms/auth-form"
import { vi } from "vitest"

describe("Authentication", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Cleanup after each test
    vi.restoreAllMocks()
  })

  describe("AuthForm", () => {
    it("should render login form by default", () => {
      render(<AuthForm />)

      expect(screen.getByText("Se connecter")).toBeInTheDocument()
      expect(screen.getByLabelText("Email")).toBeInTheDocument()
      expect(screen.getByLabelText("Mot de passe")).toBeInTheDocument()
    })

    it("should validate email format", async () => {
      render(<AuthForm />)

      const emailInput = screen.getByLabelText("Email")
      const submitButton = screen.getByText("Se connecter")

      fireEvent.change(emailInput, { target: { value: "invalid-email" } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText("Email invalide")).toBeInTheDocument()
      })
    })

    it("should validate password requirements", async () => {
      render(<AuthForm mode="signup" />)

      const passwordInput = screen.getByLabelText("Mot de passe")
      const submitButton = screen.getByText("S'inscrire")

      fireEvent.change(passwordInput, { target: { value: "123" } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText("Le mot de passe doit contenir au moins 8 caractères")).toBeInTheDocument()
      })
    })

    it("should switch between login and signup modes", () => {
      render(<AuthForm />)

      const switchButton = screen.getByText("Pas encore de compte ? S'inscrire")
      fireEvent.click(switchButton)

      expect(screen.getByText("S'inscrire")).toBeInTheDocument()
      expect(screen.getByLabelText("Nom complet")).toBeInTheDocument()
    })
  })
})
