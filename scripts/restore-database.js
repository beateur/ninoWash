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

async function restoreTable(tableName, data) {
  console.log(`📥 Restoring ${tableName}...`)

  try {
    // Clear existing data (be careful in production!)
    if (process.env.NODE_ENV !== "production" || process.argv.includes("--force")) {
      const { error: deleteError } = await supabase.from(tableName).delete().neq("id", 0) // Delete all records

      if (deleteError && !deleteError.message.includes("no rows")) {
        console.warn(`   ⚠️  Warning clearing ${tableName}:`, deleteError.message)
      }
    }

    // Insert data in batches
    const batchSize = 100
    let inserted = 0

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize)

      const { error } = await supabase.from(tableName).insert(batch)

      if (error) {
        console.error(`   ❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message)
      } else {
        inserted += batch.length
      }
    }

    console.log(`   ✅ ${tableName}: ${inserted}/${data.length} records restored`)
    return { table: tableName, restored: inserted, total: data.length }
  } catch (error) {
    console.error(`   ❌ Failed to restore ${tableName}:`, error.message)
    return { table: tableName, error: error.message }
  }
}

async function restoreFromManifest(manifestFile) {
  console.log("🔄 Starting database restore...\n")

  const backupsDir = path.join(__dirname, "..", "backups")
  const manifestPath = path.join(backupsDir, manifestFile)

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest file not found: ${manifestFile}`)
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"))
  console.log(`📋 Using manifest from ${manifest.timestamp}`)
  console.log(`🎯 Environment: ${manifest.environment}`)
  console.log(`📊 Tables to restore: ${manifest.tables.length}\n`)

  const results = []
  let totalRestored = 0

  for (const tableInfo of manifest.tables) {
    if (tableInfo.error) {
      console.log(`⏭️  Skipping ${tableInfo.table} (had backup error)`)
      continue
    }

    const dataFile = path.join(backupsDir, tableInfo.file)

    if (!fs.existsSync(dataFile)) {
      console.error(`❌ Data file not found: ${tableInfo.file}`)
      continue
    }

    const data = JSON.parse(fs.readFileSync(dataFile, "utf8"))
    const result = await restoreTable(tableInfo.table, data)
    results.push(result)

    if (result.restored) {
      totalRestored += result.restored
    }
  }

  console.log(`\n📊 Total records restored: ${totalRestored}`)
  console.log("🎉 Restore completed!")

  return results
}

// CLI usage
if (require.main === module) {
  const manifestFile = process.argv[2]

  if (!manifestFile) {
    console.error("Usage: node restore-database.js <manifest-file>")
    console.error("Example: node restore-database.js manifest_2024-01-15T10-30-00-000Z.json")
    process.exit(1)
  }

  if (process.env.NODE_ENV === "production" && !process.argv.includes("--force")) {
    console.error("❌ Production restore requires --force flag")
    console.error("Usage: node restore-database.js <manifest-file> --force")
    process.exit(1)
  }

  restoreFromManifest(manifestFile).catch((error) => {
    console.error("💥 Restore failed:", error.message)
    process.exit(1)
  })
}

module.exports = { restoreFromManifest, restoreTable }
