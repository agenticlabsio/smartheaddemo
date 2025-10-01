// Database query tool for LangGraph agents
import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import Database from '@/lib/database'

export class DatabaseQueryTool extends DynamicStructuredTool {
  constructor() {
    super({
      name: "database_query",
      description: "Execute SQL queries against the procurement database. Supports both Coupa (financial_data) and Baan (baanspending) data sources.",
      schema: z.object({
        sqlQuery: z.string().describe("The SQL query to execute"),
        dataSource: z.enum(['coupa', 'baan', 'combined']).describe("Data source to query against"),
        maxRows: z.number().optional().default(1000).describe("Maximum number of rows to return")
      }),
      func: async ({ sqlQuery, dataSource, maxRows }) => {
        try {
          // Validate query safety (basic SQL injection prevention)
          if (this.isUnsafeQuery(sqlQuery)) {
            throw new Error('Query contains potentially unsafe operations')
          }

          // Route query to appropriate table(s)
          const processedQuery = this.routeQuery(sqlQuery, dataSource)
          
          const client = await Database.getClient()
          const result = await client.query(processedQuery + ` LIMIT ${maxRows}`)
          
          return {
            success: true,
            data: result.rows,
            rowCount: result.rows.length,
            executionTime: Date.now(),
            query: processedQuery
          }
        } catch (error) {
          console.error('Database query error:', error)
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown database error',
            query: sqlQuery
          }
        }
      }
    })
  }

  private isUnsafeQuery(query: string): boolean {
    const unsafePatterns = [
      /drop\s+table/i,
      /delete\s+from/i,
      /truncate/i,
      /alter\s+table/i,
      /create\s+table/i,
      /insert\s+into/i,
      /update\s+.*set/i
    ]
    
    return unsafePatterns.some(pattern => pattern.test(query))
  }

  private routeQuery(query: string, dataSource: string): string {
    switch (dataSource) {
      case 'coupa':
        // Ensure query targets financial_data table
        return query.replace(/\b(FROM|JOIN)\s+(\w+)/gi, (match, keyword, table) => {
          if (table.toLowerCase() === 'financial_data' || table.toLowerCase() === 'coupa') {
            return `${keyword} financial_data`
          }
          return match
        })
      
      case 'baan':
        // Ensure query targets baanspending table  
        return query.replace(/\b(FROM|JOIN)\s+(\w+)/gi, (match, keyword, table) => {
          if (table.toLowerCase() === 'baanspending' || table.toLowerCase() === 'baan') {
            return `${keyword} baanspending`
          }
          return match
        })
      
      case 'combined':
        // Handle combined queries (UNION or separate subqueries)
        return query
      
      default:
        return query
    }
  }
}

export class SemanticSearchTool extends DynamicStructuredTool {
  constructor() {
    super({
      name: "semantic_search",
      description: "Search semantic catalog for relevant context and business rules",
      schema: z.object({
        searchTerm: z.string().describe("Term to search for in semantic catalog"),
        dataSource: z.enum(['coupa', 'baan', 'combined']).describe("Data source context"),
        maxResults: z.number().optional().default(5).describe("Maximum number of results")
      }),
      func: async ({ searchTerm, dataSource, maxResults }) => {
        try {
          // Use existing semantic catalog functionality
          const response = await fetch('/api/semantic-catalog?' + new URLSearchParams({
            search: searchTerm,
            dataSource: dataSource,
            limit: maxResults.toString()
          }))
          
          if (!response.ok) {
            throw new Error(`Semantic search failed: ${response.statusText}`)
          }
          
          const data = await response.json()
          
          return {
            success: true,
            results: data.results || [],
            context: data.context || '',
            relevance: data.relevance || 0
          }
        } catch (error) {
          console.error('Semantic search error:', error)
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Semantic search failed',
            results: []
          }
        }
      }
    })
  }
}

