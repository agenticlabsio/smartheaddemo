'use client'

// Request deduplication utility for preventing duplicate API calls
class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>()
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  // Create a unique key for the request
  private createKey(url: string, options?: RequestInit): string {
    const method = options?.method || 'GET'
    const body = options?.body ? JSON.stringify(options.body) : ''
    const headers = options?.headers ? JSON.stringify(options.headers) : ''
    return `${method}:${url}:${body}:${headers}`
  }

  // Check if cached data is still valid
  private isCacheValid(cacheEntry: { timestamp: number; ttl: number }): boolean {
    return Date.now() - cacheEntry.timestamp < cacheEntry.ttl
  }

  // Deduplicated fetch function
  async fetch(url: string, options?: RequestInit & { ttl?: number }): Promise<any> {
    const key = this.createKey(url, options)
    const ttl = options?.ttl || 5 * 60 * 1000 // Default 5 minutes

    // Check cache first
    const cached = this.cache.get(key)
    if (cached && this.isCacheValid(cached)) {
      return cached.data
    }

    // Check if request is already pending
    const pending = this.pendingRequests.get(key)
    if (pending) {
      return pending
    }

    // Create new request
    const requestPromise = fetch(url, options)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        const data = await response.json()
        
        // Cache the result
        this.cache.set(key, {
          data,
          timestamp: Date.now(),
          ttl
        })
        
        return data
      })
      .finally(() => {
        // Remove from pending requests
        this.pendingRequests.delete(key)
      })

    // Store pending request
    this.pendingRequests.set(key, requestPromise)
    
    return requestPromise
  }

  // Clear cache for specific pattern
  clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }

  // Clear expired cache entries
  clearExpiredCache(): void {
    for (const [key, entry] of this.cache.entries()) {
      if (!this.isCacheValid(entry)) {
        this.cache.delete(key)
      }
    }
  }

  // Get cache stats for debugging
  getCacheStats(): { size: number; pending: number; entries: string[] } {
    return {
      size: this.cache.size,
      pending: this.pendingRequests.size,
      entries: Array.from(this.cache.keys())
    }
  }
}

// Global instance
export const requestDeduplicator = new RequestDeduplicator()

// Enhanced fetch wrapper with deduplication
export async function deduplicatedFetch(
  url: string, 
  options?: RequestInit & { ttl?: number }
): Promise<any> {
  return requestDeduplicator.fetch(url, options)
}

// Batch request utility for multiple API calls
export class BatchRequestManager {
  private batchQueue: Array<{
    url: string
    options?: RequestInit
    resolve: (value: any) => void
    reject: (error: any) => void
  }> = []
  private batchTimeout: NodeJS.Timeout | null = null
  private readonly batchDelay = 50 // 50ms batch window

  // Add request to batch queue
  async request(url: string, options?: RequestInit): Promise<any> {
    return new Promise((resolve, reject) => {
      this.batchQueue.push({ url, options, resolve, reject })
      
      // Clear existing timeout
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout)
      }
      
      // Set new timeout to process batch
      this.batchTimeout = setTimeout(() => {
        this.processBatch()
      }, this.batchDelay)
    })
  }

  // Process all queued requests
  private async processBatch(): Promise<void> {
    const batch = this.batchQueue.splice(0)
    this.batchTimeout = null

    if (batch.length === 0) return

    // Group similar requests
    const groupedRequests = new Map<string, Array<typeof batch[0]>>()
    
    for (const request of batch) {
      const key = `${request.options?.method || 'GET'}:${request.url}`
      if (!groupedRequests.has(key)) {
        groupedRequests.set(key, [])
      }
      groupedRequests.get(key)!.push(request)
    }

    // Execute requests in parallel
    const promises = Array.from(groupedRequests.entries()).map(async ([_, requests]) => {
      try {
        // For identical requests, use deduplication
        if (requests.length > 1 && requests.every(r => 
          JSON.stringify(r.options) === JSON.stringify(requests[0].options)
        )) {
          const result = await deduplicatedFetch(requests[0].url, requests[0].options)
          requests.forEach(r => r.resolve(result))
        } else {
          // Execute different requests in parallel
          const results = await Promise.allSettled(
            requests.map(r => deduplicatedFetch(r.url, r.options))
          )
          
          results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              requests[index].resolve(result.value)
            } else {
              requests[index].reject(result.reason)
            }
          })
        }
      } catch (error) {
        requests.forEach(r => r.reject(error))
      }
    })

    await Promise.allSettled(promises)
  }

  // Clear pending requests
  clear(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
      this.batchTimeout = null
    }
    
    const pendingRequests = this.batchQueue.splice(0)
    pendingRequests.forEach(r => r.reject(new Error('Request cancelled')))
  }
}

// Global batch manager
export const batchRequestManager = new BatchRequestManager()

// Performance monitoring utilities
export class PerformanceMonitor {
  private metrics = new Map<string, Array<{ duration: number; timestamp: number }>>()

  // Start timing a request
  startTiming(key: string): () => void {
    const startTime = performance.now()
    
    return () => {
      const duration = performance.now() - startTime
      this.recordMetric(key, duration)
    }
  }

  // Record a metric
  private recordMetric(key: string, duration: number): void {
    if (!this.metrics.has(key)) {
      this.metrics.set(key, [])
    }
    
    const metrics = this.metrics.get(key)!
    metrics.push({ duration, timestamp: Date.now() })
    
    // Keep only last 100 measurements
    if (metrics.length > 100) {
      metrics.shift()
    }
  }

  // Get performance stats
  getStats(key: string): { 
    avg: number
    min: number
    max: number
    count: number
    recent: number
  } | null {
    const metrics = this.metrics.get(key)
    if (!metrics || metrics.length === 0) return null
    
    const durations = metrics.map(m => m.duration)
    const recent = metrics.slice(-10).map(m => m.duration) // Last 10 requests
    
    return {
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      count: durations.length,
      recent: recent.reduce((a, b) => a + b, 0) / recent.length
    }
  }

  // Get all stats
  getAllStats(): Record<string, ReturnType<typeof this.getStats>> {
    const stats: Record<string, ReturnType<typeof this.getStats>> = {}
    for (const key of this.metrics.keys()) {
      stats[key] = this.getStats(key)
    }
    return stats
  }

  // Clear metrics
  clear(): void {
    this.metrics.clear()
  }
}

// Global performance monitor
export const performanceMonitor = new PerformanceMonitor()

// Enhanced fetch with performance monitoring and deduplication
export async function optimizedFetch(
  url: string,
  options?: RequestInit & { ttl?: number; batch?: boolean }
): Promise<any> {
  const key = `${options?.method || 'GET'}:${url}`
  const endTiming = performanceMonitor.startTiming(key)
  
  try {
    let result: any
    
    if (options?.batch) {
      result = await batchRequestManager.request(url, options)
    } else {
      result = await deduplicatedFetch(url, options)
    }
    
    endTiming()
    return result
  } catch (error) {
    endTiming()
    throw error
  }
}