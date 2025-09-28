"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TableInfo {
  table_name: string
  column_name: string
  data_type: string
  is_nullable: string
}

interface TableStats {
  table_name: string
  row_count: number
}

export default function DatabaseViewer() {
  const [tables, setTables] = useState<TableInfo[]>([])
  const [stats, setStats] = useState<TableStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    fetchDatabaseInfo()
  }, [])

  const fetchDatabaseInfo = async () => {
    try {
      setLoading(true)

      // Récupérer les informations sur les tables
      const { data: tableData, error: tableError } = await supabase
        .from("information_schema.columns")
        .select("table_name, column_name, data_type, is_nullable")
        .eq("table_schema", "public")
        .order("table_name")
        .order("ordinal_position")

      if (tableError) throw tableError

      setTables(tableData || [])

      // Récupérer les statistiques des tables
      const uniqueTables = [...new Set(tableData?.map((t) => t.table_name) || [])]
      const statsPromises = uniqueTables.map(async (tableName) => {
        try {
          const { count, error } = await supabase.from(tableName).select("*", { count: "exact", head: true })

          return {
            table_name: tableName,
            row_count: count || 0,
          }
        } catch {
          return {
            table_name: tableName,
            row_count: 0,
          }
        }
      })

      const statsResults = await Promise.all(statsPromises)
      setStats(statsResults)
    } catch (err) {
      console.error("Erreur lors de la récupération des données:", err)
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  const groupedTables = tables.reduce(
    (acc, table) => {
      if (!acc[table.table_name]) {
        acc[table.table_name] = []
      }
      acc[table.table_name].push(table)
      return acc
    },
    {} as Record<string, TableInfo[]>,
  )

  const createSampleData = async () => {
    try {
      // Créer des données d'exemple
      const { error: userError } = await supabase.from("user_profiles").insert([
        {
          email: "john.doe@example.com",
          first_name: "John",
          last_name: "Doe",
          display_name: "John Doe",
          avatar_url: null,
          timezone: "Europe/Paris",
          language: "fr",
          email_verified: true,
          onboarding_completed: true,
        },
        {
          email: "jane.smith@example.com",
          first_name: "Jane",
          last_name: "Smith",
          display_name: "Jane Smith",
          avatar_url: null,
          timezone: "Europe/London",
          language: "en",
          email_verified: true,
          onboarding_completed: false,
        },
      ])

      if (userError) throw userError

      // Créer une organisation
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .insert([
          {
            name: "Acme Corp",
            slug: "acme-corp",
            description: "Une entreprise de démonstration",
            website: "https://acme-corp.com",
            logo_url: null,
            settings: { theme: "light", notifications: true },
          },
        ])
        .select()

      if (orgError) throw orgError

      alert("Données d'exemple créées avec succès!")
      fetchDatabaseInfo()
    } catch (err) {
      console.error("Erreur lors de la création des données:", err)
      alert("Erreur lors de la création des données: " + (err instanceof Error ? err.message : "Erreur inconnue"))
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Chargement des informations de la base de données...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Erreur</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchDatabaseInfo} className="mt-4">
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Visualiseur de Base de Données</h1>
          <p className="text-muted-foreground">Explorez votre schéma de base de données Supabase</p>
        </div>
        <div className="space-x-2">
          <Button onClick={fetchDatabaseInfo} variant="outline">
            Actualiser
          </Button>
          <Button onClick={createSampleData}>Créer des données d'exemple</Button>
        </div>
      </div>

      <Tabs defaultValue="schema" className="space-y-4">
        <TabsList>
          <TabsTrigger value="schema">Schéma</TabsTrigger>
          <TabsTrigger value="stats">Statistiques</TabsTrigger>
        </TabsList>

        <TabsContent value="schema" className="space-y-4">
          <div className="grid gap-4">
            {Object.entries(groupedTables).map(([tableName, columns]) => {
              const tableStats = stats.find((s) => s.table_name === tableName)
              return (
                <Card key={tableName}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">{tableName}</CardTitle>
                      <Badge variant="secondary">{tableStats?.row_count || 0} lignes</Badge>
                    </div>
                    <CardDescription>{columns.length} colonnes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {columns.map((column, index) => (
                          <div key={index} className="flex items-center justify-between p-2 rounded border">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{column.column_name}</span>
                              <Badge variant="outline" className="text-xs">
                                {column.data_type}
                              </Badge>
                            </div>
                            {column.is_nullable === "NO" && (
                              <Badge variant="destructive" className="text-xs">
                                NOT NULL
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stats.map((stat) => (
              <Card key={stat.table_name}>
                <CardHeader>
                  <CardTitle className="text-lg">{stat.table_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{stat.row_count.toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground">lignes</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