export class InsightGenerationTool extends DynamicStructuredTool {
  constructor() {
    super({
      name: "generate_insights",
      description: "Generate business insights from query results using AI analysis",
      schema: z.object({
        queryResults: z.array(z.any()).describe("Results from database query"),
        queryContext: z.string().describe("Original query and context"),
        dataSource: z.string().describe("Data source used"),
        analysisType: z.enum(['variance', 'trend', 'risk', 'optimization', 'comparative']).describe("Type of analysis")
      }),
      func: async ({ queryResults, queryContext, dataSource, analysisType }) => {
        try {
          // Generate insights using AI model
          const insights = await this.generateBusinessInsights(
            queryResults, 
            queryContext, 
            dataSource, 
            analysisType
          )
          
          return {
            success: true,
            insights: insights,
            confidence: this.calculateConfidence(queryResults, insights),
            recommendations: this.generateRecommendations(insights, analysisType)
          }
        } catch (error) {
          console.error('Insight generation error:', error)
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Insight generation failed',
            insights: []
          }
        }
      }
    })
  }

  private async generateBusinessInsights(
    queryResults: any[], 
    queryContext: string, 
    dataSource: string, 
    analysisType: string
  ): Promise<any[]> {
    // AI-powered insight generation logic
    // This would integrate with the Gemini model for analysis
    
    // For now, return structured insights based on data patterns
    const insights = []
    
    if (queryResults.length > 0) {
      const sampleData = queryResults[0]
      
      // Analyze data patterns and generate insights
      if (analysisType === 'variance' && sampleData.amount) {
        insights.push({
          type: 'variance_analysis',
          title: 'Spend Variance Detected',
          description: `Analysis of ${queryResults.length} records shows spending patterns`,
          impact: this.calculateImpact(queryResults),
          confidence: 0.85
        })
      }
      
      if (analysisType === 'risk' && sampleData.supplier_name) {
        insights.push({
          type: 'supplier_risk',
          title: 'Supplier Concentration Risk',
          description: 'Supplier dependency analysis based on spending data',
          impact: this.calculateSupplierRisk(queryResults),
          confidence: 0.90
        })
      }
    }
    
    return insights
  }

  private calculateConfidence(queryResults: any[], insights: any[]): number {
    // Calculate confidence based on data quality and insight relevance
    const dataQuality = Math.min(1, queryResults.length / 100) * 0.5
    const insightDepth = Math.min(1, insights.length / 3) * 0.5
    return Math.round((dataQuality + insightDepth) * 100) / 100
  }

  private generateRecommendations(insights: any[], analysisType: string): string[] {
    const recommendations: string[] = []
    
    insights.forEach(insight => {
      switch (insight.type) {
        case 'variance_analysis':
          recommendations.push('Implement monthly variance monitoring with automated alerts')
          recommendations.push('Establish quarterly budget review cycles')
          break
        case 'supplier_risk':
          recommendations.push('Diversify supplier base to reduce concentration risk')
          recommendations.push('Develop backup supplier relationships')
          break
      }
    })
    
    return recommendations
  }

  private calculateImpact(queryResults: any[]): string {
    if (queryResults.length > 0 && queryResults[0].amount) {
      const totalAmount = queryResults.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0)
      if (totalAmount > 1000000) {
        return `$${(totalAmount / 1000000).toFixed(1)}M impact`
      } else if (totalAmount > 1000) {
        return `$${(totalAmount / 1000).toFixed(0)}K impact`
      }
    }
    return 'Impact assessment pending'
  }

  private calculateSupplierRisk(queryResults: any[]): string {
    // Calculate supplier concentration metrics
    const supplierCounts = new Map()
    let totalSpend = 0
    
    queryResults.forEach(row => {
      const supplier = row.supplier_name || row.hfm_entity
      const amount = parseFloat(row.amount || row.reporting_total) || 0
      
      supplierCounts.set(supplier, (supplierCounts.get(supplier) || 0) + amount)
      totalSpend += amount
    })
    
    // Find top supplier concentration
    const topSupplier = Array.from(supplierCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]
    
    if (topSupplier && totalSpend > 0) {
      const concentration = (topSupplier[1] / totalSpend) * 100
      return `${concentration.toFixed(1)}% supplier concentration risk`
    }
    
    return 'Supplier risk analysis pending'
  }
}