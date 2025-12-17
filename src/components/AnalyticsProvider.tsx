'use client'

import { Suspense } from 'react'
import { useAnalytics } from '@/hooks/useAnalytics'

/**
 * Internal component that uses the analytics hook
 * Wrapped in Suspense to handle useSearchParams during SSR
 */
function AnalyticsTracker() {
  useAnalytics()
  return null
}

/**
 * Provider component for Firebase Analytics
 * This component should be used in the root layout to enable automatic page tracking
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <AnalyticsTracker />
      </Suspense>
      {children}
    </>
  )
}
