"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import {
  Calendar,
  MapPin,
  Clock,
  Package,
  ChevronRight,
  AlertCircle,
  Edit,
  X,
  CheckCircle,
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { CancelBookingForm } from "./cancel-booking-form"
import { ReportProblemForm } from "./report-problem-form"

interface BookingWithAddresses {
  id: string
  status: string
  pickup_date: string
  pickup_time_slot: string
  delivery_date: string | null
  delivery_time_slot: string | null
  total_amount: number
  created_at: string
  pickup_address: {
    street_address: string
    city: string
  } | null
  delivery_address: {
    street_address: string
    city: string
  } | null
}

interface BookingCardProps {
  booking: BookingWithAddresses
  isSelected?: boolean
  onClick?: () => void
}

const getStatusInfo = (status: string) => {
  switch (status) {
    case "pending":
      return { label: "En attente", variant: "secondary" as const, color: "bg-gray-100 text-gray-800" }
    case "confirmed":
      return { label: "Confirmée", variant: "default" as const, color: "bg-blue-100 text-blue-800" }
    case "picked_up":
      return { label: "Collectée", variant: "default" as const, color: "bg-yellow-100 text-yellow-800" }
    case "in_progress":
      return { label: "En cours", variant: "default" as const, color: "bg-purple-100 text-purple-800" }
    case "ready":
      return { label: "Prête", variant: "default" as const, color: "bg-green-100 text-green-800" }
    case "delivered":
      return { label: "Livrée", variant: "default" as const, color: "bg-green-600 text-white" }
    case "cancelled":
      return { label: "Annulée", variant: "destructive" as const, color: "bg-red-100 text-red-800" }
    default:
      return { label: status, variant: "outline" as const, color: "bg-gray-100 text-gray-800" }
  }
}

