"use client"

import { useState, useEffect } from "react"
import { Plus, MapPin, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { AddressCard } from "./address-card"
import { AddressFormDialog } from "./address-form-dialog"
import { AddressDeleteConfirm } from "./address-delete-confirm"

interface Address {
  id: string
  type: "home" | "work" | "other"
  label: string
  street_address: string
  apartment?: string
  city: string
  postal_code: string
  delivery_instructions?: string
  access_code?: string
  is_default: boolean
}

export function AddressesSection() {
  const { toast } = useToast()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean
    address: Address | null
  }>({ open: false, address: null })

  // Load addresses
  const loadAddresses = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/addresses")
      if (!response.ok) throw new Error("Failed to load addresses")

      const data = await response.json()
      setAddresses(data.addresses || [])
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger vos adresses. Veuillez réessayer.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAddresses()
  }, [])

  // Add new address
  const handleAdd = () => {
    setSelectedAddress(null)
    setIsFormOpen(true)
  }

  // Edit address
  const handleEdit = (address: Address) => {
    setSelectedAddress(address)
    setIsFormOpen(true)
  }

  // Set default address
  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/addresses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_default: true }),
      })

      if (!response.ok) throw new Error("Failed to set default")

      // Update local state
      setAddresses((prev) =>
        prev.map((addr) => ({
          ...addr,
          is_default: addr.id === id,
        }))
      )

      toast({
        title: "Succès",
        description: "Adresse par défaut mise à jour",
      })
    } catch (error) {
      throw error
    }
  }

  // Delete address
  const handleDeleteClick = (address: Address) => {
    setDeleteConfirm({ open: true, address })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.address) return

    try {
      const response = await fetch(`/api/addresses/${deleteConfirm.address.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete")
      }

      // Remove from local state
      setAddresses((prev) =>
        prev.filter((addr) => addr.id !== deleteConfirm.address!.id)
      )

      toast({
        title: "Succès",
        description: "Adresse supprimée",
      })

      setDeleteConfirm({ open: false, address: null })
    } catch (error) {
      throw error
    }
  }

  // Success callback
  const handleFormSuccess = () => {
    loadAddresses()
    setIsFormOpen(false)
    setSelectedAddress(null)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-light">Mes Adresses</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 rounded-xl border border-gray-200 bg-gray-50 animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" id="addresses">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-light">Mes Adresses</h2>
        <Button
          onClick={handleAdd}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle adresse
        </Button>
      </div>

      {/* Empty state */}
      {addresses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 px-6 text-center bg-gray-50 rounded-xl border border-gray-200"
        >
          <MapPin className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune adresse
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            Ajoutez votre première adresse pour faciliter vos futures
            réservations de pressing.
          </p>
          <Button
            onClick={handleAdd}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Ajouter ma première adresse
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((address) => (
            <motion.div
              key={address.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <AddressCard
                address={address}
                onEdit={handleEdit}
                onSetDefault={handleSetDefault}
                onDelete={handleDeleteClick}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <AddressFormDialog
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setSelectedAddress(null)
        }}
        onSuccess={handleFormSuccess}
        address={selectedAddress}
      />

      {/* Delete Confirmation */}
      <AddressDeleteConfirm
        open={deleteConfirm.open}
        addressLabel={deleteConfirm.address?.label || ""}
        onCancel={() => setDeleteConfirm({ open: false, address: null })}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
