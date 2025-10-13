/**
 * Custom hook for managing guest booking state across steps
 * Uses sessionStorage for persistence (survives page refresh, cleared on browser close)
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import type { GuestContact } from "@/lib/validations/guest-contact"
import type { GuestAddress, GuestBookingItem } from "@/lib/validations/guest-booking"
import type { LogisticSlot } from "@/lib/types/logistic-slots"

const STORAGE_KEY = "ninowash_guest_booking"
const STORAGE_EXPIRY_HOURS = 24

export interface GuestBookingState {
  // Step 0: Contact
  contact: GuestContact | null

  // Step 1: Addresses
  pickupAddress: GuestAddress | null
  deliveryAddress: GuestAddress | null

  // Step 2: Services
  items: GuestBookingItem[]
  totalAmount: number

  // Step 3: Date & Time (UPDATED: Slot-based + legacy fallback)
  pickupDate: string | null
  pickupTimeSlot: string | null
  pickupSlot: LogisticSlot | null
  deliverySlot: LogisticSlot | null

  // Step 4: Payment
  paymentIntentId: string | null
  clientSecret: string | null

  // UI state
  currentStep: number
  completedSteps: number[]

  // Metadata
  createdAt: string
  lastUpdated: string
}

const initialState: GuestBookingState = {
  contact: null,
  pickupAddress: null,
  deliveryAddress: null,
  items: [],
  totalAmount: 0,
  pickupDate: null,
  pickupTimeSlot: null,
  pickupSlot: null,
  deliverySlot: null,
  paymentIntentId: null,
  clientSecret: null,
  currentStep: 0,
  completedSteps: [],
  createdAt: new Date().toISOString(),
  lastUpdated: new Date().toISOString(),
}

export function useGuestBooking() {
  const [state, setState] = useState<GuestBookingState>(initialState)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load state from sessionStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed: GuestBookingState = JSON.parse(stored)

        // Check expiry
        const createdAt = new Date(parsed.createdAt)
        const now = new Date()
        const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)

        if (hoursDiff < STORAGE_EXPIRY_HOURS) {
          setState(parsed)
          console.log("[v0] Guest booking state loaded from sessionStorage")
        } else {
          console.log("[v0] Guest booking state expired, resetting")
          sessionStorage.removeItem(STORAGE_KEY)
        }
      }
    } catch (error) {
      console.error("[v0] Failed to load guest booking state:", error)
      sessionStorage.removeItem(STORAGE_KEY)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Persist state to sessionStorage on every change
  useEffect(() => {
    if (!isLoaded) return
    if (typeof window === "undefined") return

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (error) {
      console.error("[v0] Failed to persist guest booking state:", error)
    }
  }, [state, isLoaded])

  // Update contact (Step 0)
  const updateContact = useCallback((contact: GuestContact) => {
    setState((prev) => ({
      ...prev,
      contact,
      completedSteps: Array.from(new Set([...prev.completedSteps, 0])),
      lastUpdated: new Date().toISOString(),
    }))
  }, [])

  // Update addresses (Step 1)
  const updateAddresses = useCallback(
    (pickup: GuestAddress, delivery: GuestAddress) => {
      setState((prev) => ({
        ...prev,
        pickupAddress: pickup,
        deliveryAddress: delivery,
        completedSteps: Array.from(new Set([...prev.completedSteps, 1])),
        lastUpdated: new Date().toISOString(),
      }))
    },
    []
  )

  // Update services (Step 2)
  const updateServices = useCallback((items: GuestBookingItem[], totalAmount: number) => {
    setState((prev) => ({
      ...prev,
      items,
      totalAmount,
      completedSteps: Array.from(new Set([...prev.completedSteps, 2])),
      lastUpdated: new Date().toISOString(),
    }))
  }, [])

  // Update date & time (Step 3) - UPDATED: Support slots
  const updateDateTime = useCallback(
    (
      pickupDate: string,
      pickupTimeSlot: string,
      pickupSlot?: LogisticSlot,
      deliverySlot?: LogisticSlot
    ) => {
      setState((prev) => ({
        ...prev,
        pickupDate,
        pickupTimeSlot,
        pickupSlot: pickupSlot || null,
        deliverySlot: deliverySlot || null,
        completedSteps: Array.from(new Set([...prev.completedSteps, 3])),
        lastUpdated: new Date().toISOString(),
      }))
    },
    []
  )

  // Update payment info (Step 4)
  const updatePayment = useCallback((paymentIntentId: string, clientSecret: string) => {
    setState((prev) => ({
      ...prev,
      paymentIntentId,
      clientSecret,
      lastUpdated: new Date().toISOString(),
    }))
  }, [])

  // Navigate to step
  const goToStep = useCallback((step: number) => {
    setState((prev) => ({
      ...prev,
      currentStep: step,
      lastUpdated: new Date().toISOString(),
    }))
  }, [])

  // Reset entire state
  const reset = useCallback(() => {
    setState(initialState)
    sessionStorage.removeItem(STORAGE_KEY)
    console.log("[v0] Guest booking state reset")
  }, [])

  // Check if step is completed
  const isStepCompleted = useCallback(
    (step: number) => {
      return state.completedSteps.includes(step)
    },
    [state.completedSteps]
  )

  // Check if can proceed to next step
  const canProceed = useCallback(() => {
    const { currentStep } = state

    switch (currentStep) {
      case 0:
        return state.contact !== null
      case 1:
        return state.pickupAddress !== null && state.deliveryAddress !== null
      case 2:
        return state.items.length > 0
      case 3:
        // Support both legacy and slot-based scheduling
        const hasLegacy = state.pickupDate !== null && state.pickupTimeSlot !== null
        const hasSlots = state.pickupSlot !== null && state.deliverySlot !== null
        return hasLegacy || hasSlots
      case 4:
        return state.paymentIntentId !== null
      default:
        return false
    }
  }, [state])

  return {
    state,
    isLoaded,
    updateContact,
    updateAddresses,
    updateServices,
    updateDateTime,
    updatePayment,
    goToStep,
    reset,
    isStepCompleted,
    canProceed,
  }
}

/**
 * Helper: Check if user has abandoned booking and should be prompted to resume
 */
export function hasAbandonedBooking(): boolean {
  if (typeof window === "undefined") return false

  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (!stored) return false

    const parsed: GuestBookingState = JSON.parse(stored)
    return parsed.currentStep > 0 && parsed.currentStep < 4
  } catch {
    return false
  }
}
