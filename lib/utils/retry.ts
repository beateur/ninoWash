/**
 * Retry Utility with Exponential Backoff
 * Used for resilient operations (Supabase Auth, Booking creation, etc.)
 */

interface RetryOptions {
  retries: number // Number of retry attempts
  delay: number // Initial delay in milliseconds
  backoffFactor?: number // Exponential backoff multiplier (default: 2)
  onRetry?: (attempt: number, error: Error) => void // Callback on retry
}

/**
 * Execute a function with retry logic and exponential backoff
 * 
 * @example
 * const result = await withRetry(
 *   async () => {
 *     const { data, error } = await supabase.auth.signUp({ email, password })
 *     if (error) throw error
 *     return data
 *   },
 *   { retries: 3, delay: 2000 }
 * )
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const { retries, delay, backoffFactor = 2, onRetry } = options
  let lastError: Error

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Execute function
      return await fn()
    } catch (error) {
      lastError = error as Error

      // If last attempt, throw error
      if (attempt === retries) {
        console.error(
          `[v0] withRetry failed after ${retries + 1} attempts:`,
          lastError
        )
        throw lastError
      }

      // Calculate delay with exponential backoff
      const waitTime = delay * Math.pow(backoffFactor, attempt)

      console.warn(
        `[v0] Retry attempt ${attempt + 1}/${retries + 1} after ${waitTime}ms:`,
        lastError.message
      )

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, lastError)
      }

      // Wait before retry
      await sleep(waitTime)
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError!
}

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Retry with timeout
 * Fails if operation takes longer than timeout
 */
export async function withRetryAndTimeout<T>(
  fn: () => Promise<T>,
  options: RetryOptions & { timeout: number }
): Promise<T> {
  const { timeout, ...retryOptions } = options

  return Promise.race([
    withRetry(fn, retryOptions),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Operation timeout")), timeout)
    ),
  ])
}
