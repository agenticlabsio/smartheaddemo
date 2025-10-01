// Enhanced Memory Framework for Smart Head - Memory-enhanced conversations
import { SmartHeadCacheService } from '../cache/redis-service'

export interface LangGraphMemoryConfig {
  userId: string
  conversationId: string
  memoryType: 'semantic' | 'episodic' | 'procedural'
  namespace: string
  maxTokens?: number
}

export interface MemoryEntry {
  id: string
  content: string
  metadata: {
    timestamp: string
    userId: string
    conversationId: string
    type: 'semantic' | 'episodic' | 'procedural'
    confidence: number
    importance: number
    tags: string[]
  }
  embedding?: number[]
}

export interface ConversationEpisode {
  id: string
  userId: string
  conversationId: string
  startTime: string
  endTime?: string
  messages: any[]
  summary: string
  keyInsights: string[]
  topics: string[]
  userContext: any
}

export interface SemanticFact {
  id: string
  userId: string
  fact: string
  category: 'preference' | 'knowledge' | 'behavior' | 'context'
  confidence: number
  lastUpdated: string
  sources: string[]
}

export interface ProceduralMemory {
  id: string
  userId: string
  pattern: string
  condition: string
  action: string
  success_rate: number
  usage_count: number
  lastUsed: string
}

export class LangGraphMemoryManager {
  private cache: SmartHeadCacheService
  private config: LangGraphMemoryConfig

  constructor(config: LangGraphMemoryConfig) {
    this.config = config
    this.cache = SmartHeadCacheService.getInstance()
  }

  // ===== Semantic Memory (Facts and Preferences) =====
  async storeSemanticFact(fact: SemanticFact): Promise<void> {
    const key = `semantic:${this.config.userId}:${fact.id}`
    await this.cache.safeSet(key, fact, 2592000) // 30 days
    
    // Also store in user index for retrieval
    await this.addToUserIndex('semantic', fact.id)
  }

  async getSemanticFacts(category?: string, limit: number = 10): Promise<SemanticFact[]> {
    try {
      const factIds = await this.getUserIndex('semantic')
      const facts: SemanticFact[] = []
      
      for (const factId of factIds.slice(0, limit * 2)) { // Get more to filter
        const key = `semantic:${this.config.userId}:${factId}`
        const fact = await this.cache.safeGet<SemanticFact>(key)
        
        if (fact && (!category || fact.category === category)) {
          facts.push(fact)
          if (facts.length >= limit) break
        }
      }
      
      return facts.sort((a, b) => b.confidence - a.confidence)
    } catch (error) {
      console.error('Error retrieving semantic facts:', error)
      return []
    }
  }

  async updateSemanticFact(factId: string, updates: Partial<SemanticFact>): Promise<void> {
    const key = `semantic:${this.config.userId}:${factId}`
    const existing = await this.cache.safeGet<SemanticFact>(key)
    
    if (existing) {
      const updated = {
        ...existing,
        ...updates,
        lastUpdated: new Date().toISOString()
      }
      await this.cache.safeSet(key, updated, 2592000)
    }
  }

  // ===== Episodic Memory (Conversation Episodes) =====
  async storeConversationEpisode(episode: ConversationEpisode): Promise<void> {
    const key = `episodic:${this.config.userId}:${episode.id}`
    await this.cache.safeSet(key, episode, 604800) // 7 days
    
    await this.addToUserIndex('episodic', episode.id)
  }

  async getConversationEpisodes(limit: number = 5): Promise<ConversationEpisode[]> {
    try {
      const episodeIds = await this.getUserIndex('episodic')
      const episodes: ConversationEpisode[] = []
      
      for (const episodeId of episodeIds.slice(0, limit)) {
        const key = `episodic:${this.config.userId}:${episodeId}`
        const episode = await this.cache.safeGet<ConversationEpisode>(key)
        
        if (episode) {
          episodes.push(episode)
        }
      }
      
      return episodes.sort((a, b) => 
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      )
    } catch (error) {
      console.error('Error retrieving episodes:', error)
      return []
    }
  }

  async summarizeCurrentEpisode(messages: any[]): Promise<ConversationEpisode> {
    const episodeId = `${this.config.conversationId}_${Date.now()}`
    
    // Generate summary of conversation
    const summary = this.generateEpisodeSummary(messages)
    const keyInsights = this.extractKeyInsights(messages)
    const topics = this.extractTopics(messages)
    
    const episode: ConversationEpisode = {
      id: episodeId,
      userId: this.config.userId,
      conversationId: this.config.conversationId,
      startTime: new Date().toISOString(),
      messages: messages.slice(-10), // Store last 10 messages
      summary,
      keyInsights,
      topics,
      userContext: await this.getCurrentUserContext()
    }
    
    await this.storeConversationEpisode(episode)
    return episode
  }

