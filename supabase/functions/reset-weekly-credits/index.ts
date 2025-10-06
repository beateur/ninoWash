/**
 * Supabase Edge Function: Reset Weekly Credits
 * 
 * Cette fonction s'exécute chaque lundi à 00:00 UTC via un cron job.
 * Elle initialise les crédits hebdomadaires pour tous les abonnés actifs.
 * 
 * Cron schedule: "0 0 * * 1" (chaque lundi à minuit UTC)
 * 
 * Test manuel:
 * curl -i --location --request POST 'https://YOUR_PROJECT.supabase.co/functions/v1/reset-weekly-credits' \
 *   --header 'Authorization: Bearer YOUR_ANON_KEY'
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0"

// Types
interface Subscription {
  id: string
  user_id: string
  plan_id: string
  status: string
}

interface ResetResult {
  success: boolean
  userId: string
  subscriptionId: string
  credits: number
  error?: string
}

// Configuration CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

// Mapping des plans vers le nombre de crédits
const PLAN_CREDITS: Record<string, number> = {
  monthly: 2,
  quarterly: 3,
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    console.log("[ResetWeeklyCredits] Starting weekly reset at", new Date().toISOString())

    // Créer client Supabase avec service_role key (permissions admin)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // 1. Récupérer tous les abonnements actifs
    const { data: subscriptions, error: fetchError } = await supabase
      .from("subscriptions")
      .select("id, user_id, plan_id, status")
      .in("status", ["active", "trialing"])

    if (fetchError) {
      console.error("[ResetWeeklyCredits] Error fetching subscriptions:", fetchError)
      throw new Error(`Failed to fetch subscriptions: ${fetchError.message}`)
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("[ResetWeeklyCredits] No active subscriptions found")
      return new Response(
        JSON.stringify({
          success: true,
          message: "No active subscriptions to reset",
          totalProcessed: 0,
          results: [],
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      )
    }

    console.log(`[ResetWeeklyCredits] Found ${subscriptions.length} active subscriptions`)

    // 2. Pour chaque abonnement, initialiser les crédits hebdomadaires
    const results: ResetResult[] = []
    let successCount = 0
    let errorCount = 0

    for (const subscription of subscriptions as Subscription[]) {
      try {
        // Déterminer le nombre de crédits selon le plan
        const planKey = subscription.plan_id.toLowerCase()
        const credits = PLAN_CREDITS[planKey] || 2 // Fallback: 2 crédits par défaut

        console.log(
          `[ResetWeeklyCredits] Processing subscription ${subscription.id} (plan: ${subscription.plan_id}, credits: ${credits})`
        )

        // Appeler la fonction PostgreSQL pour initialiser les crédits
        const { data: resetData, error: resetError } = await supabase.rpc("initialize_weekly_credits", {
          p_user_id: subscription.user_id,
          p_subscription_id: subscription.id,
          p_credits_total: credits,
        })

        if (resetError) {
          console.error(
            `[ResetWeeklyCredits] Error resetting credits for user ${subscription.user_id}:`,
            resetError
          )
          errorCount++
          results.push({
            success: false,
            userId: subscription.user_id,
            subscriptionId: subscription.id,
            credits: credits,
            error: resetError.message,
          })
        } else {
          console.log(
            `[ResetWeeklyCredits] ✅ Successfully reset credits for user ${subscription.user_id} (${credits} credits)`
          )
          successCount++
          results.push({
            success: true,
            userId: subscription.user_id,
            subscriptionId: subscription.id,
            credits: credits,
          })
        }
      } catch (error) {
        console.error(
          `[ResetWeeklyCredits] Unexpected error processing subscription ${subscription.id}:`,
          error
        )
        errorCount++
        results.push({
          success: false,
          userId: subscription.user_id,
          subscriptionId: subscription.id,
          credits: 0,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    // 3. Logger les statistiques finales
    const summary = {
      success: errorCount === 0,
      totalProcessed: subscriptions.length,
      successCount,
      errorCount,
      timestamp: new Date().toISOString(),
      results: results.slice(0, 10), // Limiter les résultats détaillés aux 10 premiers
    }

    console.log("[ResetWeeklyCredits] Reset complete:", {
      total: subscriptions.length,
      success: successCount,
      errors: errorCount,
    })

    // 4. Si des erreurs, logger mais ne pas échouer
    if (errorCount > 0) {
      console.warn(
        `[ResetWeeklyCredits] ⚠️ Reset completed with ${errorCount} errors out of ${subscriptions.length} subscriptions`
      )
    }

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error) {
    console.error("[ResetWeeklyCredits] Fatal error:", error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    )
  }
})

/* Déploiement et configuration:

1. Déployer la fonction:
   supabase functions deploy reset-weekly-credits

2. Configurer le cron job dans Supabase Dashboard:
   - Aller dans Database > Cron Jobs (pg_cron extension)
   - Créer un nouveau job:
   
   SELECT cron.schedule(
     'reset-weekly-credits',           -- nom du job
     '0 0 * * 1',                      -- chaque lundi à 00:00 UTC
     $$
     SELECT
       net.http_post(
         url := 'https://YOUR_PROJECT.supabase.co/functions/v1/reset-weekly-credits',
         headers := jsonb_build_object(
           'Content-Type', 'application/json',
           'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
         ),
         body := '{}'::jsonb
       ) AS request_id;
     $$
   );

3. Vérifier les jobs:
   SELECT * FROM cron.job;

4. Désactiver le job (si nécessaire):
   SELECT cron.unschedule('reset-weekly-credits');

5. Logs (voir les exécutions):
   SELECT * FROM cron.job_run_details 
   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'reset-weekly-credits')
   ORDER BY start_time DESC LIMIT 10;

*/
