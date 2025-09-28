const lighthouse = require("lighthouse")
const chromeLauncher = require("chrome-launcher")
const fs = require("fs")
const path = require("path")

const AUDIT_CONFIG = {
  extends: "lighthouse:default",
  settings: {
    onlyAudits: [
      "first-contentful-paint",
      "largest-contentful-paint",
      "first-meaningful-paint",
      "speed-index",
      "cumulative-layout-shift",
      "total-blocking-time",
      "max-potential-fid",
      "time-to-interactive",
      "server-response-time",
      "render-blocking-resources",
      "unused-css-rules",
      "unused-javascript",
      "modern-image-formats",
      "uses-optimized-images",
      "uses-text-compression",
      "uses-responsive-images",
    ],
  },
}

const PAGES_TO_AUDIT = [
  { name: "Homepage", url: "/" },
  { name: "Services", url: "/services" },
  { name: "Booking", url: "/reservation" },
  { name: "Login", url: "/auth/signin" },
  { name: "Dashboard", url: "/dashboard" },
]

async function auditPage(chrome, baseUrl, page) {
  console.log(`🔍 Auditing ${page.name} (${page.url})...`)

  const url = `${baseUrl}${page.url}`
  const options = {
    logLevel: "info",
    output: "json",
    onlyCategories: ["performance"],
    port: chrome.port,
  }

  try {
    const runnerResult = await lighthouse(url, options, AUDIT_CONFIG)
    const { lhr } = runnerResult

    const metrics = {
      name: page.name,
      url: page.url,
      score: Math.round(lhr.categories.performance.score * 100),
      metrics: {
        fcp: lhr.audits["first-contentful-paint"].numericValue,
        lcp: lhr.audits["largest-contentful-paint"].numericValue,
        fmp: lhr.audits["first-meaningful-paint"].numericValue,
        si: lhr.audits["speed-index"].numericValue,
        cls: lhr.audits["cumulative-layout-shift"].numericValue,
        tbt: lhr.audits["total-blocking-time"].numericValue,
        fid: lhr.audits["max-potential-fid"].numericValue,
        tti: lhr.audits["time-to-interactive"].numericValue,
        ttfb: lhr.audits["server-response-time"].numericValue,
      },
      opportunities: lhr.audits["render-blocking-resources"].details?.items?.length || 0,
      diagnostics: {
        unusedCss: lhr.audits["unused-css-rules"].details?.items?.length || 0,
        unusedJs: lhr.audits["unused-javascript"].details?.items?.length || 0,
        unoptimizedImages: lhr.audits["uses-optimized-images"].details?.items?.length || 0,
      },
    }

    console.log(`   📊 Performance Score: ${metrics.score}/100`)
    console.log(`   ⚡ FCP: ${Math.round(metrics.metrics.fcp)}ms`)
    console.log(`   🎯 LCP: ${Math.round(metrics.metrics.lcp)}ms`)
    console.log(`   📐 CLS: ${metrics.metrics.cls.toFixed(3)}`)

    return metrics
  } catch (error) {
    console.error(`   ❌ Failed to audit ${page.name}:`, error.message)
    return {
      name: page.name,
      url: page.url,
      error: error.message,
    }
  }
}

async function generateReport(results) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  const reportsDir = path.join(__dirname, "..", "reports")

  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true })
  }

  // Generate JSON report
  const jsonReport = {
    timestamp: new Date().toISOString(),
    summary: {
      totalPages: results.length,
      averageScore: Math.round(
        results.filter((r) => !r.error).reduce((sum, r) => sum + r.score, 0) / results.filter((r) => !r.error).length,
      ),
      failedAudits: results.filter((r) => r.error).length,
    },
    results,
  }

  const jsonPath = path.join(reportsDir, `performance-audit-${timestamp}.json`)
  fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2))

  // Generate HTML report
  const htmlReport = `
<!DOCTYPE html>
<html>
<head>
    <title>Performance Audit Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .page-result { border: 1px solid #ddd; margin: 20px 0; padding: 20px; border-radius: 8px; }
        .score { font-size: 24px; font-weight: bold; }
        .good { color: #0f9d58; }
        .average { color: #ff9800; }
        .poor { color: #f44336; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 15px 0; }
        .metric { background: #f9f9f9; padding: 10px; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>Performance Audit Report</h1>
    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Pages Audited:</strong> ${jsonReport.summary.totalPages}</p>
        <p><strong>Average Score:</strong> ${jsonReport.summary.averageScore}/100</p>
        <p><strong>Failed Audits:</strong> ${jsonReport.summary.failedAudits}</p>
    </div>
    
    ${results
      .map((result) => {
        if (result.error) {
          return `
          <div class="page-result">
            <h3>${result.name}</h3>
            <p style="color: red;">Error: ${result.error}</p>
          </div>
        `
        }

        const scoreClass = result.score >= 90 ? "good" : result.score >= 50 ? "average" : "poor"

        return `
        <div class="page-result">
          <h3>${result.name} <span class="score ${scoreClass}">${result.score}/100</span></h3>
          <div class="metrics">
            <div class="metric">
              <strong>First Contentful Paint</strong><br>
              ${Math.round(result.metrics.fcp)}ms
            </div>
            <div class="metric">
              <strong>Largest Contentful Paint</strong><br>
              ${Math.round(result.metrics.lcp)}ms
            </div>
            <div class="metric">
              <strong>Cumulative Layout Shift</strong><br>
              ${result.metrics.cls.toFixed(3)}
            </div>
            <div class="metric">
              <strong>Time to Interactive</strong><br>
              ${Math.round(result.metrics.tti)}ms
            </div>
          </div>
          <p><strong>Optimization Opportunities:</strong> ${result.opportunities}</p>
          <p><strong>Unused CSS Rules:</strong> ${result.diagnostics.unusedCss}</p>
          <p><strong>Unused JavaScript:</strong> ${result.diagnostics.unusedJs}</p>
        </div>
      `
      })
      .join("")}
</body>
</html>
  `

  const htmlPath = path.join(reportsDir, `performance-audit-${timestamp}.html`)
  fs.writeFileSync(htmlPath, htmlReport)

  console.log(`\n📊 Reports generated:`)
  console.log(`   JSON: ${jsonPath}`)
  console.log(`   HTML: ${htmlPath}`)

  return jsonReport
}

async function runPerformanceAudit() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  console.log(`🚀 Starting performance audit for ${baseUrl}...\n`)

  const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless"] })

  try {
    const results = []

    for (const page of PAGES_TO_AUDIT) {
      const result = await auditPage(chrome, baseUrl, page)
      results.push(result)
    }

    await chrome.kill()

    const report = await generateReport(results)

    console.log(`\n🎉 Performance audit completed!`)
    console.log(`📊 Average Score: ${report.summary.averageScore}/100`)

    if (report.summary.averageScore < 70) {
      console.log(`⚠️  Performance score is below 70. Consider optimizations.`)
      process.exit(1)
    }

    return report
  } catch (error) {
    await chrome.kill()
    throw error
  }
}

if (require.main === module) {
  runPerformanceAudit().catch((error) => {
    console.error("💥 Performance audit failed:", error)
    process.exit(1)
  })
}

module.exports = { runPerformanceAudit }
