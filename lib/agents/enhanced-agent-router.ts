// Enhanced Smart Head Agent Router with Redis Caching, Upload Support, and Thinking
import { SmartAgentRouter } from './agent-router'
import { RouterResult } from '../types'
import { EnhancedGeminiClient, GeminiThinkingResponse } from '../gemini/enhanced-client'
import { SmartHeadCacheService, generateQueryHash } from '../cache/redis-service'
import { MemoryCoordinator } from '../memory/langgraph-memory'

export interface UploadedFile {
  fileId: string
  type: 'chart' | 'document' | 'csv' | 'image'
  name: string
  size: number
  uploadedAt: string
  processed: boolean
  analyzedContent?: any
}

export interface EnhancedRouterResult extends RouterResult {
  cached?: boolean
  cacheKey?: string
  uploadAnalysis?: any[]
  thinkingProcess?: string
  memoryContext?: any
  followUpSuggestions?: string[]
  contextualInsights?: string[]
}

export interface UploadClassificationResult {
  type: 'question' | 'action' | 'completion'
  primaryTool: string
  priority: 'high' | 'medium' | 'low'
  requiresUploads: boolean
  uploadProcessingStrategy: string
}

export class EnhancedSmartAgentRouter extends SmartAgentRouter {
  private geminiClient: EnhancedGeminiClient
  private cache: SmartHeadCacheService
  private memoryCoordinator: MemoryCoordinator | null = null

  constructor() {
    super()
    this.geminiClient = EnhancedGeminiClient.getInstance()
    this.cache = SmartHeadCacheService.getInstance()
  }

  // New streaming method for real-time responses
  async* executeStreamingAnalysis(
    query: string,
    options: {
      dataSource?: 'coupa' | 'baan' | 'combined',
      userId?: string,
      conversationId?: string,
      uploads?: UploadedFile[],
      enableThinking?: boolean,
      useCache?: boolean
    } = {}
  ): AsyncIterableIterator<{type: string, content?: string, sqlQuery?: string, agentUsed?: string, confidence?: number, cached?: boolean, contextualInsights?: string[], followUpSuggestions?: string[]}> {
    try {
      const { dataSource = 'coupa', uploads = [], enableThinking = true, useCache = true } = options

      // Check cache first if enabled
      if (useCache) {
        const cacheKey = generateQueryHash(`${query}-${dataSource}-${uploads.map(u => u.fileId).join(',')}`)
        const cached = await this.cache.getCachedThinking(cacheKey)
        if (cached) {
          yield { type: 'final', content: cached.response_text, sqlQuery: cached.tool_calls?.[0]?.query, agentUsed: dataSource, confidence: cached.confidence, cached: true }
          return
        }
      }

      // Stream thinking process if enabled
      if (enableThinking) {
        yield { type: 'thinking', content: 'Analyzing query and determining optimal data source...' }
      }

      // Use Gemini streaming for real-time response
      const streamResult = await this.geminiClient.generateWithThinkingStream({
        prompt: query,
        enableThinking,
        context: {
          dataSource,
          uploads: uploads.map(u => ({ type: u.type, name: u.name }))
        }
      })

      let accumulatedContent = ''
      for await (const chunk of streamResult) {
        accumulatedContent += chunk
        yield { type: 'content', content: chunk }
      }

      // Final processing and caching
      const finalResult = await this.processStreamingResult(accumulatedContent, query, options)
      yield { 
        type: 'final', 
        content: finalResult.response, 
        sqlQuery: finalResult.sqlQuery,
        agentUsed: finalResult.agentUsed,
        confidence: finalResult.confidence,
        contextualInsights: finalResult.contextualInsights,
        followUpSuggestions: finalResult.followUpSuggestions,
        cached: false
      }

    } catch (error) {
      console.error('Streaming analysis error:', error)
      yield { type: 'final', content: 'Error occurred during analysis. Please try again.', agentUsed: 'error', confidence: 0 }
    }
  }

