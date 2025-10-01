// Bulk Insight Generation Orchestrator for Automated Analytics
import { ContextAwareAgent } from './agents/context-aware-agent'
import { EnhancedSmartAgentRouter } from './agents/enhanced-agent-router'
import Database from './database'

export interface BulkInsightRequest {
  userId: string
  conversationId?: string
  analysisType: 'financial_overview' | 'procurement_analysis' | 'risk_assessment' | 'performance_metrics' | 'comprehensive'
  timeframe?: 'current_quarter' | 'year_to_date' | 'last_12_months' | 'custom'
  customDateRange?: {
    startDate: string
    endDate: string
  }
  dataSources?: ('coupa' | 'baan' | 'combined')[]
  outputFormat?: 'executive_summary' | 'detailed_analysis' | 'dashboard_insights' | 'all'
  priority?: 'high' | 'medium' | 'low'
}

export interface BulkInsightResult {
  id: string
  userId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  analysisType: string
  insights: InsightSection[]
  executionTime: number
  confidence: number
  dataSourcesUsed: string[]
  totalQueries: number
  recordsAnalyzed: number
  createdAt: Date
  completedAt?: Date
  error?: string
}

export interface InsightSection {
  title: string
  category: 'financial' | 'procurement' | 'risk' | 'performance' | 'strategic'
  priority: 'critical' | 'high' | 'medium' | 'low'
  summary: string
  details: string
  metrics: InsightMetric[]
  recommendations: string[]
  sqlQueries: string[]
  visualizationData?: any
  confidence: number
  dataSource: string
}

export interface InsightMetric {
  name: string
  value: number | string
  unit?: string
  trend?: 'up' | 'down' | 'stable'
  variance?: number
  benchmark?: number | string
  significance: 'critical' | 'important' | 'normal'
}

export class BulkInsightOrchestrator {
  private static instance: BulkInsightOrchestrator
  private contextAgent: ContextAwareAgent
  private router: EnhancedSmartAgentRouter
  private activeJobs: Map<string, BulkInsightResult> = new Map()

  private constructor() {
    this.contextAgent = new ContextAwareAgent()
    this.router = new EnhancedSmartAgentRouter()
  }

  static getInstance(): BulkInsightOrchestrator {
    if (!BulkInsightOrchestrator.instance) {
      BulkInsightOrchestrator.instance = new BulkInsightOrchestrator()
    }
    return BulkInsightOrchestrator.instance
  }

  // Main orchestration method for bulk insight generation
  async generateBulkInsights(request: BulkInsightRequest): Promise<BulkInsightResult> {
    const jobId = this.generateJobId()
    const startTime = Date.now()

    // Initialize job tracking
    const job: BulkInsightResult = {
      id: jobId,
      userId: request.userId,
      status: 'processing',
      analysisType: request.analysisType,
      insights: [],
      executionTime: 0,
      confidence: 0,
      dataSourcesUsed: [],
      totalQueries: 0,
      recordsAnalyzed: 0,
      createdAt: new Date()
    }

    // Store job in database immediately for cross-instance visibility
    await this.storeJob(job)
    this.activeJobs.set(jobId, job)

    try {

      // Generate insights based on analysis type
      const insights = await this.orchestrateAnalysis(request, jobId)
      
      // Calculate overall metrics
      const metrics = this.calculateJobMetrics(insights)
      
      // Update job with results
      job.insights = insights
      job.confidence = metrics.averageConfidence
      job.dataSourcesUsed = metrics.dataSourcesUsed
      job.totalQueries = metrics.totalQueries
      job.recordsAnalyzed = metrics.recordsAnalyzed
      job.executionTime = Date.now() - startTime
      job.status = 'completed'
      job.completedAt = new Date()

      // Update in database and remove from active tracking
      await this.updateJob(job)
      this.activeJobs.delete(jobId)

      return job
    } catch (error) {
      console.error(`Bulk insight generation failed for job ${jobId}:`, error)
      
      job.status = 'failed'
      job.error = error instanceof Error ? error.message : 'Unknown error'
      job.executionTime = Date.now() - startTime
      job.completedAt = new Date()
      
      // Update in database and remove from active tracking
      await this.updateJob(job)
      this.activeJobs.delete(jobId)
      
      throw error
    }
  }

