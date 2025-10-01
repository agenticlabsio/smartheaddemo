// Enhanced Redis Cache Service for Smart Head Platform
import Redis from 'ioredis'

export interface CacheConfig {
  redis: {
    host: string
    port: number
    password?: string
    db: number
    ttl: {
      queries: number      // 1 hour for SQL results
      conversations: number // 24 hours for chat context  
      greetings: number    // 7 days for greeting responses
      reports: number      // 4 hours for generated reports
      embeddings: number   // 30 days for vector embeddings
      charts: number       // 2 hours for chart configs
    }
  }
}

// Cache Key Patterns
export const CACHE_PATTERNS = {
  SQL_QUERY: 'sql:hash:',
  CONVERSATION: 'conv:',
  USER_MEMORY: 'memory:',
  GREETING: 'greeting:',
  REPORT: 'report:',
  EMBEDDING: 'embed:',
  CHART_CONFIG: 'chart:',
  BULK_INSIGHTS: 'insights:bulk:',
  THINKING_CACHE: 'thinking:',
  ROUTE_CACHE: 'route:'
} as const

export interface CachedQuery {
  sqlHash: string
  results: any[]
  metadata: {
    dataSource: string
    executionTime: number
    recordCount: number
    timestamp: string
  }
}

export interface ConversationCache {
  userId: string
  conversationId: string
  context: any
  messages: any[]
  metadata: {
    lastUpdated: string
    messageCount: number
    expertiseLevel: string
  }
}

export interface GreetingCache {
  userId: string
  greetingType: string
  response: string
  personalized: boolean
  metadata: {
    createdAt: string
    usageCount: number
  }
}

export class SmartHeadCacheService {
  private redis: Redis | null = null
  private config: CacheConfig['redis']
  private inMemoryCache: Map<string, { value: any, expiry: number }> = new Map()
  private isRedisAvailable: boolean = false
  private maxMemoryCacheSize: number = 1000 // Limit in-memory cache size

  constructor() {
    // Initialize Redis with environment variables or defaults
    this.config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      ttl: {
        queries: 3600,      // 1 hour
        conversations: 86400, // 24 hours
        greetings: 604800,  // 7 days
        reports: 14400,     // 4 hours
        embeddings: 2592000, // 30 days
        charts: 7200        // 2 hours
      }
    }

