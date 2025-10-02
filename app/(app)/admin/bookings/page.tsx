"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Eye, Edit, Trash2 } from "lucide-react"

interface Booking {
  id: string
  booking_number: string
  user_name: string
  user_email: string
  status: string
  pickup_date: string
  pickup_time_slot: string
  total_amount: number
  created_at: string
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    fetchBookings()
  }, [])

  useEffect(() => {
    filterBookings()
  }, [bookings, searchTerm, statusFilter])

  const fetchBookings = async () => {
    try {
      // Simulate API call - in real app would fetch from /api/admin/bookings
      const mockBookings: Booking[] = [
        {
          id: "1",
          booking_number: "NW-20241201-001",
          user_name: "Marie Dubois",
          user_email: "marie.dubois@email.com",
          status: "pending",
          pickup_date: "2024-12-02",
          pickup_time_slot: "09:00-12:00",
          total_amount: 45.9,
          created_at: "2024-12-01T10:30:00Z",
        },
        {
          id: "2",
          booking_number: "NW-20241201-002",
          user_name: "Pierre Martin",
          user_email: "pierre.martin@email.com",
          status: "confirmed",
          pickup_date: "2024-12-02",
          pickup_time_slot: "14:00-17:00",
          total_amount: 32.5,
          created_at: "2024-12-01T11:15:00Z",
        },
        {
          id: "3",
          booking_number: "NW-20241201-003",
          user_name: "Sophie Laurent",
          user_email: "sophie.laurent@email.com",
          status: "collecting",
          pickup_date: "2024-12-01",
          pickup_time_slot: "18:00-21:00",
          total_amount: 67.8,
          created_at: "2024-12-01T09:45:00Z",
        },
        {
          id: "4",
          booking_number: "NW-20241130-015",
          user_name: "Jean Dupont",
          user_email: "jean.dupont@email.com",
          status: "completed",
          pickup_date: "2024-11-30",
          pickup_time_slot: "09:00-12:00",
          total_amount: 89.2,
          created_at: "2024-11-29T16:20:00Z",
        },
      ]

      setBookings(mockBookings)
    } catch (error) {
      console.error("[v0] Error fetching bookings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterBookings = () => {
    let filtered = bookings

    if (searchTerm) {
      filtered = filtered.filter(
        (booking) =>
          booking.booking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.user_email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((booking) => booking.status === statusFilter)
    }

    setFilteredBookings(filtered)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "En attente", variant: "secondary" as const },
      confirmed: { label: "Confirmé", variant: "default" as const },
      collecting: { label: "Collecte", variant: "outline" as const },
      processing: { label: "Traitement", variant: "secondary" as const },
      ready: { label: "Prêt", variant: "default" as const },
      delivering: { label: "Livraison", variant: "outline" as const },
      completed: { label: "Terminé", variant: "secondary" as const },
      cancelled: { label: "Annulé", variant: "destructive" as const },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">Chargement des réservations...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion des réservations</h1>
        <p className="text-muted-foreground">Gérez toutes les réservations de vos clients</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
          <CardDescription>Recherchez et filtrez les réservations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numéro, nom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="confirmed">Confirmé</SelectItem>
                <SelectItem value="collecting">Collecte</SelectItem>
                <SelectItem value="processing">Traitement</SelectItem>
                <SelectItem value="ready">Prêt</SelectItem>
                <SelectItem value="delivering">Livraison</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Réservations ({filteredBookings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date de collecte</TableHead>
                <TableHead>Créneau</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">{booking.booking_number}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{booking.user_name}</div>
                      <div className="text-sm text-muted-foreground">{booking.user_email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(booking.status)}</TableCell>
                  <TableCell>{new Date(booking.pickup_date).toLocaleDateString()}</TableCell>
                  <TableCell>{booking.pickup_time_slot}</TableCell>
                  <TableCell className="font-medium">{booking.total_amount}€</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
