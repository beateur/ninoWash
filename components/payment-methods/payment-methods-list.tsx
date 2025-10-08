"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, CreditCard, AlertCircle, Loader2 } from "lucide-react"
import { PaymentMethodCard } from "./payment-method-card"
import { PaymentMethodDeleteConfirm } from "./payment-method-delete-confirm"
import { ReplacePaymentMethodDialog } from "./replace-payment-method-dialog"
import { AddPaymentMethodDialog } from "./add-payment-method-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

interface PaymentMethod {
  id: string
  user_id: string
  type: string
  provider: string
  provider_payment_method_id: string
  card_last4: string
  card_brand: string
  card_exp_month: number
  card_exp_year: number
  is_default: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Liste des moyens de paiement avec gestion CRUD
 * Fetch depuis /api/payments/methods
 * Gère les états : loading, empty, error, success
 */
export function PaymentMethodsList() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null) // ID de la carte en cours d'action
  
  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [methodToDelete, setMethodToDelete] = useState<PaymentMethod | null>(null)
  
  // Replace payment method dialog
  const [replaceDialogOpen, setReplaceDialogOpen] = useState(false)
  const [methodToReplace, setMethodToReplace] = useState<PaymentMethod | null>(null)
  
  // Add payment method dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  const { toast } = useToast()

  // Fetch payment methods
  const fetchPaymentMethods = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/payments/methods")
      
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des moyens de paiement")
      }

      const data = await response.json()
      setPaymentMethods(data.paymentMethods || [])
    } catch (err) {
      console.error("[v0] Error fetching payment methods:", err)
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchPaymentMethods()
  }, [])

  // Delete payment method
  const handleDeleteConfirm = async () => {
    if (!methodToDelete) return

    try {
      setActionLoading(methodToDelete.id)

      const response = await fetch(`/api/payments/methods/${methodToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression")
      }

      // Refresh list
      await fetchPaymentMethods()

      toast({
        title: "Moyen de paiement supprimé",
        description: "Ce moyen de paiement a été supprimé avec succès.",
      })
    } catch (err) {
      console.error("[v0] Error deleting payment method:", err)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer ce moyen de paiement.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
      setDeleteDialogOpen(false)
      setMethodToDelete(null)
    }
  }

  // Open delete confirmation
  const handleDelete = (id: string) => {
    const method = paymentMethods.find((m) => m.id === id)
    if (method) {
      setMethodToDelete(method)
      setDeleteDialogOpen(true)
    }
  }

  // Open replace dialog
  const handleReplace = (id: string) => {
    const method = paymentMethods.find((m) => m.id === id)
    if (method) {
      setMethodToReplace(method)
      setReplaceDialogOpen(true)
    }
  }

  // Confirm replace: delete old card then open add dialog
  const handleReplaceConfirm = async () => {
    if (!methodToReplace) return

    try {
      setActionLoading(methodToReplace.id)
      setReplaceDialogOpen(false)

      const response = await fetch(`/api/payments/methods/${methodToReplace.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression de l'ancienne carte")
      }

      // Refresh list
      await fetchPaymentMethods()

      toast({
        title: "Ancienne carte supprimée",
        description: "Vous pouvez maintenant ajouter votre nouvelle carte.",
      })

      // Open add dialog
      setAddDialogOpen(true)
    } catch (err) {
      console.error("[v0] Error replacing payment method:", err)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'ancienne carte.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
      setMethodToReplace(null)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPaymentMethods}
            className="ml-4"
          >
            Réessayer
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // Empty state
  if (paymentMethods.length === 0) {
    return (
      <>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Aucun moyen de paiement</h3>
            <p className="mb-6 text-sm text-muted-foreground max-w-md">
              Ajoutez une carte bancaire pour faciliter vos paiements lors de vos réservations et abonnements.
            </p>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une carte
            </Button>
          </CardContent>
        </Card>

        {/* Add payment method dialog */}
        <AddPaymentMethodDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          onSuccess={fetchPaymentMethods}
        />
      </>
    )
  }

  // List state
  return (
    <div className="space-y-6">
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Moyens de paiement</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {paymentMethods.length} carte{paymentMethods.length > 1 ? "s" : ""} enregistrée{paymentMethods.length > 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une carte
        </Button>
      </div>

      {/* Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {paymentMethods.map((method) => (
          <PaymentMethodCard
            key={method.id}
            paymentMethod={method}
            onReplace={handleReplace}
            onDelete={handleDelete}
            isLoading={actionLoading === method.id}
          />
        ))}
      </div>

      {/* Add payment method dialog */}
      <AddPaymentMethodDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={fetchPaymentMethods}
      />

      {/* Replace payment method dialog */}
      <ReplacePaymentMethodDialog
        open={replaceDialogOpen}
        onOpenChange={setReplaceDialogOpen}
        onConfirm={handleReplaceConfirm}
        paymentMethod={
          methodToReplace
            ? { card_brand: methodToReplace.card_brand, card_last4: methodToReplace.card_last4 }
            : null
        }
      />

      {/* Delete confirmation dialog */}
      <PaymentMethodDeleteConfirm
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        isLoading={actionLoading !== null}
        paymentMethodInfo={
          methodToDelete
            ? { brand: methodToDelete.card_brand, lastFour: methodToDelete.card_last4 }
            : undefined
        }
      />
    </div>
  )
}
