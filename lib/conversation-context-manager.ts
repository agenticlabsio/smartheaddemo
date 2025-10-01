// Advanced Conversation Context Manager with Memory and Intelligence
import { DatabaseChatStorageService } from './chat-storage-db'
import { DatabaseMessageStorage } from './message-storage-db'
import Database from './database'

export interface ConversationContext {
  userId: string
  conversationId: string
  sessionStart: Date
  lastActivity: Date
  messageCount: number
  
  // Enhanced Context Intelligence
  topicProgression: string[]
  queryPatterns: QueryPattern[]
  userPreferences: UserPreferences
  conversationSummary: string
  
  // Data Source Usage Patterns
  dataSourceUsage: Record<'coupa' | 'baan' | 'combined', number>
  preferredAgent: 'coupa' | 'baan' | 'combined' | null
  
  // Learning and Adaptation
  frequentQueries: string[]
  expertiseLevel: 'beginner' | 'intermediate' | 'expert'
  interactionStyle: 'detailed' | 'concise' | 'technical' | 'business'
}

export interface QueryPattern {
  category: 'financial' | 'procurement' | 'strategic' | 'operational'
  frequency: number
  lastUsed: Date
  keywords: string[]
  complexity: 'basic' | 'intermediate' | 'advanced'
}

export interface UserPreferences {
  preferredDataFormat: 'summary' | 'detailed' | 'technical'
  visualizationPreference: 'charts' | 'tables' | 'mixed'
  analysisDepth: 'quick' | 'standard' | 'comprehensive'
  notificationStyle: 'minimal' | 'standard' | 'verbose'
  defaultTimeframe: 'current_quarter' | 'year_to_date' | 'last_12_months'
  industryFocus: string[]
}

export interface ConversationMemory {
  shortTerm: ContextItem[] // Last 10 messages context
  longTerm: ContextItem[] // Persistent user patterns and preferences
  workingMemory: ContextItem[] // Current session context
  episodicMemory: ConversationEpisode[] // Past conversation episodes
}

export interface ContextItem {
  type: 'query' | 'insight' | 'preference' | 'pattern' | 'topic'
  content: string
  metadata: any
  relevanceScore: number
  timestamp: Date
  expiryDate?: Date
}

export interface ConversationEpisode {
  conversationId: string
  startTime: Date
  endTime: Date
  topicSummary: string
  keyInsights: string[]
  userSatisfaction?: number
  queryTypes: string[]
}

export class ConversationContextManager {
  private static instance: ConversationContextManager
  private chatStorage: DatabaseChatStorageService
  private messageStorage: DatabaseMessageStorage
  
  private contextCache: Map<string, ConversationContext> = new Map()
  private memoryCache: Map<string, ConversationMemory> = new Map()

  constructor() {
    this.chatStorage = DatabaseChatStorageService.getInstance()
    this.messageStorage = DatabaseMessageStorage.getInstance()
  }

  static getInstance(): ConversationContextManager {
    if (!ConversationContextManager.instance) {
      ConversationContextManager.instance = new ConversationContextManager()
    }
    return ConversationContextManager.instance
  }

  // Enhanced Context Management
  async getConversationContext(userId: string, conversationId: string): Promise<ConversationContext> {
    const cacheKey = `${userId}:${conversationId}`
    
    // Check cache first
    if (this.contextCache.has(cacheKey)) {
      const cached = this.contextCache.get(cacheKey)!
      // Update last activity
      cached.lastActivity = new Date()
      return cached
    }

    try {
      // Build context from database
      const context = await this.buildConversationContext(userId, conversationId)
      
      // Cache for performance
      this.contextCache.set(cacheKey, context)
      
      return context
    } catch (error) {
      console.error('Failed to get conversation context:', error)
      return this.createDefaultContext(userId, conversationId)
    }
  }

  private async buildConversationContext(userId: string, conversationId: string): Promise<ConversationContext> {
    // Get basic conversation data
    const chatData = await this.chatStorage.getChat(conversationId, userId)
    
    // Get historical patterns for this user
    const userPatterns = await this.getUserPatterns(userId)
    
    // Get conversation-specific context
    const conversationPatterns = await this.getConversationPatterns(conversationId, userId)
    
    return {
      userId,
      conversationId,
      sessionStart: chatData?.createdAt || new Date(),
      lastActivity: chatData?.updatedAt || new Date(),
      messageCount: chatData?.messageCount || 0,
      
      // Enhanced intelligence
      topicProgression: conversationPatterns.topics,
      queryPatterns: userPatterns.queryPatterns,
      userPreferences: userPatterns.preferences,
      conversationSummary: conversationPatterns.summary,
      
      // Usage patterns
      dataSourceUsage: userPatterns.dataSourceUsage,
      preferredAgent: userPatterns.preferredAgent,
      
      // Learning
      frequentQueries: userPatterns.frequentQueries,
      expertiseLevel: userPatterns.expertiseLevel,
      interactionStyle: userPatterns.interactionStyle
    }
  }