    this.initializeRedis()
  }

  private async initializeRedis() {
    // Don't block constructor - initialize async
    setTimeout(async () => {
      try {
        this.redis = new Redis({
          host: this.config.host,
          port: this.config.port,
          password: this.config.password,
          db: this.config.db,
          maxRetriesPerRequest: 0, // No retries to fail fast
          lazyConnect: true,
          connectTimeout: 500, // Very short timeout
          commandTimeout: 500,  // Very short timeout
          retryDelayOnFailover: 100
        })

        this.redis.on('connect', () => {
          console.log('Redis connected successfully')
          this.isRedisAvailable = true
        })

        this.redis.on('error', () => {
          // Silent fallback to in-memory
          this.isRedisAvailable = false
          this.redis = null
        })

        // Test connection with timeout
        const connectPromise = this.redis.ping()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('timeout')), 500)
        )
        
        await Promise.race([connectPromise, timeoutPromise])
        this.isRedisAvailable = true
      } catch (error) {
        // Silent fallback to in-memory cache
        this.isRedisAvailable = false
        this.redis = null
      }
    }, 0)
  }

  private generateKey(pattern: string, ...parts: string[]): string {
    return pattern + parts.join(':')
  }

  async safeSet(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      if (this.isRedisAvailable && this.redis) {
        const serialized = JSON.stringify(value)
        if (ttl) {
          await this.redis.setex(key, ttl, serialized)
        } else {
          await this.redis.set(key, serialized)
        }
        return true
      } else {
        // Fallback to in-memory cache
        this.cleanupMemoryCache()
        const expiry = ttl ? Date.now() + (ttl * 1000) : Date.now() + (3600 * 1000)
        this.inMemoryCache.set(key, { value, expiry })
        return true
      }
    } catch (error) {
      // Fallback to in-memory cache on Redis error
      this.isRedisAvailable = false
      this.cleanupMemoryCache()
      const expiry = ttl ? Date.now() + (ttl * 1000) : Date.now() + (3600 * 1000)
      this.inMemoryCache.set(key, { value, expiry })
      return true
    }
  }

  async safeGet<T>(key: string): Promise<T | null> {
    try {
      if (this.isRedisAvailable && this.redis) {
        const cached = await this.redis.get(key)
        if (!cached) return null
        return JSON.parse(cached) as T
      } else {
        // Fallback to in-memory cache
        const cached = this.inMemoryCache.get(key)
        if (!cached) return null
        
        // Check expiry
        if (Date.now() > cached.expiry) {
          this.inMemoryCache.delete(key)
          return null
        }
        
        return cached.value as T
      }
    } catch (error) {
      // Fallback to in-memory cache on Redis error
      this.isRedisAvailable = false
      const cached = this.inMemoryCache.get(key)
      if (!cached) return null
      
      // Check expiry
      if (Date.now() > cached.expiry) {
        this.inMemoryCache.delete(key)
        return null
      }
      
      return cached.value as T
    }
  }

  private cleanupMemoryCache() {
    // Clean expired entries and limit cache size
    const now = Date.now()
    for (const [key, cached] of this.inMemoryCache.entries()) {
      if (now > cached.expiry) {
        this.inMemoryCache.delete(key)
      }
    }
    
    // If still too large, remove oldest entries
    if (this.inMemoryCache.size > this.maxMemoryCacheSize) {
      const entries = Array.from(this.inMemoryCache.entries())
      const toDelete = entries.slice(0, entries.length - this.maxMemoryCacheSize)
      for (const [key] of toDelete) {
        this.inMemoryCache.delete(key)
      }
    }
  }

  // ===== SQL Query Caching =====
  async cacheQueryResult(sqlHash: string, results: any[], metadata: CachedQuery['metadata']): Promise<void> {
    const key = this.generateKey(CACHE_PATTERNS.SQL_QUERY, sqlHash)
    const cached: CachedQuery = {
      sqlHash,
      results,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString()
      }
    }
    await this.safeSet(key, cached, this.config.ttl.queries)
  }

  async getCachedQuery(sqlHash: string): Promise<CachedQuery | null> {
    const key = this.generateKey(CACHE_PATTERNS.SQL_QUERY, sqlHash)
    return this.safeGet<CachedQuery>(key)
  }

  // ===== Conversation Memory Caching =====
  async cacheConversationContext(
    userId: string, 
    conversationId: string, 
    context: any,
    messages?: any[]
  ): Promise<void> {
    const key = this.generateKey(CACHE_PATTERNS.CONVERSATION, userId, conversationId)
    const cached: ConversationCache = {
      userId,
      conversationId,
      context,
      messages: messages || [],
      metadata: {
        lastUpdated: new Date().toISOString(),
        messageCount: messages?.length || 0,
        expertiseLevel: context.expertiseLevel || 'intermediate'
      }
    }
    await this.safeSet(key, cached, this.config.ttl.conversations)
  }

  async getCachedConversation(userId: string, conversationId: string): Promise<ConversationCache | null> {
    const key = this.generateKey(CACHE_PATTERNS.CONVERSATION, userId, conversationId)
    return this.safeGet<ConversationCache>(key)
  }

  // ===== User Memory Caching =====
  async cacheUserMemory(userId: string, memory: any): Promise<void> {
    const key = this.generateKey(CACHE_PATTERNS.USER_MEMORY, userId)
    await this.safeSet(key, memory, this.config.ttl.conversations)
  }

  async getCachedUserMemory(userId: string): Promise<any> {
    const key = this.generateKey(CACHE_PATTERNS.USER_MEMORY, userId)
    return this.safeGet(key)
  }

  // ===== Greeting Pattern Caching =====
  async cacheGreetingResponse(
    userId: string, 
    greetingType: string, 
    response: string,
    personalized: boolean = true
  ): Promise<void> {
    const key = this.generateKey(CACHE_PATTERNS.GREETING, userId, greetingType)
    const cached: GreetingCache = {
      userId,
      greetingType,
      response,
      personalized,
      metadata: {
        createdAt: new Date().toISOString(),
        usageCount: 1
      }
    }
    await this.safeSet(key, cached, this.config.ttl.greetings)
  }

  async getCachedGreeting(userId: string, greetingType: string): Promise<GreetingCache | null> {
    const key = this.generateKey(CACHE_PATTERNS.GREETING, userId, greetingType)
    const cached = await this.safeGet<GreetingCache>(key)
    
    // Increment usage count if found
    if (cached) {
      cached.metadata.usageCount += 1
      await this.safeSet(key, cached, this.config.ttl.greetings)
    }
    
    return cached
  }

  // ===== Report Caching with Smart Invalidation =====
  async cacheReport(reportKey: string, report: any, dependencies: string[] = []): Promise<void> {
    const key = this.generateKey(CACHE_PATTERNS.REPORT, reportKey)
    const cached = {
      report,
      dependencies,
      metadata: {
        createdAt: new Date().toISOString(),
        dependencies
      }
    }
    await this.safeSet(key, cached, this.config.ttl.reports)
  }

  async getCachedReport(reportKey: string): Promise<any> {
    const key = this.generateKey(CACHE_PATTERNS.REPORT, reportKey)
    const cached = await this.safeGet<{report: any, dependencies: string[], metadata: any}>(key)
    return cached?.report || null
  }

  async invalidateReportCache(changedTable: string): Promise<void> {
    try {
      if (this.isRedisAvailable && this.redis) {
        const pattern = this.generateKey(CACHE_PATTERNS.REPORT, '*')
        const keys = await this.redis.keys(pattern)
        
        for (const key of keys) {
          const cached = await this.safeGet<{report: any, dependencies: string[], metadata: any}>(key)
          if (cached?.metadata?.dependencies?.includes(changedTable)) {
            await this.redis.del(key)
          }
        }
      } else {
        // Fallback: scan in-memory cache
        const pattern = this.generateKey(CACHE_PATTERNS.REPORT, '')
        for (const [key] of this.inMemoryCache.entries()) {
          if (key.startsWith(pattern)) {
            const cached = this.inMemoryCache.get(key)
            if (cached?.value?.metadata?.dependencies?.includes(changedTable)) {
              this.inMemoryCache.delete(key)
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to invalidate report cache:', error)
    }
  }

  // ===== Embedding Vector Caching =====
  async cacheEmbedding(textHash: string, embedding: number[]): Promise<void> {
    const key = this.generateKey(CACHE_PATTERNS.EMBEDDING, textHash)
    const cached = {
      textHash,
      embedding,
      dimensions: embedding.length,
      createdAt: new Date().toISOString()
    }
    await this.safeSet(key, cached, this.config.ttl.embeddings)
  }

  async getCachedEmbedding(textHash: string): Promise<number[] | null> {
    const key = this.generateKey(CACHE_PATTERNS.EMBEDDING, textHash)
    const cached = await this.safeGet<{embedding: number[], textHash: string, dimensions: number, createdAt: string}>(key)
    return cached?.embedding || null
  }

  // ===== Chart Configuration Caching =====
  async cacheChartConfig(messageId: string, chartConfig: any): Promise<void> {
    const key = this.generateKey(CACHE_PATTERNS.CHART_CONFIG, messageId)
    await this.safeSet(key, chartConfig, this.config.ttl.charts)
  }

  async getCachedChartConfig(messageId: string): Promise<any> {
    const key = this.generateKey(CACHE_PATTERNS.CHART_CONFIG, messageId)
    return this.safeGet(key)
  }

  // ===== Thinking Process Caching =====
  async cacheThinkingProcess(queryHash: string, thinking: any): Promise<void> {
    const key = this.generateKey(CACHE_PATTERNS.THINKING_CACHE, queryHash)
    await this.safeSet(key, thinking, this.config.ttl.queries)
  }

  async getCachedThinking(queryHash: string): Promise<any> {
    const key = this.generateKey(CACHE_PATTERNS.THINKING_CACHE, queryHash)
    return this.safeGet(key)
  }

  // ===== Route Caching =====
  async cacheRoute(routeHash: string, result: any, ttl?: number): Promise<void> {
    const key = this.generateKey(CACHE_PATTERNS.ROUTE_CACHE, routeHash)
    await this.safeSet(key, result, ttl || this.config.ttl.queries)
  }

  async getCachedRoute(routeHash: string): Promise<any> {
    const key = this.generateKey(CACHE_PATTERNS.ROUTE_CACHE, routeHash)
    return this.safeGet(key)
  }

  // ===== Utility Methods =====
  async clearUserCache(userId: string): Promise<void> {
    try {
      if (this.isRedisAvailable && this.redis) {
        const patterns = [
          this.generateKey(CACHE_PATTERNS.CONVERSATION, userId, '*'),
          this.generateKey(CACHE_PATTERNS.USER_MEMORY, userId),
          this.generateKey(CACHE_PATTERNS.GREETING, userId, '*')
        ]
        
        for (const pattern of patterns) {
          const keys = await this.redis.keys(pattern)
          if (keys.length > 0) {
            await this.redis.del(...keys)
          }
        }
      } else {
        // Fallback: clear from in-memory cache
        const userPrefixes = [
          this.generateKey(CACHE_PATTERNS.CONVERSATION, userId),
          this.generateKey(CACHE_PATTERNS.USER_MEMORY, userId),
          this.generateKey(CACHE_PATTERNS.GREETING, userId)
        ]
        
        for (const [key] of this.inMemoryCache.entries()) {
          if (userPrefixes.some(prefix => key.startsWith(prefix))) {
            this.inMemoryCache.delete(key)
          }
        }
      }
    } catch (error) {
      console.error('Failed to clear user cache:', error)
    }
  }

  async getCacheStats(): Promise<any> {
    try {
      if (this.isRedisAvailable && this.redis) {
        const keyCount = await this.redis.dbsize()
        
        return {
          connected: true,
          type: 'redis',
          keyCount,
          config: {
            host: this.config.host,
            port: this.config.port,
            db: this.config.db
          }
        }
      } else {
        return {
          connected: true,
          type: 'in-memory',
          keyCount: this.inMemoryCache.size,
          memoryCache: {
            size: this.inMemoryCache.size,
            maxSize: this.maxMemoryCacheSize
          }
        }
      }
    } catch (error) {
      return {
        connected: true,
        type: 'in-memory',
        keyCount: this.inMemoryCache.size,
        fallback: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.disconnect()
    }
    this.inMemoryCache.clear()
  }

  // Singleton instance
  private static instance: SmartHeadCacheService

  static getInstance(): SmartHeadCacheService {
    if (!SmartHeadCacheService.instance) {
      SmartHeadCacheService.instance = new SmartHeadCacheService()
    }
    return SmartHeadCacheService.instance
  }
}

// Utility function to generate consistent hashes
export function generateSQLHash(sqlQuery: string, dataSource?: string): string {
  const crypto = require('crypto')
  const combined = `${sqlQuery}:${dataSource || 'default'}`
  return crypto.createHash('sha256').update(combined).digest('hex').substring(0, 16)
}

export function generateQueryHash(query: string, uploads: any[] = [], context?: any): string {
  const crypto = require('crypto')
  const combined = JSON.stringify({ query, uploads: uploads.map(u => u.type), context })
  return crypto.createHash('sha256').update(combined).digest('hex').substring(0, 16)
}

export default SmartHeadCacheService