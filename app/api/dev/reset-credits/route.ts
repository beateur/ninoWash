/**
 * DEV ONLY: Manual Credit Reset API
 * 
 * This endpoint allows developers to manually reset weekly credits
 * for testing purposes without waiting for the Monday cron job.
 * 
 * Security: Only available in development mode
 * 
 * Usage:
 *   POST /api/dev/reset-credits
 *   Body: { userId?: string } // Optional: reset specific user
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  // CRITICAL: Block in production
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "This endpoint is only available in development mode" },
      { status: 403 }
    )
  }

  try {
    const body = await request.json().catch(() => ({}))
    const { userId } = body as { userId?: string }

    const supabase = await createClient()

    // Step 1: Fetch active subscriptions
    let query = supabase
      .from("subscriptions")
      .select("id, user_id, plan_id")
      .in("status", ["active", "trialing"])

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data: subscriptions, error: fetchError } = await query

    if (fetchError) {
      console.error("Error fetching subscriptions:", fetchError)
      return NextResponse.json(
        { error: "Failed to fetch subscriptions", details: fetchError.message },
        { status: 500 }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active subscriptions found",
        totalProcessed: 0,
        successCount: 0,
        errorCount: 0,
        results: [],
      })
    }

    // Step 2: Reset credits for each subscription
    const results = []
    let successCount = 0
    let errorCount = 0

    // Map plan_id to credit count
    const PLAN_CREDITS: Record<string, number> = {
      monthly: 2,
      quarterly: 3,
    }

    for (const subscription of subscriptions) {
      const credits = PLAN_CREDITS[subscription.plan_id] || 2

      try {
        // Call initialize_weekly_credits RPC
        const { data, error } = await supabase.rpc("initialize_weekly_credits", {
          p_user_id: subscription.user_id,
          p_subscription_id: subscription.id,
          p_credits_total: credits,
        })

        if (error) {
          console.error(`Error resetting credits for ${subscription.user_id}:`, error)
          errorCount++
          results.push({
            userId: subscription.user_id,
            planId: subscription.plan_id,
            credits,
            success: false,
            error: error.message,
          })
        } else {
          successCount++
          results.push({
            userId: subscription.user_id,
            planId: subscription.plan_id,
            credits,
            success: true,
          })
        }
      } catch (error) {
        console.error(`Exception resetting credits for ${subscription.user_id}:`, error)
        errorCount++
        results.push({
          userId: subscription.user_id,
          planId: subscription.plan_id,
          credits,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    // Step 3: Return summary
    return NextResponse.json({
      success: true,
      message: `Reset completed: ${successCount} successful, ${errorCount} failed`,
      totalProcessed: subscriptions.length,
      successCount,
      errorCount,
      results,
    })
  } catch (error) {
    console.error("Error in dev reset-credits endpoint:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check current credits (for verification)
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "This endpoint is only available in development mode" },
      { status: 403 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    const supabase = await createClient()

    let query = supabase
      .from("subscription_credits")
      .select(`
        *,
        subscription:subscriptions(plan_id, status)
      `)
      .order("created_at", { ascending: false })

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data, error } = await query.limit(10)

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch credits", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      credits: data,
      count: data?.length || 0,
    })
  } catch (error) {
    console.error("Error fetching credits:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
