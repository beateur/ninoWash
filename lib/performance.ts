"use client"

import React from "react"

export interface PerformanceMetrics {
  pageLoadTime: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  cumulativeLayoutShift: number
  firstInputDelay: number
}

export class PerformanceTracker {
  private static instance: PerformanceTracker
  private metrics: Map<string, PerformanceMetrics> = new Map()

  static getInstance(): PerformanceTracker {
    if (!PerformanceTracker.instance) {
      PerformanceTracker.instance = new PerformanceTracker()
    }
    return PerformanceTracker.instance
  }

  trackPageLoad(pageName: string) {
    if (typeof window === "undefined") return

    // Wait for page to be fully loaded
    window.addEventListener("load", () => {
      const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming
      const paint = performance.getEntriesByType("paint")

      const fcp = paint.find((entry) => entry.name === "first-contentful-paint")?.startTime || 0

      const metrics: PerformanceMetrics = {
        pageLoadTime: navigation.loadEventEnd - navigation.fetchStart,
        firstContentfulPaint: fcp,
        largestContentfulPaint: 0, // Will be updated by observer
        cumulativeLayoutShift: 0, // Will be updated by observer
        firstInputDelay: 0, // Will be updated by observer
      }

      this.metrics.set(pageName, metrics)
      this.setupObservers(pageName)

      // Send to analytics in production
      if (process.env.NODE_ENV === "production") {
        this.sendToAnalytics(pageName, metrics)
      }
    })
  }

  private setupObservers(pageName: string) {
    if (typeof window === "undefined") return

    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      const metrics = this.metrics.get(pageName)
      if (metrics) {
        metrics.largestContentfulPaint = lastEntry.startTime
        this.metrics.set(pageName, metrics)
      }
    }).observe({ entryTypes: ["largest-contentful-paint"] })

    // Cumulative Layout Shift
    new PerformanceObserver((list) => {
      let clsValue = 0
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value
        }
      }
      const metrics = this.metrics.get(pageName)
      if (metrics) {
        metrics.cumulativeLayoutShift = clsValue
        this.metrics.set(pageName, metrics)
      }
    }).observe({ entryTypes: ["layout-shift"] })

    // First Input Delay
    new PerformanceObserver((list) => {
      const firstInput = list.getEntries()[0]
      const metrics = this.metrics.get(pageName)
      if (metrics) {
        metrics.firstInputDelay = (firstInput as any).processingStart - firstInput.startTime
        this.metrics.set(pageName, metrics)
      }
    }).observe({ entryTypes: ["first-input"] })
  }

  private sendToAnalytics(pageName: string, metrics: PerformanceMetrics) {
    // Send to Vercel Analytics or other service
    if (typeof window !== "undefined" && (window as any).gtag) {
      ;(window as any).gtag("event", "page_performance", {
        page_name: pageName,
        page_load_time: Math.round(metrics.pageLoadTime),
        fcp: Math.round(metrics.firstContentfulPaint),
        lcp: Math.round(metrics.largestContentfulPaint),
        cls: metrics.cumulativeLayoutShift,
        fid: Math.round(metrics.firstInputDelay),
      })
    }
  }

  getMetrics(pageName: string): PerformanceMetrics | undefined {
    return this.metrics.get(pageName)
  }

  getAllMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.metrics)
  }
}

// Hook for easy usage in components
export function usePerformanceTracking(pageName: string) {
  const tracker = PerformanceTracker.getInstance()

  React.useEffect(() => {
    tracker.trackPageLoad(pageName)
  }, [pageName, tracker])

  return tracker.getMetrics(pageName)
}
