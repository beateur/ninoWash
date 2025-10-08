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

interface PaymentMethodDeleteConfirmProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isLoading?: boolean
  paymentMethodInfo?: {
    brand: string
    lastFour: string
  }
}

/**
 * Dialog de confirmation avant suppression d'un moyen de paiement
 */
export function PaymentMethodDeleteConfirm({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
  paymentMethodInfo,
}: PaymentMethodDeleteConfirmProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer ce moyen de paiement ?</AlertDialogTitle>
          <AlertDialogDescription>
            {paymentMethodInfo ? (
              <>
                Vous êtes sur le point de supprimer votre carte <strong className="capitalize">{paymentMethodInfo.brand}</strong> se terminant par <strong>•••• {paymentMethodInfo.lastFour}</strong>.
                <br /><br />
                Cette action est irréversible. Vous devrez ajouter à nouveau cette carte si vous souhaitez l'utiliser ultérieurement.
              </>
            ) : (
              "Cette action est irréversible. Vous devrez ajouter à nouveau cette carte si vous souhaitez l'utiliser ultérieurement."
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isLoading ? "Suppression..." : "Supprimer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
