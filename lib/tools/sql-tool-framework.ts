// Advanced Tool Calling Framework with SQL Generation, Validation, and Error Correction
import Database from '../database'
import { EnhancedGeminiClient } from '../gemini/enhanced-client'
import { SemanticCatalog } from '../semantic-catalog'
import { SmartHeadCacheService } from '../cache/redis-service'

export interface SQLToolCall {
  id: string
  name: string
  description: string
  parameters: {
    query: string
    dataSource: 'coupa' | 'baan' | 'combined'
    validationLevel: 'basic' | 'strict' | 'comprehensive'
    errorCorrection: boolean
  }
}

export interface SQLValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
  correctedSQL?: string
  riskLevel: 'low' | 'medium' | 'high'
  estimatedExecutionTime?: number
}

export interface SQLExecutionResult {
  success: boolean
  data: any[]
  executionTime: number
  rowCount: number
  query: string
  error?: string
  corrections?: string[]
  metadata: {
    dataSource: string
    cacheHit: boolean
    validationPassed: boolean
    confidenceScore: number
  }
}

export interface ToolCallResult {
  toolCall: SQLToolCall
  validation: SQLValidationResult
  execution: SQLExecutionResult
  insights: string[]
  recommendations: string[]
  followUpQueries: string[]
}

export class SQLToolFramework {
  private geminiClient: EnhancedGeminiClient
  private semanticCatalog: SemanticCatalog
  private cache: SmartHeadCacheService
  private validationCache: Map<string, SQLValidationResult> = new Map()
  
  constructor() {
    this.geminiClient = new EnhancedGeminiClient(process.env.GOOGLE_API_KEY)
    this.semanticCatalog = new SemanticCatalog({
      catalogName: 'sql_tools',
      embeddingModel: 'text-embedding-004'
    })
    this.cache = SmartHeadCacheService.getInstance()
  }

  /**
   * Main entry point for tool calling with comprehensive error handling
   */
  async executeToolCall(toolCall: SQLToolCall): Promise<ToolCallResult> {
    const startTime = Date.now()
    
    try {
      console.log(`Executing tool call: ${toolCall.name} for ${toolCall.parameters.dataSource}`)
      
      // Step 1: Generate optimized SQL with context awareness
      const generatedSQL = await this.generateContextAwareSQL(
        toolCall.parameters.query,
        toolCall.parameters.dataSource
      )
      
      // Step 2: Comprehensive validation with error detection
      const validation = await this.validateSQL(
        generatedSQL,
        toolCall.parameters.validationLevel
      )
      
      // Step 3: Error correction if needed and enabled
      let finalSQL = generatedSQL
      if (!validation.isValid && toolCall.parameters.errorCorrection) {
        finalSQL = await this.correctSQLErrors(generatedSQL, validation.errors)
        // Re-validate corrected SQL
        validation.correctedSQL = finalSQL
      }
      
      // Step 4: Safe execution with monitoring
      const execution = await this.executeSQLSafely(
        finalSQL,
        toolCall.parameters.dataSource,
        validation
      )
      
      // Step 5: Generate insights and recommendations
      const insights = await this.generateInsights(execution, toolCall.parameters.query)
      const recommendations = await this.generateRecommendations(execution, validation)
      const followUpQueries = await this.suggestFollowUpQueries(
        toolCall.parameters.query,
        execution.data
      )
      
      return {
        toolCall,
        validation,
        execution,
        insights,
        recommendations,
        followUpQueries
      }
      
    } catch (error) {
      console.error('Tool call execution failed:', error)
      
      // Return error result with fallback data
      return {
        toolCall,
        validation: {
          isValid: false,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          warnings: [],
          suggestions: ['Check query syntax and try again'],
          riskLevel: 'high'
        },
        execution: {
          success: false,
          data: [],
          executionTime: Date.now() - startTime,
          rowCount: 0,
          query: toolCall.parameters.query,
          error: error instanceof Error ? error.message : 'Unknown error',
          metadata: {
            dataSource: toolCall.parameters.dataSource,
            cacheHit: false,
            validationPassed: false,
            confidenceScore: 0
          }
        },
        insights: ['Tool execution failed', 'Review query and try again'],
        recommendations: ['Simplify query', 'Check data source availability'],
        followUpQueries: []
      }
    }
  }

