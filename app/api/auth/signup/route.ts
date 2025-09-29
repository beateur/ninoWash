import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { signUpSchema } from "@/lib/validations/auth"
import { z } from "zod"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = signUpSchema.parse(body)

    const supabase = await createClient()

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${request.nextUrl.origin}/auth/callback`,
        data: {
          first_name: validatedData.firstName,
          last_name: validatedData.lastName,
          phone: validatedData.phone,
        },
      },
    })

    if (authError) {
      console.error("[v0] Supabase auth error:", authError)
      return NextResponse.json({ error: "Erreur lors de la création du compte" }, { status: 400 })
    }

    // Insert additional user data into our users table
    if (authData.user) {
      const { error: dbError } = await supabase.from("users").insert({
        id: authData.user.id,
        email: validatedData.email,
        first_name: validatedData.firstName,
        last_name: validatedData.lastName,
        phone: validatedData.phone,
        email_verified: false,
        preferences: {
          marketing_consent: validatedData.marketingConsent,
        },
      })

      if (dbError) {
        console.error("[v0] Database insert error:", dbError)
        // Continue anyway, auth user was created
      }
    }

    return NextResponse.json({
      message: "Compte créé avec succès. Vérifiez votre email pour confirmer votre inscription.",
      user: authData.user,
    })
  } catch (error) {
    console.error("[v0] Signup error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
