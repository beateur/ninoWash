import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { signInSchema } from "@/lib/validations/auth"
import { z } from "zod"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = signInSchema.parse(body)

    const supabase = await createServerSupabaseClient()

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    })

    if (error) {
      console.error("[v0] Signin error:", error)
      return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 })
    }

    return NextResponse.json({
      message: "Connexion réussie",
      user: data.user,
    })
  } catch (error) {
    console.error("[v0] Signin error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