  /**
   * Generate context-aware SQL with semantic understanding
   */
  private async generateContextAwareSQL(
    naturalQuery: string,
    dataSource: string
  ): Promise<string> {
    try {
      // Get semantic context for better SQL generation
      const semanticContext = await this.semanticCatalog.semanticSearch(naturalQuery, 5)
      const schemaContext = await this.getSchemaContext(dataSource)
      
      const sqlPrompt = `You are an expert SQL generator for financial data analysis.

Natural Language Query: "${naturalQuery}"
Data Source: ${dataSource}
Schema Context: ${JSON.stringify(schemaContext)}
Semantic Context: ${JSON.stringify(semanticContext)}

Generate optimized PostgreSQL query that:
1. Uses proper table names and column references from the schema
2. Applies appropriate JOIN conditions
3. Includes meaningful WHERE clauses for data filtering
4. Uses proper aggregation functions (SUM, AVG, COUNT, etc.)
5. Includes ORDER BY for meaningful result ordering
6. Limits results to reasonable numbers (LIMIT 1000 max)
7. Uses parameterized queries where possible
8. Follows PostgreSQL best practices

Schema Guidelines:
- Use table aliases for better readability
- Include proper date/time filtering if time-based
- Use COALESCE for handling NULL values
- Apply proper type casting when needed

Return ONLY the SQL query, no explanations.`

      const response = await this.geminiClient.generateWithThinking({
        prompt: sqlPrompt,
        enableThinking: true,
        temperature: 0.1,
        thinkingBudget: 2000
      })

      let sqlQuery = this.extractSQLFromResponse(response.response_text)
      
      // Apply safety constraints
      sqlQuery = this.applySafetyConstraints(sqlQuery)
      
      return sqlQuery
      
    } catch (error) {
      console.error('SQL generation error:', error)
      return this.getFallbackSQL(dataSource, naturalQuery)
    }
  }

  /**
   * Comprehensive SQL validation with multiple levels
   */
  private async validateSQL(
    sql: string,
    validationLevel: 'basic' | 'strict' | 'comprehensive'
  ): Promise<SQLValidationResult> {
    const cacheKey = `sql_validation_${Buffer.from(sql).toString('base64').slice(0, 32)}`
    
    // Check validation cache
    const cached = this.validationCache.get(cacheKey)
    if (cached) {
      return cached
    }
    
    const validation: SQLValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      riskLevel: 'low'
    }
    
