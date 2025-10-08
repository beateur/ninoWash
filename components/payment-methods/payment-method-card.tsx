"use client"

import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreditCard, MoreVertical, Star, Trash2, Edit } from "lucide-react"

interface PaymentMethodCardProps {
  paymentMethod: {
    id: string
    card_brand: string
    card_last4: string
    card_exp_month: number
    card_exp_year: number
    is_default: boolean
  }
  onReplace: (id: string) => void
  onDelete: (id: string) => void
  isLoading?: boolean
}

/**
 * Carte visuelle pour afficher un moyen de paiement
 * Affiche : brand logo, last 4 digits, expiration, badge "Par défaut"
 * Actions : Remplacer, Supprimer
 */
export function PaymentMethodCard({ 
  paymentMethod, 
  onReplace,
  onDelete, 
  isLoading = false 
}: PaymentMethodCardProps) {
  const { id, card_brand, card_last4, card_exp_month, card_exp_year, is_default } = paymentMethod
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Format expiration : MM/YY
  const expiration = `${String(card_exp_month).padStart(2, "0")}/${String(card_exp_year).slice(-2)}`

  // Vérifier si la carte est expirée
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const isExpired = card_exp_year < currentYear || (card_exp_year === currentYear && card_exp_month < currentMonth)

  // Logo de la marque (mapping basique)
  const getBrandColor = (brand: string) => {
    switch (brand.toLowerCase()) {
      case "visa":
        return "bg-blue-500"
      case "mastercard":
        return "bg-red-500"
      case "amex":
        return "bg-blue-700"
      case "discover":
        return "bg-orange-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <Card className="relative p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        {/* Icône et infos carte */}
        <div className="flex items-start gap-4">
          {/* Logo/Icône de marque */}
          <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${getBrandColor(card_brand)} text-white`}>
            <CreditCard className="h-6 w-6" />
          </div>

          {/* Détails */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold capitalize text-lg">
                {card_brand}
              </p>
              {/* Badge Par défaut (inline) */}
              {is_default && (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  Par défaut
                </Badge>
              )}
              {/* Badge Expirée (inline) */}
              {isExpired && (
                <Badge variant="destructive">
                  Expirée
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              •••• {card_last4}
            </p>
            <p className="text-xs text-muted-foreground">
              Expire : {expiration}
            </p>
          </div>
        </div>

        {/* Menu actions - Dropdown custom sans Radix */}
        <div className="relative" ref={dropdownRef}>
          <Button 
            variant="ghost" 
            size="icon" 
            disabled={isLoading}
            aria-label="Actions"
            className="shrink-0"
            onClick={() => {
              console.log("[v0] Dropdown button clicked, current state:", isOpen)
              setIsOpen(!isOpen)
            }}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>

          {/* Dropdown menu */}
          {isOpen && (
            <div 
              className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-[9999]"
              style={{ zIndex: 9999 }}
            >
              <button
                onClick={() => {
                  console.log("[v0] Replace clicked:", id)
                  onReplace(id)
                  setIsOpen(false)
                }}
                disabled={isLoading}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer disabled:opacity-50 rounded-t-md"
              >
                <Edit className="h-4 w-4" />
                Remplacer la carte
              </button>
              <div className="border-t border-gray-200" />
              <button
                onClick={() => {
                  console.log("[v0] Delete clicked:", id)
                  onDelete(id)
                  setIsOpen(false)
                }}
                disabled={isLoading}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer disabled:opacity-50 rounded-b-md"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </button>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