  private async processStreamingResult(content: string, query: string, options: any): Promise<EnhancedRouterResult> {
    // Process the accumulated streaming content into a structured result
    const sqlMatch = content.match(/```sql\n([\s\S]*?)\n```/)
    const sqlQuery = sqlMatch ? sqlMatch[1].trim() : null

    // Generate insights and suggestions
    const contextualInsights = this.extractInsights(content)
    const followUpSuggestions = this.generateStreamingFollowUpSuggestions(query, content)

    return {
      response: content,
      sqlQuery: sqlQuery || undefined,
      agentUsed: options.dataSource || 'coupa',
      confidence: 90,
      contextualInsights,
      followUpSuggestions,
      cached: false,
      success: true,
      executionTime: Date.now()
    }
  }

  private extractInsights(content: string): string[] {
    const insights = []
    if (content.includes('variance') || content.includes('trend')) {
      insights.push('Significant variance patterns detected in the data')
    }
    if (content.includes('cost') && content.includes('optimization')) {
      insights.push('Cost optimization opportunities identified')
    }
    if (content.includes('risk') || content.includes('anomaly')) {
      insights.push('Risk factors or anomalies requiring attention')
    }
    return insights
  }

  private generateStreamingFollowUpSuggestions(query: string, content: string): string[] {
    const suggestions = []
    if (content.includes('SQL') || content.includes('SELECT')) {
      suggestions.push('Would you like to see the detailed SQL execution results?')
    }
    if (query.toLowerCase().includes('cost') || query.toLowerCase().includes('spending')) {
      suggestions.push('Show cost breakdown by entity or department?')
    }
    if (query.toLowerCase().includes('supplier') || query.toLowerCase().includes('vendor')) {
      suggestions.push('Analyze supplier performance trends?')
    }
    return suggestions
  }

  async classifyWithUploads(
    query: string, 
    uploads: UploadedFile[] = [],
    userId?: string,
    conversationId?: string
  ): Promise<UploadClassificationResult> {
    // Enhanced classification considering uploaded content
    const hasUploads = uploads.length > 0
    const uploadTypes = uploads.map(f => f.type)
    
    // Use Gemini 2.5 thinking for complex routing decisions
    const classificationResult = await this.geminiClient.generateWithThinking({
      prompt: `Classify this query and uploaded files for Smart Head procurement analytics:

Query: "${query}"
Has uploads: ${hasUploads}
Upload types: ${uploadTypes.join(', ')}
Upload content: ${uploads.map(f => f.analyzedContent?.summary || 'Not analyzed').join('; ')}

Classify into one of these types:
1. QUESTION - Requires clarification (ambiguous query, unclear intent)
2. ACTION - Requires data gathering (SQL queries, file processing, analysis)
3. COMPLETION - Ready for response (clear query, sufficient context)

Consider:
- Upload content relevance to procurement/financial analysis
- Query complexity and data requirements
- Need for additional context or clarification

Respond with: TYPE, PRIMARY_TOOL, PRIORITY, PROCESSING_STRATEGY`,
      systemPrompt: `You are a Smart Head query classifier with upload awareness.
      
CLASSIFICATION RULES:
- QUESTION: Ambiguous queries needing clarification
- ACTION: Requires data gathering, SQL execution, or file processing
- COMPLETION: Direct responses with sufficient context

UPLOAD PROCESSING:
- Charts/Images: Use multimodal analysis for insights
- CSV: Integrate with existing financial data
- Documents: Extract procurement-relevant information`,
      enableThinking: true,
      context: {
        hasUploads,
        uploadTypes,
        platform: 'Smart Head Procurement Analytics'
      }
    })

    return this.parseClassificationResult(classificationResult, uploads)
  }