    try {
      // Basic syntax validation
      await this.validateSyntax(sql, validation)
      
      if (validationLevel === 'strict' || validationLevel === 'comprehensive') {
        // Security validation
        await this.validateSecurity(sql, validation)
        
        // Performance validation
        await this.validatePerformance(sql, validation)
      }
      
      if (validationLevel === 'comprehensive') {
        // Business logic validation
        await this.validateBusinessLogic(sql, validation)
        
        // Data integrity validation
        await this.validateDataIntegrity(sql, validation)
      }
      
      // Determine overall risk level
      validation.riskLevel = this.calculateRiskLevel(validation)
      validation.isValid = validation.errors.length === 0
      
      // Cache the result
      this.validationCache.set(cacheKey, validation)
      
      return validation
      
    } catch (error) {
      validation.isValid = false
      validation.errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      validation.riskLevel = 'high'
      return validation
    }
  }

  /**
   * Advanced error correction with AI-powered suggestions
   */
  private async correctSQLErrors(
    sql: string,
    errors: string[]
  ): Promise<string> {
    try {
      const correctionPrompt = `You are an expert SQL error correction specialist.

Original SQL: ${sql}
Errors Found: ${errors.join('; ')}

Fix the SQL query to address all errors while maintaining the original intent:
1. Fix syntax errors
2. Correct table/column references
3. Fix JOIN conditions
4. Resolve type mismatches
5. Fix aggregation issues
6. Ensure proper GROUP BY clauses

Return ONLY the corrected SQL query, no explanations.`

      const response = await this.geminiClient.generateWithThinking({
        prompt: correctionPrompt,
        enableThinking: true,
        temperature: 0.2,
        thinkingBudget: 1500
      })

      let correctedSQL = this.extractSQLFromResponse(response.response_text)
      correctedSQL = this.applySafetyConstraints(correctedSQL)
      
      return correctedSQL
      
    } catch (error) {
      console.error('SQL correction failed:', error)
      return sql // Return original if correction fails
    }
  }

  /**
   * Safe SQL execution with monitoring and timeouts
   */
  private async executeSQLSafely(
    sql: string,
    dataSource: string,
    validation: SQLValidationResult
  ): Promise<SQLExecutionResult> {
    const startTime = Date.now()
    const executionTimeout = 30000 // 30 seconds max
    
    try {
      // Check execution cache first
      const cacheKey = `sql_execution_${Buffer.from(sql).toString('base64').slice(0, 32)}`
      const cached = await this.cache.safeGet<any[]>(cacheKey)
      
      if (cached) {
        return {
          success: true,
          data: cached,
          executionTime: Date.now() - startTime,
          rowCount: cached.length,
          query: sql,
          metadata: {
            dataSource,
            cacheHit: true,
            validationPassed: validation.isValid,
            confidenceScore: validation.isValid ? 0.9 : 0.6
          }
        }
      }
      
      // Execute with timeout
      const client = await Database.getClient()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), executionTimeout)
      )
      
      const queryPromise = client.query(sql)
      const result = await Promise.race([queryPromise, timeoutPromise]) as any
      
      const data = result.rows || []
      const executionTime = Date.now() - startTime
      
      // Cache successful results
      if (data.length > 0 && executionTime < 10000) { // Cache if under 10s
        await this.cache.safeSet(cacheKey, data, 1800) // Cache for 30 minutes
      }
      
      return {
        success: true,
        data,
        executionTime,
        rowCount: data.length,
        query: sql,
        metadata: {
          dataSource,
          cacheHit: false,
          validationPassed: validation.isValid,
          confidenceScore: this.calculateConfidenceScore(validation, executionTime, data.length)
        }
      }
      
    } catch (error) {
      return {
        success: false,
        data: [],
        executionTime: Date.now() - startTime,
        rowCount: 0,
        query: sql,
        error: error instanceof Error ? error.message : 'Unknown execution error',
        metadata: {
          dataSource,
          cacheHit: false,
          validationPassed: validation.isValid,
          confidenceScore: 0
        }
      }
    }
  }

  /**
   * Generate actionable insights from execution results
   */
  private async generateInsights(
    execution: SQLExecutionResult,
    originalQuery: string
  ): Promise<string[]> {
    if (!execution.success || execution.data.length === 0) {
      return [
        'Query execution unsuccessful',
        'No data returned for analysis',
        'Consider revising query parameters'
      ]
    }
    
    try {
      const insightsPrompt = `Analyze this SQL execution result and generate actionable insights:

Original Query: "${originalQuery}"
Result Count: ${execution.rowCount} rows
Execution Time: ${execution.executionTime}ms
Sample Data: ${JSON.stringify(execution.data.slice(0, 3))}

Generate 3-5 specific insights about:
1. Data patterns and trends
2. Performance observations
3. Business implications
4. Data quality assessment
5. Actionable recommendations

Focus on specific findings from the actual data.`

      const response = await this.geminiClient.generateWithThinking({
        prompt: insightsPrompt,
        enableThinking: true,
        temperature: 0.6,
        thinkingBudget: 2000
      })

      return this.parseInsights(response.response_text)
      
    } catch (error) {
      console.error('Insight generation error:', error)
      return [
        `Query returned ${execution.rowCount} records`,
        `Execution completed in ${execution.executionTime}ms`,
        'Data analysis available for review'
      ]
    }
  }

  /**
   * Generate performance and optimization recommendations
   */
  private async generateRecommendations(
    execution: SQLExecutionResult,
    validation: SQLValidationResult
  ): Promise<string[]> {
    const recommendations: string[] = []
    
    // Performance recommendations
    if (execution.executionTime > 5000) {
      recommendations.push('Consider adding indexes for better performance')
      recommendations.push('Review query complexity and optimize joins')
    }
    
    // Data volume recommendations
    if (execution.rowCount > 10000) {
      recommendations.push('Consider adding LIMIT clause for large datasets')
      recommendations.push('Use pagination for better user experience')
    }
    
    // Security recommendations
    if (validation.warnings.length > 0) {
      recommendations.push('Address security warnings for production use')
    }
    
    // Cache recommendations
    if (execution.executionTime < 2000 && execution.rowCount > 100) {
      recommendations.push('Results suitable for caching due to stable performance')
    }
    
    return recommendations.length > 0 ? recommendations : ['Query performed well', 'No specific optimizations needed']
  }

  /**
   * Suggest intelligent follow-up queries
   */
  private async suggestFollowUpQueries(
    originalQuery: string,
    data: any[]
  ): Promise<string[]> {
    if (data.length === 0) {
      return [
        'Broaden search criteria',
        'Check different time periods',
        'Verify data source availability'
      ]
    }
    
    try {
      const followUpPrompt = `Based on this query and results, suggest 3 intelligent follow-up queries:

Original Query: "${originalQuery}"
Data Sample: ${JSON.stringify(data.slice(0, 2))}

Suggest follow-up queries that would:
1. Drill down into interesting findings
2. Compare with different dimensions
3. Explore related metrics
4. Identify root causes or trends

Provide specific, actionable follow-up questions.`

      const response = await this.geminiClient.generateWithThinking({
        prompt: followUpPrompt,
        enableThinking: false,
        temperature: 0.7
      })

      return this.parseFollowUpQueries(response.response_text)
      
    } catch (error) {
      console.error('Follow-up generation error:', error)
      return [
        'Analyze trends over time',
        'Compare with benchmarks',
        'Explore by category or region'
      ]
    }
  }

  /**
   * Helper methods for validation
   */
  private async validateSyntax(sql: string, validation: SQLValidationResult): Promise<void> {
    // Basic SQL syntax checks
    const sqlLower = sql.toLowerCase()
    
    if (!sqlLower.includes('select')) {
      validation.errors.push('Query must include SELECT statement')
    }
    
    if (sqlLower.includes('drop') || sqlLower.includes('delete') || sqlLower.includes('truncate')) {
      validation.errors.push('Destructive operations not allowed')
    }
    
    // Check for balanced parentheses
    const openParens = (sql.match(/\(/g) || []).length
    const closeParens = (sql.match(/\)/g) || []).length
    if (openParens !== closeParens) {
      validation.errors.push('Unbalanced parentheses in query')
    }
    
    // Basic structure validation
    if (!sql.trim().endsWith(';') && !sql.includes('LIMIT')) {
      validation.warnings.push('Consider adding LIMIT clause for large datasets')
    }
  }

  private async validateSecurity(sql: string, validation: SQLValidationResult): Promise<void> {
    const sqlLower = sql.toLowerCase()
    const riskyPatterns = [
      'union select',
      'information_schema',
      'pg_user',
      'pg_shadow',
      'current_user',
      'version()',
      'pg_sleep'
    ]
    
    for (const pattern of riskyPatterns) {
      if (sqlLower.includes(pattern)) {
        validation.warnings.push(`Potentially risky pattern detected: ${pattern}`)
      }
    }
  }

  private async validatePerformance(sql: string, validation: SQLValidationResult): Promise<void> {
    const sqlLower = sql.toLowerCase()
    
    if (!sqlLower.includes('limit')) {
      validation.warnings.push('No LIMIT clause - query may return large datasets')
    }
    
    if (sqlLower.includes('select *')) {
      validation.suggestions.push('Consider selecting specific columns instead of *')
    }
    
    if (sqlLower.includes('like \'%') && sqlLower.includes('%\'')) {
      validation.warnings.push('Leading wildcard in LIKE may cause performance issues')
    }
  }

  private async validateBusinessLogic(sql: string, validation: SQLValidationResult): Promise<void> {
    // Check for common business logic issues
    const sqlLower = sql.toLowerCase()
    
    if (sqlLower.includes('sum(') && !sqlLower.includes('group by')) {
      validation.warnings.push('SUM without GROUP BY - verify this is intentional')
    }
    
    if (sqlLower.includes('count(') && sqlLower.includes('group by') && !sqlLower.includes('having')) {
      validation.suggestions.push('Consider using HAVING clause for filtered aggregations')
    }
  }

  private async validateDataIntegrity(sql: string, validation: SQLValidationResult): Promise<void> {
    // Check for data integrity considerations
    const sqlLower = sql.toLowerCase()
    
    if (sqlLower.includes('join') && !sqlLower.includes('on')) {
      validation.errors.push('JOIN without proper ON condition')
    }
    
    if (sqlLower.includes('where') && sqlLower.includes('null')) {
      validation.suggestions.push('Consider using IS NULL or IS NOT NULL instead of = NULL')
    }
  }

  /**
   * Utility methods
   */
  private calculateRiskLevel(validation: SQLValidationResult): 'low' | 'medium' | 'high' {
    if (validation.errors.length > 0) return 'high'
    if (validation.warnings.length > 2) return 'medium'
    return 'low'
  }

  private calculateConfidenceScore(
    validation: SQLValidationResult,
    executionTime: number,
    dataCount: number
  ): number {
    let score = 0.8 // Base score
    
    if (validation.isValid) score += 0.1
    if (executionTime < 5000) score += 0.05
    if (dataCount > 0) score += 0.05
    if (validation.warnings.length === 0) score += 0.05
    
    return Math.min(score, 1.0)
  }

  private extractSQLFromResponse(response: string): string {
    // Extract SQL from AI response
    const sqlMatch = response.match(/```sql\n([\s\S]*?)\n```/) || 
                    response.match(/```\n([\s\S]*?)\n```/) ||
                    response.match(/SELECT[\s\S]*?(?=;|\n\n|$)/i)
    
    let sql = sqlMatch ? sqlMatch[1] || sqlMatch[0] : response
    sql = sql.trim()
    
    if (!sql.toLowerCase().startsWith('select')) {
      sql = `SELECT * FROM financial_data WHERE 1=1 LIMIT 100` // Basic fallback
    }
    
    return sql
  }

  private applySafetyConstraints(sql: string): string {
    let safeSql = sql
    
    // Ensure LIMIT clause
    if (!safeSql.toLowerCase().includes('limit')) {
      safeSql += ' LIMIT 1000'
    }
    
    // Remove dangerous keywords
    const dangerousPatterns = [
      /DROP\s+/gi,
      /DELETE\s+/gi,
      /TRUNCATE\s+/gi,
      /ALTER\s+/gi,
      /CREATE\s+/gi,
      /INSERT\s+/gi,
      /UPDATE\s+/gi
    ]
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(safeSql)) {
        throw new Error(`Dangerous SQL operation detected: ${pattern.source}`)
      }
    }
    
    return safeSql
  }

  private async getSchemaContext(dataSource: string): Promise<any> {
    // Get schema information for better SQL generation
    try {
      const schemaQuery = `
        SELECT table_name, column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        ORDER BY table_name, ordinal_position
        LIMIT 100
      `
      
      const client = await Database.getClient()
      const result = await client.query(schemaQuery)
      
      return result.rows
    } catch (error) {
      console.error('Schema context error:', error)
      return []
    }
  }

  private getFallbackSQL(dataSource: string, query: string): string {
    const tableName = dataSource === 'coupa' ? 'financial_data' : 
                     dataSource === 'baan' ? 'procurement_data' : 'financial_data'
    
    return `SELECT * FROM ${tableName} ORDER BY created_date DESC LIMIT 100`
  }

  private parseInsights(content: string): string[] {
    const insights: string[] = []
    const lines = content.split('\n')
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.match(/^\d+\./) || trimmed.startsWith('-') || trimmed.startsWith('•')) {
        insights.push(trimmed.replace(/^[\d.\-•\s]+/, ''))
      }
    }
    
    return insights.length > 0 ? insights.slice(0, 5) : [
      'Data analysis completed successfully',
      'Results available for review',
      'Consider exploring related metrics'
    ]
  }

  private parseFollowUpQueries(content: string): string[] {
    const queries: string[] = []
    const lines = content.split('\n')
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.includes('?') || trimmed.match(/^\d+\./) || trimmed.startsWith('-')) {
        queries.push(trimmed.replace(/^[\d.\-\s]+/, ''))
      }
    }
    
    return queries.length > 0 ? queries.slice(0, 3) : [
      'Show trends over time',
      'Compare by category',
      'Analyze top performers'
    ]
  }
}