  // ===== Procedural Memory (Behavioral Patterns) =====
  async storeProceduralPattern(pattern: ProceduralMemory): Promise<void> {
    const key = `procedural:${this.config.userId}:${pattern.id}`
    await this.cache.safeSet(key, pattern, 2592000) // 30 days
    
    await this.addToUserIndex('procedural', pattern.id)
  }

  async getProceduralPatterns(condition?: string): Promise<ProceduralMemory[]> {
    try {
      const patternIds = await this.getUserIndex('procedural')
      const patterns: ProceduralMemory[] = []
      
      for (const patternId of patternIds) {
        const key = `procedural:${this.config.userId}:${patternId}`
        const pattern = await this.cache.safeGet<ProceduralMemory>(key)
        
        if (pattern && (!condition || pattern.condition === condition)) {
          patterns.push(pattern)
        }
      }
      
      return patterns.sort((a, b) => b.success_rate - a.success_rate)
    } catch (error) {
      console.error('Error retrieving procedural patterns:', error)
      return []
    }
  }

  async updateProceduralPattern(patternId: string, success: boolean): Promise<void> {
    const key = `procedural:${this.config.userId}:${patternId}`
    const existing = await this.cache.safeGet<ProceduralMemory>(key)
    
    if (existing) {
      const newCount = existing.usage_count + 1
      const newSuccessRate = success 
        ? ((existing.success_rate * existing.usage_count) + 1) / newCount
        : (existing.success_rate * existing.usage_count) / newCount
      
      const updated = {
        ...existing,
        success_rate: newSuccessRate,
        usage_count: newCount,
        lastUsed: new Date().toISOString()
      }
      
      await this.cache.safeSet(key, updated, 2592000)
    }
  }

  // ===== Context Management =====
  async getRelevantMemories(query: string, limit: number = 5): Promise<MemoryEntry[]> {
    // Simplified retrieval - in production, use vector similarity
    const memories: MemoryEntry[] = []
    
    // Get recent semantic facts
    const facts = await this.getSemanticFacts(undefined, 3)
    memories.push(...facts.map(fact => ({
      id: fact.id,
      content: fact.fact,
      metadata: {
        timestamp: fact.lastUpdated,
        userId: fact.userId,
        conversationId: this.config.conversationId,
        type: 'semantic' as const,
        confidence: fact.confidence,
        importance: 0.8,
        tags: [fact.category]
      }
    })))
    
    // Get recent episodes
    const episodes = await this.getConversationEpisodes(2)
    memories.push(...episodes.map(episode => ({
      id: episode.id,
      content: episode.summary,
      metadata: {
        timestamp: episode.startTime,
        userId: episode.userId,
        conversationId: episode.conversationId,
        type: 'episodic' as const,
        confidence: 0.9,
        importance: 0.7,
        tags: episode.topics
      }
    })))
    
    return memories.slice(0, limit)
  }

  async getCurrentUserContext(): Promise<any> {
    return {
      semanticFacts: await this.getSemanticFacts(undefined, 5),
      recentEpisodes: await this.getConversationEpisodes(3),
      activePatterns: await this.getProceduralPatterns(),
      timestamp: new Date().toISOString()
    }
  }

  // ===== Helper Methods =====
  private async addToUserIndex(type: string, id: string): Promise<void> {
    const indexKey = `index:${type}:${this.config.userId}`
    const existing = await this.cache.safeGet<string[]>(indexKey) || []
    
    // Add to front and limit size
    const updated = [id, ...existing.filter(existingId => existingId !== id)].slice(0, 100)
    await this.cache.safeSet(indexKey, updated, 2592000)
  }

  private async getUserIndex(type: string): Promise<string[]> {
    const indexKey = `index:${type}:${this.config.userId}`
    return await this.cache.safeGet<string[]>(indexKey) || []
  }

  private generateEpisodeSummary(messages: any[]): string {
    // Simple summarization - in production, use LLM
    const topics = messages.map(m => m.content).join(' ')
    return topics.length > 200 ? topics.substring(0, 200) + '...' : topics
  }

  private extractKeyInsights(messages: any[]): string[] {
    // Extract insights from conversation
    const insights = []
    for (const message of messages) {
      if (message.role === 'assistant' && message.content.includes('insight')) {
        insights.push(message.content.substring(0, 100))
      }
    }
    return insights.slice(0, 3)
  }