  async routeWithCache(
    query: string, 
    uploads: UploadedFile[] = [],
    userId?: string,
    conversationId?: string,
    requestedDataSource?: 'coupa' | 'baan' | 'combined'
  ): Promise<EnhancedRouterResult> {
    // Initialize memory coordinator if user context available
    if (userId && conversationId && !this.memoryCoordinator) {
      this.memoryCoordinator = new MemoryCoordinator(userId, conversationId)
    }

    // Check cache first for similar queries
    const queryHash = generateQueryHash(query, uploads, { userId, requestedDataSource })
    const cached = await this.cache.getCachedRoute(queryHash)
    
    if (cached && this.isCacheValid(cached)) {
      // Enrich cached result with memory context
      return {
        ...cached.result,
        cached: true,
        cacheKey: queryHash,
        memoryContext: await this.getMemoryContext(userId, conversationId, query)
      }
    }

    // Process with uploads and enhanced context
    const result = await this.processWithUploadsAndMemory(
      query, 
      uploads, 
      userId, 
      conversationId, 
      requestedDataSource
    )
    
    // Cache result with appropriate TTL
    const cacheTTL = this.determineCacheTTL(result, uploads)
    await this.cache.cacheRoute(queryHash, result, cacheTTL)
    
    return {
      ...result,
      cached: false,
      cacheKey: queryHash
    }
  }

  private async processWithUploadsAndMemory(
    query: string,
    uploads: UploadedFile[],
    userId?: string,
    conversationId?: string,
    requestedDataSource?: 'coupa' | 'baan' | 'combined'
  ): Promise<EnhancedRouterResult> {
    try {
      // Get memory context if available
      const memoryContext = await this.getMemoryContext(userId, conversationId, query)
      
      // Classify query with upload awareness
      const classification = await this.classifyWithUploads(query, uploads, userId, conversationId)
      
      // Process uploads if present
      const uploadAnalysis = await this.processUploads(uploads, query)
      
      // Enhanced context for agent processing
      const enhancedContext = {
        query,
        uploads,
        uploadAnalysis,
        memoryContext,
        classification,
        requestedDataSource: requestedDataSource || 'combined'
      }

      // Route based on classification and uploads
      let result: RouterResult
      switch (classification.type) {
        case 'question':
          result = await this.handleQuestionWithUploads(enhancedContext)
          break
        case 'action':
          result = await this.handleActionWithUploads(enhancedContext)
          break
        case 'completion':
          result = await this.handleCompletionWithUploads(enhancedContext)
          break
        default:
          result = await super.routeQuery(query, requestedDataSource)
      }

      // Generate enhanced insights and suggestions
      const contextualInsights = await this.generateContextualInsights(result, memoryContext, uploadAnalysis)
      const followUpSuggestions = await this.generateFollowUpSuggestions(query, result, uploads)

      // Store interaction in memory
      if (this.memoryCoordinator) {
        await this.memoryCoordinator.storeInteractionResults(
          query, 
          result.response || '', 
          !result.error,
          contextualInsights
        )
      }

      return {
        ...result,
        uploadAnalysis,
        memoryContext,
        contextualInsights,
        followUpSuggestions,
        thinkingProcess: result.thinkingProcess || '' // Use actual thinking process from agents
      }
    } catch (error) {
      console.error('Enhanced routing error:', error)
      
      // Fallback to basic routing
      const fallbackResult = await super.routeQuery(query, requestedDataSource)
      return {
        ...fallbackResult,
        uploadAnalysis: [],
        contextualInsights: ['Enhanced processing unavailable - using basic analysis'],
        followUpSuggestions: []
      }
    }
  }

  private async processUploads(uploads: UploadedFile[], query: string): Promise<any[]> {
    if (uploads.length === 0) return []

    const analysis = []
    for (const upload of uploads) {
      try {
        // Get cached processing result or process
        const cacheKey = `upload_analysis:${upload.fileId}`
        let uploadResult = await this.cache.safeGet(cacheKey)
        
        if (!uploadResult) {
          // Process upload with Gemini multimodal capabilities
          uploadResult = await this.geminiClient.processUploadedFile({
            type: upload.type,
            name: upload.name,
            fileId: upload.fileId
          }, `Analyze this ${upload.type} file in context of: "${query}"`)
          
          await this.cache.safeSet(cacheKey, uploadResult, 3600) // 1 hour cache
        }
        
        analysis.push({
          fileId: upload.fileId,
          type: upload.type,
          analysis: uploadResult,
          relevanceToQuery: this.assessRelevance(uploadResult, query)
        })
      } catch (error) {
        console.error(`Failed to process upload ${upload.fileId}:`, error)
        analysis.push({
          fileId: upload.fileId,
          type: upload.type,
          error: 'Processing failed',
          relevanceToQuery: 0
        })
      }
    }

    return analysis
  }

