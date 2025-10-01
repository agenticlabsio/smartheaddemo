// Intelligent Agent Router with Sophisticated Query Analysis and Context-Aware Routing
import { EnhancedGeminiClient } from '../gemini/enhanced-client'
import { LangGraphMemoryManager } from '../memory/langgraph-memory'
import { SemanticCatalog } from '../semantic-catalog'
import { SmartHeadCacheService } from '../cache/redis-service'
import { CollaborativeAgentFramework, CollaborativeQuery } from './collaborative-agent-framework'

export interface QueryComplexityAnalysis {
  overallComplexity: 'simple' | 'moderate' | 'complex' | 'expert'
  dimensions: {
    semantic: number          // 0-1: How semantically complex is the query?
    technical: number         // 0-1: Does it require technical/domain expertise?
    analytical: number        // 0-1: How much data analysis is needed?
    collaborative: number     // 0-1: Would multiple perspectives help?
    temporal: number          // 0-1: Does it involve time-series analysis?
    comparative: number       // 0-1: Does it require comparisons/benchmarking?
  }
  requiresSpecialization: string[]
  estimatedProcessingTime: number
  confidence: number
}

export interface UserContextProfile {
  userId: string
  expertise: 'beginner' | 'intermediate' | 'expert'
  role: 'analyst' | 'executive' | 'manager' | 'specialist'
  preferredAnalysisDepth: 'summary' | 'detailed' | 'comprehensive'
  historicalPerformance: {
    successfulQueries: number
    averageComplexity: number
    preferredAgents: string[]
    commonTopics: string[]
  }
  recentContext: {
    lastQueryTime: string
    sessionLength: number
    currentFocus: string[]
  }
}

export interface AgentCapabilityMap {
  agentId: string
  capabilities: {
    complexity: 'simple' | 'moderate' | 'complex' | 'expert'
    domains: string[]
    processingSpeed: number   // queries per minute
    accuracy: number          // historical accuracy score
    collaboration: number     // works well with others (0-1)
  }
  currentLoad: number         // 0-1 current utilization
  performance: {
    averageResponseTime: number
    successRate: number
    userSatisfaction: number
  }
}

export interface RoutingStrategy {
  primaryAgent: string
  supportingAgents: string[]
  collaborationLevel: 'none' | 'review' | 'full_collaboration'
  expectedConfidence: number
  estimatedTime: number
  fallbackOptions: string[]
}

export interface RoutingDecision {
  strategy: RoutingStrategy
  reasoning: string[]
  alternatives: RoutingStrategy[]
  contextFactors: string[]
  optimizationApplied: string[]
}

export class IntelligentAgentRouter {
  private geminiClient: EnhancedGeminiClient
  private memoryManager: LangGraphMemoryManager
  private semanticCatalog: SemanticCatalog
  private cache: SmartHeadCacheService
  private collaborativeFramework: CollaborativeAgentFramework
  
  // Dynamic capability mapping
  private agentCapabilities: Map<string, AgentCapabilityMap> = new Map()
  private routingHistory: Map<string, any[]> = new Map()
  private performanceMetrics: Map<string, any> = new Map()

  constructor(userId: string) {
    this.geminiClient = new EnhancedGeminiClient(process.env.GOOGLE_API_KEY)
    this.memoryManager = new LangGraphMemoryManager({
      userId,
      conversationId: 'agent_routing',
      memoryType: 'semantic',
      namespace: 'intelligent_routing'
    })
    this.semanticCatalog = new SemanticCatalog({
      catalogName: 'agent_routing',
      embeddingModel: 'text-embedding-004'
    })
    this.cache = SmartHeadCacheService.getInstance()
    this.collaborativeFramework = new CollaborativeAgentFramework(userId)
    
    this.initializeAgentCapabilities()
  }

