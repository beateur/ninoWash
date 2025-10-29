'use client'

import { useEffect } from 'react'
import { trackViewContent } from '@/lib/analytics/facebook-pixel'

interface TrackViewContentProps {
  contentName?: string
  contentCategory?: string
}

/**
 * Client component to track ViewContent event on page load
 */
export function TrackViewContent({ contentName, contentCategory }: TrackViewContentProps) {
  useEffect(() => {
    trackViewContent({ contentName, contentCategory })
  }, [contentName, contentCategory])

  return null
}
