'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useCallback } from 'react'
import { queryKeys, prefetchConfig } from '@/lib/react-query-client'

// Hook for intelligent prefetching based on user behavior
export function usePrefetch() {
  const queryClient = useQueryClient()

  // Prefetch insights on app initialization
  const prefetchInsights = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.insights.list(),
      queryFn: async () => {
        const response = await fetch('/api/insights')
        if (!response.ok) throw new Error('Failed to fetch insights')
        return response.json()
      },
      staleTime: prefetchConfig.insights.staleTime,
    })
  }, [queryClient])

  // Prefetch data catalog
  const prefetchDataCatalog = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.dataCatalog.list(),
      queryFn: async () => {
        const response = await fetch('/api/data-catalog')
        if (!response.ok) throw new Error('Failed to fetch data catalog')
        return response.json()
      },
      staleTime: prefetchConfig.dataCatalog.staleTime,
    })
  }, [queryClient])

  // Prefetch chats list
  const prefetchChats = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.chat.list(),
      queryFn: async () => {
        const response = await fetch('/api/chat/load')
        if (!response.ok) throw new Error('Failed to fetch chats')
        return response.json()
      },
      staleTime: prefetchConfig.chats.staleTime,
    })
  }, [queryClient])

  // Prefetch insight templates (used in bulk insights)
  const prefetchInsightTemplates = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.insights.templates(),
      queryFn: async () => {
        const response = await fetch('/api/bulk-insights/templates')
        if (!response.ok) throw new Error('Failed to fetch templates')
        return response.json()
      },
      staleTime: 30 * 60 * 1000, // 30 minutes
    })
  }, [queryClient])

  // Prefetch settings
  const prefetchSettings = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.settings.get(),
      queryFn: async () => {
        const response = await fetch('/api/settings')
        if (!response.ok) throw new Error('Failed to fetch settings')
        return response.json()
      },
      staleTime: 30 * 60 * 1000, // 30 minutes
    })
  }, [queryClient])

  // Auto-prefetch on app load
  useEffect(() => {
    const timer1 = setTimeout(() => {
      prefetchChats()
    }, prefetchConfig.chats.prefetchTime)

    const timer2 = setTimeout(() => {
      prefetchInsights()
    }, prefetchConfig.insights.prefetchTime)

    const timer3 = setTimeout(() => {
      prefetchDataCatalog()
    }, prefetchConfig.dataCatalog.prefetchTime)

    const timer4 = setTimeout(() => {
      prefetchInsightTemplates()
    }, 3000) // 3 seconds

    const timer5 = setTimeout(() => {
      prefetchSettings()
    }, 4000) // 4 seconds

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
      clearTimeout(timer5)
    }
  }, [prefetchChats, prefetchInsights, prefetchDataCatalog, prefetchInsightTemplates, prefetchSettings])

  return {
    prefetchInsights,
    prefetchDataCatalog,
    prefetchChats,
    prefetchInsightTemplates,
    prefetchSettings,
  }
}

// Hook for predictive prefetching based on user interactions
export function usePredictivePrefetch() {
  const queryClient = useQueryClient()

  // Prefetch chat message evidence when hovering over a message
  const prefetchMessageEvidence = useCallback((messageId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.message.evidence(messageId),
      queryFn: async () => {
        const response = await fetch(`/api/message/${messageId}/evidence`)
        if (!response.ok) throw new Error('Failed to fetch evidence')
        return response.json()
      },
      staleTime: 15 * 60 * 1000,
    })
  }, [queryClient])

  // Prefetch chart data when evidence tab is selected
  const prefetchMessageChart = useCallback((messageId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.message.chart(messageId),
      queryFn: async () => {
        const response = await fetch(`/api/message/${messageId}/chart`)
        if (!response.ok) throw new Error('Failed to fetch chart')
        return response.json()
      },
      staleTime: 15 * 60 * 1000,
    })
  }, [queryClient])

  // Prefetch insight details when hovering over insight in list
  const prefetchInsightDetail = useCallback((insightId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.insights.detail(insightId),
      queryFn: async () => {
        const response = await fetch(`/api/insights/${insightId}`)
        if (!response.ok) throw new Error('Failed to fetch insight')
        return response.json()
      },
      staleTime: 10 * 60 * 1000,
    })
  }, [queryClient])

  // Prefetch semantic catalog when data catalog is viewed
  const prefetchSemanticCatalog = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.dataCatalog.semantic(),
      queryFn: async () => {
        const response = await fetch('/api/semantic-catalog')
        if (!response.ok) throw new Error('Failed to fetch semantic catalog')
        return response.json()
      },
      staleTime: 20 * 60 * 1000,
    })
  }, [queryClient])

  return {
    prefetchMessageEvidence,
    prefetchMessageChart,
    prefetchInsightDetail,
    prefetchSemanticCatalog,
  }
}

// Hook for cache warming strategies
export function useCacheWarming() {
  const queryClient = useQueryClient()

  // Warm cache for frequently accessed data
  const warmCache = useCallback(async () => {
    const promises = [
      // Warm insights cache
      queryClient.prefetchQuery({
        queryKey: queryKeys.insights.list(),
        queryFn: async () => {
          const response = await fetch('/api/insights')
          return response.ok ? response.json() : null
        },
        staleTime: 10 * 60 * 1000,
      }),
      
      // Warm data catalog cache
      queryClient.prefetchQuery({
        queryKey: queryKeys.dataCatalog.list(),
        queryFn: async () => {
          const response = await fetch('/api/data-catalog')
          return response.ok ? response.json() : null
        },
        staleTime: 15 * 60 * 1000,
      }),

      // Warm recent chats cache
      queryClient.prefetchQuery({
        queryKey: queryKeys.chat.list(),
        queryFn: async () => {
          const response = await fetch('/api/chat/load')
          return response.ok ? response.json() : null
        },
        staleTime: 5 * 60 * 1000,
      }),
    ]

    try {
      await Promise.allSettled(promises)
    } catch (error) {
      console.warn('Cache warming failed for some queries:', error)
    }
  }, [queryClient])

  // Selectively warm cache based on user role or preferences
  const warmCacheForUser = useCallback(async (userPreferences: any) => {
    const promises = []

    // If user frequently uses insights
    if (userPreferences?.usesInsights) {
      promises.push(
        queryClient.prefetchQuery({
          queryKey: queryKeys.insights.templates(),
          queryFn: async () => {
            const response = await fetch('/api/bulk-insights/templates')
            return response.ok ? response.json() : null
          },
          staleTime: 30 * 60 * 1000,
        })
      )
    }

    // If user frequently uses chat
    if (userPreferences?.usesChat) {
      promises.push(
        queryClient.prefetchQuery({
          queryKey: queryKeys.chat.list(),
          queryFn: async () => {
            const response = await fetch('/api/chat/load')
            return response.ok ? response.json() : null
          },
          staleTime: 5 * 60 * 1000,
        })
      )
    }

    try {
      await Promise.allSettled(promises)
    } catch (error) {
      console.warn('User-specific cache warming failed:', error)
    }
  }, [queryClient])

  // Clear stale cache data
  const clearStaleCache = useCallback(() => {
    // Remove queries older than their stale time
    queryClient.removeQueries({
      predicate: (query) => {
        const now = Date.now()
        const staleTime = (query.options as any).staleTime || 0
        const lastUpdated = query.state.dataUpdatedAt || 0
        return now - lastUpdated > staleTime
      }
    })
  }, [queryClient])

  return {
    warmCache,
    warmCacheForUser,
    clearStaleCache,
  }
}