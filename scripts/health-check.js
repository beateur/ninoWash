const https = require("https")
const http = require("http")

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

const healthChecks = [
  {
    name: "Main Application",
    url: `${BASE_URL}/api/health`,
    timeout: 5000,
  },
  {
    name: "Database Connection",
    url: `${BASE_URL}/api/health/db`,
    timeout: 10000,
  },
  {
    name: "Authentication Service",
    url: `${BASE_URL}/api/health/auth`,
    timeout: 5000,
  },
  {
    name: "Payment Service",
    url: `${BASE_URL}/api/health/stripe`,
    timeout: 5000,
  },
]

async function checkEndpoint(check) {
  return new Promise((resolve) => {
    const client = check.url.startsWith("https") ? https : http
    const startTime = Date.now()

    const req = client.get(check.url, { timeout: check.timeout }, (res) => {
      const responseTime = Date.now() - startTime
      const isHealthy = res.statusCode === 200

      resolve({
        name: check.name,
        status: isHealthy ? "healthy" : "unhealthy",
        responseTime,
        statusCode: res.statusCode,
      })
    })

    req.on("error", (error) => {
      resolve({
        name: check.name,
        status: "error",
        responseTime: Date.now() - startTime,
        error: error.message,
      })
    })

    req.on("timeout", () => {
      req.destroy()
      resolve({
        name: check.name,
        status: "timeout",
        responseTime: check.timeout,
        error: "Request timeout",
      })
    })
  })
}

async function runHealthChecks() {
  console.log("🏥 Running health checks...\n")

  const results = await Promise.all(healthChecks.map((check) => checkEndpoint(check)))

  let allHealthy = true

  results.forEach((result) => {
    const icon = result.status === "healthy" ? "✅" : "❌"
    console.log(`${icon} ${result.name}`)
    console.log(`   Status: ${result.status}`)
    console.log(`   Response Time: ${result.responseTime}ms`)

    if (result.statusCode) {
      console.log(`   Status Code: ${result.statusCode}`)
    }

    if (result.error) {
      console.log(`   Error: ${result.error}`)
      allHealthy = false
    }

    console.log("")
  })

  if (allHealthy) {
    console.log("🎉 All health checks passed!")
    process.exit(0)
  } else {
    console.log("💥 Some health checks failed!")
    process.exit(1)
  }
}

runHealthChecks().catch((error) => {
  console.error("Health check script failed:", error)
  process.exit(1)
})
