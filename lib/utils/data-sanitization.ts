/**
 * Data sanitization utilities for protecting sensitive information
 */

/**
 * Mask email address for display
 * Example: john.doe@example.com -> j***@example.com
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return email

  const [localPart, domain] = email.split("@")
  const maskedLocal = localPart.length > 2 ? `${localPart[0]}***` : "***"

  return `${maskedLocal}@${domain}`
}

/**
 * Mask phone number for display
 * Example: +33612345678 -> +336****5678
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 8) return phone

  const visibleStart = phone.slice(0, 4)
  const visibleEnd = phone.slice(-4)
  const maskedMiddle = "*".repeat(phone.length - 8)

  return `${visibleStart}${maskedMiddle}${visibleEnd}`
}

/**
 * Mask address for display (keep only city and postal code)
 */
export function maskAddress(address: {
  street_address?: string
  city?: string
  postal_code?: string
}): string {
  if (!address.city && !address.postal_code) return "Adresse masquée"

  return `${address.postal_code || ""} ${address.city || ""}`.trim()
}

/**
 * Sanitize user data for logging (remove sensitive fields)
 */
export function sanitizeForLogging(data: Record<string, any>): Record<string, any> {
  const sensitiveFields = ["password", "password_hash", "token", "secret", "api_key", "credit_card", "ssn", "tax_id"]

  const sanitized = { ...data }

  for (const key of Object.keys(sanitized)) {
    if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
      sanitized[key] = "[REDACTED]"
    }
  }

  return sanitized
}

/**
 * Sanitize user data for analytics (remove PII)
 */
export function sanitizeForAnalytics(data: Record<string, any>): Record<string, any> {
  const piiFields = [
    "email",
    "phone",
    "first_name",
    "last_name",
    "name",
    "address",
    "street_address",
    "building_info",
    "access_instructions",
  ]

  const sanitized = { ...data }

  for (const key of Object.keys(sanitized)) {
    if (piiFields.some((field) => key.toLowerCase().includes(field))) {
      delete sanitized[key]
    }
  }

  return sanitized
}

/**
 * Hash sensitive data for storage (one-way hash)
 */
export async function hashSensitiveData(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}