  private async getMemoryContext(userId?: string, conversationId?: string, query?: string): Promise<any> {
    if (!userId || !conversationId || !this.memoryCoordinator) return null

    try {
      return await this.memoryCoordinator.getComprehensiveContext(query || '')
    } catch (error) {
      console.error('Memory context retrieval error:', error)
      return null
    }
  }

  private async handleQuestionWithUploads(context: any): Promise<RouterResult> {
    // Generate clarifying questions considering uploads
    const clarificationResult = await this.geminiClient.generateWithThinking({
      prompt: `Generate clarifying questions for this procurement query:

Query: "${context.query}"
Uploads: ${context.uploads.map((u: UploadedFile) => `${u.type} file: ${u.name}`).join(', ')}
Upload analysis: ${context.uploadAnalysis.map((a: any) => a.analysis?.response_text || 'No analysis').join('; ')}

What clarifications are needed to provide the most valuable procurement insights?`,
      systemPrompt: `You are a Smart Head clarification expert. Generate 2-3 specific questions that would help provide better procurement analytics.`,
      enableThinking: true
    })

    return {
      success: true,
      response: clarificationResult.response_text,
      agentUsed: 'simple',
      classification: context.classification,
      executionTime: Date.now(),
      confidence: 0.8
    }
  }

  private async handleActionWithUploads(context: any): Promise<RouterResult> {
    // Import our updated agents with correct names
    const { CoupaFinancialAgent } = await import('./coupa-agent')
    const { BaanProcurementAgent } = await import('./baan-agent')
    
    // Determine which agent to use
    const dataSource = context.requestedDataSource || 'coupa'
    let agent
    let agentName: 'coupa' | 'baan' | 'combined' | 'simple'
    
    if (dataSource === 'baan') {
      agent = new BaanProcurementAgent()
      agentName = 'baan'
    } else {
      agent = new CoupaFinancialAgent()
      agentName = 'coupa'
    }

    // Process the query with the proper agent using analyze method
    const agentResult = await agent.analyze(context.query)

    // Extract SQL query if present
    const sqlQuery = this.extractSQLFromResponse(agentResult.response || '')

    return {
      success: true,
      response: agentResult.response || 'Analysis completed',
      sqlQuery: agentResult.sqlQuery || sqlQuery,
      agentUsed: agentName,
      classification: context.classification,
      confidence: 0.85,
      queryResults: agentResult.queryResults || [],
      evidence: agentResult.evidence || [],
      insights: agentResult.insights || [],
      executionTime: Date.now()
    }
  }

  private async handleCompletionWithUploads(context: any): Promise<RouterResult> {
    // Generate comprehensive response with all context
    const completionResult = await this.geminiClient.generateWithThinking({
      prompt: `Provide comprehensive procurement analysis for:

Query: "${context.query}"
Memory context: ${context.memoryContext?.contextSummary || 'No prior context'}
Upload insights: ${context.uploadAnalysis.map((a: any) => a.analysis?.response_text || '').join(' ')}

Generate executive-level insights with actionable recommendations.`,
      systemPrompt: `You are a Smart Head executive analyst. Provide comprehensive procurement insights with:
1. Executive summary
2. Key findings
3. Strategic recommendations
4. Next steps`,
      enableThinking: true
    })

    return {
      success: true,
      response: completionResult.response_text,
      agentUsed: 'simple',
      classification: context.classification,
      confidence: completionResult.confidence || 0.9,
      executionTime: Date.now()
    }
  }

