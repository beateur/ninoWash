/**
 * API Route: Check if email already exists
 * POST /api/bookings/guest/check-email
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { emailCheckSchema } from "@/lib/validations/guest-contact"

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request
    const body = await request.json()
    const validation = emailCheckSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation échouée",
          issues: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { email } = validation.data

    // 2. Check if email exists in Supabase Auth
    const supabase = await createClient()

    // Use admin client to query auth.users
    const { data: { users }, error } = await supabase.auth.admin.listUsers()

    if (error) {
      console.error("[v0] Failed to list users:", error)
      return NextResponse.json(
        { error: "Erreur lors de la vérification de l'email" },
        { status: 500 }
      )
    }

    const userExists = users.some((user) => user.email?.toLowerCase() === email.toLowerCase())

    return NextResponse.json({
      exists: userExists,
      suggestLogin: userExists,
    })
  } catch (error) {
    console.error("[v0] Email check error:", error)
    return NextResponse.json(
      { error: "Erreur serveur lors de la vérification" },
      { status: 500 }
    )
  }
}
