import { SchemaVisualization } from "@/components/schema-visualization"
import { SchemaDocumentation } from "@/components/schema-documentation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function DatabaseSchemaPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-balance">Database Schema Design</h1>
          <p className="text-muted-foreground text-lg">
            Comprehensive documentation for your SaaS application database architecture
          </p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="visualization">Visualization</TabsTrigger>
            <TabsTrigger value="tables">Tables</TabsTrigger>
            <TabsTrigger value="best-practices">Best Practices</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <SchemaDocumentation />
          </TabsContent>

          <TabsContent value="visualization">
            <SchemaVisualization />
          </TabsContent>

          <TabsContent value="tables">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h2>Database Tables Reference</h2>
              <p className="text-muted-foreground">Detailed reference for all 48 tables in your database schema</p>
            </div>
          </TabsContent>

          <TabsContent value="best-practices">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h2>Best Practices</h2>
              <p className="text-muted-foreground">Guidelines for working with your database schema</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