  /**
   * Main routing entry point with comprehensive analysis
   */
  async routeQuery(
    query: string,
    userId: string,
    userRole: 'analyst' | 'executive' = 'analyst',
    dataSource: 'coupa' | 'baan' | 'combined' = 'coupa',
    sessionContext?: any
  ): Promise<RoutingDecision> {
    const startTime = Date.now()
    
    try {
      console.log(`Starting intelligent routing for query: "${query.substring(0, 100)}..."`)
      
      // Phase 1: Comprehensive query complexity analysis
      const complexityAnalysis = await this.analyzeQueryComplexity(query, dataSource)
      
      // Phase 2: Build user context profile
      const userProfile = await this.buildUserContextProfile(userId, userRole, sessionContext)
      
      // Phase 3: Analyze current agent capabilities and load
      const currentCapabilities = await this.analyzeAgentCapabilities()
      
      // Phase 4: Generate optimal routing strategy
      const routingStrategy = await this.generateOptimalRouting(
        query,
        complexityAnalysis,
        userProfile,
        currentCapabilities
      )
      
      // Phase 5: Apply optimization techniques
      const optimizedStrategy = await this.applyRoutingOptimizations(
        routingStrategy,
        complexityAnalysis,
        userProfile
      )
      
      // Phase 6: Generate alternative strategies for robustness
      const alternatives = await this.generateAlternativeStrategies(
        query,
        complexityAnalysis,
        userProfile,
        optimizedStrategy
      )
      
      // Phase 7: Create final routing decision with reasoning
      const decision: RoutingDecision = {
        strategy: optimizedStrategy,
        reasoning: this.generateRoutingReasoning(complexityAnalysis, userProfile, optimizedStrategy),
        alternatives,
        contextFactors: this.extractContextFactors(userProfile, complexityAnalysis),
        optimizationApplied: this.getAppliedOptimizations(routingStrategy, optimizedStrategy)
      }
      
      // Phase 8: Store routing decision for learning
      await this.storeRoutingDecision(query, decision, userId)
      
      console.log(`Routing completed in ${Date.now() - startTime}ms. Selected: ${optimizedStrategy.primaryAgent} with ${optimizedStrategy.supportingAgents.length} supporting agents`)
      
      return decision
      
    } catch (error) {
      console.error('Intelligent routing failed:', error)
      return this.createFallbackRouting(query, userRole, error)
    }
  }

  /**
   * Comprehensive query complexity analysis with multiple dimensions
   */
  private async analyzeQueryComplexity(query: string, dataSource: string): Promise<QueryComplexityAnalysis> {
    try {
      const analysisPrompt = `Analyze the complexity of this financial query across multiple dimensions:

Query: "${query}"
Data Source: ${dataSource}

Evaluate complexity on a scale of 0-1 for each dimension:

1. **Semantic Complexity**: How semantically complex is the language and concepts?
   - Simple: Basic financial terms, straightforward requests
   - Complex: Multiple concepts, abstract relationships, nuanced language

2. **Technical Complexity**: How much domain expertise is required?
   - Simple: Basic reporting, standard metrics
   - Complex: Advanced analytics, specialized financial knowledge

3. **Analytical Complexity**: How much data analysis and computation is needed?
   - Simple: Single table queries, basic aggregations
   - Complex: Multi-source joins, statistical analysis, modeling

4. **Collaborative Complexity**: Would multiple expert perspectives improve accuracy?
   - Simple: Clear-cut analysis, single domain
   - Complex: Cross-functional insights, diverse perspectives needed

5. **Temporal Complexity**: How much time-series analysis is involved?
   - Simple: Single point in time, current state
   - Complex: Trends, forecasting, historical comparisons

6. **Comparative Complexity**: How much comparison and benchmarking is needed?
   - Simple: Absolute values, single entity
   - Complex: Multi-entity comparisons, industry benchmarks

Provide analysis in this format:
SEMANTIC: 0.X
TECHNICAL: 0.X
ANALYTICAL: 0.X
COLLABORATIVE: 0.X
TEMPORAL: 0.X
COMPARATIVE: 0.X
OVERALL: simple|moderate|complex|expert
SPECIALIZATIONS: [list of required specializations]
ESTIMATED_TIME: X seconds
CONFIDENCE: 0.X`

      const response = await this.geminiClient.generateWithThinking({
        prompt: analysisPrompt,
        enableThinking: true,
        temperature: 0.3,
        thinkingBudget: 2000
      })

      return this.parseComplexityAnalysis(response.response_text, query)
      
    } catch (error) {
      console.error('Complexity analysis failed:', error)
      return this.createFallbackComplexityAnalysis(query)
    }
  }