  // Streaming version for real-time insight generation
  async *streamBulkInsights(request: BulkInsightRequest): AsyncGenerator<Partial<BulkInsightResult>, void, unknown> {
    const jobId = this.generateJobId()
    const startTime = Date.now()

    const job: BulkInsightResult = {
      id: jobId,
      userId: request.userId,
      status: 'processing',
      analysisType: request.analysisType,
      insights: [],
      executionTime: 0,
      confidence: 0,
      dataSourcesUsed: [],
      totalQueries: 0,
      recordsAnalyzed: 0,
      createdAt: new Date()
    }

    try {
      // Store initial job in database for cross-instance visibility
      await this.storeJob(job)
      this.activeJobs.set(jobId, job)

      yield { id: jobId, status: 'processing', createdAt: job.createdAt }

      // Stream insights as they're generated
      for await (const insight of this.streamAnalysis(request, jobId)) {
        job.insights.push(insight)
        
        // Yield progress update
        yield {
          id: jobId,
          insights: [insight],
          totalQueries: job.totalQueries + 1,
          status: 'processing'
        }
      }

      // Final metrics calculation
      const metrics = this.calculateJobMetrics(job.insights)
      job.confidence = metrics.averageConfidence
      job.dataSourcesUsed = metrics.dataSourcesUsed
      job.totalQueries = metrics.totalQueries
      job.recordsAnalyzed = metrics.recordsAnalyzed
      job.executionTime = Date.now() - startTime
      job.status = 'completed'
      job.completedAt = new Date()

      await this.updateJob(job)
      this.activeJobs.delete(jobId)

      // Yield final result
      yield {
        id: jobId,
        status: 'completed',
        confidence: job.confidence,
        executionTime: job.executionTime,
        totalQueries: job.totalQueries,
        recordsAnalyzed: job.recordsAnalyzed
      }

    } catch (error) {
      console.error(`Streaming bulk insight generation failed for job ${jobId}:`, error)
      
      job.status = 'failed'
      job.error = error instanceof Error ? error.message : 'Unknown error'
      
      await this.updateJob(job)
      this.activeJobs.delete(jobId)
      
      yield { id: jobId, status: 'failed', error: job.error }
    }
  }

  // Orchestrate analysis based on request type
  private async orchestrateAnalysis(request: BulkInsightRequest, jobId: string): Promise<InsightSection[]> {
    const insights: InsightSection[] = []
    const analysisQueries = this.generateAnalysisQueries(request)

    for (const queryConfig of analysisQueries) {
      try {
        const result = await this.contextAgent.processQuery(
          queryConfig.query,
          request.userId,
          request.conversationId || jobId,
          queryConfig.dataSource
        )

        if (result.success && result.response) {
          const insight = await this.transformToInsight(result, queryConfig)
          insights.push(insight)
        }
      } catch (error) {
        console.error(`Failed to process query: ${queryConfig.query}`, error)
        // Continue with other queries even if one fails
      }
    }

    return insights
  }

  // Streaming analysis version
  private async *streamAnalysis(request: BulkInsightRequest, jobId: string): AsyncGenerator<InsightSection, void, unknown> {
    const analysisQueries = this.generateAnalysisQueries(request)

    for (const queryConfig of analysisQueries) {
      try {
        const result = await this.contextAgent.processQuery(
          queryConfig.query,
          request.userId,
          request.conversationId || jobId,
          queryConfig.dataSource
        )

        if (result.success && result.response) {
          const insight = await this.transformToInsight(result, queryConfig)
          yield insight
        }
      } catch (error) {
        console.error(`Failed to process streaming query: ${queryConfig.query}`, error)
        // Continue with other queries
      }
    }
  }

