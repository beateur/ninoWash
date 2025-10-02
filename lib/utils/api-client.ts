/**
 * API Client Utilities with Error Protection and Negative Programming
 *
 * This module provides utilities for making API calls with:
 * - Authentication verification before requests
 * - Circuit breaker pattern to prevent infinite loops
 * - Exponential backoff for retries
 * - Comprehensive error handling
 */

interface CircuitBreakerState {
  failures: number
  lastFailureTime: number
  isOpen: boolean
}

const circuitBreakers = new Map<string, CircuitBreakerState>()

const CIRCUIT_BREAKER_THRESHOLD = 3 // Open circuit after 3 failures
const CIRCUIT_BREAKER_TIMEOUT = 30000 // 30 seconds
const MAX_RETRIES = 2
const INITIAL_RETRY_DELAY = 1000 // 1 second

/**
 * Check if circuit breaker is open for a given endpoint
 */
function isCircuitOpen(endpoint: string): boolean {
  const state = circuitBreakers.get(endpoint)

  if (!state || !state.isOpen) {
    return false
  }

  // Check if timeout has passed
  const now = Date.now()
  if (now - state.lastFailureTime > CIRCUIT_BREAKER_TIMEOUT) {
    // Reset circuit breaker
    circuitBreakers.set(endpoint, {
      failures: 0,
      lastFailureTime: 0,
      isOpen: false,
    })
    return false
  }

  return true
}

/**
 * Record a failure for circuit breaker
 */
function recordFailure(endpoint: string): void {
  const state = circuitBreakers.get(endpoint) || {
    failures: 0,
    lastFailureTime: 0,
    isOpen: false,
  }

  state.failures += 1
  state.lastFailureTime = Date.now()

  if (state.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    state.isOpen = true
    console.warn(`[v0] Circuit breaker opened for ${endpoint} after ${state.failures} failures`)
  }

  circuitBreakers.set(endpoint, state)
}

/**
 * Record a success for circuit breaker
 */
function recordSuccess(endpoint: string): void {
  circuitBreakers.set(endpoint, {
    failures: 0,
    lastFailureTime: 0,
    isOpen: false,
  })
}

/**
 * Sleep for exponential backoff
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Safe API fetch with error protection
 *
 * Features:
 * - Circuit breaker to prevent infinite loops
 * - Exponential backoff for retries
 * - Comprehensive error handling
 * - Type-safe responses
 */
export async function safeFetch<T>(
  endpoint: string,
  options?: RequestInit,
  retryCount = 0,
): Promise<{ data: T | null; error: string | null; status: number }> {
  // NEGATIVE PROGRAMMING: Check circuit breaker before making request
  if (isCircuitOpen(endpoint)) {
    console.warn(`[v0] Circuit breaker is open for ${endpoint}, skipping request`)
    return {
      data: null,
      error: "Trop de requêtes échouées. Veuillez réessayer dans quelques instants.",
      status: 429,
    }
  }

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })

    // NEGATIVE PROGRAMMING: Check if response is OK before parsing
    if (!response.ok) {
      // Handle specific error codes
      if (response.status === 401) {
        recordFailure(endpoint)
        return {
          data: null,
          error: "Non autorisé. Veuillez vous connecter.",
          status: 401,
        }
      }

      if (response.status === 429) {
        // Rate limited - apply exponential backoff
        if (retryCount < MAX_RETRIES) {
          const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount)
          console.log(`[v0] Rate limited, retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`)
          await sleep(delay)
          return safeFetch<T>(endpoint, options, retryCount + 1)
        }

        recordFailure(endpoint)
        return {
          data: null,
          error: "Trop de requêtes. Veuillez réessayer dans quelques instants.",
          status: 429,
        }
      }

      if (response.status >= 500) {
        // Server error - retry with exponential backoff
        if (retryCount < MAX_RETRIES) {
          const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount)
          console.log(`[v0] Server error, retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`)
          await sleep(delay)
          return safeFetch<T>(endpoint, options, retryCount + 1)
        }

        recordFailure(endpoint)
        return {
          data: null,
          error: "Erreur serveur. Veuillez réessayer plus tard.",
          status: response.status,
        }
      }

      // Other client errors
      recordFailure(endpoint)
      const errorText = await response.text().catch(() => "Erreur inconnue")
      return {
        data: null,
        error: errorText || `Erreur ${response.status}`,
        status: response.status,
      }
    }

    // NEGATIVE PROGRAMMING: Check if response has content before parsing
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      // Not JSON response
      const text = await response.text()
      recordFailure(endpoint)
      return {
        data: null,
        error: `Réponse invalide: ${text.substring(0, 100)}`,
        status: response.status,
      }
    }

    const data = await response.json()

    // Success - reset circuit breaker
    recordSuccess(endpoint)

    return {
      data: data as T,
      error: null,
      status: response.status,
    }
  } catch (error) {
    // Network error or JSON parsing error
    console.error(`[v0] Fetch error for ${endpoint}:`, error)
    recordFailure(endpoint)

    return {
      data: null,
      error: error instanceof Error ? error.message : "Erreur réseau",
      status: 0,
    }
  }
}

/**
 * Check if user is authenticated before making API call
 * This is a client-side check only - server-side validation is still required
 */
export function checkClientAuth(): boolean {
  // Check if we're in browser
  if (typeof window === "undefined") {
    return false
  }

  // Check for Supabase auth cookies
  const cookies = document.cookie.split(";")
  const hasAuthCookie = cookies.some((cookie) => {
    const trimmed = cookie.trim()
    return trimmed.startsWith("sb-") && trimmed.includes("-auth-token")
  })

  return hasAuthCookie
}

/**
 * Safe API call with authentication check
 */
export async function authenticatedFetch<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<{ data: T | null; error: string | null; status: number }> {
  // NEGATIVE PROGRAMMING: Check auth before making request
  if (!checkClientAuth()) {
    console.warn(`[v0] No authentication found for ${endpoint}`)
    return {
      data: null,
      error: "Non autorisé. Veuillez vous connecter.",
      status: 401,
    }
  }

  return safeFetch<T>(endpoint, options)
}

/**
 * Reset circuit breaker for an endpoint (useful for manual retry)
 */
export function resetCircuitBreaker(endpoint: string): void {
  circuitBreakers.delete(endpoint)
  console.log(`[v0] Circuit breaker reset for ${endpoint}`)
}

/**
 * Get circuit breaker status for debugging
 */
export function getCircuitBreakerStatus(endpoint: string): CircuitBreakerState | null {
  return circuitBreakers.get(endpoint) || null
}