  /**
   * Build comprehensive user context profile
   */
  private async buildUserContextProfile(
    userId: string,
    userRole: string,
    sessionContext?: any
  ): Promise<UserContextProfile> {
    try {
      // Get user's historical episodes
      const recentEpisodes = await this.memoryManager.getConversationEpisodes(10)
      
      // Analyze user expertise based on query patterns
      const expertise = this.assessUserExpertise(recentEpisodes)
      
      // Extract performance metrics
      const performance = this.calculateUserPerformance(recentEpisodes)
      
      // Get current session context
      const recentContext = {
        lastQueryTime: recentEpisodes[0]?.endTime || new Date().toISOString(),
        sessionLength: recentEpisodes.length,
        currentFocus: this.extractCurrentFocus(recentEpisodes, sessionContext)
      }
      
      return {
        userId,
        expertise,
        role: userRole as any,
        preferredAnalysisDepth: this.inferPreferredDepth(expertise, userRole),
        historicalPerformance: performance,
        recentContext
      }
      
    } catch (error) {
      console.error('User profile building failed:', error)
      return this.createFallbackUserProfile(userId, userRole)
    }
  }

  /**
   * Analyze current agent capabilities and load
   */
  private async analyzeAgentCapabilities(): Promise<Map<string, AgentCapabilityMap>> {
    // Get current capabilities from cache or recalculate
    const cacheKey = 'agent_capabilities_current'
    const cached = await this.cache.safeGet<Map<string, AgentCapabilityMap>>(cacheKey)
    
    if (cached) {
      return new Map(Object.entries(cached))
    }
    
    // Update capabilities based on recent performance
    const capabilities = new Map(this.agentCapabilities)
    
    // Simulate load balancing (in real system, this would check actual agent status)
    for (const [agentId, capability] of capabilities) {
      capability.currentLoad = Math.random() * 0.3 // Low load for demo
      capability.performance.successRate = 0.85 + Math.random() * 0.1 // 85-95%
    }
    
    // Cache for 5 minutes
    await this.cache.safeSet(cacheKey, Object.fromEntries(capabilities), 300)
    
    return capabilities
  }

  /**
   * Generate optimal routing strategy
   */
  private async generateOptimalRouting(
    query: string,
    complexity: QueryComplexityAnalysis,
    userProfile: UserContextProfile,
    capabilities: Map<string, AgentCapabilityMap>
  ): Promise<RoutingStrategy> {
    // Rule-based routing with AI enhancement
    let primaryAgent = 'financial_analyst' // Default
    let supportingAgents: string[] = []
    let collaborationLevel: 'none' | 'review' | 'full_collaboration' = 'none'
    
    // Select primary agent based on specialization requirements
    if (complexity.requiresSpecialization.includes('procurement')) {
      primaryAgent = 'procurement_specialist'
    } else if (complexity.requiresSpecialization.includes('risk')) {
      primaryAgent = 'risk_analyst'
    } else if (complexity.requiresSpecialization.includes('executive') || userProfile.role === 'executive') {
      primaryAgent = 'executive_advisor'
    } else if (complexity.dimensions.analytical > 0.7) {
      primaryAgent = 'data_scientist'
    }
    
    // Add supporting agents based on complexity
    if (complexity.dimensions.collaborative > 0.6 || complexity.overallComplexity === 'complex') {
      collaborationLevel = 'review'
      
      // Add complementary agents
      const availableAgents = Array.from(capabilities.keys()).filter(id => id !== primaryAgent)
      
      if (complexity.dimensions.technical > 0.7) {
        supportingAgents.push('risk_analyst')
      }
      
      if (complexity.dimensions.analytical > 0.6) {
        supportingAgents.push('data_scientist')
      }
      
      if (userProfile.role === 'executive' && !supportingAgents.includes('executive_advisor')) {
        supportingAgents.push('executive_advisor')
      }
    }
    
    if (complexity.overallComplexity === 'expert' || complexity.dimensions.collaborative > 0.8) {
      collaborationLevel = 'full_collaboration'
    }
    
    // Calculate expected confidence based on agent capabilities and query complexity
    const expectedConfidence = this.calculateExpectedConfidence(
      primaryAgent,
      supportingAgents,
      complexity,
      capabilities
    )
    
    // Estimate processing time
    const estimatedTime = this.estimateProcessingTime(
      complexity,
      collaborationLevel,
      supportingAgents.length
    )
    
    // Generate fallback options
    const fallbackOptions = this.generateFallbackOptions(primaryAgent, capabilities)
    
    return {
      primaryAgent,
      supportingAgents: [...new Set(supportingAgents)], // Remove duplicates
      collaborationLevel,
      expectedConfidence,
      estimatedTime,
      fallbackOptions
    }
  }