  // Generate analysis queries based on request type
  private generateAnalysisQueries(request: BulkInsightRequest): Array<{
    query: string
    dataSource: 'coupa' | 'baan' | 'combined'
    category: InsightSection['category']
    priority: InsightSection['priority']
    title: string
  }> {
    const queries: Array<{
      query: string
      dataSource: 'coupa' | 'baan' | 'combined'
      category: InsightSection['category']
      priority: InsightSection['priority']
      title: string
    }> = []

    const timeframe = this.buildTimeframeCondition(request.timeframe, request.customDateRange)

    switch (request.analysisType) {
      case 'financial_overview':
        queries.push(
          {
            query: `Analyze total spending by cost group ${timeframe} with variance analysis`,
            dataSource: 'coupa',
            category: 'financial',
            priority: 'critical',
            title: 'Cost Group Analysis'
          },
          {
            query: `Show top 10 cost centers by spending ${timeframe} with budget variance`,
            dataSource: 'coupa',
            category: 'financial',
            priority: 'high',
            title: 'Cost Center Performance'
          },
          {
            query: `Analyze spending trends by entity ${timeframe} with quarterly comparison`,
            dataSource: 'coupa',
            category: 'financial',
            priority: 'high',
            title: 'Entity Spending Trends'
          }
        )
        break

      case 'procurement_analysis':
        queries.push(
          {
            query: `Analyze top suppliers by spend ${timeframe} with performance metrics`,
            dataSource: 'baan',
            category: 'procurement',
            priority: 'critical',
            title: 'Supplier Performance Analysis'
          },
          {
            query: `Show commodity spending breakdown ${timeframe} with trend analysis`,
            dataSource: 'baan',
            category: 'procurement',
            priority: 'high',
            title: 'Commodity Spend Analysis'
          },
          {
            query: `Analyze procurement efficiency by location ${timeframe}`,
            dataSource: 'baan',
            category: 'procurement',
            priority: 'medium',
            title: 'Location-Based Procurement'
          }
        )
        break

      case 'risk_assessment':
        queries.push(
          {
            query: `Identify high-risk suppliers with concentration analysis ${timeframe}`,
            dataSource: 'baan',
            category: 'risk',
            priority: 'critical',
            title: 'Supplier Risk Assessment'
          },
          {
            query: `Analyze budget variance and overspend risks ${timeframe}`,
            dataSource: 'coupa',
            category: 'risk',
            priority: 'critical',
            title: 'Budget Risk Analysis'
          },
          {
            query: `Review compliance and audit findings ${timeframe}`,
            dataSource: 'combined',
            category: 'risk',
            priority: 'high',
            title: 'Compliance Risk Review'
          }
        )
        break

      case 'performance_metrics':
        queries.push(
          {
            query: `Calculate procurement efficiency metrics ${timeframe}`,
            dataSource: 'combined',
            category: 'performance',
            priority: 'high',
            title: 'Procurement Efficiency'
          },
          {
            query: `Analyze cost savings and optimization opportunities ${timeframe}`,
            dataSource: 'combined',
            category: 'performance',
            priority: 'high',
            title: 'Cost Optimization'
          },
          {
            query: `Review supplier performance ratings and KPIs ${timeframe}`,
            dataSource: 'baan',
            category: 'performance',
            priority: 'medium',
            title: 'Supplier KPI Analysis'
          }
        )
        break

      case 'comprehensive':
        // Combine all analysis types for comprehensive view
        queries.push(
          ...this.generateAnalysisQueries({ ...request, analysisType: 'financial_overview' }),
          ...this.generateAnalysisQueries({ ...request, analysisType: 'procurement_analysis' }),
          ...this.generateAnalysisQueries({ ...request, analysisType: 'risk_assessment' }),
          ...this.generateAnalysisQueries({ ...request, analysisType: 'performance_metrics' })
        )
        break
    }

    // Filter by requested data sources if specified
    if (request.dataSources && request.dataSources.length > 0) {
      return queries.filter(q => request.dataSources!.includes(q.dataSource))
    }

    return queries
  }

  // Transform agent result to insight section
  private async transformToInsight(result: any, queryConfig: any): Promise<InsightSection> {
    const metrics = this.extractMetricsFromResponse(result.response, result.queryResults)
    const recommendations = this.generateRecommendations(result.response, queryConfig.category)

    return {
      title: queryConfig.title,
      category: queryConfig.category,
      priority: queryConfig.priority,
      summary: this.generateSummary(result.response),
      details: result.response,
      metrics,
      recommendations,
      sqlQueries: result.sqlQuery ? [result.sqlQuery] : [],
      visualizationData: this.prepareVisualizationData(result.queryResults, queryConfig.category),
      confidence: result.confidence || 85,
      dataSource: result.agentUsed || queryConfig.dataSource
    }
  }

