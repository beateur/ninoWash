const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

const SECURITY_CHECKS = [
  {
    name: "NPM Audit",
    command: "npm audit --audit-level moderate --json",
    parser: parseNpmAudit,
  },
  {
    name: "Environment Variables Check",
    command: null,
    parser: checkEnvironmentVariables,
  },
  {
    name: "File Permissions Check",
    command: null,
    parser: checkFilePermissions,
  },
  {
    name: "Dependency Vulnerabilities",
    command: "npm ls --depth=0 --json",
    parser: checkDependencyVersions,
  },
]

function parseNpmAudit(output) {
  try {
    const audit = JSON.parse(output)
    return {
      vulnerabilities: audit.metadata?.vulnerabilities || {},
      totalVulnerabilities: Object.values(audit.metadata?.vulnerabilities || {}).reduce((sum, count) => sum + count, 0),
      advisories: audit.advisories || {},
    }
  } catch (error) {
    return { error: "Failed to parse npm audit output" }
  }
}

function checkEnvironmentVariables() {
  const requiredVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]

  const sensitiveVars = ["STRIPE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY", "NEXTAUTH_SECRET"]

  const issues = []

  // Check for missing required variables
  requiredVars.forEach((varName) => {
    if (!process.env[varName]) {
      issues.push({
        type: "missing",
        variable: varName,
        severity: "high",
        message: `Required environment variable ${varName} is not set`,
      })
    }
  })

  // Check for potentially exposed sensitive variables
  sensitiveVars.forEach((varName) => {
    if (process.env[varName] && process.env[varName].includes("test") && process.env.NODE_ENV === "production") {
      issues.push({
        type: "test_key_in_production",
        variable: varName,
        severity: "critical",
        message: `Test key detected in production for ${varName}`,
      })
    }
  })

  return {
    requiredVars: requiredVars.length,
    missingVars: issues.filter((i) => i.type === "missing").length,
    issues,
  }
}

function checkFilePermissions() {
  const sensitiveFiles = [".env", ".env.local", ".env.production", "next.config.mjs"]

  const issues = []

  sensitiveFiles.forEach((file) => {
    const filePath = path.join(process.cwd(), file)
    if (fs.existsSync(filePath)) {
      try {
        const stats = fs.statSync(filePath)
        const mode = stats.mode & Number.parseInt("777", 8)

        // Check if file is world-readable (dangerous for sensitive files)
        if (mode & Number.parseInt("004", 8)) {
          issues.push({
            file,
            permissions: mode.toString(8),
            severity: "medium",
            message: `${file} is world-readable`,
          })
        }
      } catch (error) {
        issues.push({
          file,
          error: error.message,
          severity: "low",
        })
      }
    }
  })

  return { issues }
}

function checkDependencyVersions(output) {
  try {
    const deps = JSON.parse(output)
    const issues = []

    // Check for known vulnerable packages (simplified check)
    const vulnerablePatterns = [
      { name: "lodash", version: "< 4.17.21" },
      { name: "axios", version: "< 0.21.1" },
      { name: "node-fetch", version: "< 2.6.7" },
    ]

    // This is a simplified check - in production, use a proper vulnerability database
    Object.entries(deps.dependencies || {}).forEach(([name, info]) => {
      vulnerablePatterns.forEach((pattern) => {
        if (name === pattern.name) {
          issues.push({
            package: name,
            version: info.version,
            vulnerability: `Potentially vulnerable version (${pattern.version})`,
            severity: "medium",
          })
        }
      })
    })

    return {
      totalDependencies: Object.keys(deps.dependencies || {}).length,
      issues,
    }
  } catch (error) {
    return { error: "Failed to parse dependency list" }
  }
}

async function runSecurityCheck(check) {
  console.log(`🔒 Running ${check.name}...`)

  try {
    let output = ""

    if (check.command) {
      output = execSync(check.command, {
        encoding: "utf8",
        stdio: "pipe",
        cwd: process.cwd(),
      })
    }

    const result = check.parser(output)

    console.log(`   ✅ ${check.name} completed`)
    return { name: check.name, ...result }
  } catch (error) {
    console.log(`   ⚠️  ${check.name} had issues`)
    return {
      name: check.name,
      error: error.message,
      output: error.stdout || error.stderr || "",
    }
  }
}

async function generateSecurityReport(results) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  const reportsDir = path.join(__dirname, "..", "reports")

  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true })
  }

  const report = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    summary: {
      totalChecks: results.length,
      passedChecks: results.filter((r) => !r.error && (!r.issues || r.issues.length === 0)).length,
      failedChecks: results.filter((r) => r.error).length,
      totalIssues: results.reduce((sum, r) => sum + (r.issues?.length || 0), 0),
    },
    results,
  }

  const reportPath = path.join(reportsDir, `security-scan-${timestamp}.json`)
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

  console.log(`\n📋 Security report generated: ${reportPath}`)
  return report
}

async function runSecurityScan() {
  console.log("🛡️  Starting security scan...\n")

  const results = []

  for (const check of SECURITY_CHECKS) {
    const result = await runSecurityCheck(check)
    results.push(result)
  }

  const report = await generateSecurityReport(results)

  console.log(`\n📊 Security Scan Summary:`)
  console.log(`   Total Checks: ${report.summary.totalChecks}`)
  console.log(`   Passed: ${report.summary.passedChecks}`)
  console.log(`   Failed: ${report.summary.failedChecks}`)
  console.log(`   Total Issues: ${report.summary.totalIssues}`)

  if (report.summary.totalIssues > 0) {
    console.log(`\n⚠️  Security issues found. Please review the report.`)

    // Show critical issues
    results.forEach((result) => {
      if (result.issues) {
        const criticalIssues = result.issues.filter((i) => i.severity === "critical")
        if (criticalIssues.length > 0) {
          console.log(`\n🚨 Critical issues in ${result.name}:`)
          criticalIssues.forEach((issue) => {
            console.log(`   - ${issue.message}`)
          })
        }
      }
    })
  } else {
    console.log(`\n✅ No security issues found!`)
  }

  return report
}

if (require.main === module) {
  runSecurityScan().catch((error) => {
    console.error("💥 Security scan failed:", error)
    process.exit(1)
  })
}

module.exports = { runSecurityScan }