  /**
   * Apply advanced routing optimizations
   */
  private async applyRoutingOptimizations(
    strategy: RoutingStrategy,
    complexity: QueryComplexityAnalysis,
    userProfile: UserContextProfile
  ): Promise<RoutingStrategy> {
    const optimized = { ...strategy }
    
    // Load balancing optimization
    const primaryCapability = this.agentCapabilities.get(strategy.primaryAgent)
    if (primaryCapability && primaryCapability.currentLoad > 0.8) {
      // Find alternative with lower load
      const alternatives = strategy.fallbackOptions
        .map(id => ({ id, load: this.agentCapabilities.get(id)?.currentLoad || 1 }))
        .sort((a, b) => a.load - b.load)
      
      if (alternatives[0] && alternatives[0].load < 0.5) {
        optimized.primaryAgent = alternatives[0].id
      }
    }
    
    // User preference optimization
    if (userProfile.historicalPerformance.preferredAgents.length > 0) {
      const preferredAgent = userProfile.historicalPerformance.preferredAgents[0]
      if (this.agentCapabilities.has(preferredAgent) && 
          this.isAgentSuitableForComplexity(preferredAgent, complexity)) {
        optimized.primaryAgent = preferredAgent
      }
    }
    
    // Expertise optimization
    if (userProfile.expertise === 'expert' && complexity.overallComplexity === 'simple') {
      // Expert users can handle more complex agents for simple queries
      optimized.collaborationLevel = 'none'
      optimized.supportingAgents = []
    } else if (userProfile.expertise === 'beginner' && complexity.overallComplexity === 'complex') {
      // Beginners need more support for complex queries
      optimized.collaborationLevel = 'full_collaboration'
      if (!optimized.supportingAgents.includes('executive_advisor')) {
        optimized.supportingAgents.push('executive_advisor')
      }
    }
    
    return optimized
  }

  /**
   * Generate alternative routing strategies for robustness
   */
  private async generateAlternativeStrategies(
    query: string,
    complexity: QueryComplexityAnalysis,
    userProfile: UserContextProfile,
    primaryStrategy: RoutingStrategy
  ): Promise<RoutingStrategy[]> {
    const alternatives: RoutingStrategy[] = []
    
    // Alternative 1: Single-agent approach
    if (primaryStrategy.collaborationLevel !== 'none') {
      alternatives.push({
        primaryAgent: primaryStrategy.primaryAgent,
        supportingAgents: [],
        collaborationLevel: 'none',
        expectedConfidence: primaryStrategy.expectedConfidence * 0.8,
        estimatedTime: primaryStrategy.estimatedTime * 0.6,
        fallbackOptions: primaryStrategy.fallbackOptions
      })
    }
    
    // Alternative 2: Maximum collaboration
    if (primaryStrategy.collaborationLevel !== 'full_collaboration') {
      alternatives.push({
        primaryAgent: primaryStrategy.primaryAgent,
        supportingAgents: ['risk_analyst', 'data_scientist', 'executive_advisor'],
        collaborationLevel: 'full_collaboration',
        expectedConfidence: primaryStrategy.expectedConfidence * 1.1,
        estimatedTime: primaryStrategy.estimatedTime * 1.5,
        fallbackOptions: primaryStrategy.fallbackOptions
      })
    }
    
    // Alternative 3: Different primary agent
    const fallbackAgent = primaryStrategy.fallbackOptions[0]
    if (fallbackAgent) {
      alternatives.push({
        primaryAgent: fallbackAgent,
        supportingAgents: primaryStrategy.supportingAgents,
        collaborationLevel: primaryStrategy.collaborationLevel,
        expectedConfidence: primaryStrategy.expectedConfidence * 0.9,
        estimatedTime: primaryStrategy.estimatedTime * 1.1,
        fallbackOptions: primaryStrategy.fallbackOptions.slice(1)
      })
    }
    
    return alternatives.slice(0, 3) // Return top 3 alternatives
  }

