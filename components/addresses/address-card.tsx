"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Home, Building, MapIcon, Edit, Trash2 } from "lucide-react"

interface Address {
  id: string
  type: "home" | "work" | "other"
  label: string
  street_address: string
  building_info?: string
  city: string
  postal_code: string
  access_instructions?: string
  is_default: boolean
}

interface AddressCardProps {
  address: Address
  onEdit: (address: Address) => void
  onDelete: (address: Address) => void
}

const getAddressIcon = (type: string) => {
  switch (type) {
    case "home":
      return <Home className="h-4 w-4" />
    case "work":
      return <Building className="h-4 w-4" />
    default:
      return <MapIcon className="h-4 w-4" />
  }
}

const getTypeLabel = (type: string) => {
  switch (type) {
    case "home":
      return "Domicile"
    case "work":
      return "Bureau"
    default:
      return "Autre"
  }
}

export function AddressCard({ address, onEdit, onDelete }: AddressCardProps) {
  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              {getAddressIcon(address.type)}
              <span className="font-medium">{address.label}</span>
            </div>
            <Badge variant="outline">{getTypeLabel(address.type)}</Badge>
          </div>

          {/* Address Details */}
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>{address.street_address}</p>
            {address.building_info && <p>{address.building_info}</p>}
            <p>
              {address.postal_code} {address.city}
            </p>
            {address.access_instructions && (
              <p className="text-xs italic">
                Instructions: {address.access_instructions}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(address)}
              className="flex-1"
            >
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(address)}
              className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