  private parseClassificationResult(result: GeminiThinkingResponse, uploads: UploadedFile[]): UploadClassificationResult {
    const text = result.response_text.toLowerCase()
    
    let type: 'question' | 'action' | 'completion' = 'action' // default
    if (text.includes('question')) type = 'question'
    else if (text.includes('completion')) type = 'completion'
    
    let priority: 'high' | 'medium' | 'low' = 'medium'
    if (uploads.length > 0) priority = 'high'
    else if (text.includes('critical') || text.includes('urgent')) priority = 'high'
    else if (text.includes('low') || text.includes('simple')) priority = 'low'

    return {
      type,
      primaryTool: this.determinePrimaryTool(type, uploads),
      priority,
      requiresUploads: uploads.length > 0,
      uploadProcessingStrategy: uploads.length > 0 ? 'multimodal_analysis' : 'none'
    }
  }

  private determinePrimaryTool(type: string, uploads: UploadedFile[]): string {
    if (uploads.length > 0) {
      if (uploads.some(u => u.type === 'csv')) return 'csv_integrator'
      if (uploads.some(u => u.type === 'chart')) return 'chart_analyzer'
      if (uploads.some(u => u.type === 'document')) return 'document_processor'
    }
    
    switch (type) {
      case 'question': return 'clarification_generator'
      case 'action': return 'sql_executor'
      case 'completion': return 'executive_synthesizer'
      default: return 'general_processor'
    }
  }

  private assessRelevance(uploadResult: any, query: string): number {
    // Simple relevance scoring - in production, use more sophisticated analysis
    const keywords = query.toLowerCase().split(' ')
    const content = uploadResult.response_text?.toLowerCase() || ''
    
    const matches = keywords.filter(keyword => content.includes(keyword)).length
    return Math.min(matches / keywords.length, 1.0)
  }

  private extractSQLFromResponse(response: string): string | undefined {
    const sqlMatch = response.match(/```sql\n([\s\S]*?)\n```/)
    return sqlMatch ? sqlMatch[1].trim() : undefined
  }

  private async generateContextualInsights(
    result: RouterResult, 
    memoryContext: any, 
    uploadAnalysis: any[]
  ): Promise<string[]> {
    const insights = []
    
    if (memoryContext?.semanticFacts?.length > 0) {
      insights.push(`Leveraged ${memoryContext.semanticFacts.length} user preferences in analysis`)
    }
    
    if (uploadAnalysis.length > 0) {
      insights.push(`Analyzed ${uploadAnalysis.length} uploaded files for enhanced context`)
    }
    
    if (result.confidence && result.confidence > 0.9) {
      insights.push('High confidence analysis based on comprehensive data')
    }
    
    return insights
  }

  private async generateFollowUpSuggestions(
    query: string, 
    result: RouterResult, 
    uploads: UploadedFile[]
  ): Promise<string[]> {
    const suggestions = []
    
    if (uploads.length > 0) {
      suggestions.push('Explore deeper insights from uploaded files')
      suggestions.push('Cross-reference upload data with historical trends')
    }
    
    if (result.sqlQuery) {
      suggestions.push('Analyze variance patterns in similar time periods')
      suggestions.push('Generate comparative analysis with other cost centers')
    }
    
    suggestions.push('Create dashboard visualization of these findings')
    
    return suggestions.slice(0, 3) // Limit to 3 suggestions
  }

  private isCacheValid(cached: any): boolean {
    if (!cached.timestamp) return false
    
    const age = Date.now() - new Date(cached.timestamp).getTime()
    const maxAge = 3600000 // 1 hour
    
    return age < maxAge
  }

  private determineCacheTTL(result: RouterResult, uploads: UploadedFile[]): number {
    // Dynamic TTL based on result characteristics
    if (uploads.length > 0) return 1800 // 30 minutes for upload-based results
    if (result.sqlQuery) return 3600 // 1 hour for SQL results
    return 7200 // 2 hours for general results
  }
}

export default EnhancedSmartAgentRouter