  private async getUserPatterns(userId: string): Promise<{
    queryPatterns: QueryPattern[]
    preferences: UserPreferences
    dataSourceUsage: Record<'coupa' | 'baan' | 'combined', number>
    preferredAgent: 'coupa' | 'baan' | 'combined' | null
    frequentQueries: string[]
    expertiseLevel: 'beginner' | 'intermediate' | 'expert'
    interactionStyle: 'detailed' | 'concise' | 'technical' | 'business'
  }> {
    try {
      const result = await Database.query(
        `SELECT 
          query_patterns,
          user_preferences,
          data_source_usage,
          preferred_agent,
          frequent_queries,
          expertise_level,
          interaction_style
         FROM user_conversation_profiles 
         WHERE user_id = $1`,
        [userId]
      )

      if (result.rows.length > 0) {
        const profile = result.rows[0]
        return {
          queryPatterns: profile.query_patterns || [],
          preferences: profile.user_preferences || this.getDefaultPreferences(),
          dataSourceUsage: profile.data_source_usage || { coupa: 0, baan: 0, combined: 0 },
          preferredAgent: profile.preferred_agent,
          frequentQueries: profile.frequent_queries || [],
          expertiseLevel: profile.expertise_level || 'beginner',
          interactionStyle: profile.interaction_style || 'detailed'
        }
      }
    } catch (error) {
      console.error('Failed to get user patterns:', error)
    }

    // Return defaults if no profile exists
    return {
      queryPatterns: [],
      preferences: this.getDefaultPreferences(),
      dataSourceUsage: { coupa: 0, baan: 0, combined: 0 },
      preferredAgent: null,
      frequentQueries: [],
      expertiseLevel: 'beginner',
      interactionStyle: 'detailed'
    }
  }

  private async getConversationPatterns(conversationId: string, userId: string): Promise<{
    topics: string[]
    summary: string
  }> {
    try {
      // Analyze conversation messages to extract topics and patterns
      const messages = await this.chatStorage.getChat(conversationId, userId)
      
      if (!messages || !messages.messages) {
        return { topics: [], summary: '' }
      }

      // Extract topics from conversation
      const topics = this.extractTopicsFromMessages(messages.messages)
      
      // Generate conversation summary
      const summary = this.generateConversationSummary(messages.messages)
      
      return { topics, summary }
    } catch (error) {
      console.error('Failed to get conversation patterns:', error)
      return { topics: [], summary: '' }
    }
  }

  private extractTopicsFromMessages(messages: any[]): string[] {
    const topics: string[] = []
    const topicKeywords = {
      'Budget Analysis': ['budget', 'variance', 'spend', 'allocation', 'cost'],
      'Supplier Management': ['supplier', 'vendor', 'procurement', 'contract', 'sourcing'],
      'Financial Performance': ['revenue', 'profit', 'margin', 'financial', 'performance'],
      'Risk Assessment': ['risk', 'compliance', 'audit', 'control', 'exposure'],
      'Trend Analysis': ['trend', 'forecast', 'prediction', 'pattern', 'historical'],
      'Operational Efficiency': ['efficiency', 'optimization', 'process', 'workflow', 'automation']
    }

    for (const message of messages) {
      if (message.role === 'user' && message.content) {
        const content = message.content.toLowerCase()
        
        for (const [topic, keywords] of Object.entries(topicKeywords)) {
          if (keywords.some(keyword => content.includes(keyword))) {
            if (!topics.includes(topic)) {
              topics.push(topic)
            }
          }
        }
      }
    }

    return topics
  }

  private generateConversationSummary(messages: any[]): string {
    const userMessages = messages.filter(m => m.role === 'user').slice(0, 5)
    const queries = userMessages.map(m => m.content).filter(Boolean)
    
    if (queries.length === 0) {
      return 'No specific topics discussed yet'
    }

    // Simple summary generation based on query patterns
    const commonTerms = this.findCommonTerms(queries)
    if (commonTerms.length > 0) {
      return `Discussion focused on ${commonTerms.slice(0, 3).join(', ')}`
    }
    
    return `${queries.length} queries covering various analytics topics`
  }

