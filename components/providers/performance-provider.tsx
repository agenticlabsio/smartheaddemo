'use client'

import { useEffect } from 'react'
import { usePrefetch } from '@/lib/hooks/use-prefetch'

export function PerformanceProvider({ children }: { children: React.ReactNode }) {
  const { prefetchInsights, prefetchDataCatalog, prefetchChats } = usePrefetch()

  useEffect(() => {
    // Initialize performance optimizations
    const initializePerformance = async () => {
      // Enable resource hints for critical assets
      if (typeof document !== 'undefined') {
        // Preconnect to API endpoints
        const preconnectLink = document.createElement('link')
        preconnectLink.rel = 'preconnect'
        preconnectLink.href = window.location.origin
        document.head.appendChild(preconnectLink)

        // Prefetch critical routes
        const routesToPrefetch = ['/dashboard', '/insights-center', '/data-catalog']
        routesToPrefetch.forEach(route => {
          const link = document.createElement('link')
          link.rel = 'prefetch'
          link.href = route
          document.head.appendChild(link)
        })
      }

      // Start background prefetching after initial load
      setTimeout(() => {
        prefetchInsights()
        prefetchDataCatalog()
        prefetchChats()
      }, 1000)
    }

    initializePerformance()
  }, [prefetchInsights, prefetchDataCatalog, prefetchChats])

  return <>{children}</>
}