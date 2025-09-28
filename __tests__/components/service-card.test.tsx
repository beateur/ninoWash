"use client"

import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ServiceCard } from "@/components/ui/service-card"

describe("ServiceCard", () => {
  const mockService = {
    id: 1,
    name: "Nettoyage Standard",
    description: "Service de nettoyage complet",
    price: 15,
    category: "cleaning",
    duration: 60,
    image: "/images/cleaning.jpg",
  }

  const mockOnSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render service information correctly", () => {
    render(<ServiceCard service={mockService} onSelect={mockOnSelect} />)

    expect(screen.getByText("Nettoyage Standard")).toBeInTheDocument()
    expect(screen.getByText("Service de nettoyage complet")).toBeInTheDocument()
    expect(screen.getByText("15,00 €")).toBeInTheDocument()
    expect(screen.getByText("60 min")).toBeInTheDocument()
  })

  it("should call onSelect when clicked", () => {
    render(<ServiceCard service={mockService} onSelect={mockOnSelect} />)

    const card = screen.getByRole("button")
    fireEvent.click(card)

    expect(mockOnSelect).toHaveBeenCalledWith(mockService)
  })

  it("should show selected state", () => {
    render(<ServiceCard service={mockService} onSelect={mockOnSelect} selected />)

    const card = screen.getByRole("button")
    expect(card).toHaveClass("ring-2", "ring-primary")
  })

  it("should be accessible", () => {
    render(<ServiceCard service={mockService} onSelect={mockOnSelect} />)

    const card = screen.getByRole("button")
    expect(card).toHaveAttribute("aria-label", expect.stringContaining("Nettoyage Standard"))
  })
})