  // Extract key metrics from response
  private extractMetricsFromResponse(response: string, queryResults: any[]): InsightMetric[] {
    const metrics: InsightMetric[] = []

    // Extract numerical values from response
    const numberPattern = /(\$?[\d,]+\.?\d*)/g
    const numbers = response.match(numberPattern) || []

    // Common metric patterns
    const patterns = [
      { name: 'Total Amount', pattern: /total.*?(\$?[\d,]+\.?\d*)/i },
      { name: 'Variance', pattern: /variance.*?(\$?[\d,]+\.?\d*)/i },
      { name: 'Count', pattern: /(\d+)\s+(records|transactions|suppliers|entities)/i },
      { name: 'Percentage', pattern: /(\d+\.?\d*)%/g }
    ]

    patterns.forEach(pattern => {
      const match = response.match(pattern.pattern)
      if (match) {
        const value = match[1].replace(/[$,]/g, '')
        metrics.push({
          name: pattern.name,
          value: pattern.name.includes('Percentage') ? `${value}%` : parseFloat(value) || value,
          significance: 'important'
        })
      }
    })

    // Add record count if available
    if (queryResults && queryResults.length > 0) {
      metrics.push({
        name: 'Records Analyzed',
        value: queryResults.length,
        significance: 'normal'
      })
    }

    return metrics
  }

  // Generate recommendations based on insights
  private generateRecommendations(response: string, category: string): string[] {
    const recommendations: string[] = []

    // Category-specific recommendation patterns
    switch (category) {
      case 'financial':
        if (response.toLowerCase().includes('variance')) {
          recommendations.push('Review budget allocations for high variance areas')
        }
        if (response.toLowerCase().includes('overspend')) {
          recommendations.push('Implement cost controls for overspending categories')
        }
        break

      case 'procurement':
        if (response.toLowerCase().includes('supplier')) {
          recommendations.push('Diversify supplier base to reduce concentration risk')
        }
        if (response.toLowerCase().includes('commodity')) {
          recommendations.push('Consider bulk purchasing for high-volume commodities')
        }
        break

      case 'risk':
        recommendations.push('Implement monitoring alerts for identified risk areas')
        recommendations.push('Develop contingency plans for high-risk scenarios')
        break

      case 'performance':
        recommendations.push('Set performance targets based on benchmark analysis')
        recommendations.push('Implement continuous improvement processes')
        break
    }

    // Default recommendations if none generated
    if (recommendations.length === 0) {
      recommendations.push('Monitor trends and implement data-driven improvements')
      recommendations.push('Schedule regular review of these metrics')
    }

    return recommendations
  }

  // Generate executive summary
  private generateSummary(response: string): string {
    const sentences = response.split('.').filter(s => s.trim().length > 10)
    return sentences.slice(0, 2).join('.') + '.'
  }

  // Prepare data for visualizations
  private prepareVisualizationData(queryResults: any[], category: string): any {
    if (!queryResults || queryResults.length === 0) return null

    // Sample visualization data structure
    return {
      type: category === 'financial' ? 'bar' : 'pie',
      data: queryResults.slice(0, 10).map((row, index) => ({
        name: Object.values(row)[0] || `Item ${index + 1}`,
        value: Object.values(row)[1] || 0
      }))
    }
  }

  // Build timeframe SQL condition
  private buildTimeframeCondition(
    timeframe?: string,
    customRange?: { startDate: string; endDate: string }
  ): string {
    switch (timeframe) {
      case 'current_quarter':
        return 'for current quarter'
      case 'year_to_date':
        return 'for year to date'
      case 'last_12_months':
        return 'for last 12 months'
      case 'custom':
        if (customRange) {
          return `from ${customRange.startDate} to ${customRange.endDate}`
        }
        return ''
      default:
        return 'for current quarter'
    }
  }

  // Calculate job metrics
  private calculateJobMetrics(insights: InsightSection[]): {
    averageConfidence: number
    dataSourcesUsed: string[]
    totalQueries: number
    recordsAnalyzed: number
  } {
    const confidences = insights.map(i => i.confidence).filter(c => c > 0)
    const averageConfidence = confidences.length > 0 
      ? confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length 
      : 85

    const dataSourcesUsed = [...new Set(insights.map(i => i.dataSource))]
    const totalQueries = insights.reduce((sum, i) => sum + i.sqlQueries.length, 0)
    const recordsAnalyzed = insights.reduce((sum, i) => {
      const recordMetric = i.metrics.find(m => m.name === 'Records Analyzed')
      return sum + (typeof recordMetric?.value === 'number' ? recordMetric.value : 0)
    }, 0)

    return {
      averageConfidence,
      dataSourcesUsed,
      totalQueries,
      recordsAnalyzed
    }
  }

