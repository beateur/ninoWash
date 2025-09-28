const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

const ENVIRONMENTS = {
  staging: {
    branch: "develop",
    url: process.env.STAGING_URL || "https://nino-wash-staging.vercel.app",
    vercelProject: process.env.VERCEL_PROJECT_ID,
  },
  production: {
    branch: "main",
    url: process.env.PRODUCTION_URL || "https://nino-wash.vercel.app",
    vercelProject: process.env.VERCEL_PROJECT_ID,
  },
}

async function runCommand(command, description) {
  console.log(`🔄 ${description}...`)
  try {
    const output = execSync(command, { encoding: "utf8", stdio: "pipe" })
    console.log(`✅ ${description} completed`)
    return output
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message)
    throw error
  }
}

async function runHealthCheck(url) {
  console.log(`🏥 Running health check on ${url}...`)

  try {
    const healthCheck = execSync(`node scripts/health-check.js`, {
      env: { ...process.env, NEXT_PUBLIC_APP_URL: url },
      encoding: "utf8",
    })
    console.log("✅ Health check passed")
    return true
  } catch (error) {
    console.error("❌ Health check failed:", error.message)
    return false
  }
}

async function createDeploymentReport(environment, deploymentUrl, healthCheckPassed) {
  const report = {
    timestamp: new Date().toISOString(),
    environment,
    deploymentUrl,
    healthCheckPassed,
    version: process.env.npm_package_version || "unknown",
    branch: ENVIRONMENTS[environment].branch,
    commit: execSync("git rev-parse HEAD", { encoding: "utf8" }).trim(),
    deployer: execSync("git config user.name", { encoding: "utf8" }).trim(),
  }

  const reportsDir = path.join(__dirname, "..", "reports")
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true })
  }

  const reportFile = path.join(reportsDir, `deployment-${environment}-${Date.now()}.json`)
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2))

  console.log(`📊 Deployment report saved: ${reportFile}`)
  return report
}

async function deploy(environment) {
  if (!ENVIRONMENTS[environment]) {
    throw new Error(`Unknown environment: ${environment}`)
  }

  const config = ENVIRONMENTS[environment]
  console.log(`🚀 Starting deployment to ${environment}...\n`)

  try {
    // Pre-deployment checks
    await runCommand("npm run lint", "Linting code")
    await runCommand("npm run test", "Running unit tests")
    await runCommand("npm run build", "Building application")

    // Deploy to Vercel
    const deployCommand = environment === "production" ? "vercel --prod --yes" : "vercel --yes"

    const deployOutput = await runCommand(deployCommand, `Deploying to ${environment}`)

    // Extract deployment URL from output
    const deploymentUrl = deployOutput.match(/https:\/\/[^\s]+/)?.[0] || config.url

    console.log(`🌐 Deployment URL: ${deploymentUrl}`)

    // Wait for deployment to be ready
    console.log("⏳ Waiting for deployment to be ready...")
    await new Promise((resolve) => setTimeout(resolve, 30000)) // Wait 30 seconds

    // Run health check
    const healthCheckPassed = await runHealthCheck(deploymentUrl)

    // Create deployment report
    const report = await createDeploymentReport(environment, deploymentUrl, healthCheckPassed)

    if (healthCheckPassed) {
      console.log(`\n🎉 Deployment to ${environment} completed successfully!`)
      console.log(`🌐 URL: ${deploymentUrl}`)
    } else {
      console.log(`\n⚠️  Deployment completed but health check failed`)
      console.log(`🌐 URL: ${deploymentUrl}`)
      console.log("Please check the application manually")
    }

    return report
  } catch (error) {
    console.error(`\n💥 Deployment to ${environment} failed:`, error.message)
    process.exit(1)
  }
}

// CLI usage
if (require.main === module) {
  const environment = process.argv[2]

  if (!environment || !ENVIRONMENTS[environment]) {
    console.error("Usage: node deploy.js <staging|production>")
    process.exit(1)
  }

  deploy(environment)
}

module.exports = { deploy }