  /**
   * Initialize agent capabilities with realistic performance data
   */
  private initializeAgentCapabilities(): void {
    const capabilities: AgentCapabilityMap[] = [
      {
        agentId: 'financial_analyst',
        capabilities: {
          complexity: 'complex',
          domains: ['financial_analysis', 'budget_analysis', 'cost_analysis'],
          processingSpeed: 8.5,
          accuracy: 0.88,
          collaboration: 0.85
        },
        currentLoad: 0.2,
        performance: {
          averageResponseTime: 4500,
          successRate: 0.92,
          userSatisfaction: 0.87
        }
      },
      {
        agentId: 'procurement_specialist',
        capabilities: {
          complexity: 'expert',
          domains: ['procurement', 'supplier_analysis', 'contract_management'],
          processingSpeed: 7.2,
          accuracy: 0.91,
          collaboration: 0.88
        },
        currentLoad: 0.15,
        performance: {
          averageResponseTime: 5200,
          successRate: 0.94,
          userSatisfaction: 0.89
        }
      },
      {
        agentId: 'risk_analyst',
        capabilities: {
          complexity: 'expert',
          domains: ['risk_assessment', 'compliance', 'audit'],
          processingSpeed: 6.8,
          accuracy: 0.93,
          collaboration: 0.82
        },
        currentLoad: 0.25,
        performance: {
          averageResponseTime: 6100,
          successRate: 0.96,
          userSatisfaction: 0.91
        }
      },
      {
        agentId: 'data_scientist',
        capabilities: {
          complexity: 'expert',
          domains: ['statistical_analysis', 'modeling', 'data_quality'],
          processingSpeed: 5.5,
          accuracy: 0.89,
          collaboration: 0.79
        },
        currentLoad: 0.35,
        performance: {
          averageResponseTime: 7800,
          successRate: 0.89,
          userSatisfaction: 0.84
        }
      },
      {
        agentId: 'executive_advisor',
        capabilities: {
          complexity: 'moderate',
          domains: ['strategic_analysis', 'executive_reporting', 'business_impact'],
          processingSpeed: 9.2,
          accuracy: 0.86,
          collaboration: 0.92
        },
        currentLoad: 0.1,
        performance: {
          averageResponseTime: 3200,
          successRate: 0.88,
          userSatisfaction: 0.93
        }
      }
    ]
    
    capabilities.forEach(cap => this.agentCapabilities.set(cap.agentId, cap))
  }

  /**
   * Utility methods for analysis and optimization
   */
  private parseComplexityAnalysis(response: string, query: string): QueryComplexityAnalysis {
    const dimensions = {
      semantic: this.extractScore(response, 'SEMANTIC') || 0.5,
      technical: this.extractScore(response, 'TECHNICAL') || 0.5,
      analytical: this.extractScore(response, 'ANALYTICAL') || 0.5,
      collaborative: this.extractScore(response, 'COLLABORATIVE') || 0.4,
      temporal: this.extractScore(response, 'TEMPORAL') || 0.3,
      comparative: this.extractScore(response, 'COMPARATIVE') || 0.3
    }
    
    const averageComplexity = Object.values(dimensions).reduce((sum, val) => sum + val, 0) / 6
    
    let overallComplexity: 'simple' | 'moderate' | 'complex' | 'expert'
    if (averageComplexity < 0.3) overallComplexity = 'simple'
    else if (averageComplexity < 0.6) overallComplexity = 'moderate'
    else if (averageComplexity < 0.8) overallComplexity = 'complex'
    else overallComplexity = 'expert'
    
    const specializations = this.extractSpecializations(response, query)
    
    return {
      overallComplexity,
      dimensions,
      requiresSpecialization: specializations,
      estimatedProcessingTime: this.estimateBaseProcessingTime(dimensions),
      confidence: 0.85
    }
  }

  private extractScore(text: string, dimension: string): number | null {
    const match = text.match(new RegExp(`${dimension}:\\s*([0-9.]+)`, 'i'))
    return match ? Math.max(0, Math.min(1, parseFloat(match[1]))) : null
  }

