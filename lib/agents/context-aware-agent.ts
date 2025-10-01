// Context-Aware Agent with Advanced Conversation Intelligence
import { EnhancedSmartAgentRouter, EnhancedRouterResult } from './enhanced-agent-router'
import { ConversationContextManager, ConversationContext, ConversationMemory } from '../conversation-context-manager'
import { followUpGenerator, FollowUpContext } from '../followup-generator'

// Type alias for compatibility
type RouterResult = EnhancedRouterResult

export interface ContextAwareResponse extends EnhancedRouterResult {
  conversationContext?: ConversationContext
  relevantMemory?: any[]
  contextualInsights?: string[]
  followUpSuggestions?: string[]
  userPreferences?: any
}

export class ContextAwareAgent {
  private router: EnhancedSmartAgentRouter
  private contextManager: ConversationContextManager

  constructor() {
    this.router = new EnhancedSmartAgentRouter()
    this.contextManager = ConversationContextManager.getInstance()
  }

  async processQuery(
    query: string,
    userId: string,
    conversationId: string,
    requestedDataSource?: 'coupa' | 'baan' | 'combined'
  ): Promise<ContextAwareResponse> {
    try {
      // Step 1: Get conversation context and memory
      const context = await this.contextManager.getConversationContext(userId, conversationId)
      const relevantMemory = await this.contextManager.getRelevantContext(userId, conversationId, query)
      
      // Step 2: Enhance query with contextual information
      const enhancedQuery = await this.enhanceQueryWithContext(query, context, relevantMemory)
      
      // Step 3: Route query through enhanced intelligent agent system
      const routerResult = await this.router.routeWithCache(enhancedQuery, [], userId, conversationId, requestedDataSource)
      
      // Step 4: Learn from interaction and update context
      await this.learnFromInteraction(userId, conversationId, query, routerResult, context)
      
      // Step 5: Generate contextual enhancements
      const contextualInsights = await this.generateContextualInsights(routerResult, context)
      const followUpSuggestions = await this.generateFollowUpSuggestions(query, routerResult, context)
      
      return {
        ...routerResult,
        conversationContext: context,
        relevantMemory,
        contextualInsights,
        followUpSuggestions,
        userPreferences: context.userPreferences
      }
    } catch (error) {
      console.error('Context-aware agent error:', error)
      
      // Fallback to basic router without context
      const fallbackResult = await this.router.routeWithCache(query, [], userId, conversationId, requestedDataSource)
      return {
        ...fallbackResult,
        contextualInsights: ['Context enhancement unavailable - using basic analysis'],
        followUpSuggestions: []
      }
    }
  }

  async *processStreamingQuery(
    query: string,
    userId: string,
    conversationId: string,
    requestedDataSource?: 'coupa' | 'baan' | 'combined'
  ): AsyncGenerator<ContextAwareResponse, void, unknown> {
    try {
      // Get conversation context first
      const context = await this.contextManager.getConversationContext(userId, conversationId)
      const relevantMemory = await this.contextManager.getRelevantContext(userId, conversationId, query)
      
      // Enhance query with context
      const enhancedQuery = await this.enhanceQueryWithContext(query, context, relevantMemory)
      
      // Stream through enhanced router with context enhancements
      // Note: Using routeWithCache for now as streaming may need additional implementation
      const result = await this.router.routeWithCache(enhancedQuery, [], userId, conversationId, requestedDataSource)
      
      // Add context to streaming response
      const enhancedResult: ContextAwareResponse = {
        ...result,
        conversationContext: context,
        relevantMemory,
        userPreferences: context.userPreferences
      }
      
      // Add final enhancements to the result
      if (result.success && result.response && !result.error) {
        enhancedResult.contextualInsights = await this.generateContextualInsights(result, context)
        enhancedResult.followUpSuggestions = await this.generateFollowUpSuggestions(query, result, context)
        
        // Learn from successful interaction
        await this.learnFromInteraction(userId, conversationId, query, result, context)
      }
      
      yield enhancedResult
    } catch (error) {
      console.error('Context-aware streaming error:', error)
      
      // Fallback to basic enhanced routing
      const fallbackResult = await this.router.routeWithCache(query, [], userId, conversationId, requestedDataSource)
      yield {
        ...fallbackResult,
        contextualInsights: ['Context enhancement unavailable'],
        followUpSuggestions: []
      }
    }
  }

