"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, CreditCard, DollarSign, Package, TrendingUp, Users, Clock, CheckCircle } from "lucide-react"
import { requireAdmin } from "@/lib/auth/route-guards"

interface DashboardStats {
  totalBookings: number
  activeSubscriptions: number
  monthlyRevenue: number
  pendingBookings: number
  completedBookings: number
  newUsers: number
}

interface RecentBooking {
  id: string
  booking_number: string
  user_name: string
  status: string
  pickup_date: string
  total_amount: number
}

export default async function AdminDashboard() {
  await requireAdmin()

  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    pendingBookings: 0,
    completedBookings: 0,
    newUsers: 0,
  })
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // In a real app, these would be separate API calls
      // For now, we'll simulate the data
      setStats({
        totalBookings: 1247,
        activeSubscriptions: 89,
        monthlyRevenue: 15420,
        pendingBookings: 23,
        completedBookings: 156,
        newUsers: 34,
      })

      setRecentBookings([
        {
          id: "1",
          booking_number: "NW-20241201-001",
          user_name: "Marie Dubois",
          status: "pending",
          pickup_date: "2024-12-02",
          total_amount: 45.9,
        },
        {
          id: "2",
          booking_number: "NW-20241201-002",
          user_name: "Pierre Martin",
          status: "confirmed",
          pickup_date: "2024-12-02",
          total_amount: 32.5,
        },
        {
          id: "3",
          booking_number: "NW-20241201-003",
          user_name: "Sophie Laurent",
          status: "collecting",
          pickup_date: "2024-12-01",
          total_amount: 67.8,
        },
      ])
    } catch (error) {
      console.error("[v0] Error fetching dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
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
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">Chargement du dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Vue d'ensemble de votre activité Nino Wash</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Réservations totales</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +12% ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abonnements actifs</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +8% ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'affaires</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monthlyRevenue.toLocaleString()}€</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +15% ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nouveaux utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newUsers}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +5% ce mois
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>Accès rapide aux tâches courantes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-20 flex flex-col gap-2 bg-transparent">
                <Clock className="h-6 w-6" />
                <span className="text-sm">Réservations en attente</span>
                <Badge variant="secondary">{stats.pendingBookings}</Badge>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2 bg-transparent">
                <CheckCircle className="h-6 w-6" />
                <span className="text-sm">À traiter aujourd'hui</span>
                <Badge variant="secondary">{stats.completedBookings}</Badge>
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Button variant="default" className="w-full">
                <Package className="mr-2 h-4 w-4" />
                Nouvelle réservation
              </Button>
              <Button variant="outline" className="w-full bg-transparent">
                <Users className="mr-2 h-4 w-4" />
                Gérer les utilisateurs
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Réservations récentes</CardTitle>
            <CardDescription>Dernières réservations effectuées</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">{booking.booking_number}</div>
                    <div className="text-sm text-muted-foreground">{booking.user_name}</div>
                    <div className="text-xs text-muted-foreground">
                      Collecte: {new Date(booking.pickup_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    {getStatusBadge(booking.status)}
                    <div className="font-medium">{booking.total_amount}€</div>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4 bg-transparent">
              Voir toutes les réservations
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
