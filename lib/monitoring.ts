export interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  userId?: string
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetric[] = []

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  trackMetric(name: string, value: number, userId?: string) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      userId,
    }

    this.metrics.push(metric)

    // Send to analytics in production
    if (process.env.NODE_ENV === "production") {
      this.sendToAnalytics(metric)
    }
  }

  private sendToAnalytics(metric: PerformanceMetric) {
    // Send to Vercel Analytics or other monitoring service
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "performance_metric", {
        metric_name: metric.name,
        metric_value: metric.value,
        user_id: metric.userId,
      })
    }
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  clearMetrics() {
    this.metrics = []
  }
}

// Performance tracking hooks
export function trackPageLoad(pageName: string) {
  const monitor = PerformanceMonitor.getInstance()

  if (typeof window !== "undefined") {
    const loadTime = performance.now()
    monitor.trackMetric(`page_load_${pageName}`, loadTime)
  }
}

export function trackUserAction(action: string, duration?: number) {
  const monitor = PerformanceMonitor.getInstance()
  monitor.trackMetric(`user_action_${action}`, duration || 1)
}

// Error boundary for production error tracking
export function trackError(error: Error, context?: string) {
  console.error(`[Nino Wash Error] ${context || "Unknown"}:`, error)

  if (process.env.NODE_ENV === "production") {
    // Send to error tracking service
    const monitor = PerformanceMonitor.getInstance()
    monitor.trackMetric("error_count", 1)
  }
}
