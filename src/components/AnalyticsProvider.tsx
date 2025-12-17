'use client'

import { useAnalytics } from '@/hooks/useAnalytics'

/**
 * Provider component for Firebase Analytics
 * This component should be used in the root layout to enable automatic page tracking
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useAnalytics()
  return <>{children}</>
}
