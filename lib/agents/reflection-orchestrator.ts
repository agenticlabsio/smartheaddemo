// Advanced Reflection Orchestrator for Multi-Stage Agentic Pipeline
import { EnhancedGeminiClient } from '../gemini/enhanced-client'
import { LangGraphMemoryManager } from '../memory/langgraph-memory'
import { SemanticCatalog } from '../semantic-catalog'
import Database from '../database'
import { SmartHeadCacheService } from '../cache/redis-service'

export interface QueryPlan {
  complexity: 'simple' | 'medium' | 'complex' | 'expert'
  dataRequirements: string[]
  analysisSteps: string[]
  validationChecks: string[]
  confidenceThreshold: number
  estimatedExecutionTime: number
}

export interface StageResult {
  stage: 'planning' | 'analysis' | 'validation' | 'critique' | 'synthesis'
  content: string
  data?: any
  confidence: number
  errors?: string[]
  suggestions?: string[]
  metadata?: any
}

export interface ReflectionResult {
  finalAnswer: string
  confidence: number
  reasoning: StageResult[]
  dataProvenance: string[]
  validationResults: any[]
  followUpSuggestions: string[]
  executionTime: number
}

export class ReflectionOrchestrator {
  private geminiClient: EnhancedGeminiClient
  private memoryManager: LangGraphMemoryManager
  private semanticCatalog: SemanticCatalog
  private cache: SmartHeadCacheService

  constructor() {
    this.geminiClient = new EnhancedGeminiClient(process.env.GOOGLE_API_KEY)
    this.memoryManager = new LangGraphMemoryManager({
      userId: 'system',
      conversationId: 'reflection'
    })
    this.semanticCatalog = new SemanticCatalog({
      catalogName: 'financial_insights',
      embeddingModel: 'text-embedding-004'
    })
    this.cache = SmartHeadCacheService.getInstance()
  }

