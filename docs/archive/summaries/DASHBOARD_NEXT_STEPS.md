# Dashboard Sidebar UI - Quick Start Guide

## ✅ Ce qui a été fait

### 1. Nouvelle architecture layout
- **Sidebar latérale** remplace le header traditionnel
- **Menu utilisateur** en bas de la sidebar avec dropdown
- **Responsive**: sidebar desktop, bottom nav mobile

### 2. Composants créés
\`\`\`
✅ components/layout/dashboard-sidebar.tsx
✅ components/booking/booking-card.tsx  
✅ components/dashboard/dashboard-client.tsx
\`\`\`

### 3. Refonte du dashboard
- **KPIs** en cards (réservations actives, adresses, prochaine collecte)
- **Liste réservations** cliquables
- **Panneau détails** avec résumé complet
- **Actions**: Signaler problème, Modifier futures (placeholders)

---

## 🚀 Prochaines étapes

### Étape 1: Formulaire "Signaler un problème"

Créer `components/booking/report-problem-form.tsx`:

\`\`\`typescript
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const problemSchema = z.object({
  type: z.enum([
    "damaged_items",
    "missing_items",
    "late_delivery",
    "quality_issue",
    "other"
  ]),
  description: z.string().min(10, "Minimum 10 caractères"),
})

interface ReportProblemFormProps {
  bookingId: string
  onSuccess: () => void
  onCancel: () => void
}

export function ReportProblemForm({ bookingId, onSuccess, onCancel }: ReportProblemFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof problemSchema>>({
    resolver: zodResolver(problemSchema),
  })

  async function onSubmit(data: z.infer<typeof problemSchema>) {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/bookings/${bookingId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        onSuccess()
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type de problème</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="damaged_items">Articles endommagés</SelectItem>
                  <SelectItem value="missing_items">Articles manquants</SelectItem>
                  <SelectItem value="late_delivery">Retard de livraison</SelectItem>
                  <SelectItem value="quality_issue">Problème de qualité</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Décrivez le problème..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Envoi..." : "Envoyer"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        </div>
      </form>
    </Form>
  )
}
\`\`\`

**API Route** `app/api/bookings/[id]/report/route.ts`:

\`\`\`typescript
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const reportSchema = z.object({
  type: z.enum(["damaged_items", "missing_items", "late_delivery", "quality_issue", "other"]),
  description: z.string().min(10),
})

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validated = reportSchema.parse(body)

    // Verify booking belongs to user
    const { data: booking } = await supabase
      .from("bookings")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single()

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Insert problem report
    const { data: report, error } = await supabase
      .from("booking_reports")
      .insert({
        booking_id: params.id,
        user_id: user.id,
        type: validated.type,
        description: validated.description,
        status: "pending",
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, report })
  } catch (error) {
    console.error("Report creation error:", error)
    return NextResponse.json(
      { error: "Failed to create report" },
      { status: 500 }
    )
  }
}
\`\`\`

**Migration SQL** pour la table `booking_reports`:

\`\`\`sql
-- Create booking_reports table
CREATE TABLE IF NOT EXISTS booking_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('damaged_items', 'missing_items', 'late_delivery', 'quality_issue', 'other')),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'resolved', 'rejected')),
  admin_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE booking_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reports"
  ON booking_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create reports for their bookings"
  ON booking_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view and update all reports
CREATE POLICY "Admins can view all reports"
  ON booking_reports FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update all reports"
  ON booking_reports FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin');
\`\`\`

### Étape 2: Intégrer le formulaire dans BookingDetailPanel

Modifier `components/booking/booking-card.tsx`:

\`\`\`typescript
// Ajouter import
import { ReportProblemForm } from "./report-problem-form"

// Dans BookingDetailPanel component:
{showProblemForm && (
  <div className="p-4 bg-muted rounded-lg border">
    <h3 className="font-semibold mb-4">Signaler un problème</h3>
    <ReportProblemForm
      bookingId={booking.id}
      onSuccess={() => {
        setShowProblemForm(false)
        // Optionnel: show success toast
      }}
      onCancel={() => setShowProblemForm(false)}
    />
  </div>
)}
\`\`\`

### Étape 3: Formulaire "Modifier réservations futures"

Similaire à l'étape 1, créer:
- `components/booking/modify-future-form.tsx`
- `app/api/bookings/modify-future/route.ts`

### Étape 4: Pages gestion compte

Créer les sections dans `/profile`:
- Modes de paiement (Stripe Payment Methods)
- Gestion adresses (CRUD adresses utilisateur)

---

## 📋 Commandes Git

\`\`\`bash
# Créer une nouvelle feature branch
git checkout -b feature/booking-problem-reports

# Après développement
git add -A
git commit -m "feat: formulaire signalement problème réservation"
git push origin feature/booking-problem-reports

# Merge dans feature/dashboard-sidebar-ui
git checkout feature/dashboard-sidebar-ui
git merge feature/booking-problem-reports
\`\`\`

---

## 🧪 Tester le dashboard

1. **Se connecter** au dashboard
2. **Cliquer sur une réservation** → Panneau détails s'ouvre
3. **Cliquer "Signaler un problème"** → Formulaire s'affiche
4. **Remplir et soumettre** → Données envoyées à l'API
5. **Vérifier en base** → Table `booking_reports` populated

---

## 📚 Ressources

- **Architecture complète**: `docs/DASHBOARD_SIDEBAR_ARCHITECTURE.md`
- **Composants Shadcn**: https://ui.shadcn.com/docs/components
- **React Hook Form**: https://react-hook-form.com/
- **Zod validation**: https://zod.dev/

---

**Branche actuelle**: `feature/dashboard-sidebar-ui`  
**Status**: ✅ Phase 1 terminée | 🔄 Phase 2 en cours