  private async enhanceQueryWithContext(
    query: string,
    context: ConversationContext,
    relevantMemory: any[]
  ): Promise<string> {
    // Don't modify the query itself, but we can use context for internal processing
    // The context will influence agent behavior through other means
    return query
  }

  private async learnFromInteraction(
    userId: string,
    conversationId: string,
    query: string,
    result: RouterResult,
    context: ConversationContext
  ): Promise<void> {
    try {
      // Update conversation metrics
      const updates: Partial<ConversationContext> = {
        messageCount: context.messageCount + 1,
        lastActivity: new Date()
      }

      // Learn from agent usage patterns (only for tracked agents)
      const currentUsage = { ...context.dataSourceUsage }
      
      // Only track usage for our specialized agents, not the 'simple' fallback
      if (result.agentUsed === 'coupa' || result.agentUsed === 'baan' || result.agentUsed === 'combined') {
        currentUsage[result.agentUsed] = (currentUsage[result.agentUsed] || 0) + 1
        updates.dataSourceUsage = currentUsage

        // Update preferred agent based on successful queries
        if (result.success && result.confidence && result.confidence > 80) {
          // High confidence results influence preference
          const totalUsage = Object.values(currentUsage).reduce((sum, count) => sum + count, 0)
          const agentUsagePercent = currentUsage[result.agentUsed] / totalUsage
          
          if (agentUsagePercent > 0.6) { // 60% threshold for preference
            updates.preferredAgent = result.agentUsed
          }
        }
      }

      // Track topics from query
      const extractedTopics = this.extractTopicsFromQuery(query)
      if (extractedTopics.length > 0) {
        const updatedTopics = [...context.topicProgression]
        extractedTopics.forEach(topic => {
          if (!updatedTopics.includes(topic)) {
            updatedTopics.push(topic)
          }
        })
        updates.topicProgression = updatedTopics.slice(-20) // Keep last 20 topics
      }

      // Update frequent queries
      const updatedQueries = [...context.frequentQueries]
      if (!updatedQueries.includes(query) && query.length > 10 && query.length < 200) {
        updatedQueries.unshift(query)
        updates.frequentQueries = updatedQueries.slice(0, 10) // Keep top 10
      }

      // Assess user expertise level based on query complexity
      const queryComplexity = this.assessQueryComplexity(query)
      if (queryComplexity === 'advanced' && context.expertiseLevel === 'beginner') {
        updates.expertiseLevel = 'intermediate'
      } else if (queryComplexity === 'advanced' && context.expertiseLevel === 'intermediate') {
        updates.expertiseLevel = 'expert'
      }

      // Update context
      await this.contextManager.updateConversationContext(userId, conversationId, updates)
    } catch (error) {
      console.error('Failed to learn from interaction:', error)
    }
  }