  // Job management methods
  private generateJobId(): string {
    return `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async storeJob(job: BulkInsightResult): Promise<void> {
    try {
      await Database.query(
        `INSERT INTO bulk_insight_jobs 
         (id, user_id, analysis_type, status, insights, execution_time, confidence, 
          data_sources_used, total_queries, records_analyzed, created_at, completed_at, error)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          job.id,
          job.userId,
          job.analysisType,
          job.status,
          JSON.stringify(job.insights),
          job.executionTime,
          job.confidence,
          JSON.stringify(job.dataSourcesUsed),
          job.totalQueries,
          job.recordsAnalyzed,
          job.createdAt,
          job.completedAt || null,
          job.error || null
        ]
      )
    } catch (error) {
      console.error('Failed to store bulk insight job:', error)
      // Non-critical, continue without database storage
    }
  }

  private async updateJob(job: BulkInsightResult): Promise<void> {
    try {
      await Database.query(
        `UPDATE bulk_insight_jobs 
         SET status = $2, insights = $3, execution_time = $4, confidence = $5,
             data_sources_used = $6, total_queries = $7, records_analyzed = $8,
             completed_at = $9, error = $10
         WHERE id = $1`,
        [
          job.id,
          job.status,
          JSON.stringify(job.insights),
          job.executionTime,
          job.confidence,
          JSON.stringify(job.dataSourcesUsed),
          job.totalQueries,
          job.recordsAnalyzed,
          job.completedAt || null,
          job.error || null
        ]
      )
    } catch (error) {
      console.error('Failed to update bulk insight job:', error)
    }
  }

  // Public methods for job management
  async getJob(jobId: string): Promise<BulkInsightResult | null> {
    try {
      const result = await Database.query(
        'SELECT * FROM bulk_insight_jobs WHERE id = $1',
        [jobId]
      )

      if (result.rows.length > 0) {
        const row = result.rows[0]
        return {
          id: row.id,
          userId: row.user_id,
          status: row.status,
          analysisType: row.analysis_type,
          insights: row.insights || [],
          executionTime: row.execution_time || 0,
          confidence: row.confidence || 0,
          dataSourcesUsed: row.data_sources_used || [],
          totalQueries: row.total_queries || 0,
          recordsAnalyzed: row.records_analyzed || 0,
          createdAt: new Date(row.created_at),
          completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
          error: row.error || undefined
        }
      }
    } catch (error) {
      console.error('Failed to get bulk insight job:', error)
    }

    return null
  }

  async getUserJobs(userId: string, limit: number = 10): Promise<BulkInsightResult[]> {
    try {
      const result = await Database.query(
        'SELECT * FROM bulk_insight_jobs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
        [userId, limit]
      )

      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        status: row.status,
        analysisType: row.analysis_type,
        insights: row.insights || [],
        executionTime: row.execution_time || 0,
        confidence: row.confidence || 0,
        dataSourcesUsed: row.data_sources_used || [],
        totalQueries: row.total_queries || 0,
        recordsAnalyzed: row.records_analyzed || 0,
        createdAt: new Date(row.created_at),
        completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
        error: row.error || undefined
      }))
    } catch (error) {
      console.error('Failed to get user bulk insight jobs:', error)
      return []
    }
  }

  // Get active jobs from database for cross-instance visibility
  async getActiveJobs(): Promise<BulkInsightResult[]> {
    try {
      const result = await Database.query(
        `SELECT * FROM bulk_insight_jobs 
         WHERE status IN ('pending', 'processing') 
         AND created_at > NOW() - INTERVAL '24 hours'
         ORDER BY created_at DESC`,
        []
      )

      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        status: row.status,
        analysisType: row.analysis_type,
        insights: row.insights || [],
        executionTime: row.execution_time || 0,
        confidence: row.confidence || 0,
        dataSourcesUsed: row.data_sources_used || [],
        totalQueries: row.total_queries || 0,
        recordsAnalyzed: row.records_analyzed || 0,
        createdAt: new Date(row.created_at),
        completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
        error: row.error || undefined
      }))
    } catch (error) {
      console.error('Failed to get active jobs from database:', error)
      
      // Fallback to in-memory jobs as backup
      return Array.from(this.activeJobs.values())
    }
  }

  // Get in-memory active jobs for performance when needed
  getInMemoryActiveJobs(): BulkInsightResult[] {
    return Array.from(this.activeJobs.values())
  }
}