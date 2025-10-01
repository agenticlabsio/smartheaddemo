'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/react-query-client'

// Chat-related API hooks
export function useChats() {
  return useQuery({
    queryKey: queryKeys.chat.list(),
    queryFn: async () => {
      const response = await fetch('/api/chat/load')
      if (!response.ok) throw new Error('Failed to fetch chats')
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useChat(chatId: string) {
  return useQuery({
    queryKey: queryKeys.chat.detail(chatId),
    queryFn: async () => {
      const response = await fetch(`/api/chat/load/${chatId}`)
      if (!response.ok) throw new Error('Failed to fetch chat')
      return response.json()
    },
    enabled: !!chatId,
    staleTime: 10 * 60 * 1000, // 10 minutes for individual chats
  })
}

// Message-related API hooks
export function useMessageEvidence(messageId: string) {
  return useQuery({
    queryKey: queryKeys.message.evidence(messageId),
    queryFn: async () => {
      const response = await fetch(`/api/message/${messageId}/evidence`)
      if (!response.ok) throw new Error('Failed to fetch evidence')
      return response.json()
    },
    enabled: !!messageId,
    staleTime: 15 * 60 * 1000, // Evidence data changes less frequently
  })
}

export function useMessageChart(messageId: string) {
  return useQuery({
    queryKey: queryKeys.message.chart(messageId),
    queryFn: async () => {
      const response = await fetch(`/api/message/${messageId}/chart`)
      if (!response.ok) throw new Error('Failed to fetch chart')
      return response.json()
    },
    enabled: !!messageId,
    staleTime: 15 * 60 * 1000, // Chart data changes less frequently
  })
}

export function useMessageSql(messageId: string) {
  return useQuery({
    queryKey: queryKeys.message.sql(messageId),
    queryFn: async () => {
      const response = await fetch(`/api/message/${messageId}/sql`)
      if (!response.ok) throw new Error('Failed to fetch SQL')
      return response.json()
    },
    enabled: !!messageId,
    staleTime: 30 * 60 * 1000, // SQL rarely changes
  })
}

// Insights-related API hooks
export function useInsights(filters?: any) {
  return useQuery({
    queryKey: queryKeys.insights.list(filters),
    queryFn: async () => {
      const response = await fetch('/api/insights')
      if (!response.ok) throw new Error('Failed to fetch insights')
      return response.json()
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useInsightTemplates() {
  return useQuery({
    queryKey: queryKeys.insights.templates(),
    queryFn: async () => {
      const response = await fetch('/api/bulk-insights/templates')
      if (!response.ok) throw new Error('Failed to fetch templates')
      return response.json()
    },
    staleTime: 30 * 60 * 1000, // Templates change rarely
  })
}

export function useBulkInsightStatus(jobId: string) {
  return useQuery({
    queryKey: queryKeys.insights.bulkStatus(jobId),
    queryFn: async () => {
      const response = await fetch(`/api/bulk-insights/status?jobId=${jobId}`)
      if (!response.ok) throw new Error('Failed to fetch bulk status')
      return response.json()
    },
    enabled: !!jobId,
    refetchInterval: 2000, // Poll every 2 seconds for job status
    staleTime: 0, // Always fetch fresh data for job status
  })
}

// Data catalog API hooks
export function useDataCatalog() {
  return useQuery({
    queryKey: queryKeys.dataCatalog.list(),
    queryFn: async () => {
      const response = await fetch('/api/data-catalog')
      if (!response.ok) throw new Error('Failed to fetch data catalog')
      return response.json()
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  })
}

export function useSemanticCatalog() {
  return useQuery({
    queryKey: queryKeys.dataCatalog.semantic(),
    queryFn: async () => {
      const response = await fetch('/api/semantic-catalog')
      if (!response.ok) throw new Error('Failed to fetch semantic catalog')
      return response.json()
    },
    staleTime: 20 * 60 * 1000, // 20 minutes - semantic data changes infrequently
  })
}

// Settings API hooks
export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings.get(),
    queryFn: async () => {
      const response = await fetch('/api/settings')
      if (!response.ok) throw new Error('Failed to fetch settings')
      return response.json()
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

// Mutation hooks with optimistic updates
export function useSaveChat() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (chatData: any) => {
      const response = await fetch('/api/unified-storage/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chatData),
      })
      if (!response.ok) throw new Error('Failed to save chat')
      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch chats list
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.all })
    },
  })
}

export function useDeleteChat() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (chatId: string) => {
      const response = await fetch('/api/chat/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId }),
      })
      if (!response.ok) throw new Error('Failed to delete chat')
      return response.json()
    },
    onSuccess: () => {
      // Invalidate chats list
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.all })
    },
  })
}

export function useStoreMessage() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (messageData: any) => {
      const response = await fetch('/api/message/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData),
      })
      if (!response.ok) throw new Error('Failed to store message')
      return response.json()
    },
    onSuccess: (data, variables) => {
      // Invalidate related chat messages
      if (variables.chatId) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.chat.messages(variables.chatId) 
        })
      }
    },
  })
}

// Prefetch utilities for performance
export function usePrefetchInsights() {
  const queryClient = useQueryClient()
  
  return () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.insights.list(),
      queryFn: async () => {
        const response = await fetch('/api/insights')
        if (!response.ok) throw new Error('Failed to fetch insights')
        return response.json()
      },
      staleTime: 10 * 60 * 1000,
    })
  }
}

export function usePrefetchDataCatalog() {
  const queryClient = useQueryClient()
  
  return () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.dataCatalog.list(),
      queryFn: async () => {
        const response = await fetch('/api/data-catalog')
        if (!response.ok) throw new Error('Failed to fetch data catalog')
        return response.json()
      },
      staleTime: 15 * 60 * 1000,
    })
  }
}