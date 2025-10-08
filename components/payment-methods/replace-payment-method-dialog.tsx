"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertCircle, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ReplacePaymentMethodDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  paymentMethod: {
    card_brand: string
    card_last4: string
  } | null
}

/**
 * Dialog explicatif pour le remplacement de carte
 * Explique que pour des raisons de sécurité, il faut supprimer l'ancienne carte
 * et en ajouter une nouvelle via Stripe
 */
export function ReplacePaymentMethodDialog({
  open,
  onOpenChange,
  onConfirm,
  paymentMethod,
}: ReplacePaymentMethodDialogProps) {
  if (!paymentMethod) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            Remplacer votre carte
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 text-left">
            <p>
              Vous êtes sur le point de remplacer votre carte{" "}
              <strong className="capitalize">
                {paymentMethod.card_brand} •••• {paymentMethod.card_last4}
              </strong>
              .
            </p>
            
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                <strong>Pour des raisons de sécurité</strong>, nous ne pouvons pas modifier
                directement les informations d'une carte bancaire. Vous devrez :
              </AlertDescription>
            </Alert>

            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Supprimer l'ancienne carte</li>
              <li>Ajouter votre nouvelle carte via le formulaire sécurisé Stripe</li>
            </ol>

            <p className="text-sm text-muted-foreground">
              Cette procédure garantit la sécurité de vos informations bancaires.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-blue-600 hover:bg-blue-700">
            Continuer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
