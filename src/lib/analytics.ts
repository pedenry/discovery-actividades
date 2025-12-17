import { logEvent, setUserProperties, setUserId } from 'firebase/analytics'
import { getAnalyticsInstance } from './firebase'

/**
 * Logs a custom event to Firebase Analytics
 * @param eventName - Name of the event
 * @param eventParams - Optional parameters for the event
 */
export const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
  const analytics = getAnalyticsInstance()
  if (analytics) {
    logEvent(analytics, eventName, eventParams)
    console.log(`📊 Event tracked: ${eventName}`, eventParams)
  }
}

/**
 * Tracks page views
 * @param pagePath - Path of the page
 * @param pageTitle - Title of the page
 */
export const trackPageView = (pagePath: string, pageTitle?: string) => {
  trackEvent('page_view', {
    page_path: pagePath,
    page_title: pageTitle || pagePath,
  })
}

/**
 * Tracks user interactions
 */
export const trackUserInteraction = (action: string, category: string, label?: string) => {
  trackEvent('user_interaction', {
    action,
    category,
    label,
  })
}

/**
 * Tracks activity creation
 */
export const trackActivityCreated = (activityType: string) => {
  trackEvent('activity_created', {
    activity_type: activityType,
  })
}

/**
 * Tracks activity update
 */
export const trackActivityUpdated = (activityType: string) => {
  trackEvent('activity_updated', {
    activity_type: activityType,
  })
}

/**
 * Tracks evidence upload
 */
export const trackEvidenceUploaded = (evidenceType: string, fileSize?: number) => {
  trackEvent('evidence_uploaded', {
    evidence_type: evidenceType,
    file_size: fileSize,
  })
}

/**
 * Tracks search queries
 */
export const trackSearch = (searchTerm: string, resultsCount: number) => {
  trackEvent('search', {
    search_term: searchTerm,
    results_count: resultsCount,
  })
}

/**
 * Tracks filter usage
 */
export const trackFilterUsed = (filterType: string, filterValue: string) => {
  trackEvent('filter_used', {
    filter_type: filterType,
    filter_value: filterValue,
  })
}

/**
 * Tracks errors
 */
export const trackError = (errorMessage: string, errorCode?: string) => {
  trackEvent('error_occurred', {
    error_message: errorMessage,
    error_code: errorCode,
  })
}

/**
 * Sets user properties for Analytics
 */
export const setUserAnalyticsProperties = (properties: Record<string, any>) => {
  const analytics = getAnalyticsInstance()
  if (analytics) {
    setUserProperties(analytics, properties)
    console.log('📊 User properties set:', properties)
  }
}

/**
 * Sets the user ID for Analytics
 */
export const setAnalyticsUserId = (userId: string) => {
  const analytics = getAnalyticsInstance()
  if (analytics) {
    setUserId(analytics, userId)
    console.log('📊 User ID set:', userId)
  }
}