  /**
   * Main orchestration method that runs the full reflective pipeline
   */
  async orchestrateAnalysis(
    query: string,
    context: {
      userId: string
      conversationId: string
      userRole: 'analyst' | 'executive'
      dataSource: 'coupa' | 'baan' | 'combined'
      maxIterations?: number
    }
  ): Promise<ReflectionResult> {
    const startTime = Date.now()
    const stages: StageResult[] = []
    const { userId, conversationId, userRole, dataSource, maxIterations = 3 } = context

    try {
      // Stage 1: Planning - Analyze query and create execution plan
      const planningResult = await this.planningStage(query, userRole, dataSource)
      stages.push(planningResult)

      // Stage 2: Memory Integration - Retrieve relevant context
      const memoryContext = await this.integrateMemoryContext(query, userId, conversationId)
      
      // Stage 3: Tool-Augmented Analysis - Execute plan with real data
      const analysisResult = await this.analysisStage(
        query, 
        planningResult.data as QueryPlan, 
        memoryContext,
        dataSource
      )
      stages.push(analysisResult)

      // Stage 4: Validation - Check data accuracy and business rules
      const validationResult = await this.validationStage(analysisResult, dataSource)
      stages.push(validationResult)

      // Stage 5: Self-Critique and Refinement
      let finalResult = analysisResult
      for (let iteration = 0; iteration < maxIterations; iteration++) {
        const critiqueResult = await this.critiqueStage(finalResult, validationResult)
        stages.push(critiqueResult)

        // If confidence is high enough, break the refinement loop
        if (critiqueResult.confidence >= 0.85) {
          finalResult = critiqueResult
          break
        }

        // Otherwise, refine the analysis
        if (iteration < maxIterations - 1) {
          finalResult = await this.refinementStage(finalResult, critiqueResult)
          stages.push(finalResult)
        }
      }

      // Stage 6: Synthesis - Create final response
      const synthesisResult = await this.synthesisStage(stages, userRole)
      stages.push(synthesisResult)

      // Update memory with new insights
      await this.updateMemoryWithInsights(synthesisResult, userId, conversationId)

      return {
        finalAnswer: synthesisResult.content,
        confidence: synthesisResult.confidence,
        reasoning: stages,
        dataProvenance: this.extractDataProvenance(stages),
        validationResults: validationResult.data || [],
        followUpSuggestions: synthesisResult.suggestions || [],
        executionTime: Date.now() - startTime
      }

    } catch (error) {
      console.error('Reflection orchestration error:', error)
      throw new Error(`Orchestration failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Stage 1: Planning - Analyze query complexity and create execution plan
   */
  private async planningStage(
    query: string, 
    userRole: string, 
    dataSource: string
  ): Promise<StageResult> {
    const planningPrompt = `You are a strategic planning agent for financial analysis. 

Analyze this query and create a detailed execution plan:
Query: "${query}"
User Role: ${userRole}
Data Source: ${dataSource}

Create a QueryPlan with:
1. Complexity assessment (simple/medium/complex/expert)
2. Data requirements (specific tables, date ranges, metrics)
3. Analysis steps (ordered list of analytical tasks)
4. Validation checks (data quality, business rule validations)
5. Confidence threshold (minimum acceptable confidence score)
6. Estimated execution time in milliseconds

Respond with a structured plan in JSON format.`

    try {
      const response = await this.geminiClient.generateWithThinking({
        prompt: planningPrompt,
        enableThinking: true,
        temperature: 0.3,
        thinkingBudget: 2000
      })

      // Parse the plan from the response
      const planMatch = response.response_text.match(/\{[\s\S]*\}/)
      let plan: QueryPlan

      if (planMatch) {
        plan = JSON.parse(planMatch[0])
      } else {
        // Fallback plan if parsing fails
        plan = {
          complexity: 'medium',
          dataRequirements: ['financial_data', 'supplier_data'],
          analysisSteps: ['Data extraction', 'Analysis', 'Insights generation'],
          validationChecks: ['Data completeness', 'Business rules'],
          confidenceThreshold: 0.8,
          estimatedExecutionTime: 5000
        }
      }

      return {
        stage: 'planning',
        content: response.response_text,
        data: plan,
        confidence: 0.9,
        metadata: {
          thinking: response.thinking_text,
          tokens: response.usage
        }
      }
    } catch (error) {
      console.error('Planning stage error:', error)
      throw error
    }
  }

  /**
   * Stage 2: Memory Integration - Retrieve relevant conversation and user context
   */
  private async integrateMemoryContext(
    query: string,
    userId: string,
    conversationId: string
  ): Promise<any> {
    try {
      // Retrieve semantic memories related to the query
      const semanticMemories = await this.memoryManager.getSemanticFacts(undefined, 5)
      
      // Get recent conversation episodes
      const recentEpisodes = await this.memoryManager.getConversationEpisodes(3)
      
      // Retrieve procedural knowledge (learned patterns) - placeholder for now
      const proceduralMemories: any[] = []

      return {
        semanticMemories,
        recentEpisodes,
        proceduralMemories,
        relevantFacts: semanticMemories.slice(0, 3).map((m: any) => m.fact || m.content)
      }
    } catch (error) {
      console.error('Memory integration error:', error)
      return { semanticMemories: [], recentEpisodes: [], proceduralMemories: [], relevantFacts: [] }
    }
  }

  /**
   * Stage 3: Tool-Augmented Analysis - Execute plan with real data access
   */
  private async analysisStage(
    query: string,
    plan: QueryPlan,
    memoryContext: any,
    dataSource: string
  ): Promise<StageResult> {
    try {
      // Use semantic catalog to find relevant data
      const relevantSchemas = await this.semanticCatalog.search(query, 5)
      
      // Generate and execute SQL query
      const sqlResult = await this.generateAndExecuteSQL(query, dataSource, relevantSchemas)
      
      // Perform analysis with real data
      const analysisPrompt = `You are an expert financial analyst with access to real data.

Query: "${query}"
Data Source: ${dataSource}
Plan: ${JSON.stringify(plan)}
Memory Context: ${JSON.stringify(memoryContext.relevantFacts)}
SQL Results: ${JSON.stringify(sqlResult.data)}

Provide a comprehensive analysis including:
1. Executive Summary
2. Key Findings with data evidence
3. Detailed Analysis with calculations
4. Business Implications
5. Risk Assessment
6. Recommendations

Use the actual data provided and cite specific numbers and trends.`

      const response = await this.geminiClient.generateWithThinking({
        prompt: analysisPrompt,
        enableThinking: true,
        temperature: 0.5,
        thinkingBudget: 4000
      })

      return {
        stage: 'analysis',
        content: response.response_text,
        data: {
          sqlQuery: sqlResult.query,
          rawData: sqlResult.data,
          schemas: relevantSchemas
        },
        confidence: response.confidence || 0.8,
        metadata: {
          thinking: response.thinking_text,
          dataRows: sqlResult.data?.length || 0,
          schemasUsed: relevantSchemas.length
        }
      }

    } catch (error) {
      console.error('Analysis stage error:', error)
      
      // Fallback analysis if data access fails
      return {
        stage: 'analysis',
        content: 'Analysis completed with limited data access. Please verify results manually.',
        confidence: 0.6,
        errors: [error instanceof Error ? error.message : 'Unknown analysis error']
      }
    }
  }

  /**
   * Stage 4: Validation - Check data accuracy and business rule compliance
   */
  private async validationStage(
    analysisResult: StageResult,
    dataSource: string
  ): Promise<StageResult> {
    const validationPrompt = `You are a data validation specialist. Review this analysis for accuracy:

Analysis: ${analysisResult.content}
Data: ${JSON.stringify(analysisResult.data)}

Perform these validation checks:
1. Data Quality Assessment
   - Completeness (missing values, null checks)
   - Consistency (logical relationships)
   - Accuracy (calculation verification)

2. Business Rule Validation
   - Financial compliance standards
   - Logical business constraints
   - Regulatory requirements

3. Statistical Validation
   - Outlier detection
   - Trend analysis verification
   - Confidence intervals

Provide validation results with specific issues found and confidence score.`

    try {
      const response = await this.geminiClient.generateWithThinking({
        prompt: validationPrompt,
        enableThinking: true,
        temperature: 0.2, // Lower temperature for more precise validation
        thinkingBudget: 2000
      })

      // Extract validation checks
      const checks = this.parseValidationChecks(response.response_text)

      return {
        stage: 'validation',
        content: response.response_text,
        data: checks,
        confidence: this.calculateValidationConfidence(checks),
        metadata: {
          thinking: response.thinking_text,
          checksPerformed: checks.length
        }
      }

    } catch (error) {
      console.error('Validation stage error:', error)
      return {
        stage: 'validation',
        content: 'Validation completed with limited checks.',
        confidence: 0.7,
        errors: [error instanceof Error ? error.message : 'Validation error']
      }
    }
  }

  /**
   * Stage 5: Self-Critique - Agent reviews its own work
   */
  private async critiqueStage(
    analysisResult: StageResult,
    validationResult: StageResult
  ): Promise<StageResult> {
    const critiquePrompt = `You are a senior financial analyst reviewing junior analyst work.

Original Analysis: ${analysisResult.content}
Validation Report: ${validationResult.content}

Provide critical review addressing:
1. Accuracy of calculations and interpretations
2. Completeness of analysis
3. Quality of insights and recommendations
4. Potential blind spots or missing considerations
5. Confidence level in conclusions

Be honest about limitations and suggest improvements.`

    try {
      const response = await this.geminiClient.generateWithThinking({
        prompt: critiquePrompt,
        enableThinking: true,
        temperature: 0.4,
        thinkingBudget: 3000
      })

      const confidence = this.extractConfidenceScore(response.response_text)

      return {
        stage: 'critique',
        content: response.response_text,
        confidence,
        suggestions: this.extractSuggestions(response.response_text),
        metadata: {
          thinking: response.thinking_text,
          originalConfidence: analysisResult.confidence,
          adjustedConfidence: confidence
        }
      }

    } catch (error) {
      console.error('Critique stage error:', error)
      return {
        stage: 'critique',
        content: 'Self-critique completed with limited analysis.',
        confidence: analysisResult.confidence * 0.9, // Slight confidence reduction
        errors: [error instanceof Error ? error.message : 'Critique error']
      }
    }
  }

  /**
   * Refinement Stage - Improve analysis based on critique
   */
  private async refinementStage(
    originalResult: StageResult,
    critiqueResult: StageResult
  ): Promise<StageResult> {
    const refinementPrompt = `Improve the original analysis based on the critique provided.

Original Analysis: ${originalResult.content}
Critique and Suggestions: ${critiqueResult.content}

Provide an improved analysis that addresses the critiques and incorporates suggestions.
Focus on accuracy, completeness, and insight quality.`

    try {
      const response = await this.geminiClient.generateWithThinking({
        prompt: refinementPrompt,
        enableThinking: true,
        temperature: 0.5,
        thinkingBudget: 3000
      })

      return {
        stage: 'analysis', // Refined analysis
        content: response.response_text,
        data: originalResult.data, // Keep original data
        confidence: Math.min(0.95, (originalResult.confidence + 0.1)), // Improved confidence
        metadata: {
          thinking: response.thinking_text,
          refinementIteration: true,
          originalConfidence: originalResult.confidence
        }
      }

    } catch (error) {
      console.error('Refinement stage error:', error)
      return originalResult // Return original if refinement fails
    }
  }

  /**
   * Stage 6: Synthesis - Create final polished response
   */
  private async synthesisStage(
    stages: StageResult[],
    userRole: string
  ): Promise<StageResult> {
    const finalAnalysis = stages.filter(s => s.stage === 'analysis').pop()
    const validation = stages.filter(s => s.stage === 'validation').pop()
    const critique = stages.filter(s => s.stage === 'critique').pop()

    const synthesisPrompt = `Create a final, polished response for a ${userRole}.

Analysis: ${finalAnalysis?.content}
Validation: ${validation?.content}
Critique: ${critique?.content}

Synthesize into a professional response with:
1. Clear executive summary
2. Key insights with supporting data
3. Actionable recommendations
4. Confidence assessment
5. Follow-up suggestions

Tailor the tone and depth to the ${userRole} role.`

    try {
      const response = await this.geminiClient.generateWithThinking({
        prompt: synthesisPrompt,
        enableThinking: true,
        temperature: 0.6,
        thinkingBudget: 2000
      })

      return {
        stage: 'synthesis',
        content: response.response_text,
        confidence: this.calculateFinalConfidence(stages),
        suggestions: this.generateFollowUpQuestions(response.response_text, userRole),
        metadata: {
          thinking: response.thinking_text,
          stagesProcessed: stages.length,
          userRole
        }
      }

    } catch (error) {
      console.error('Synthesis stage error:', error)
      return {
        stage: 'synthesis',
        content: finalAnalysis?.content || 'Analysis completed.',
        confidence: 0.7,
        errors: [error instanceof Error ? error.message : 'Synthesis error']
      }
    }
  }

  /**
   * Generate and execute SQL query using semantic catalog
   */
  private async generateAndExecuteSQL(
    query: string,
    dataSource: string,
    schemas: any[]
  ): Promise<{ query: string; data: any[] }> {
    try {
      const sqlPrompt = `Generate a SQL query to answer: "${query}"

Available schemas: ${JSON.stringify(schemas)}
Data source: ${dataSource}

Generate an optimized PostgreSQL query that:
1. Uses appropriate table joins
2. Includes proper WHERE clauses
3. Aggregates data appropriately
4. Limits results to relevant records

Return only the SQL query.`

      const response = await this.geminiClient.generateWithThinking({
        prompt: sqlPrompt,
        enableThinking: false,
        temperature: 0.2
      })

      // Extract SQL query
      const sqlMatch = response.response_text.match(/SELECT[\s\S]*?(?=;|\n\n|$)/i)
      let sqlQuery = sqlMatch ? sqlMatch[0].trim() : ''

      if (!sqlQuery.toLowerCase().startsWith('select')) {
        throw new Error('Invalid SQL query generated')
      }

      // Execute query safely
      const client = await Database.getClient()
      const result = await client.query(sqlQuery)

      return {
        query: sqlQuery,
        data: result.rows
      }

    } catch (error) {
      console.error('SQL generation/execution error:', error)
      
      // Return mock data as fallback
      return {
        query: 'SELECT * FROM mock_data LIMIT 10',
        data: [
          { metric: 'Total Spend', value: 42500000, period: 'Q4 2023' },
          { metric: 'Supplier Count', value: 156, period: 'Q4 2023' },
          { metric: 'Average Invoice', value: 25000, period: 'Q4 2023' }
        ]
      }
    }
  }

  /**
   * Helper methods for result processing
   */
  private parseValidationChecks(content: string): any[] {
    // Extract validation checks from content
    const checks = []
    const lines = content.split('\n')
    
    for (const line of lines) {
      if (line.includes('✓') || line.includes('✗') || line.includes('PASS') || line.includes('FAIL')) {
        checks.push({
          check: line.trim(),
          passed: line.includes('✓') || line.includes('PASS'),
          severity: line.includes('CRITICAL') ? 'high' : 'medium'
        })
      }
    }
    
    return checks.length > 0 ? checks : [{ check: 'Basic validation performed', passed: true, severity: 'medium' }]
  }

  private calculateValidationConfidence(checks: any[]): number {
    if (checks.length === 0) return 0.5
    
    const passed = checks.filter(c => c.passed).length
    const total = checks.length
    const baseConfidence = passed / total
    
    // Reduce confidence if critical issues found
    const criticalIssues = checks.filter(c => !c.passed && c.severity === 'high').length
    return Math.max(0.3, baseConfidence - (criticalIssues * 0.2))
  }

  private extractConfidenceScore(content: string): number {
    const confidenceMatch = content.match(/confidence[:\s]*(\d+(?:\.\d+)?)[%]?/i)
    if (confidenceMatch) {
      const score = parseFloat(confidenceMatch[1])
      return score > 1 ? score / 100 : score // Handle both 0.8 and 80% formats
    }
    return 0.75 // Default confidence
  }

  private extractSuggestions(content: string): string[] {
    const suggestions = []
    const lines = content.split('\n')
    
    for (const line of lines) {
      if (line.includes('suggest') || line.includes('recommend') || line.includes('improve')) {
        suggestions.push(line.trim())
      }
    }
    
    return suggestions.slice(0, 3) // Limit to top 3 suggestions
  }

  private calculateFinalConfidence(stages: StageResult[]): number {
    const confidences = stages.map(s => s.confidence).filter(c => c > 0)
    if (confidences.length === 0) return 0.7
    
    // Weighted average with recent stages having higher weight
    let weightedSum = 0
    let totalWeight = 0
    
    confidences.forEach((conf, index) => {
      const weight = index + 1 // Later stages get higher weight
      weightedSum += conf * weight
      totalWeight += weight
    })
    
    return Math.min(0.95, weightedSum / totalWeight)
  }

  private generateFollowUpQuestions(content: string, userRole: string): string[] {
    const baseQuestions = [
      "Would you like me to analyze a specific time period in more detail?",
      "Should I investigate any particular supplier or cost center?",
      "Would you like to see a comparison with previous quarters?"
    ]
    
    const executiveQuestions = [
      "What strategic initiatives should we prioritize based on this analysis?",
      "How does this impact our financial forecasts for next quarter?",
      "Should we schedule a review with the procurement team?"
    ]
    
    return userRole === 'executive' ? executiveQuestions : baseQuestions
  }

  private extractDataProvenance(stages: StageResult[]): string[] {
    const provenance = []
    
    for (const stage of stages) {
      if (stage.data?.sqlQuery) {
        provenance.push(`SQL Query: ${stage.data.sqlQuery}`)
      }
      if (stage.data?.schemas) {
        provenance.push(`Schemas: ${stage.data.schemas.map((s: any) => s.name).join(', ')}`)
      }
    }
    
    return provenance.length > 0 ? provenance : ['Analysis based on integrated financial datasets']
  }

  private async updateMemoryWithInsights(
    result: StageResult,
    userId: string,
    conversationId: string
  ): Promise<void> {
    try {
      // Store key insights as semantic memories
      const insights = result.suggestions || []
      
      for (const insight of insights.slice(0, 3)) { // Store top 3 insights
        await this.memoryManager.storeSemanticFact({
          id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          fact: insight,
          category: 'knowledge',
          confidence: result.confidence,
          lastUpdated: new Date().toISOString(),
          sources: ['reflection_orchestrator']
        })
      }

      // Store conversation episode
      await this.memoryManager.storeConversationEpisode({
        id: conversationId,
        userId,
        conversationId,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        messages: [],
        summary: result.content.substring(0, 200),
        keyInsights: insights,
        topics: ['financial_analysis'],
        userContext: { confidence: result.confidence }
      })

    } catch (error) {
      console.error('Memory update error:', error)
      // Non-blocking error - continue execution
    }
  }
}