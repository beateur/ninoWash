'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function FacebookPixel() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Track PageView on route change
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'PageView')
    }
  }, [pathname, searchParams])

  return null
}

// Type declaration for fbq
declare global {
  interface Window {
    fbq: (command: 'track' | 'init', eventName: string, data?: any) => void
    _fbq: any
  }
}