  private extractSpecializations(response: string, query: string): string[] {
    const specializations: string[] = []
    const queryLower = query.toLowerCase()
    
    if (queryLower.includes('supplier') || queryLower.includes('vendor') || queryLower.includes('procurement')) {
      specializations.push('procurement')
    }
    if (queryLower.includes('risk') || queryLower.includes('compliance') || queryLower.includes('audit')) {
      specializations.push('risk')
    }
    if (queryLower.includes('executive') || queryLower.includes('strategic') || queryLower.includes('board')) {
      specializations.push('executive')
    }
    if (queryLower.includes('model') || queryLower.includes('predict') || queryLower.includes('statistical')) {
      specializations.push('data_science')
    }
    
    return specializations
  }

  private assessUserExpertise(episodes: any[]): 'beginner' | 'intermediate' | 'expert' {
    if (episodes.length < 3) return 'beginner'
    
    const complexQueries = episodes.filter(ep => 
      ep.userContext?.expertise === 'expert' || 
      (ep.summary && ep.summary.length > 100)
    ).length
    
    const ratio = complexQueries / episodes.length
    
    if (ratio > 0.7) return 'expert'
    if (ratio > 0.4) return 'intermediate'
    return 'beginner'
  }

  private calculateUserPerformance(episodes: any[]): any {
    return {
      successfulQueries: episodes.length,
      averageComplexity: 0.6,
      preferredAgents: ['financial_analyst'],
      commonTopics: ['financial_analysis', 'cost_analysis']
    }
  }

  private extractCurrentFocus(episodes: any[], sessionContext?: any): string[] {
    const topics = episodes.flatMap(ep => ep.topics || [])
    const topicCounts = new Map<string, number>()
    
    topics.forEach(topic => {
      topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1)
    })
    
