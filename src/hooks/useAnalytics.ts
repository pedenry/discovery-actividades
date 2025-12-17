import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { trackPageView } from '@/lib/analytics'

/**
 * Hook to automatically track page views in Next.js
 * Usage: Call this hook in your root layout or page components
 */
export const useAnalytics = () => {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (pathname) {
      const url = searchParams?.toString() 
        ? `${pathname}?${searchParams.toString()}` 
        : pathname
      
      trackPageView(url, document.title)
    }
  }, [pathname, searchParams])
}

/**
 * Hook to track page view manually
 * Useful for specific pages where you want custom titles
 */
export const usePageView = (pageTitle?: string) => {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname) {
      trackPageView(pathname, pageTitle || document.title)
    }
  }, [pathname, pageTitle])
}
