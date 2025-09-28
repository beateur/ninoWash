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

async function runMigrations() {
  console.log("🚀 Starting database migrations...\n")

  try {
    // Get all SQL files in scripts directory
    const scriptsDir = path.join(__dirname)
    const sqlFiles = fs
      .readdirSync(scriptsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort()

    console.log(`Found ${sqlFiles.length} SQL files to process:\n`)

    for (const file of sqlFiles) {
      console.log(`📄 Processing ${file}...`)

      const filePath = path.join(scriptsDir, file)
      const sql = fs.readFileSync(filePath, "utf8")

      // Split SQL file into individual statements
      const statements = sql
        .split(";")
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0)

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i]
        if (statement) {
          try {
            const { error } = await supabase.rpc("exec_sql", { sql_query: statement })
            if (error) {
              console.error(`   ❌ Error in statement ${i + 1}:`, error.message)
            } else {
              console.log(`   ✅ Statement ${i + 1} executed successfully`)
            }
          } catch (err) {
            console.error(`   ❌ Failed to execute statement ${i + 1}:`, err.message)
          }
        }
      }

      console.log(`✅ Completed ${file}\n`)
    }

    console.log("🎉 All migrations completed successfully!")
  } catch (error) {
    console.error("💥 Migration failed:", error.message)
    process.exit(1)
  }
}

// Create exec_sql function if it doesn't exist
async function createExecFunction() {
  const { error } = await supabase.rpc("exec_sql", {
    sql_query: `
      CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql_query;
      END;
      $$;
    `,
  })

  if (error && !error.message.includes("already exists")) {
    console.log("Creating exec_sql function...")
  }
}

createExecFunction()
  .then(() => {
    runMigrations()
  })
  .catch((error) => {
    console.error("Failed to create exec function:", error)
    process.exit(1)
  })