  private extractTopicsFromQuery(query: string): string[] {
    const topics: string[] = []
    const queryLower = query.toLowerCase()

    const topicKeywords = {
      'Budget Analysis': ['budget', 'variance', 'spend', 'allocation', 'cost'],
      'Supplier Management': ['supplier', 'vendor', 'procurement', 'contract', 'sourcing'],
      'Financial Performance': ['revenue', 'profit', 'margin', 'financial', 'performance'],
      'Risk Assessment': ['risk', 'compliance', 'audit', 'control', 'exposure'],
      'Trend Analysis': ['trend', 'forecast', 'prediction', 'pattern', 'historical'],
      'Operational Efficiency': ['efficiency', 'optimization', 'process', 'workflow', 'automation']
    }

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => queryLower.includes(keyword))) {
        topics.push(topic)
      }
    }

    return topics
  }

  private assessQueryComplexity(query: string): 'basic' | 'intermediate' | 'advanced' {
    const queryLower = query.toLowerCase()
    
    // Advanced indicators
    const advancedTerms = ['variance', 'regression', 'correlation', 'trend analysis', 'forecast', 'optimization', 'aggregation', 'group by', 'having', 'join']
    const advancedCount = advancedTerms.filter(term => queryLower.includes(term)).length
    
    // Intermediate indicators
    const intermediateTerms = ['compare', 'analyze', 'breakdown', 'summary', 'total', 'average', 'percentage']
    const intermediateCount = intermediateTerms.filter(term => queryLower.includes(term)).length
    
    if (advancedCount >= 2 || (query.length > 100 && intermediateCount >= 2)) {
      return 'advanced'
    } else if (intermediateCount >= 1 || query.length > 50) {
      return 'intermediate'
    }
    
    return 'basic'
  }

  private async generateContextualInsights(
    result: RouterResult,
    context: ConversationContext
  ): Promise<string[]> {
    const insights: string[] = []

    try {
      // Usage pattern insights
      const totalQueries = Object.values(context.dataSourceUsage).reduce((sum, count) => sum + count, 0)
      if (totalQueries > 5) {
        const mostUsedAgent = Object.entries(context.dataSourceUsage)
          .sort(([,a], [,b]) => b - a)[0]
        
        insights.push(`Your analysis pattern shows ${((mostUsedAgent[1] / totalQueries) * 100).toFixed(0)}% preference for ${mostUsedAgent[0]} data sources`)
      }

      // Expertise progression
      if (context.expertiseLevel === 'expert' && context.messageCount > 20) {
        insights.push(`Advanced user detected - consider enabling technical mode for more detailed analysis`)
      }

      // Topic progression insights
      if (context.topicProgression.length > 3) {
        const recentTopics = context.topicProgression.slice(-3)
        insights.push(`Recent focus areas: ${recentTopics.join(', ')}`)
      }

      // Data source recommendation
      if (result.confidence && result.confidence < 70 && context.preferredAgent && context.preferredAgent !== result.agentUsed) {
        insights.push(`Consider trying ${context.preferredAgent} analysis for potentially better results based on your history`)
      }
    } catch (error) {
      console.error('Failed to generate contextual insights:', error)
    }

    return insights
  }

  private async generateFollowUpSuggestions(
    query: string,
    result: RouterResult,
    context: ConversationContext
  ): Promise<string[]> {
    try {
      // Create conversation history from context
      const conversationHistory = context.frequentQueries?.map((q: any) => ({
        role: 'user' as const,
        content: q.query || q,
        queryType: q.queryType
      })) || []

      // Build FollowUpContext for the enhanced generator
      const followUpContext: FollowUpContext = {
        currentQuery: query,
        responseContent: result.response || '',
        queryType: result.agentUsed,
        confidence: result.confidence,
        recordCount: result.queryResults?.length || 0,
        conversationHistory
      }

      // Use the enhanced FollowUpGenerator
      return followUpGenerator.generateFollowUps(followUpContext)
    } catch (error) {
      console.error('Failed to generate follow-up suggestions:', error)
      
      // Fallback to basic suggestions
      return [
        'Export results for reporting',
        'Create visualization of these findings', 
        'Compare with historical data'
      ]
    }
  }

  // Conversation intelligence methods
  async getConversationSummary(userId: string, conversationId: string): Promise<string> {
    try {
      const context = await this.contextManager.getConversationContext(userId, conversationId)
      return context.conversationSummary || 'No conversation summary available'
    } catch (error) {
      console.error('Failed to get conversation summary:', error)
      return 'Summary unavailable'
    }
  }

  async getUserPreferences(userId: string): Promise<any> {
    try {
      const context = await this.contextManager.getConversationContext(userId, 'temp')
      return context.userPreferences
    } catch (error) {
      console.error('Failed to get user preferences:', error)
      return null
    }
  }

  async updateUserPreferences(userId: string, preferences: any): Promise<void> {
    try {
      await this.contextManager.updateConversationContext(userId, 'temp', {
        userPreferences: preferences
      })
    } catch (error) {
      console.error('Failed to update user preferences:', error)
    }
  }

  // Memory management
  clearUserMemory(userId: string): void {
    this.contextManager.clearUserCache(userId)
  }

  clearAllMemory(): void {
    this.contextManager.clearCache()
  }
}