const { createClient } = require("@supabase/supabase-js")
const fs = require("fs")
const path = require("path")

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const tables = [
  "users",
  "user_addresses",
  "services",
  "bookings",
  "booking_services",
  "subscription_plans",
  "user_subscriptions",
  "payments",
  "notifications",
]

async function backupTable(tableName) {
  console.log(`📦 Backing up ${tableName}...`)

  try {
    const { data, error } = await supabase.from(tableName).select("*")

    if (error) {
      throw error
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const backupDir = path.join(__dirname, "..", "backups")

    // Create backups directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    const filename = `${tableName}_${timestamp}.json`
    const filepath = path.join(backupDir, filename)

    fs.writeFileSync(filepath, JSON.stringify(data, null, 2))

    console.log(`   ✅ ${tableName}: ${data?.length || 0} records backed up to ${filename}`)
    return { table: tableName, records: data?.length || 0, file: filename }
  } catch (error) {
    console.error(`   ❌ Failed to backup ${tableName}:`, error.message)
    return { table: tableName, error: error.message }
  }
}

async function createFullBackup() {
  console.log("🗄️  Starting full database backup...\n")

  const results = []
  let totalRecords = 0

  for (const table of tables) {
    const result = await backupTable(table)
    results.push(result)

    if (result.records) {
      totalRecords += result.records
    }
  }

  // Create backup manifest
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  const manifest = {
    timestamp: new Date().toISOString(),
    tables: results,
    totalRecords,
    environment: process.env.NODE_ENV || "development",
  }

  const manifestPath = path.join(__dirname, "..", "backups", `manifest_${timestamp}.json`)
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))

  console.log(`\n📋 Backup manifest created: manifest_${timestamp}.json`)
  console.log(`📊 Total records backed up: ${totalRecords}`)
  console.log("🎉 Backup completed successfully!")

  return manifest
}

if (require.main === module) {
  createFullBackup().catch((error) => {
    console.error("💥 Backup failed:", error)
    process.exit(1)
  })
}

module.exports = { createFullBackup, backupTable }
