/**
 * Feature Flags Configuration
 * 
 * Centralized feature flags for controlling feature availability.
 * All flags use NEXT_PUBLIC_ prefix for client-side access.
 */

/**
 * Controls subscription features (monthly/quarterly plans)
 * 
 * When FALSE (MVP):
 * - Subscription cards show teaser with blur overlay
 * - CTAs are disabled (no href, aria-disabled)
 * - Direct URL access redirected by middleware
 * 
 * When TRUE (Production):
 * - All subscription features fully functional
 * - CTAs clickable with normal Link behavior
 * 
 * @default false
 */
export const SUBSCRIPTIONS_ENABLED: boolean =
  process.env.NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED === "true"

/**
 * Controls booking availability
 * 
 * When FALSE:
 * - All "Réserver maintenant" buttons show a toast with contact info
 * - Bookings are disabled with message to contact via Instagram
 * 
 * When TRUE:
 * - Normal booking flow accessible
 * 
 * @default true
 */
export const BOOKINGS_ENABLED: boolean =
  process.env.NEXT_PUBLIC_BOOKINGS_ENABLED !== "false"
