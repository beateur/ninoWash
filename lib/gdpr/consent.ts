/**
 * GDPR consent management
 */

export type ConsentType = "necessary" | "analytics" | "marketing" | "preferences"

export interface UserConsent {
  necessary: boolean // Always true, required for app functionality
  analytics: boolean
  marketing: boolean
  preferences: boolean
  timestamp: Date
}

/**
 * Get user consent from localStorage
 */
export function getUserConsent(): UserConsent | null {
  if (typeof window === "undefined") return null

  try {
    const consent = localStorage.getItem("user-consent")
    return consent ? JSON.parse(consent) : null
  } catch {
    return null
  }
}

/**
 * Save user consent to localStorage
 */
export function saveUserConsent(consent: Omit<UserConsent, "timestamp">): void {
  if (typeof window === "undefined") return

  const consentData: UserConsent = {
    ...consent,
    necessary: true, // Always true
    timestamp: new Date(),
  }

  localStorage.setItem("user-consent", JSON.stringify(consentData))
}

/**
 * Check if user has given consent for a specific type
 */
export function hasConsent(type: ConsentType): boolean {
  const consent = getUserConsent()

  if (!consent) return type === "necessary" // Only necessary cookies by default

  return consent[type]
}

/**
 * Clear all consent data
 */
export function clearConsent(): void {
  if (typeof window === "undefined") return

  localStorage.removeItem("user-consent")
}
