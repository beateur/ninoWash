/**
 * Subscription Credits Service
 * Gestion des crédits hebdomadaires pour abonnés
 */

import { createClient } from "@/lib/supabase/server"

// ============================================
// TYPES
// ============================================

export interface UserCredits {
  creditsRemaining: number
  creditsTotal: number
  weekStartDate: string
  resetAt: string
}

export interface CreditUsage {
  id: string
  bookingId: string
  creditsBefore: number
  creditsAfter: number
  bookingWeightKg: number
  amountSaved: number
  usedAt: string
}

export interface ConsumeCreditsResult {
  success: boolean
  creditsRemaining?: number
  message?: string
}

// ============================================
// CONSTANTS
// ============================================

const MAX_FREE_WEIGHT_KG = 15 // Poids maximum gratuit avec 1 crédit
const PRICE_PER_KG = 3.57 // Prix au kg (24,99€ / 7kg = 3.57€/kg)

// Mapping plans → crédits
const PLAN_CREDITS: Record<string, number> = {
  monthly: 2,
  quarterly: 3,
}

// ============================================
// PUBLIC FUNCTIONS
// ============================================

/**
 * Récupère les crédits actuels d'un utilisateur
 * @param userId - ID de l'utilisateur
 * @returns Crédits restants ou null si aucun crédit
 */
export async function getCurrentCredits(userId: string): Promise<UserCredits | null> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc("get_user_current_credits", {
    p_user_id: userId,
  })

  if (error) {
    console.error("[SubscriptionCredits] Error fetching credits:", error)
    return null
  }

  if (!data || data.length === 0) {
    return null
  }

  const credit = data[0]

  return {
    creditsRemaining: credit.credits_remaining,
    creditsTotal: credit.credits_total,
    weekStartDate: credit.week_start_date,
    resetAt: credit.reset_at,
  }
}

/**
 * Vérifie si un utilisateur a des crédits disponibles
 * @param userId - ID de l'utilisateur
 * @returns true si crédits disponibles
 */
export async function hasAvailableCredits(userId: string): Promise<boolean> {
  const credits = await getCurrentCredits(userId)
  return credits !== null && credits.creditsRemaining > 0
}

/**
 * Consomme un crédit pour une réservation
 * @param userId - ID de l'utilisateur
 * @param subscriptionId - ID de l'abonnement
 * @param bookingId - ID de la réservation
 * @param bookingWeightKg - Poids de la réservation en kg
 * @returns Résultat de la consommation
 */
export async function consumeCredit(
  userId: string,
  subscriptionId: string,
  bookingId: string,
  bookingWeightKg: number
): Promise<ConsumeCreditsResult> {
  const supabase = await createClient()

  // Calculer le montant économisé
  const amountSaved = calculateCreditDiscount(bookingWeightKg)

  const { data, error } = await supabase.rpc("consume_subscription_credit", {
    p_user_id: userId,
    p_subscription_id: subscriptionId,
    p_booking_id: bookingId,
    p_booking_weight: bookingWeightKg,
    p_amount_saved: amountSaved,
  })

  if (error) {
    console.error("[SubscriptionCredits] Error consuming credit:", error)
    return {
      success: false,
      message: "Erreur lors de la consommation du crédit",
    }
  }

  if (!data) {
    return {
      success: false,
      message: "Aucun crédit disponible",
    }
  }

  // Récupérer crédits restants après consommation
  const updatedCredits = await getCurrentCredits(userId)

  return {
    success: true,
    creditsRemaining: updatedCredits?.creditsRemaining || 0,
    message: "Crédit consommé avec succès",
  }
}

/**
 * Calcule le montant économisé grâce à un crédit
 * @param bookingWeightKg - Poids de la réservation en kg
 * @returns Montant économisé en euros
 */
export function calculateCreditDiscount(bookingWeightKg: number): number {
  if (bookingWeightKg <= MAX_FREE_WEIGHT_KG) {
    // Entièrement gratuit
    return bookingWeightKg * PRICE_PER_KG
  }

  // Gratuit pour 15kg, surplus facturé
  return MAX_FREE_WEIGHT_KG * PRICE_PER_KG
}

/**
 * Calcule le surplus à facturer si > 15kg
 * @param bookingWeightKg - Poids de la réservation en kg
 * @returns Montant du surplus en euros (0 si ≤ 15kg)
 */
export function calculateSurplusAmount(bookingWeightKg: number): number {
  if (bookingWeightKg <= MAX_FREE_WEIGHT_KG) {
    return 0
  }

  const surplusKg = bookingWeightKg - MAX_FREE_WEIGHT_KG
  return surplusKg * PRICE_PER_KG
}

/**
 * Récupère l'historique d'utilisation des crédits
 * @param userId - ID de l'utilisateur
 * @param limit - Nombre maximum de résultats
 * @returns Liste des utilisations de crédits
 */
export async function getCreditUsageHistory(userId: string, limit = 20): Promise<CreditUsage[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("credit_usage_log")
    .select("*")
    .eq("user_id", userId)
    .order("used_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("[SubscriptionCredits] Error fetching usage history:", error)
    return []
  }

  return (data || []).map((log) => ({
    id: log.id,
    bookingId: log.booking_id,
    creditsBefore: log.credits_before,
    creditsAfter: log.credits_after,
    bookingWeightKg: log.booking_weight_kg,
    amountSaved: log.amount_saved,
    usedAt: log.used_at,
  }))
}

