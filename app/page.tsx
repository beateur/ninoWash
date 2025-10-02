import { DatabaseSchemaVisualization } from "@/components/database-schema-visualization"
import { SchemaDocumentation } from "@/components/schema-documentation"

export default function DatabaseSchemaPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Database Schema Design</h1>
          <p className="text-muted-foreground text-lg">
            Comprehensive multi-tenant SaaS database architecture with 48 tables
          </p>
        </div>

        <div className="space-y-8">
          <DatabaseSchemaVisualization />
          <SchemaDocumentation />
        </div>
      </div>
    </div>
  )
}