export function BookingCard({ booking, isSelected, onClick }: BookingCardProps) {
  const statusInfo = getStatusInfo(booking.status)
  const pickupDate = booking.pickup_date ? new Date(booking.pickup_date) : null
  const deliveryDate = booking.delivery_date ? new Date(booking.delivery_date) : null

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isSelected && "ring-2 ring-primary"
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
              <span className="text-sm text-muted-foreground">
                #{booking.id.slice(0, 8)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Créée le {format(new Date(booking.created_at), "d MMMM yyyy", { locale: fr })}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="space-y-3">
          {/* Pickup info */}
          <div className="flex items-start gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-medium">Collecte</p>
              <p className="text-muted-foreground">
                {pickupDate ? format(pickupDate, "EEEE d MMMM", { locale: fr }) : "Date non définie"}
                {booking.pickup_time_slot && ` • ${booking.pickup_time_slot}`}
              </p>
            </div>
          </div>

          {/* Pickup address */}
          {booking.pickup_address && (
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1 text-sm">
                <p className="text-muted-foreground">
                  {booking.pickup_address.street_address}, {booking.pickup_address.city}
                </p>
              </div>
            </div>
          )}

          {/* Delivery info */}
          {deliveryDate && (
            <div className="flex items-start gap-3">
              <Package className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1 text-sm">
                <p className="font-medium">Livraison</p>
                <p className="text-muted-foreground">
                  {format(deliveryDate, "EEEE d MMMM", { locale: fr })}
                  {booking.delivery_time_slot && ` • ${booking.delivery_time_slot}`}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t flex items-center justify-between">
          <span className="text-sm font-medium">Total</span>
          <span className="text-lg font-bold">{booking.total_amount.toFixed(2)} €</span>
        </div>
      </CardContent>
    </Card>
  )
}

interface BookingDetailPanelProps {
  booking: BookingWithAddresses
  onClose: () => void
  onBookingUpdated?: () => void
}

export function BookingDetailPanel({ booking, onClose, onBookingUpdated }: BookingDetailPanelProps) {
  const [showProblemForm, setShowProblemForm] = useState(false)
  const [showModifyForm, setShowModifyForm] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const { toast } = useToast()

  const statusInfo = getStatusInfo(booking.status)
  const pickupDate = booking.pickup_date ? new Date(booking.pickup_date) : null
  const deliveryDate = booking.delivery_date ? new Date(booking.delivery_date) : null

  // Check if booking is in the future (pickup date is after today)
  const isFutureBooking = pickupDate && pickupDate > new Date()
  
  // Check if booking can be modified (pending or confirmed status and future date)
  const canModify = isFutureBooking && ["pending", "confirmed"].includes(booking.status)

  const handleCancelSuccess = () => {
    toast({
      title: "Réservation annulée",
      description: "Votre réservation a été annulée avec succès.",
      variant: "default",
    })
    setShowCancelConfirm(false)
    onClose()
    onBookingUpdated?.()
  }

  const handleReportSuccess = () => {
    toast({
      title: "Problème signalé",
      description: "Notre équipe vous contactera sous 24h.",
      variant: "default",
    })
    setShowProblemForm(false)
  }

  return (
    <div className="h-full overflow-y-auto">
      <Card className="border-0 shadow-none">
        <CardHeader className="border-b">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">Détails de la réservation</CardTitle>
              <div className="flex items-center gap-2">
                <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                <span className="text-sm text-muted-foreground">
                  Réservation #{booking.id.slice(0, 8)}
                </span>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Informations générales */}
          <div>
            <h3 className="font-semibold mb-3">Informations générales</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date de création</span>
                <span className="font-medium">
                  {format(new Date(booking.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Montant total</span>
                <span className="font-bold text-lg">{booking.total_amount.toFixed(2)} €</span>
              </div>
            </div>
          </div>

          {/* Collecte */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Collecte
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">
                  {pickupDate ? format(pickupDate, "EEEE d MMMM yyyy", { locale: fr }) : "Non définie"}
                </span>
              </div>
              {booking.pickup_time_slot && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Créneau</span>
                  <span className="font-medium">{booking.pickup_time_slot}</span>
                </div>
              )}
              {booking.pickup_address && (
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <p className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <span>
                      {booking.pickup_address.street_address}
                      <br />
                      {booking.pickup_address.city}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Livraison */}
          {deliveryDate && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Livraison
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">
                    {format(deliveryDate, "EEEE d MMMM yyyy", { locale: fr })}
                  </span>
                </div>
                {booking.delivery_time_slot && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Créneau</span>
                    <span className="font-medium">{booking.delivery_time_slot}</span>
                  </div>
                )}
                {booking.delivery_address && (
                  <div className="mt-2 p-3 bg-muted rounded-lg">
                    <p className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <span>
                        {booking.delivery_address.street_address}
                        <br />
                        {booking.delivery_address.city}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3 pt-4 border-t">
            {/* Signaler un problème - toujours disponible */}
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setShowProblemForm(true)}
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              Signaler un problème
            </Button>

            {/* Modifier la réservation - seulement pour réservations futures */}
            {canModify && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowModifyForm(true)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Modifier la réservation
              </Button>
            )}

            {/* Annuler la réservation - seulement pour réservations futures */}
            {canModify && (
              <Button
                variant="outline"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setShowCancelConfirm(true)}
              >
                <X className="mr-2 h-4 w-4" />
                Annuler la réservation
              </Button>
            )}
          </div>

          {/* Problem form placeholder */}
          {showProblemForm && (
            <div className="p-4 bg-muted border rounded-lg">
              <p className="text-sm font-medium mb-3">Signaler un problème</p>
              <ReportProblemForm
                bookingId={booking.id}
                onSuccess={handleReportSuccess}
                onCancel={() => setShowProblemForm(false)}
              />
            </div>
          )}

          {/* Modify form placeholder */}
          {showModifyForm && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium mb-2">Modifier la réservation</p>
              <p className="text-sm text-muted-foreground mb-3">
                Formulaire de modification en développement...
              </p>
              <Button variant="outline" size="sm" onClick={() => setShowModifyForm(false)}>
                Fermer
              </Button>
            </div>
          )}

          {/* Cancel confirmation */}
          {showCancelConfirm && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium mb-3 text-red-900">Annuler la réservation</p>
              <p className="text-sm text-muted-foreground mb-4">
                Êtes-vous sûr de vouloir annuler cette réservation ? Cette action est irréversible.
              </p>
              <CancelBookingForm
                bookingId={booking.id}
                onSuccess={handleCancelSuccess}
                onCancel={() => setShowCancelConfirm(false)}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