/**
 * Calcule le montant total économisé par l'utilisateur
 * @param userId - ID de l'utilisateur
 * @returns Montant total économisé en euros
 */
export async function getTotalAmountSaved(userId: string): Promise<number> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("credit_usage_log")
    .select("amount_saved")
    .eq("user_id", userId)

  if (error) {
    console.error("[SubscriptionCredits] Error calculating total saved:", error)
    return 0
  }

  return (data || []).reduce((total, log) => total + Number(log.amount_saved), 0)
}

/**
 * Initialise les crédits hebdomadaires pour un abonnement
 * @param userId - ID de l'utilisateur
 * @param subscriptionId - ID de l'abonnement
 * @param planType - Type de plan ('monthly' ou 'quarterly')
 * @returns ID des crédits créés ou null si erreur
 */
export async function initializeWeeklyCredits(
  userId: string,
  subscriptionId: string,
  planType: string
): Promise<string | null> {
  const supabase = await createClient()

  const creditsTotal = PLAN_CREDITS[planType] || 0

  if (creditsTotal === 0) {
    console.warn(`[SubscriptionCredits] Unknown plan type: ${planType}`)
    return null
  }

  const { data, error } = await supabase.rpc("initialize_weekly_credits", {
    p_user_id: userId,
    p_subscription_id: subscriptionId,
    p_credits_total: creditsTotal,
  })

  if (error) {
    console.error("[SubscriptionCredits] Error initializing credits:", error)
    return null
  }

  return data
}

/**
 * Vérifie si une réservation peut utiliser un crédit
 * @param userId - ID de l'utilisateur
 * @param bookingWeightKg - Poids de la réservation en kg
 * @returns Détails de l'application du crédit
 */
export async function canUseCredit(
  userId: string,
  bookingWeightKg: number
): Promise<{
  canUse: boolean
  creditsRemaining: number
  totalAmount: number
  discountAmount: number
  surplusAmount: number
  message: string
}> {
  const credits = await getCurrentCredits(userId)

  if (!credits || credits.creditsRemaining <= 0) {
    return {
      canUse: false,
      creditsRemaining: 0,
      totalAmount: bookingWeightKg * PRICE_PER_KG,
      discountAmount: 0,
      surplusAmount: 0,
      message: "Aucun crédit disponible - Tarif classique appliqué",
    }
  }

  const discountAmount = calculateCreditDiscount(bookingWeightKg)
  const surplusAmount = calculateSurplusAmount(bookingWeightKg)
  const totalAmount = surplusAmount

  let message = ""
  if (bookingWeightKg <= MAX_FREE_WEIGHT_KG) {
    message = `Réservation gratuite (crédit utilisé) - ${credits.creditsRemaining - 1} crédit(s) restant(s)`
  } else {
    message = `15kg gratuits (crédit utilisé), surplus de ${(bookingWeightKg - MAX_FREE_WEIGHT_KG).toFixed(1)}kg facturé ${surplusAmount.toFixed(2)}€`
  }

  return {
    canUse: true,
    creditsRemaining: credits.creditsRemaining - 1,
    totalAmount,
    discountAmount,
    surplusAmount,
    message,
  }
}

/**
 * Récupère les statistiques des crédits pour un utilisateur
 * @param userId - ID de l'utilisateur
 * @returns Statistiques d'utilisation
 */
export async function getCreditStats(userId: string): Promise<{
  currentCredits: UserCredits | null
  totalUsed: number
  totalSaved: number
  usageRate: number
}> {
  const currentCredits = await getCurrentCredits(userId)
  const usageHistory = await getCreditUsageHistory(userId, 100)
  const totalSaved = await getTotalAmountSaved(userId)

  const totalUsed = usageHistory.length

  let usageRate = 0
  if (currentCredits) {
    const totalAllocated = currentCredits.creditsTotal
    const used = currentCredits.creditsTotal - currentCredits.creditsRemaining
    usageRate = totalAllocated > 0 ? (used / totalAllocated) * 100 : 0
  }

  return {
    currentCredits,
    totalUsed,
    totalSaved,
    usageRate,
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Formate le message de crédits pour l'UI
 * @param creditsRemaining - Nombre de crédits restants
 * @returns Message formaté
 */
export function formatCreditsMessage(creditsRemaining: number): string {
  if (creditsRemaining === 0) {
    return "Aucune réservation gratuite restante"
  }

  if (creditsRemaining === 1) {
    return "1 réservation gratuite restante"
  }

  return `${creditsRemaining} réservations gratuites restantes`
}

/**
 * Formate la date de reset pour l'UI
 * @param resetAt - Date de reset ISO
 * @returns Message formaté
 */
export function formatResetDate(resetAt: string): string {
  const resetDate = new Date(resetAt)
  const now = new Date()
  const diffDays = Math.ceil((resetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return "Aujourd'hui"
  }

  if (diffDays === 1) {
    return "Demain"
  }

  return `Dans ${diffDays} jours`
}
