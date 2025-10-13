#!/usr/bin/env tsx
/**
 * Script interactif pour créer des créneaux de collecte et livraison
 * 
 * Usage:
 *   pnpm slots:create
 * 
 * Configuration:
 *   Modifier les constantes SLOT_CONFIG ci-dessous pour personnaliser
 */

import { config } from "dotenv"
import { resolve } from "path"
import { createClient } from "@supabase/supabase-js"

// Charger les variables d'environnement depuis .env.local
config({ path: resolve(process.cwd(), ".env.local") })

// ============================================================================
// CONFIGURATION - Modifier ces valeurs selon vos besoins
// ============================================================================

interface SlotConfig {
  date: string // Format: YYYY-MM-DD
  startTime: string // Format: HH:MM
  endTime: string // Format: HH:MM
  label: string // Ex: "Matin", "Après-midi", "Soirée"
  createBoth?: boolean // true = créer pickup ET delivery, false = uniquement pickup
  notes?: string // Notes optionnelles
}

const SLOT_CONFIG: SlotConfig[] = [
  // Semaine du 14-20 octobre 2025
  {
    date: "2025-10-14",
    startTime: "09:00",
    endTime: "12:00",
    label: "Matin",
    createBoth: true,
    notes: "Créneau matinal - Mardi",
  },
  {
    date: "2025-10-14",
    startTime: "14:00",
    endTime: "17:00",
    label: "Après-midi",
    createBoth: true,
    notes: "Créneau après-midi - Mardi",
  },
  {
    date: "2025-10-14",
    startTime: "18:00",
    endTime: "21:00",
    label: "Soirée",
    createBoth: true,
    notes: "Créneau soirée - Mardi",
  },
  {
    date: "2025-10-16",
    startTime: "09:00",
    endTime: "12:00",
    label: "Matin",
    createBoth: true,
    notes: "Créneau matinal - Jeudi",
  },
  {
    date: "2025-10-16",
    startTime: "14:00",
    endTime: "17:00",
    label: "Après-midi",
    createBoth: true,
    notes: "Créneau après-midi - Jeudi",
  },
  {
    date: "2025-10-16",
    startTime: "18:00",
    endTime: "21:00",
    label: "Soirée",
    createBoth: true,
    notes: "Créneau soirée - Jeudi",
  },
  {
    date: "2025-10-18",
    startTime: "16:00",
    endTime: "18:00",
    label: "Fin d'après-midi",
    createBoth: true,
    notes: "Créneau fin d'après-midi - Samedi",
  },
  {
    date: "2025-10-18",
    startTime: "19:00",
    endTime: "21:00",
    label: "Soirée",
    createBoth: true,
    notes: "Créneau soirée - Samedi",
  },
]

// ============================================================================
// CODE DU SCRIPT - Ne pas modifier sauf si vous savez ce que vous faites
// ============================================================================

interface Slot {
  role: "pickup" | "delivery"
  slot_date: string
  start_time: string
  end_time: string
  label: string
  is_open: boolean
  notes?: string
}

async function main() {
  console.log("🚀 Script de création de créneaux logistiques\n")

  // Vérifier les variables d'environnement
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Erreur: Variables d'environnement manquantes")
    console.error("   NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✓" : "✗")
    console.error("   SUPABASE_SERVICE_ROLE_KEY:", supabaseKey ? "✓" : "✗")
    console.error("\n💡 Assurez-vous que votre fichier .env.local contient ces variables")
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  console.log("📋 Configuration:")
  console.log(`   - ${SLOT_CONFIG.length} dates configurées`)
  console.log("")

  // Compter les slots à créer
  const totalSlots = SLOT_CONFIG.reduce((acc, config) => {
    return acc + (config.createBoth !== false ? 2 : 1)
  }, 0)

  console.log(`📊 ${totalSlots} créneaux à créer:\n`)

  // Préparer les slots
  const slotsToInsert: Slot[] = []

  for (const config of SLOT_CONFIG) {
    const baseSlot = {
      slot_date: config.date,
      start_time: config.startTime,
      end_time: config.endTime,
      label: config.label,
      is_open: true,
      notes: config.notes,
    }

    // Créer le slot de collecte
    slotsToInsert.push({
      ...baseSlot,
      role: "pickup",
    })

    console.log(
      `   ✓ Collecte - ${config.date} ${config.startTime}-${config.endTime} (${config.label})`
    )

    // Créer le slot de livraison si demandé
    if (config.createBoth !== false) {
      slotsToInsert.push({
        ...baseSlot,
        role: "delivery",
      })

      console.log(
        `   ✓ Livraison - ${config.date} ${config.startTime}-${config.endTime} (${config.label})`
      )
    }
  }

  console.log("\n⏳ Insertion dans Supabase...")

  // Insérer les slots
  const { data, error } = await supabase
    .from("logistic_slots")
    .insert(slotsToInsert)
    .select()

  if (error) {
    console.error("\n❌ Erreur lors de l'insertion:", error.message)
    console.error("   Détails:", error)
    process.exit(1)
  }

  console.log(`\n✅ ${data?.length || 0} créneaux créés avec succès!`)

  // Afficher un résumé
  console.log("\n📊 Résumé par date:")
  const groupedByDate = slotsToInsert.reduce((acc, slot) => {
    if (!acc[slot.slot_date]) {
      acc[slot.slot_date] = { pickup: 0, delivery: 0 }
    }
    acc[slot.slot_date][slot.role]++
    return acc
  }, {} as Record<string, { pickup: number; delivery: number }>)

  Object.entries(groupedByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([date, counts]) => {
      console.log(
        `   ${date}: ${counts.pickup} collecte(s) + ${counts.delivery} livraison(s)`
      )
    })

  console.log("\n🎉 Terminé! Les créneaux sont maintenant disponibles dans l'application.")
  console.log("   → Testez sur: http://localhost:3000/reservation/guest (étape 3)\n")
}

// Exécution
main().catch((error) => {
  console.error("\n❌ Erreur fatale:", error)
  process.exit(1)
})