    return Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([topic, _]) => topic)
  }

  private inferPreferredDepth(expertise: string, role: string): 'summary' | 'detailed' | 'comprehensive' {
    if (role === 'executive') return 'summary'
    if (expertise === 'expert') return 'comprehensive'
    if (expertise === 'intermediate') return 'detailed'
    return 'summary'
  }

  private calculateExpectedConfidence(
    primaryAgent: string,
    supportingAgents: string[],
    complexity: QueryComplexityAnalysis,
    capabilities: Map<string, AgentCapabilityMap>
  ): number {
    const primaryCap = capabilities.get(primaryAgent)
    const baseConfidence = primaryCap ? primaryCap.capabilities.accuracy : 0.8
    
    // Adjust for complexity match
    const complexityBonus = this.isAgentSuitableForComplexity(primaryAgent, complexity) ? 0.1 : -0.1
    
    // Collaboration bonus
    const collaborationBonus = supportingAgents.length * 0.05
    
    return Math.max(0.5, Math.min(0.95, baseConfidence + complexityBonus + collaborationBonus))
  }

  private estimateProcessingTime(
    complexity: QueryComplexityAnalysis,
    collaborationLevel: string,
    supportingAgentCount: number
  ): number {
    let baseTime = complexity.estimatedProcessingTime
    
    if (collaborationLevel === 'review') baseTime *= 1.3
    if (collaborationLevel === 'full_collaboration') baseTime *= 1.8
    
    baseTime += supportingAgentCount * 2000 // 2s per supporting agent
    
    return Math.max(3000, baseTime) // Minimum 3 seconds
  }

  private estimateBaseProcessingTime(dimensions: any): number {
    const avgComplexity = Object.values(dimensions).reduce((sum: number, val: any) => sum + val, 0) / 6
    return 3000 + (avgComplexity * 10000) // 3-13 seconds base time
  }

  private isAgentSuitableForComplexity(agentId: string, complexity: QueryComplexityAnalysis): boolean {
    const capability = this.agentCapabilities.get(agentId)
    if (!capability) return false
    
    const complexityLevels = { simple: 1, moderate: 2, complex: 3, expert: 4 }
    const agentLevel = complexityLevels[capability.capabilities.complexity]
    const queryLevel = complexityLevels[complexity.overallComplexity]
    
    return agentLevel >= queryLevel
  }

  private generateFallbackOptions(primaryAgent: string, capabilities: Map<string, AgentCapabilityMap>): string[] {
    return Array.from(capabilities.keys())
      .filter(id => id !== primaryAgent)
      .sort((a, b) => {
        const aPerf = capabilities.get(a)?.performance.successRate || 0
        const bPerf = capabilities.get(b)?.performance.successRate || 0
        return bPerf - aPerf
      })
      .slice(0, 2)
  }

  private generateRoutingReasoning(
    complexity: QueryComplexityAnalysis,
    userProfile: UserContextProfile,
    strategy: RoutingStrategy
  ): string[] {
    const reasoning: string[] = []
    
    reasoning.push(`Selected ${strategy.primaryAgent} based on ${complexity.overallComplexity} complexity`)
    
    if (strategy.supportingAgents.length > 0) {
      reasoning.push(`Added ${strategy.supportingAgents.length} supporting agents for collaborative analysis`)
    }
    
    if (userProfile.expertise === 'expert') {
      reasoning.push('Optimized for expert user with detailed analysis')
    }
    
    if (complexity.dimensions.collaborative > 0.6) {
      reasoning.push('Multi-agent approach chosen due to collaborative complexity')
    }
    
    return reasoning
  }

  private extractContextFactors(userProfile: UserContextProfile, complexity: QueryComplexityAnalysis): string[] {
    const factors: string[] = []
    
    factors.push(`User expertise: ${userProfile.expertise}`)
    factors.push(`Query complexity: ${complexity.overallComplexity}`)
    factors.push(`Session length: ${userProfile.recentContext.sessionLength}`)
    
    if (userProfile.recentContext.currentFocus.length > 0) {
      factors.push(`Current focus: ${userProfile.recentContext.currentFocus.join(', ')}`)
    }
    
    return factors
  }

  private getAppliedOptimizations(original: RoutingStrategy, optimized: RoutingStrategy): string[] {
    const optimizations: string[] = []
    
    if (original.primaryAgent !== optimized.primaryAgent) {
      optimizations.push('Primary agent optimization')
    }
    
    if (original.supportingAgents.length !== optimized.supportingAgents.length) {
      optimizations.push('Supporting agent adjustment')
    }
    
    if (original.collaborationLevel !== optimized.collaborationLevel) {
      optimizations.push('Collaboration level optimization')
    }
    
    return optimizations.length > 0 ? optimizations : ['No optimizations applied']
  }

  private async storeRoutingDecision(query: string, decision: RoutingDecision, userId: string): Promise<void> {
    try {
      await this.memoryManager.storeSemanticFact({
        id: `routing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        fact: `Routing decision: ${decision.strategy.primaryAgent} for ${decision.strategy.collaborationLevel} analysis`,
        category: 'knowledge',
        confidence: decision.strategy.expectedConfidence,
        lastUpdated: new Date().toISOString(),
        sources: ['intelligent_router']
      })
    } catch (error) {
      console.error('Failed to store routing decision:', error)
    }
  }

  private createFallbackComplexityAnalysis(query: string): QueryComplexityAnalysis {
    return {
      overallComplexity: 'moderate',
      dimensions: {
        semantic: 0.5,
        technical: 0.5,
        analytical: 0.5,
        collaborative: 0.4,
        temporal: 0.3,
        comparative: 0.3
      },
      requiresSpecialization: [],
      estimatedProcessingTime: 5000,
      confidence: 0.6
    }
  }

  private createFallbackUserProfile(userId: string, userRole: string): UserContextProfile {
    return {
      userId,
      expertise: 'intermediate',
      role: userRole as any,
      preferredAnalysisDepth: 'detailed',
      historicalPerformance: {
        successfulQueries: 5,
        averageComplexity: 0.5,
        preferredAgents: ['financial_analyst'],
        commonTopics: ['financial_analysis']
      },
      recentContext: {
        lastQueryTime: new Date().toISOString(),
        sessionLength: 1,
        currentFocus: ['financial_analysis']
      }
    }
  }

  private createFallbackRouting(query: string, userRole: string, error: any): RoutingDecision {
    return {
      strategy: {
        primaryAgent: 'financial_analyst',
        supportingAgents: [],
        collaborationLevel: 'none',
        expectedConfidence: 0.7,
        estimatedTime: 5000,
        fallbackOptions: ['procurement_specialist', 'data_scientist']
      },
      reasoning: ['Fallback routing due to analysis failure', 'Using default financial analyst'],
      alternatives: [],
      contextFactors: ['Error in routing analysis'],
      optimizationApplied: ['None due to fallback']
    }
  }
}