  private extractTopics(messages: any[]): string[] {
    // Simple topic extraction
    const topics = new Set<string>()
    const topicKeywords = [
      'procurement', 'supplier', 'cost', 'variance', 'analysis', 
      'quarterly', 'budget', 'spending', 'efficiency', 'risk'
    ]
    
    for (const message of messages) {
      for (const keyword of topicKeywords) {
        if (message.content.toLowerCase().includes(keyword)) {
          topics.add(keyword)
        }
      }
    }
    
    return Array.from(topics).slice(0, 5)
  }

  // ===== Factory Methods =====
  static createSemanticMemory(userId: string): LangGraphMemoryManager {
    return new LangGraphMemoryManager({
      userId,
      conversationId: 'semantic',
      memoryType: 'semantic',
      namespace: `semantic:${userId}`
    })
  }

  static createEpisodicMemory(userId: string, conversationId: string): LangGraphMemoryManager {
    return new LangGraphMemoryManager({
      userId,
      conversationId,
      memoryType: 'episodic',
      namespace: `episodic:${userId}:${conversationId}`
    })
  }

  static createProceduralMemory(userId: string): LangGraphMemoryManager {
    return new LangGraphMemoryManager({
      userId,
      conversationId: 'procedural',
      memoryType: 'procedural',
      namespace: `procedural:${userId}`
    })
  }
}

// Utility class for memory coordination
export class MemoryCoordinator {
  private userId: string
  private semanticMemory: LangGraphMemoryManager
  private episodicMemory: LangGraphMemoryManager
  private proceduralMemory: LangGraphMemoryManager

  constructor(userId: string, conversationId: string) {
    this.userId = userId
    this.semanticMemory = LangGraphMemoryManager.createSemanticMemory(userId)
    this.episodicMemory = LangGraphMemoryManager.createEpisodicMemory(userId, conversationId)
    this.proceduralMemory = LangGraphMemoryManager.createProceduralMemory(userId)
  }

  async getComprehensiveContext(query: string): Promise<{
    semanticFacts: SemanticFact[]
    recentEpisodes: ConversationEpisode[]
    relevantPatterns: ProceduralMemory[]
    contextSummary: string
  }> {
    const [semanticFacts, recentEpisodes, relevantPatterns] = await Promise.all([
      this.semanticMemory.getSemanticFacts(undefined, 5),
      this.episodicMemory.getConversationEpisodes(3),
      this.proceduralMemory.getProceduralPatterns()
    ])

    const contextSummary = this.generateContextSummary(semanticFacts, recentEpisodes, relevantPatterns)

    return {
      semanticFacts,
      recentEpisodes,
      relevantPatterns,
      contextSummary
    }
  }

  private generateContextSummary(
    facts: SemanticFact[], 
    episodes: ConversationEpisode[], 
    patterns: ProceduralMemory[]
  ): string {
    const parts = []
    
    if (facts.length > 0) {
      parts.push(`User has ${facts.length} stored preferences/facts`)
    }
    
    if (episodes.length > 0) {
      parts.push(`${episodes.length} recent conversation episodes`)
    }
    
    if (patterns.length > 0) {
      parts.push(`${patterns.length} behavioral patterns identified`)
    }
    
    return parts.join(', ')
  }

  async storeInteractionResults(
    query: string, 
    response: string, 
    success: boolean,
    insights: string[] = []
  ): Promise<void> {
    // Store facts if new preferences or information discovered
    for (const insight of insights) {
      if (insight.includes('prefer') || insight.includes('like')) {
        await this.semanticMemory.storeSemanticFact({
          id: `fact_${Date.now()}`,
          userId: this.userId,
          fact: insight,
          category: 'preference',
          confidence: 0.8,
          lastUpdated: new Date().toISOString(),
          sources: ['conversation']
        })
      }
    }

    // Update procedural patterns based on query success
    const pattern = `query_type:${this.categorizeQuery(query)}`
    await this.proceduralMemory.updateProceduralPattern(pattern, success)
  }

  private categorizeQuery(query: string): string {
    const categories = {
      variance: ['variance', 'difference', 'deviation'],
      trend: ['trend', 'over time', 'quarterly', 'monthly'],
      supplier: ['supplier', 'vendor', 'procurement'],
      cost: ['cost', 'expense', 'spending', 'budget']
    }

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => query.toLowerCase().includes(keyword))) {
        return category
      }
    }

    return 'general'
  }
}

export default LangGraphMemoryManager