  private findCommonTerms(queries: string[]): string[] {
    const terms: Record<string, number> = {}
    const stopWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'show', 'me', 'what', 'how', 'is', 'are', 'can', 'you'])
    
    for (const query of queries) {
      const words = query.toLowerCase().split(/\s+/).filter(word => 
        word.length > 3 && !stopWords.has(word) && /^[a-zA-Z]+$/.test(word)
      )
      
      for (const word of words) {
        terms[word] = (terms[word] || 0) + 1
      }
    }
    
    return Object.entries(terms)
      .filter(([_, count]) => count > 1)
      .sort(([_,a], [__,b]) => b - a)
      .map(([term, _]) => term)
  }

  // Memory Management
  async getConversationMemory(userId: string, conversationId: string): Promise<ConversationMemory> {
    const cacheKey = `${userId}:${conversationId}`
    
    if (this.memoryCache.has(cacheKey)) {
      return this.memoryCache.get(cacheKey)!
    }

    const memory = await this.buildConversationMemory(userId, conversationId)
    this.memoryCache.set(cacheKey, memory)
    
    return memory
  }

  private async buildConversationMemory(userId: string, conversationId: string): Promise<ConversationMemory> {
    // Get recent messages for short-term memory
    const shortTerm = await this.getShortTermMemory(conversationId, userId)
    
    // Get user patterns for long-term memory
    const longTerm = await this.getLongTermMemory(userId)
    
    // Build working memory from current session
    const workingMemory = await this.getWorkingMemory(conversationId, userId)
    
    // Get past conversation episodes
    const episodicMemory = await this.getEpisodicMemory(userId)
    
    return {
      shortTerm,
      longTerm,
      workingMemory,
      episodicMemory
    }
  }

  private async getShortTermMemory(conversationId: string, userId: string): Promise<ContextItem[]> {
    // Get last 10 messages from current conversation
    try {
      const chat = await this.chatStorage.getChat(conversationId, userId)
      
      if (!chat?.messages) return []
      
      return chat.messages.slice(-10).map((message, index) => ({
        type: 'query' as const,
        content: message.content,
        metadata: { role: message.role, messageId: message.id },
        relevanceScore: 1.0 - (index * 0.1), // Decay relevance with age
        timestamp: new Date(message.timestamp || Date.now())
      }))
    } catch (error) {
      console.error('Failed to get short-term memory:', error)
      return []
    }
  }

  private async getLongTermMemory(userId: string): Promise<ContextItem[]> {
    // Get persistent user patterns and preferences
    try {
      const patterns = await this.getUserPatterns(userId)
      
      const items: ContextItem[] = []
      
      // Add user preferences as memory items
      items.push({
        type: 'preference',
        content: `User prefers ${patterns.preferences.preferredDataFormat} data format`,
        metadata: patterns.preferences,
        relevanceScore: 0.9,
        timestamp: new Date()
      })
      
      // Add frequent queries as patterns
      patterns.frequentQueries.forEach(query => {
        items.push({
          type: 'pattern',
          content: query,
          metadata: { category: 'frequent_query' },
          relevanceScore: 0.8,
          timestamp: new Date()
        })
      })
      
      return items
    } catch (error) {
      console.error('Failed to get long-term memory:', error)
      return []
    }
  }

  private async getWorkingMemory(conversationId: string, userId: string): Promise<ContextItem[]> {
    // Get current session context
    const context = await this.getConversationContext(userId, conversationId)
    
    return context.topicProgression.map(topic => ({
      type: 'topic' as const,
      content: topic,
      metadata: { session: conversationId },
      relevanceScore: 0.9,
      timestamp: new Date(),
      expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    }))
  }

  private async getEpisodicMemory(userId: string): Promise<ConversationEpisode[]> {
    try {
      const result = await Database.query(
        `SELECT conversation_id, start_time, end_time, topic_summary, key_insights, 
                user_satisfaction, query_types
         FROM conversation_episodes 
         WHERE user_id = $1 
         ORDER BY end_time DESC 
         LIMIT 20`,
        [userId]
      )

      return result.rows.map(row => ({
        conversationId: row.conversation_id,
        startTime: new Date(row.start_time),
        endTime: new Date(row.end_time),
        topicSummary: row.topic_summary,
        keyInsights: row.key_insights || [],
        userSatisfaction: row.user_satisfaction,
        queryTypes: row.query_types || []
      }))
    } catch (error) {
      console.error('Failed to get episodic memory:', error)
      return []
    }
  }

  // Context Update and Learning
  async updateConversationContext(
    userId: string, 
    conversationId: string, 
    updates: Partial<ConversationContext>
  ): Promise<void> {
    const cacheKey = `${userId}:${conversationId}`
    
    try {
      // Update cache
      if (this.contextCache.has(cacheKey)) {
        const existing = this.contextCache.get(cacheKey)!
        this.contextCache.set(cacheKey, { ...existing, ...updates })
      }
      
      // Persist important context updates to database
      await this.persistContextUpdates(userId, conversationId, updates)
    } catch (error) {
      console.error('Failed to update conversation context:', error)
    }
  }

  private async persistContextUpdates(
    userId: string, 
    conversationId: string, 
    updates: Partial<ConversationContext>
  ): Promise<void> {
    // Update user profile with learning insights
    if (updates.queryPatterns || updates.userPreferences || updates.dataSourceUsage) {
      await Database.query(
        `INSERT INTO user_conversation_profiles 
         (user_id, query_patterns, user_preferences, data_source_usage, preferred_agent, 
          frequent_queries, expertise_level, interaction_style, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         ON CONFLICT (user_id) 
         DO UPDATE SET
           query_patterns = EXCLUDED.query_patterns,
           user_preferences = EXCLUDED.user_preferences,
           data_source_usage = EXCLUDED.data_source_usage,
           preferred_agent = EXCLUDED.preferred_agent,
           frequent_queries = EXCLUDED.frequent_queries,
           expertise_level = EXCLUDED.expertise_level,
           interaction_style = EXCLUDED.interaction_style,
           updated_at = NOW()`,
        [
          userId,
          updates.queryPatterns || null,
          updates.userPreferences || null,
          updates.dataSourceUsage || null,
          updates.preferredAgent || null,
          updates.frequentQueries || null,
          updates.expertiseLevel || null,
          updates.interactionStyle || null
        ]
      )
    }
  }

  // Smart Context Retrieval
  async getRelevantContext(
    userId: string, 
    conversationId: string, 
    query: string
  ): Promise<ContextItem[]> {
    const memory = await this.getConversationMemory(userId, conversationId)
    
    // Combine all memory sources
    const allContext = [
      ...memory.shortTerm,
      ...memory.longTerm,
      ...memory.workingMemory
    ]
    
    // Score context relevance to current query
    const scoredContext = allContext.map(item => ({
      ...item,
      relevanceScore: this.calculateRelevanceScore(item, query)
    }))
    
    // Return top relevant context items
    return scoredContext
      .filter(item => item.relevanceScore > 0.3)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10)
  }

  private calculateRelevanceScore(item: ContextItem, query: string): number {
    const queryLower = query.toLowerCase()
    const contentLower = item.content.toLowerCase()
    
    // Exact match
    if (contentLower.includes(queryLower) || queryLower.includes(contentLower)) {
      return 1.0
    }
    
    // Keyword similarity
    const queryWords = queryLower.split(/\s+/)
    const contentWords = contentLower.split(/\s+/)
    
    const commonWords = queryWords.filter(word => contentWords.includes(word))
    const similarity = commonWords.length / Math.max(queryWords.length, contentWords.length)
    
    // Apply time decay
    const ageInHours = (Date.now() - item.timestamp.getTime()) / (1000 * 60 * 60)
    const timeFactor = Math.exp(-ageInHours / 24) // Decay over 24 hours
    
    return similarity * timeFactor * item.relevanceScore
  }

  // Utility Methods
  private createDefaultContext(userId: string, conversationId: string): ConversationContext {
    return {
      userId,
      conversationId,
      sessionStart: new Date(),
      lastActivity: new Date(),
      messageCount: 0,
      topicProgression: [],
      queryPatterns: [],
      userPreferences: this.getDefaultPreferences(),
      conversationSummary: '',
      dataSourceUsage: { coupa: 0, baan: 0, combined: 0 },
      preferredAgent: null,
      frequentQueries: [],
      expertiseLevel: 'beginner',
      interactionStyle: 'detailed'
    }
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      preferredDataFormat: 'summary',
      visualizationPreference: 'mixed',
      analysisDepth: 'standard',
      notificationStyle: 'standard',
      defaultTimeframe: 'current_quarter',
      industryFocus: []
    }
  }

  // Cache Management
  clearCache(): void {
    this.contextCache.clear()
    this.memoryCache.clear()
  }

  clearUserCache(userId: string): void {
    for (const [key, _] of this.contextCache.entries()) {
      if (key.startsWith(`${userId}:`)) {
        this.contextCache.delete(key)
      }
    }
    
    for (const [key, _] of this.memoryCache.entries()) {
      if (key.startsWith(`${userId}:`)) {
        this.memoryCache.delete(key)
      }
    }
  }
}