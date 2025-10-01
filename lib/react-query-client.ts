import { QueryClient } from '@tanstack/react-query'

// Create a React Query client with optimized configuration for financial app
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      // Keep cache for 30 minutes
      gcTime: 30 * 60 * 1000,
      // Retry failed requests up to 3 times
      retry: 3,
      // Don't refetch on window focus for better UX
      refetchOnWindowFocus: false,
      // Enable background refetch for fresh data
      refetchOnReconnect: true,
      // Longer stale time for data that changes infrequently
      refetchInterval: false,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      // Show error for 10 seconds
      gcTime: 10 * 1000,
    },
  },
})

// Query keys for consistent caching
export const queryKeys = {
  // Chat-related queries
  chat: {
    all: ['chats'] as const,
    list: () => [...queryKeys.chat.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.chat.all, 'detail', id] as const,
    messages: (chatId: string) => [...queryKeys.chat.all, 'messages', chatId] as const,
  },
  // Message-related queries  
  message: {
    all: ['messages'] as const,
    detail: (id: string) => [...queryKeys.message.all, 'detail', id] as const,
    evidence: (id: string) => [...queryKeys.message.all, 'evidence', id] as const,
    chart: (id: string) => [...queryKeys.message.all, 'chart', id] as const,
    sql: (id: string) => [...queryKeys.message.all, 'sql', id] as const,
  },
  // Insights-related queries
  insights: {
    all: ['insights'] as const,
    list: (filters?: any) => [...queryKeys.insights.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.insights.all, 'detail', id] as const,
    templates: () => [...queryKeys.insights.all, 'templates'] as const,
    bulkStatus: (jobId: string) => [...queryKeys.insights.all, 'bulk-status', jobId] as const,
  },
  // Data catalog queries
  dataCatalog: {
    all: ['data-catalog'] as const,
    list: () => [...queryKeys.dataCatalog.all, 'list'] as const,
    semantic: () => [...queryKeys.dataCatalog.all, 'semantic'] as const,
  },
  // Settings queries
  settings: {
    all: ['settings'] as const,
    get: () => [...queryKeys.settings.all, 'get'] as const,
  }
} as const

// Prefetch configuration for common data
export const prefetchConfig = {
  // Prefetch insights list on app load
  insights: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    prefetchTime: 1000, // Prefetch after 1 second
  },
  // Prefetch data catalog
  dataCatalog: {
    staleTime: 15 * 60 * 1000, // 15 minutes  
    prefetchTime: 2000, // Prefetch after 2 seconds
  },
  // Prefetch chat list
  chats: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    prefetchTime: 500, // Prefetch after 500ms
  }
}