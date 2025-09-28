"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AddressForm } from "@/components/forms/address-form"
import { useAuth } from "@/lib/hooks/use-auth"
import { MapPin, Plus, Home, Building, MapIcon } from "lucide-react"

interface Address {
  id: string
  type: string
  label: string
  street_address: string
  apartment?: string
  city: string
  postal_code: string
  is_default: boolean
}

interface AddressStepProps {
  pickupAddressId: string
  deliveryAddressId: string
  onUpdate: (data: { pickupAddressId?: string; deliveryAddressId?: string }) => void
}

export function AddressStep({ pickupAddressId, deliveryAddressId, onUpdate }: AddressStepProps) {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchAddresses()
    } else {
      setAddresses([])
      setLoading(false)
    }
  }, [user])

  const fetchAddresses = async () => {
    try {
      const response = await fetch("/api/addresses")
      const data = await response.json()
      if (response.ok) {
        setAddresses(data.addresses || [])
        // Auto-select default address if none selected
        if (!pickupAddressId && !deliveryAddressId) {
          const defaultAddress = data.addresses?.find((addr: Address) => addr.is_default)
          if (defaultAddress) {
            onUpdate({
              pickupAddressId: defaultAddress.id,
              deliveryAddressId: defaultAddress.id,
            })
          }
        }
      } else {
        console.error("[v0] Error fetching addresses:", data.error)
      }
    } catch (error) {
      console.error("[v0] Error fetching addresses:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddressCreated = (newAddress: Address) => {
    if (user) {
      // For authenticated users, add the address returned from API
      setAddresses((prev) => [newAddress, ...prev])
    } else {
      // For guest users, create a temporary address with generated ID
      const guestAddress = {
        ...newAddress,
        id: `guest-${Date.now()}`, // Generate temporary ID for guest
      }
      setAddresses((prev) => [guestAddress, ...prev])
    }
    setIsDialogOpen(false)
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

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pickup Address */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center">
            <MapPin className="mr-2 h-5 w-5 text-primary" />
            Adresse de collecte
          </h3>
          <div className="space-y-3">
            {addresses.map((address) => (
              <Card
                key={`pickup-${address.id}`}
                className={`cursor-pointer transition-all ${
                  pickupAddressId === address.id ? "ring-2 ring-primary border-primary" : "hover:shadow-md"
                }`}
                onClick={() => onUpdate({ pickupAddressId: address.id })}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        {getAddressIcon(address.type)}
                        <span className="font-medium">{address.label}</span>
                        {address.is_default && <Badge variant="secondary">Par défaut</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {address.street_address}
                        {address.apartment && `, ${address.apartment}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {address.postal_code} {address.city}
                      </p>
                    </div>
                    <Badge variant="outline">{getTypeLabel(address.type)}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Delivery Address */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center">
            <MapPin className="mr-2 h-5 w-5 text-green-600" />
            Adresse de livraison
          </h3>
          <div className="space-y-3">
            {addresses.map((address) => (
              <Card
                key={`delivery-${address.id}`}
                className={`cursor-pointer transition-all ${
                  deliveryAddressId === address.id ? "ring-2 ring-green-500 border-green-500" : "hover:shadow-md"
                }`}
                onClick={() => onUpdate({ deliveryAddressId: address.id })}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        {getAddressIcon(address.type)}
                        <span className="font-medium">{address.label}</span>
                        {address.is_default && <Badge variant="secondary">Par défaut</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {address.street_address}
                        {address.apartment && `, ${address.apartment}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {address.postal_code} {address.city}
                      </p>
                    </div>
                    <Badge variant="outline">{getTypeLabel(address.type)}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Add New Address */}
      <div className="flex justify-center pt-4 border-t">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="bg-transparent">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une nouvelle adresse
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nouvelle adresse</DialogTitle>
            </DialogHeader>
            <AddressForm onSuccess={handleAddressCreated} isGuest={!user} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Same Address Option */}
      {pickupAddressId && deliveryAddressId !== pickupAddressId && (
        <div className="flex justify-center pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onUpdate({ deliveryAddressId: pickupAddressId })}
            className="bg-transparent"
          >
            Utiliser la même adresse pour la livraison
          </Button>
        </div>
      )}
    </div>
  )
}
